# backend/app/routes/billing.py

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
import stripe
import os
from app import db
# Make sure all these models are imported
from app.models.subscription import UserSubscription, SubscriptionPlan
from app.models.resume import ResumeEnhancement
from app.services.email_service import EmailService
from app.models.user import User
from datetime import datetime, date # Import date
import json
import traceback # Import traceback

billing_bp = Blueprint('billing', __name__)

@billing_bp.route('/create-payment-intent', methods=['POST'])
@jwt_required()
def create_payment():
    stripe.api_key = current_app.config['STRIPE_SECRET_KEY']

    if not stripe.api_key:
        print("FATAL: Stripe secret key is NOT configured in the application.")
        return jsonify(error="The server is not configured for payments. Please contact support."), 500

    try:
        data = request.get_json()
        quantity = data.get('quantity', 5)
        user_id = get_jwt_identity()

        if not quantity or not isinstance(quantity, int) or quantity <= 0:
            return jsonify(error="Invalid quantity provided."), 400

        amount = quantity * 100

        print(f"\n{'='*60}")
        print(f"CREATING PAYMENT INTENT")
        print(f"{'='*60}")
        print(f"User ID: {user_id}")
        print(f"Quantity: {quantity} credits")
        print(f"Amount: ${amount/100:.2f} USD")

        intent = stripe.PaymentIntent.create(
            amount=amount,
            currency='usd',
            automatic_payment_methods={'enabled': True},
            metadata={
                'user_id': str(user_id),
                'credits_purchased': str(quantity),
                'timestamp': datetime.utcnow().isoformat()
            }
        )

        print(f"PaymentIntent created: {intent.id}")
        print(f"{'='*60}\n")

        return jsonify({
            'clientSecret': intent.client_secret,
            'paymentIntentId': intent.id
        })

    except Exception as e:
        print(f"Error creating PaymentIntent: {e}")
        import traceback
        print(traceback.format_exc())
        return jsonify(error=str(e)), 500




@billing_bp.route('/webhook', methods=['POST'])
def webhook():
    """
    Handles Stripe webhooks to update user credits and include payment method details.
    """
    print(f"\n{'='*80}\nWEBHOOK ENDPOINT HIT at {datetime.utcnow().isoformat()}\n{'='*80}")

    endpoint_secret = current_app.config.get('STRIPE_WEBHOOK_SECRET')
    if not endpoint_secret:
        print("CRITICAL ERROR: STRIPE_WEBHOOK_SECRET is not set in the environment!")
        return jsonify(error='Webhook secret not configured on the server.'), 500

    payload = request.get_data()
    sig_header = request.headers.get('Stripe-Signature')
    event = None

    try:
        event = stripe.Webhook.construct_event(payload, sig_header, endpoint_secret)
        print(f"Webhook signature VERIFIED. Event ID: {event['id']}, Type: {event['type']}")
    except stripe.SignatureVerificationError as e:
        print(f"ERROR: Signature verification failed - {e}")
        return jsonify(error='Invalid signature'), 400
    except ValueError as e:
        print(f"ERROR: Invalid payload - {e}")
        return jsonify(error='Invalid payload'), 400
    except Exception as e:
        print(f"ERROR: Unexpected error during webhook construction - {e}")
        return jsonify(error='Webhook error'), 400

    if event['type'] == 'payment_intent.succeeded':
        payment_intent = event['data']['object']
        metadata = payment_intent.get('metadata', {})

        print(f"\n--- Handling 'payment_intent.succeeded' for PI_ID: {payment_intent['id']} ---")

        try:
            user_id = int(metadata.get('user_id'))
            credits_purchased = int(metadata.get('credits_purchased'))
        except (ValueError, TypeError, TypeError) as e:
            print(f"ERROR: Cannot parse metadata into integers - {e}")
            return jsonify(error='Invalid metadata format'), 400

        # --- UPDATED LOGIC TO FETCH PAYMENT BRAND ---
        payment_method_info = "Not available"
        payment_method_brand = None
        try:
            pi_with_pm = stripe.PaymentIntent.retrieve(
                payment_intent['id'], expand=['payment_method']
            )
            if pi_with_pm.payment_method:
                pm_details = pi_with_pm.payment_method
                if pm_details.type == 'card':
                    card = pm_details.card
                    payment_method_info = f"{card.brand.title()} ending in {card.last4}"
                    payment_method_brand = card.brand.lower() # e.g., 'visa'
                elif pm_details.type in ['cashapp', 'amazon_pay']:
                    payment_method_info = pm_details.type.replace('_', ' ').title()
                    payment_method_brand = pm_details.type.lower() # e.g., 'cashapp'
        except Exception as e:
            print(f"WARNING: Could not expand payment_method. Error: {e}")

        try:
            updated_rows = db.session.query(UserSubscription).filter_by(user_id=user_id).update({
                'enhancement_credits': UserSubscription.enhancement_credits + credits_purchased,
                'updated_at': datetime.utcnow()
            }, synchronize_session=False)

            if updated_rows == 0:
                free_plan = SubscriptionPlan.query.filter_by(plan_name='Free - 3 Enhancements').first()
                if not free_plan:
                    print("CRITICAL DATABASE ERROR: The 'Free - 3 Enhancements' plan is not defined.")
                    return jsonify(error='Server configuration error: Default plan not found.'), 500

                new_subscription = UserSubscription(
                    user_id=user_id,
                    plan_id=free_plan.plan_id,
                    start_date=datetime.utcnow().date(),
                    status='active',
                    enhancement_credits=credits_purchased
                )
                db.session.add(new_subscription)

            db.session.commit()
            print("SUCCESS: Database commit successful.")

            try:
                user = User.query.get(user_id)
                if user:
                    payment_details = {
                        "credits_purchased": credits_purchased,
                        "amount_paid": payment_intent.get('amount', 0) / 100.0,
                        "payment_intent_id": payment_intent.get('id'),
                        "payment_method_info": payment_method_info,
                        "payment_method_brand": payment_method_brand
                    }
                    email_service = EmailService()
                    email_service.send_payment_receipt_email(user=user, payment_details=payment_details)
                    print(f"Payment receipt email queued for {user.email} with payment method info.")
            except Exception as email_error:
                print(f"WARNING: Failed to send receipt email for user {user_id}. Error: {email_error}")

            return jsonify({'success': True}), 200

        except Exception as e:
            print(f"\n--- DATABASE ERROR ---\n{traceback.format_exc()}")
            db.session.rollback()
            return jsonify(error=f'Database update failed: {str(e)}'), 500

    else:
        print(f"Received unhandled event type: {event['type']}")

    return jsonify(success=True), 200


