# backend/app/pdf_service.py
# RECTIFIED: Fixes layout collisions, text wrapping, and missing values.

from fpdf import FPDF
from datetime import datetime
import os

class PDFService:
    def create_invoice_pdf(self, user, payment_details) -> str:
        # ... (This function is correct as per our previous fix for the stamp) ...
        # [This function generates the RECEIPT for TOP-UPS]
        
        class PDF(FPDF):
            def __init__(self, *args, **kwargs):
                super().__init__(*args, **kwargs)
                self.company_name = "InstantResumeAI"
                self.company_address_line1 = "5080 Spectrum Drive,"
                self.company_address_line2 = "Suite 575E, Addison TX 75001"
                self.company_contact = "info@instantresumeai.com"
                self.header_height = 45 

            def header(self):
                # 1. Logo (Top-Left)
                try:
                    logo_path = os.path.join(os.path.dirname(__file__), '..', 'assets', 'logo.png')
                    if os.path.exists(logo_path):
                        self.image(logo_path, x=15, y=10, h=12)
                    else:
                        print("WARNING: Logo file not found at backend/assets/logo.png")
                        self.set_y(10)
                        self.set_x(15)
                        self.set_font("Helvetica", 'B', 12)
                        self.cell(95, 6, self.company_name)
                except Exception as e:
                    print(f"WARNING: Could not load logo for PDF. Error: {e}")

                # 2. Company Address (Left, under logo)
                self.set_y(24) 
                self.set_x(15)
                self.set_font("Helvetica", 'B', 10)
                self.set_text_color(30, 41, 59)
                self.cell(95, 5, self.company_name, 0, 1, 'L')
                
                self.set_x(15)
                self.set_font("Helvetica", '', 9)
                self.set_text_color(80, 80, 80)
                self.cell(95, 5, self.company_address_line1, 0, 1, 'L')
                self.set_x(15)
                self.cell(95, 5, self.company_address_line2, 0, 1, 'L')
                self.set_x(15)
                self.cell(95, 5, f"Email : {self.company_contact}", 0, 1, 'L') 

                # 3. RECEIPT Title (Top-Right)
                self.set_y(10) 
                self.set_x(-75) 
                self.set_font("Helvetica", 'B', 32)
                self.set_text_color(30, 41, 59)
                self.cell(60, 15, "RECEIPT", 0, 1, 'R')

                # 4. STATUS: PAID (Top-Right, under title)
                self.set_x(-75)
                self.set_font("Helvetica", 'B', 12)
                self.set_text_color(72, 187, 120) 
                self.cell(60, 8, "STATUS : PAID", 0, 1, 'R')

            def footer(self):
                self.set_y(-25)
                self.set_font("Helvetica", 'B', 12)
                self.set_text_color(160, 160, 160)
                self.cell(0, 10, "THANK YOU FOR YOUR BUSINESS", 0, 0, 'C')

        pdf = PDF(orientation='P', unit='mm', format='A4')
        pdf.add_page()
        pdf.set_auto_page_break(auto=True, margin=25)
        
        pdf.set_y(pdf.header_height + 15) 
        y_column_start = pdf.get_y()

        # Billed To
        pdf.set_x(15)
        pdf.set_font("Helvetica", 'B', 10)
        pdf.set_text_color(120, 120, 120)
        pdf.cell(95, 7, "Billed To", 0, 1, 'L')
        pdf.set_font("Helvetica", 'B', 11)
        pdf.set_text_color(0, 0, 0)
        user_name = f"{user.first_name or ''} {user.last_name or ''}".strip()
        pdf.cell(95, 6, user_name, 0, 1, 'L')
        pdf.set_font("Helvetica", '', 10)
        pdf.set_text_color(50, 50, 50)
        
        if user.location:
             pdf.cell(95, 6, user.location, 0, 1, 'L')
             
        pdf.cell(95, 6, user.email, 0, 1, 'L')
        y_after_left = pdf.get_y()

        # Payment Details
        pdf.set_y(y_column_start) 
        pdf.set_x(115)           
        pdf.set_font("Helvetica", 'B', 10)
        pdf.set_text_color(120, 120, 120)
        pdf.cell(95, 7, "Payment Details", 0, 1, 'L')

        pdf.set_x(115)
        pdf.set_font("Helvetica", 'B', 10)
        pdf.set_text_color(50, 50, 50)
        pdf.cell(35, 6, "Payment ID :", 0, 0, 'L')
        pdf.set_font("Helvetica", '', 10)
        
        current_y_for_pi = pdf.get_y()
        pdf.set_x(150) 
        pdf.multi_cell(45, 6, payment_details['payment_intent_id'], 0, 'L')
        y_after_pi = pdf.get_y() 
        pdf.set_y(y_after_pi) 

        pdf.set_x(115) 
        pdf.set_font("Helvetica", 'B', 10)
        pdf.set_text_color(50, 50, 50)
        pdf.cell(35, 6, "Payment Date :", 0, 0, 'L')
        pdf.set_font("Helvetica", '', 10)
        pdf.cell(50, 6, datetime.now().strftime('%d-%m-%Y'), 0, 1, 'L')

        pdf.set_x(115)
        pdf.set_font("Helvetica", 'B', 10)
        pdf.set_text_color(50, 50, 50)
        pdf.cell(35, 6, "Payment Method:", 0, 0, 'L')
        pdf.set_font("Helvetica", '', 10)
        pdf.cell(50, 6, payment_details.get('payment_method_info', 'Not available'), 0, 1, 'L')
        
        y_after_right = pdf.get_y()
        pdf.set_y(max(y_after_left, y_after_right) + 15) 

        # Line Item Table
        qty = payment_details['credits_purchased']
        amount = payment_details['amount_paid']
        unit_price = (amount / qty) if qty > 0 else 0 

        pdf.set_font("Helvetica", 'B', 10)
        pdf.set_fill_color(220, 38, 38) 
        pdf.set_text_color(255, 255, 255) 
        
        pdf.set_x(15)
        pdf.cell(95, 10, 'Description', 0, 0, 'L', 1)
        pdf.cell(30, 10, 'Quantity', 0, 0, 'C', 1)
        pdf.cell(30, 10, 'Unit Price', 0, 0, 'R', 1)
        pdf.cell(30, 10, 'Total', 0, 1, 'R', 1)

        # Table body
        pdf.set_font("Helvetica", '', 10)
        pdf.set_text_color(0, 0, 0)
        pdf.set_fill_color(255, 255, 255) 
        
        pdf.set_x(15)
        pdf.cell(95, 12, "Enhancement Credits Top-Up", 'B', 0, 'L', 1)
        pdf.cell(30, 12, str(qty), 'B', 0, 'C', 1)
        pdf.cell(30, 12, f"${unit_price:.2f}", 'B', 0, 'R', 1)
        pdf.cell(30, 12, f"${amount:.2f}", 'B', 1, 'R', 1)
        pdf.ln(15)

        # Summary Table
        summary_x_pos = 130 
        
        pdf.set_x(summary_x_pos)
        pdf.set_font("Helvetica", '', 10)
        pdf.set_text_color(50, 50, 50)
        pdf.cell(35, 7, "Sub Total", 0, 0, 'L') 
        pdf.cell(30, 7, f"${amount:.2f}", 0, 1, 'R') 

        pdf.set_x(summary_x_pos)
        pdf.cell(35, 7, "Taxes", 0, 0, 'L')
        pdf.cell(30, 7, "$0.00", 0, 1, 'R') 
        
        pdf.set_x(summary_x_pos)
        pdf.set_font("Helvetica", 'B', 11)
        pdf.set_text_color(0, 0, 0)
        pdf.cell(35, 9, "Total", 0, 0, 'L')
        pdf.cell(30, 9, f"${amount:.2f}", 0, 1, 'R') 
        
        y_after_total = pdf.get_y()
        
        # PAID Stamp
        try:
            stamp_path = os.path.join(os.path.dirname(__file__), '..', 'assets', 'paid_stamp.png')
            if os.path.exists(stamp_path):
                pdf.image(stamp_path, x=148, y=y_after_total + 2, h=30)
            else:
                print("WARNING: 'backend/assets/paid_stamp.png' not found. Skipping PAID stamp.")
        except Exception as e:
            print(f"WARNING: Could not load PAID stamp image. Error: {e}")

        # Save the PDF
        temp_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'temp')
        os.makedirs(temp_dir, exist_ok=True)
        file_path = os.path.join(temp_dir, f"invoice_{payment_details['payment_intent_id']}.pdf")
        
        pdf.output(file_path)
        return file_path
        
    # --- RECTIFIED METHOD FOR SUBSCRIPTION INVOICES (matches Invoice 6.pdf) ---
    def create_subscription_invoice(self, user, plan, transaction) -> str:
        """
        Generates a professional PDF subscription invoice, matching
        the layout of 'Invoice 6.pdf'.
        """
        
        class InvoicePDF(FPDF):
            # ... (The __init__, header, and footer methods are correct and unchanged) ...
            def __init__(self, *args, **kwargs):
                super().__init__(*args, **kwargs)
                self.company_name = "InstantResumeAI"
                self.company_address_line1 = "5080 Spectrum Drive,"
                self.company_address_line2 = "Suite 575E, Addison TX 75001"
                self.company_contact = "info@instantresumeai.com"
                self.header_height = 45 

            def header(self):
                # 1. Logo (Top-Left)
                try:
                    logo_path = os.path.join(os.path.dirname(__file__), '..', 'assets', 'logo.png')
                    if os.path.exists(logo_path):
                        self.image(logo_path, x=15, y=10, h=12)
                    else:
                        self.set_y(10)
                        self.set_x(15)
                        self.set_font("Helvetica", 'B', 12)
                        self.cell(95, 6, self.company_name)
                except Exception as e:
                    print(f"WARNING: Could not load logo for PDF. Error: {e}")

                # 2. Company Address (Left, under logo)
                self.set_y(24) 
                self.set_x(15)
                self.set_font("Helvetica", 'B', 10)
                self.set_text_color(30, 41, 59)
                self.cell(95, 5, self.company_name, 0, 1, 'L')
                
                self.set_x(15)
                self.set_font("Helvetica", '', 9)
                self.set_text_color(80, 80, 80)
                self.cell(95, 5, self.company_address_line1, 0, 1, 'L')
                self.cell(95, 5, self.company_address_line2, 0, 1, 'L')
                self.cell(95, 5, f"Email : {self.company_contact}", 0, 1, 'L')

                # 3. INVOICE Title (Top-Right)
                self.set_y(10) 
                self.set_x(-75) 
                self.set_font("Helvetica", 'B', 32)
                self.set_text_color(30, 41, 59)
                self.cell(60, 15, "INVOICE", 0, 1, 'R')

            def footer(self):
                self.set_y(-25)
                self.set_font("Helvetica", 'B', 10)
                self.set_text_color(160, 160, 160)
                self.cell(0, 10, "Thank you for your Business", 0, 0, 'C')
                self.set_y(-15)
                self.set_font("Helvetica", '', 9)
                self.set_text_color(120, 120, 120)
                self.cell(0, 10, "If you have any questions, Please Contact info@instantresumeai.com", 0, 0, 'C')

        pdf = InvoicePDF(orientation='P', unit='mm', format='A4')
        pdf.add_page()
        pdf.set_auto_page_break(auto=True, margin=25)
        pdf.set_y(pdf.header_height + 15)
        
        y_column_start = pdf.get_y()

        # Left Column (Billed To)
        pdf.set_x(15)
        pdf.set_font("Helvetica", 'B', 10)
        pdf.set_text_color(120, 120, 120)
        pdf.cell(95, 7, "Billed To", 0, 1, 'L')
        pdf.set_font("Helvetica", 'B', 11)
        pdf.set_text_color(0, 0, 0)
        user_name = f"{user.first_name or ''} {user.last_name or ''}".strip()
        pdf.cell(95, 6, user_name, 0, 1, 'L')
        pdf.set_font("Helvetica", '', 10)
        pdf.set_text_color(50, 50, 50)
        if user.location:
             pdf.cell(95, 6, user.location, 0, 1, 'L')
        pdf.cell(95, 6, user.email, 0, 1, 'L')
        y_after_left = pdf.get_y()

        # Right Column (Invoice Details)
        pdf.set_y(y_column_start) 
        pdf.set_x(115)
        pdf.set_font("Helvetica", 'B', 10)
        pdf.set_text_color(120, 120, 120)
        pdf.cell(95, 7, "Invoice Details", 0, 1, 'L')
        
        pdf.set_x(115)
        pdf.set_font("Helvetica", 'B', 10)
        pdf.set_text_color(50, 50, 50)
        pdf.cell(35, 6, "Invoice Number :", 0, 0, 'L')
        pdf.set_font("Helvetica", '', 10)
        pdf.cell(50, 6, transaction.invoice_number if transaction.invoice_number else f"TR-{transaction.transaction_id}", 0, 1, 'L')

        pdf.set_x(115)
        pdf.set_font("Helvetica", 'B', 10)
        pdf.set_text_color(50, 50, 50)
        pdf.cell(35, 6, "Invoice Date :", 0, 0, 'L')
        pdf.set_font("Helvetica", '', 10)
        pdf.cell(50, 6, transaction.created_at.strftime('%d-%m-%Y'), 0, 1, 'L')
        
        y_after_right = pdf.get_y()
        pdf.set_y(max(y_after_left, y_after_right) + 15) 

        # --- RECTIFIED TABLE ---
        # Line Item Table Header
        pdf.set_font("Helvetica", 'B', 10)
        pdf.set_fill_color(220, 38, 38) # Red header
        pdf.set_text_color(255, 255, 255)
        pdf.set_x(15)
        pdf.cell(95, 10, 'Description', 0, 0, 'L', 1)
        pdf.cell(30, 10, 'Quantity', 0, 0, 'C', 1)
        pdf.cell(30, 10, 'Unit Price', 0, 0, 'R', 1)
        pdf.cell(30, 10, 'Total', 0, 1, 'R', 1)

        # Table body (with multi-line support)
        pdf.set_font("Helvetica", '', 10)
        pdf.set_text_color(0, 0, 0)
        pdf.set_fill_color(255, 255, 255)
        
        # Store Y before main item
        y_before_item = pdf.get_y()

        # --- NEW LOGIC: Differentiate between Subscriptions and Top-ups ---
        is_top_up = transaction.subscription_id is None
        
        if is_top_up:
            # This is a TOP-UP
            # ASSUMPTION: $1 = 1 credit for top-ups
            qty = int(transaction.amount) 
            unit_price = (transaction.amount / qty) if qty > 0 else 0
            
            plan_desc = "Enhancement Credits Top-Up"
            unit_price_desc = f"${unit_price:.2f}"
            quantity_desc = str(qty)
            
            pdf.set_x(15)
            pdf.set_font("Helvetica", 'B', 10) # Main item is bold
            pdf.multi_cell(95, 6, plan_desc, 0, 'L', 1)
            y_after_details = pdf.get_y() # Get height
            
        else:
            # This is a SUBSCRIPTION (like Invoice 6.pdf)
            plan_desc = f"Plan: {plan.plan_name}"
            unit_price_desc = f"${plan.price}/{plan.plan_type.capitalize()}"
            quantity_desc = "1"

            pdf.set_x(15)
            pdf.set_font("Helvetica", 'B', 10) # Main item is bold
            pdf.multi_cell(95, 6, plan_desc, 0, 'L', 1)
            
            # Add the extra details from Invoice 6.pdf
            pdf.set_font("Helvetica", '', 9)
            pdf.set_text_color(80, 80, 80)
            
            pdf.set_x(15)
            pdf.multi_cell(95, 5, f"Subscription Type: {plan.plan_type.capitalize()}", 0, 'L', 1)
            
            # Safely get features
            features_list = []
            if hasattr(plan, 'features') and plan.features and isinstance(plan.features, list):
                features_list = plan.features
            
            if features_list:
                pdf.set_x(15)
                pdf.multi_cell(95, 5, "Details of plan:", 0, 'L', 1)
                for feature in features_list:
                    pdf.set_x(15)
                    # Add a bullet/dash for the feature list
                    pdf.multi_cell(95, 5, f"- {feature}", 0, 'L', 1)
            
            y_after_details = pdf.get_y() # Get height

        # --- END NEW LOGIC ---

        # Determine max height for this row
        # Add a small buffer just in case
        row_height = (y_after_details - y_before_item) + 2
        
        # Now draw the right-side cells, using the captured Y and calculated height
        pdf.set_y(y_before_item)
        pdf.set_font("Helvetica", 'B', 10) # Set font back for these cells
        current_x = 110 # 15 (start) + 95 (width)
        pdf.set_x(current_x)
        pdf.cell(30, row_height, quantity_desc, 0, 0, 'C', 1)
        
        current_x += 30
        pdf.set_x(current_x)
        pdf.cell(30, row_height, unit_price_desc, 0, 0, 'R', 1)
        
        current_x += 30
        pdf.set_x(current_x)
        pdf.cell(30, row_height, f"${transaction.amount:.2f}", 0, 1, 'R', 1)
        
        # Draw the bottom border manually
        pdf.set_y(y_before_item + row_height)
        pdf.set_x(15)
        pdf.cell(180, 0, '', 'T', 1, 'L') # 180 = 95+30+30+30
        
        pdf.ln(15)
        # --- END RECTIFIED TABLE ---

        # Summary Table
        summary_x_pos = 130 
        pdf.set_x(summary_x_pos)
        pdf.set_font("Helvetica", '', 10)
        pdf.set_text_color(50, 50, 50)
        pdf.cell(35, 7, "Sub Total", 0, 0, 'L')
        pdf.cell(30, 7, f"${transaction.amount:.2f}", 0, 1, 'R')

        pdf.set_x(summary_x_pos)
        pdf.cell(35, 7, "Taxes", 0, 0, 'L')
        pdf.cell(30, 7, "$0.00", 0, 1, 'R')
        
        pdf.set_x(summary_x_pos)
        pdf.set_font("Helvetica", 'B', 11)
        pdf.set_text_color(0, 0, 0)
        pdf.cell(35, 9, "Total", 0, 0, 'L')
        pdf.cell(30, 9, f"${transaction.amount:.2f}", 0, 1, 'R')
        
        # --- Save the PDF ---
        temp_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'temp')
        os.makedirs(temp_dir, exist_ok=True)
        file_path = os.path.join(temp_dir, f"invoice_sub_{transaction.transaction_id}.pdf")
        
        pdf.output(file_path)
        return file_path