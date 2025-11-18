# backend/app/routes/billing.py
# --- FULLY CORRECTED FILE ---

from flask import Blueprint, request, jsonify, current_app, send_file, after_this_request
from flask_jwt_extended import jwt_required, get_jwt_identity
import stripe
import os
import traceback
import time
from datetime import datetime, date, timedelta # Added timedelta

from app import db
from app.models.user import User
from app.models.subscription import UserSubscription, SubscriptionPlan
from app.models.transactions import Transaction
from app.services.email_service import EmailService
from app.pdf_service import PDFService

billing_bp = Blueprint('billing', __name__)

@billing_bp.route('/create-payment-intent', methods=['POST'])
@jwt_required()
def create_payment():
    stripe.api_key = current_app.config['STRIPE_SECRET_KEY']
    if not stripe.api_key:
        return jsonify(error="Server is not configured for payments."), 500

    try:
        data = request.get_json()
        user_id = get_jwt_identity()

        plan_id = data.get('plan_id')
        quantity = data.get('quantity')
        agreed_to_terms = data.get('agreedToTerms', False)
        
        amount = 0
        metadata = { 'user_id': str(user_id) }
        description = ""

        if plan_id:
            # --- CRITICAL FIX FOR THE 500 ERROR ---
            try:
                # Force integer conversion. If this fails, return 400 immediately.
                plan_id_int = int(plan_id)
            except (ValueError, TypeError):
                print(f"Invalid plan_id received: {plan_id}")
                return jsonify(error="Invalid plan ID format. Expected number."), 400

            print(f"Handling SUBSCRIPTION payment for plan_id: {plan_id_int}")
            
            # Query using the integer ID
            plan = SubscriptionPlan.query.get(plan_id_int)
            
            if not plan:
                return jsonify(error="Plan not found."), 404
            
            if plan.price <= 0:
                 return jsonify(error="This plan cannot be purchased directly."), 400
            
            amount = int(plan.price * 100) 
            metadata['plan_id'] = str(plan_id_int)
            description = f"Subscription: {plan.plan_name}"

        elif quantity:
            # ... (Top up logic remains the same) ...
            try:
                qty_int = int(quantity)
            except:
                return jsonify(error="Invalid quantity."), 400
            
            amount = qty_int * 100 
            metadata['credits_purchased'] = str(qty_int)
            description = f"{qty_int} enhancement credits"
        
        else:
            return jsonify(error="Invalid request."), 400

        # Create intent
        intent = stripe.PaymentIntent.create(
            amount=amount,
            currency='usd',
            automatic_payment_methods={'enabled': True},
            metadata=metadata,
            description=description
        )
        return jsonify({'clientSecret': intent.client_secret})

    except Exception as e:
        print(f"Error creating PaymentIntent: {e}")
        return jsonify(error=str(e)), 500