@billing_bp.route('/webhook-test', methods=['GET', 'POST'])
def webhook_test():
    """Test endpoint to verify webhook can be reached"""
    print("\n" + "="*80)
    print("WEBHOOK TEST ENDPOINT HIT")
    print("="*80)
    print(f"Method: {request.method}")
    print(f"Headers: {dict(request.headers)}")

    if request.method == 'POST':
        print(f"Body: {request.data}")

    return jsonify({
        'success': True,
        'message': 'Webhook endpoint is reachable',
        'method': request.method,
        'timestamp': datetime.utcnow().isoformat()
    }), 200


@billing_bp.route('/verify-credits', methods=['GET'])
@jwt_required()
def verify_user_credits():
    """
    Endpoint to verify user's current credit status
    Useful for debugging payment issues
    """
    try:
        user_id = int(get_jwt_identity())

        db.session.expire_all()
        user_subscription = UserSubscription.query.filter_by(user_id=user_id).first()

        if not user_subscription:
            return jsonify({
                'success': False,
                'message': 'No subscription found'
            }), 404

        plan = SubscriptionPlan.query.get(user_subscription.plan_id)

        from app.models.resume import ResumeEnhancement
        enhancement_count = ResumeEnhancement.query.filter_by(user_id=user_id).count()

        if plan and plan.resume_limit is not None:
            total_available = plan.resume_limit + (user_subscription.enhancement_credits or 0)
            remaining = total_available - enhancement_count
        else:
            total_available = 'unlimited'
            remaining = 'unlimited'

        return jsonify({
            'success': True,
            'data': {
                'user_id': user_id,
                'plan_name': plan.plan_name if plan else 'Unknown',
                'plan_id': plan.plan_id if plan else None,
                'plan_type': plan.plan_type if plan else None,
                'plan_limit': plan.resume_limit if plan else None,
                'enhancement_credits': user_subscription.enhancement_credits or 0,
                'enhancements_used': enhancement_count,
                'total_available': total_available,
                'remaining': remaining,
                'subscription_status': user_subscription.status,
                'last_updated': user_subscription.updated_at.isoformat() if user_subscription.updated_at else None
            }
        }), 200
    except Exception as e:
        print(f"Error verifying credits: {e}")
        import traceback
        print(traceback.format_exc())
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@billing_bp.route('/manual-add-credits', methods=['POST'])
@jwt_required()
def manual_add_credits():
    """
    ADMIN ENDPOINT: Manually add credits to a user
    """
    try:
        from flask_jwt_extended import get_jwt
        claims = get_jwt()

        if not claims.get('is_admin', False):
            return jsonify({
                'success': False,
                'message': 'Admin access required'
            }), 403

        data = request.get_json()
        target_user_id = data.get('user_id')
        credits_to_add = data.get('credits', 0)
        reason = data.get('reason', 'Manual credit addition')

        if not target_user_id or credits_to_add <= 0:
            return jsonify({
                'success': False,
                'message': 'user_id and credits (>0) are required'
            }), 400

        user_subscription = UserSubscription.query.filter_by(user_id=target_user_id).first()
        if not user_subscription:
            return jsonify({
                'success': False,
                'message': f'No subscription found for user_id={target_user_id}'
            }), 404

        old_credits = user_subscription.enhancement_credits or 0
        new_credits = old_credits + credits_to_add

        db.session.query(UserSubscription).filter_by(
            user_id=target_user_id
        ).update({
            'enhancement_credits': new_credits,
            'updated_at': datetime.utcnow()
        })
        db.session.commit()

        admin_user_id = int(get_jwt_identity())
        from app.models.activity import ActivityLog
        log = ActivityLog(
            user_id=target_user_id,
            action='manual_credit_addition',
            description=f'Admin (user_id={admin_user_id}) manually added {credits_to_add} credits. Reason: {reason}'
        )
        db.session.add(log)
        db.session.commit()

        print(f"MANUAL CREDIT ADD: user_id={target_user_id}, old={old_credits}, new={new_credits}, by admin={admin_user_id}")

        return jsonify({
            'success': True,
            'message': f'Successfully added {credits_to_add} credits',
            'old_credits': old_credits,
            'new_credits': new_credits
        }), 200

    except Exception as e:
        print(f"Error manually adding credits: {e}")
        import traceback
        print(traceback.format_exc())
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500