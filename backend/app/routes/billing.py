# backend/app/routes/billing.py
# --- COMPLETE RECTIFIED FILE (FINAL) ---

from flask import Blueprint, request, jsonify, current_app, send_file, after_this_request
from flask_jwt_extended import jwt_required, get_jwt_identity
import stripe
import os
import traceback
import time
from datetime import datetime, date

from app import db
from app.models.user import User
from app.models.subscription import UserSubscription, SubscriptionPlan
from app.models.transactions import Transaction
from app.services.email_service import EmailService
from app.pdf_service import PDFService

billing_bp = Blueprint('billing', __name__)

# --- All routes from create_payment to manual_add_credits remain unchanged ---

@billing_bp.route('/create-payment-intent', methods=['POST'])
@jwt_required()
def create_payment():
    stripe.api_key = current_app.config['STRIPE_SECRET_KEY']
    if not stripe.api_key:
        print("FATAL: Stripe secret key is NOT configured.")
        return jsonify(error="Server is not configured for payments."), 500

    try:
        data = request.get_json()
        quantity = data.get('quantity', 5)
        user_id = get_jwt_identity()

        agreed_to_terms = data.get('agreedToTerms', False)
        if not agreed_to_terms:
            return jsonify({'message': 'You must agree to the non-refundable terms to proceed.'}), 400

        if not isinstance(quantity, int) or quantity <= 0:
            return jsonify(error="Invalid quantity provided."), 400

        amount = quantity * 100
        print(f"CREATING PAYMENT INTENT for user {user_id}: {quantity} credits for ${amount/100:.2f} USD")

        intent = stripe.PaymentIntent.create(
            amount=amount,
            currency='usd',
            automatic_payment_methods={'enabled': True},
            metadata={
                'user_id': str(user_id),
                'credits_purchased': str(quantity)
            }
        )
        return jsonify({'clientSecret': intent.client_secret})

    except Exception as e:
        print(f"Error creating PaymentIntent: {e}")
        return jsonify(error=str(e)), 500

@billing_bp.route('/webhook', methods=['POST'])
def webhook():
    endpoint_secret = current_app.config.get('STRIPE_WEBHOOK_SECRET')
    if not endpoint_secret:
        print("CRITICAL ERROR: STRIPE_WEBHOOK_SECRET is not set!")
        return jsonify(error='Webhook secret not configured.'), 500

    payload = request.get_data()
    sig_header = request.headers.get('Stripe-Signature')
    event = None

    try:
        event = stripe.Webhook.construct_event(payload, sig_header, endpoint_secret)
        print(f"Webhook signature VERIFIED. Event ID: {event['id']}, Type: {event['type']}")
    except (ValueError, stripe.SignatureVerificationError) as e:
        print(f"ERROR: Webhook signature/payload error - {e}")
        return jsonify(error=str(e)), 400

    if event['type'] == 'payment_intent.succeeded':
        payment_intent = event['data']['object']
        metadata = payment_intent.get('metadata', {})
        print(f"--- Handling 'payment_intent.succeeded' for PI_ID: {payment_intent['id']} ---")

        try:
            user_id = int(metadata.get('user_id'))
            credits_purchased = int(metadata.get('credits_purchased'))
        except (ValueError, TypeError):
            print("ERROR: Could not parse metadata into integers.")
            return jsonify(error='Invalid metadata format'), 400
        
        try:
            payment_method_info = "Stripe"
            payment_method_for_db = "stripe" 

            pi_with_pm = stripe.PaymentIntent.retrieve(payment_intent['id'], expand=['payment_method'])
            if pi_with_pm.payment_method:
                pm_details = pi_with_pm.payment_method
                if pm_details.type == 'card':
                    payment_method_info = f"{pm_details.card.brand.title()} ending in {pm_details.card.last4}"
                    payment_method_for_db = 'credit_card'
                elif pm_details.type in ['paypal', 'stripe']:
                    payment_method_info = pm_details.type.title()
                    payment_method_for_db = pm_details.type

            user_subscription = UserSubscription.query.filter_by(user_id=user_id).first()
            if not user_subscription:
                free_plan = SubscriptionPlan.query.filter_by(plan_name='Free - 3 Enhancements').first()
                if not free_plan: raise Exception("Default 'Free - 3 Enhancements' plan not found.")
                user_subscription = UserSubscription(user_id=user_id, plan_id=free_plan.plan_id, start_date=date.today(), status='active')
                db.session.add(user_subscription)

            user_subscription.enhancement_credits = (user_subscription.enhancement_credits or 0) + credits_purchased
            
            new_transaction = Transaction(
                user_id=user_id,
                amount=payment_intent.get('amount', 0) / 100.0,
                currency='usd',
                payment_method=payment_method_for_db,
                payment_gateway_id=payment_intent.get('id'),
                status='completed',
                description=f'{credits_purchased} enhancement credits',
                subscription_id=None # Explicitly None for a top-up
            )
            db.session.add(new_transaction)
            db.session.commit()
            print("SUCCESS: Database commit successful.")
            
            user = User.query.get(user_id)
            if user:
                payment_details = {
                    "credits_purchased": credits_purchased,
                    "amount_paid": new_transaction.amount,
                    "payment_intent_id": new_transaction.payment_gateway_id,
                    "payment_method_info": payment_method_info
                }
                email_service = EmailService()
                email_service.send_payment_receipt_email(user=user, payment_details=payment_details)
                print(f"Receipt email queued for {user.email}.")
        
        except Exception as e:
            print(f"\n--- DATABASE OR EMAIL ERROR during webhook processing ---\n{traceback.format_exc()}")
            db.session.rollback()
            return jsonify(error=f'Webhook processing failed: {str(e)}'), 500

    return jsonify(success=True), 200