@billing_bp.route('/webhook', methods=['POST'])
def webhook():
    endpoint_secret = current_app.config.get('STRIPE_WEBHOOK_SECRET')
    payload = request.get_data()
    sig_header = request.headers.get('Stripe-Signature')
    event = None

    try:
        event = stripe.Webhook.construct_event(payload, sig_header, endpoint_secret)
    except Exception as e:
        print(f"Webhook Error: {e}")
        return jsonify(error=str(e)), 400

    if event['type'] == 'payment_intent.succeeded':
        payment_intent = event['data']['object']
        
        # RECTIFIED: Idempotency Check
        existing = Transaction.query.filter_by(payment_gateway_id=payment_intent['id']).first()
        if existing:
            print(f"Transaction {payment_intent['id']} already processed.")
            return jsonify(success=True), 200

        metadata = payment_intent.get('metadata', {})
        try:
            user_id = int(metadata.get('user_id'))
            plan_id_str = metadata.get('plan_id')
            credits_str = metadata.get('credits_purchased')

            user = User.query.get(user_id)
            user_sub = UserSubscription.query.filter_by(user_id=user_id).first()
            email_service = EmailService()
            
            payment_method_for_db = "stripe" # Simplified for brevity

            if plan_id_str:
                # SUBSCRIPTION Logic
                plan = SubscriptionPlan.query.get(int(plan_id_str))
                if plan:
                    user_sub.plan_id = plan.plan_id
                    user_sub.start_date = date.today()
                    user_sub.end_date = date.today() + timedelta(days=plan.duration_days)
                    user_sub.status = 'active'
                    user_sub.monthly_enhancements_used = 0
                    user_sub.credits_reset_at = datetime.utcnow()
                    
                    txn = Transaction(
                        user_id=user_id,
                        subscription_id=user_sub.subscription_id,
                        amount=payment_intent.get('amount', 0) / 100.0,
                        payment_method=payment_method_for_db,
                        payment_gateway_id=payment_intent.get('id'),
                        status='completed',
                        description=f"Subscription: {plan.plan_name}"
                    )
                    db.session.add(txn)
                    db.session.commit()
                    
                    # Send INVOICE Email
                    email_service.send_subscription_invoice_email(user, plan, txn)

            elif credits_str:
                # TOP-UP Logic
                qty = int(credits_str)
                user_sub.enhancement_credits = (user_sub.enhancement_credits or 0) + qty
                
                txn = Transaction(
                    user_id=user_id,
                    amount=payment_intent.get('amount', 0) / 100.0,
                    payment_method=payment_method_for_db,
                    payment_gateway_id=payment_intent.get('id'),
                    status='completed',
                    description=f'{qty} enhancement credits'
                )
                db.session.add(txn)
                db.session.commit()

                # RECTIFIED: Send INVOICE Email (plan=None indicates Top-up Invoice)
                email_service.send_subscription_invoice_email(user, None, txn)
            
            db.session.commit()
        
        except Exception as e:
            db.session.rollback()
            print(f"Webhook Processing Error: {e}")
            return jsonify(error=str(e)), 500

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
    (This is deprecated by /auth/status but kept for now)
    """
    try:
        user_id = int(get_jwt_identity())
        db.session.expire_all()
        user_subscription = UserSubscription.query.filter_by(user_id=user_id).first()
        if not user_subscription:
            return jsonify({'success': False, 'message': 'No subscription found'}), 404
        
        plan = SubscriptionPlan.query.get(user_subscription.plan_id)
        if not plan:
            return jsonify({'success': False, 'message': 'Subscription plan not found'}), 404
            
        from app.models.resume import ResumeEnhancement
        enhancement_count = ResumeEnhancement.query.filter_by(user_id=user_id).count()
        
        # --- START OF FIX ---
        # Define variables with default values first
        total_available = 0
        remaining = 0
        
        if plan and plan.resume_limit is not None:
            total_available = plan.resume_limit + (user_subscription.enhancement_credits or 0)
            remaining = total_available - enhancement_count
        else:
            total_available = 'unlimited'
            remaining = 'unlimited'
        # --- END OF FIX ---
            
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
                'total_available': total_available, # Now correctly defined
                'remaining': remaining,           # Now correctly defined
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
    """Generates a generic RECEIPT for the dashboard (Works for Sub & Top-up)"""
    pdf_service = PDFService()
    try:
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)

        # RECTIFIED: Removed subscription_id check to allow receipts for all transactions
        transaction = Transaction.query.filter(
            Transaction.user_id == user_id,
            Transaction.status == 'completed'
        ).order_by(Transaction.created_at.desc()).first()

        if not transaction:
             return jsonify(message="No transaction history found"), 404

        # Determine quantity string for receipt
        qty = 1
        if not transaction.subscription_id and transaction.description:
             try:
                 qty = int(transaction.description.split()[0])
             except:
                 pass

        payment_details = {
            "credits_purchased": qty, 
            "amount_paid": transaction.amount,
            "payment_intent_id": transaction.payment_gateway_id,
            "payment_method_info": transaction.payment_method
        }

        pdf_path = pdf_service.create_invoice_pdf(user, payment_details)

        if not pdf_path or not os.path.exists(pdf_path):
            return jsonify(message="Could not generate receipt file"), 500

        @after_this_request
        def cleanup(response):
            try:
                if pdf_path and os.path.exists(pdf_path): os.remove(pdf_path)
            except: pass
            return response

        return send_file(pdf_path, as_attachment=True, download_name=f"Receipt_{transaction.transaction_id}.pdf")

    except Exception as e:
        return jsonify(message="Error generating receipt", error=str(e)), 500

@billing_bp.route('/download-invoice', methods=['GET'])
@jwt_required()
def download_invoice():
    """
    Generates and sends the user's LATEST invoice, whether it's
    for a subscription or a top-up.
    """
    pdf_service = PDFService()
    pdf_path = None
    try:
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        if not user:
            return jsonify(message="User not found"), 404

        # 1. Find the MOST RECENT completed transaction of ANY type
        transaction = Transaction.query.filter(
            Transaction.user_id == user_id,
            Transaction.status == 'completed'
        ).order_by(Transaction.created_at.desc()).first()

        # 2. If no transaction at all, return 404
        if not transaction:
             return jsonify(message="No invoice history found"), 404

        # 3. Check if it was a subscription and get plan details
        plan = None
        download_filename = ""
        
        if transaction.subscription_id:
            # This was a subscription purchase
            user_sub = UserSubscription.query.filter_by(subscription_id=transaction.subscription_id).first()
            if user_sub:
                plan = SubscriptionPlan.query.get(user_sub.plan_id)
            
            if not plan:
                 print(f"Warning: Could not find plan details for sub {transaction.subscription_id}")
            
            download_filename = f"InstantResumeAI_Invoice_{transaction.transaction_id}.pdf"
        
        else:
            # This was a top-up (plan is None)
            download_filename = f"InstantResumeAI_Invoice_Receipt_{transaction.transaction_id}.pdf"
        
        # 4. Call the INVOICE generator for BOTH cases.
        #    The `create_subscription_invoice` function correctly handles `plan=None`.
        pdf_path = pdf_service.create_subscription_invoice(user, plan, transaction)
        
        if not pdf_path or not os.path.exists(pdf_path):
            return jsonify(message="Could not generate invoice file"), 500

        # 5. Use after_this_request for cleanup
        @after_this_request
        def cleanup_invoice(response):
            if pdf_path and os.path.exists(pdf_path):
                try:
                    os.remove(pdf_path)
                    print(f"Cleaned up temp file: {pdf_path}")
                except Exception as e:
                    print(f"Error cleaning up temp invoice file: {e}")
            return response

        # 6. Send the file
        return send_file(
            pdf_path,
            as_attachment=True,
            download_name=download_filename,
            mimetype='application/pdf'
        )

    except Exception as e:
        print(f"Error generating invoice: {e}")
        import traceback
        print(traceback.format_exc())
        return jsonify(message="An error occurred while generating the invoice", error=str(e)), 500