@billing_bp.route('/verify-payment/<string:payment_intent_id>', methods=['GET'])
@jwt_required()
def verify_payment(payment_intent_id):
    user_id = int(get_jwt_identity())
    
    for _ in range(5):
        transaction = Transaction.query.filter_by(
            user_id=user_id,
            payment_gateway_id=payment_intent_id,
            status='completed'
        ).first()

        if transaction:
            print(f"Verification successful for user {user_id}, PI_ID: {payment_intent_id}")
            return jsonify({'success': True, 'message': 'Credits updated successfully.'}), 200

        print(f"Verification attempt failed for user {user_id}. Waiting...")
        time.sleep(2)

    print(f"Verification timed out for user {user_id}, PI_ID: {payment_intent_id}")
    return jsonify({'success': False, 'message': 'Could not confirm credit update in time.'}), 408


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


@billing_bp.route('/verify-credits', methods=['GET'], endpoint='verify_credits_status')
@jwt_required()
def verify_user_credits():
    """
    Endpoint to verify user's current credit status
    """
    try:
        user_id = int(get_jwt_identity())
        db.session.expire_all()
        user_subscription = UserSubscription.query.filter_by(user_id=user_id).first()
        if not user_subscription:
            return jsonify({'success': False, 'message': 'No subscription found'}), 404
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
        return jsonify({'success': False, 'error': str(e)}), 500


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
            return jsonify({'success': False, 'message': 'Admin access required'}), 403
        data = request.get_json()
        target_user_id = data.get('user_id')
        try:
            credits_to_add = int(data.get('credits', 0))
        except (ValueError, TypeError):
            return jsonify({'success': False, 'message': 'Credits must be a whole number.'}), 400
        reason = data.get('reason', 'Manual credit addition')
        user_subscription = UserSubscription.query.filter_by(user_id=target_user_id).first()
        if not user_subscription:
            return jsonify({'success': False, 'message': f'No subscription found for user_id={target_user_id}'}), 404
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
        return jsonify({'success': False, 'error': str(e)}), 500

@billing_bp.route('/download-receipt', methods=['GET'])
@jwt_required()
def download_receipt():
    """
    Generates and sends the user's latest TOP-UP RECEIPT.
    (This route is correct and uses the correct PDF generator)
    """
    pdf_service = PDFService()
    pdf_path = None
    try:
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        if not user:
            return jsonify(message="User not found"), 404

        transaction = Transaction.query.filter(
            Transaction.user_id == user_id,
            Transaction.status == 'completed',
            Transaction.subscription_id == None
        ).order_by(Transaction.created_at.desc()).first()

        if not transaction:
             return jsonify(message="No credit receipt history found"), 404

        credits_purchased = int(transaction.amount) 
        
        payment_details = {
            "credits_purchased": credits_purchased,
            "amount_paid": transaction.amount,
            "payment_intent_id": transaction.payment_gateway_id,
            "payment_method_info": transaction.payment_method.replace('_', ' ').title()
        }

        # --- CORRECT: Calls the RECEIPT generator ---
        pdf_path = pdf_service.create_invoice_pdf(user, payment_details)

        if not pdf_path or not os.path.exists(pdf_path):
            return jsonify(message="Could not generate receipt file"), 500

        @after_this_request
        def cleanup(response):
            if pdf_path and os.path.exists(pdf_path):
                try:
                    os.remove(pdf_path)
                    print(f"Cleaned up temp file: {pdf_path}")
                except Exception as e:
                    print(f"Error cleaning up temp receipt file: {e}")
            return response

        return send_file(
            pdf_path,
            as_attachment=True,
            download_name=f"InstantResumeAI_Receipt_{transaction.transaction_id}.pdf",
            mimetype='application/pdf'
        )

    except Exception as e:
        print(f"Error generating receipt: {e}")
        import traceback
        print(traceback.format_exc())
        return jsonify(message="An error occurred while generating the receipt", error=str(e)), 500

# --- THIS IS THE RECTIFIED FUNCTION ---
@billing_bp.route('/download-invoice', methods=['GET'])
@jwt_required()
def download_invoice():
    """
    Generates and sends the user's latest invoice.
    It will generate an INVOICE-style PDF (like Invoice 6.pdf) for 
    EITHER a subscription OR a top-up.
    """
    pdf_service = PDFService()
    pdf_path = None
    try:
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        if not user:
            return jsonify(message="User not found"), 404

        # 1. Try to find the latest SUBSCRIPTION invoice first
        transaction = Transaction.query.filter(
            Transaction.user_id == user_id,
            Transaction.status == 'completed',
            Transaction.subscription_id != None
        ).order_by(Transaction.created_at.desc()).first()

        plan = None
        download_filename = ""

        # 2. If no subscription invoice, find the latest TOP-UP receipt
        if not transaction:
            transaction = Transaction.query.filter(
                Transaction.user_id == user_id,
                Transaction.status == 'completed',
                Transaction.subscription_id == None
            ).order_by(Transaction.created_at.desc()).first()
            
            # If a top-up is found, we set filename for receipt
            if transaction:
                download_filename = f"InstantResumeAI_Receipt_as_Invoice_{transaction.transaction_id}.pdf"
        
        # 3. If still no transaction at all, then return 404
        if not transaction:
             return jsonify(message="No invoice or receipt history found"), 404

        # 4. If it was a subscription, get its plan details
        if transaction.subscription_id:
            user_sub = UserSubscription.query.filter_by(subscription_id=transaction.subscription_id).first()
            if not user_sub:
                 return jsonify(message="Subscription data linked to invoice is missing"), 404
            plan = SubscriptionPlan.query.get(user_sub.plan_id)
            if not plan:
                 return jsonify(message="Plan data linked to invoice is missing"), 404
            download_filename = f"InstantResumeAI_Invoice_{transaction.transaction_id}.pdf"
        
        # 5. Call the INVOICE generator for BOTH cases.
        #    The function in pdf_service.py is smart enough to handle `plan=None`.
        pdf_path = pdf_service.create_subscription_invoice(user, plan, transaction)
        
        if not pdf_path or not os.path.exists(pdf_path):
            return jsonify(message="Could not generate invoice file"), 500

        # 6. Use after_this_request for cleanup
        @after_this_request
        def cleanup_invoice(response):
            if pdf_path and os.path.exists(pdf_path):
                try:
                    os.remove(pdf_path)
                    print(f"Cleaned up temp file: {pdf_path}")
                except Exception as e:
                    print(f"Error cleaning up temp invoice file: {e}")
            return response

        # 7. Send the file
        return send_file(
            pdf_path,
            as_attachment=True,
            download_name=download_filename, # Use the dynamic filename
            mimetype='application/pdf'
        )

    except Exception as e:
        print(f"Error generating invoice: {e}")
        import traceback
        print(traceback.format_exc())
        return jsonify(message="An error occurred while generating the invoice", error=str(e)), 500