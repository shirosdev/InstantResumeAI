# backend/app/pdf_service.py

from fpdf import FPDF
from datetime import datetime
import os

class PDFService:
    def create_invoice_pdf(self, user, payment_details) -> str:
        """
        Generates a professional PDF invoice with correct alignment and payment method logos.
        """
        class PDF(FPDF):
            def __init__(self, *args, **kwargs):
                super().__init__(*args, **kwargs)
                self.company_name = "InstantResumeAI"
                self.company_address = "123 Innovation Drive, Tech City, 570023"
                self.company_contact = "support@instantresumeai.com"
                self.header_height = 60

            def header(self):
                self.set_fill_color(248, 249, 250)
                self.rect(0, 0, self.w, self.header_height, 'F')

                try:
                    # Corrected Path Calculation:
                    # os.path.dirname(__file__) -> backend/app
                    # os.path.dirname(os.path.dirname(__file__)) -> backend
                    backend_root = os.path.dirname(os.path.dirname(__file__))
                    logo_path = os.path.join(backend_root, 'assets', 'logo.png')

                    print(f"DEBUG: Calculated logo path: {logo_path}") # Keep for debugging
                    if os.path.exists(logo_path):
                        self.image(logo_path, x=15, y=12, h=18)
                    else:
                        print(f"WARNING: Logo file NOT FOUND at calculated path: {logo_path}") # Keep for debugging
                except Exception as e:
                    print(f"WARNING: Could not load logo for PDF. Error: {e}")

                self.set_y(32)
                self.set_x(15)
                self.set_font("Helvetica", 'B', 11)
                self.set_text_color(30, 41, 59)
                self.cell(95, 6, self.company_name)
                self.ln()
                self.set_x(15)
                self.set_font("Helvetica", '', 9)
                self.set_text_color(80, 80, 80)
                self.cell(95, 5, self.company_address)
                self.ln()
                self.set_x(15)
                self.cell(95, 5, self.company_contact)

                self.set_y(15)
                self.set_x(-60)
                self.set_font("Helvetica", 'B', 30)
                self.set_text_color(30, 41, 59)
                self.cell(50, 15, "INVOICE", 0, 1, 'R')

                self.set_x(-60)
                self.set_font("Helvetica", 'B', 12)
                self.set_text_color(72, 187, 120)
                self.cell(50, 8, "STATUS: PAID", 0, 1, 'R')

            def footer(self):
                self.set_y(-25)
                self.set_font("Helvetica", 'I', 9)
                self.set_text_color(160, 160, 160)
                self.cell(0, 10, "Thank you for your business!", 0, 1, 'C')
                self.cell(0, 10, "If you have any questions, please contact support@instantresumeai.com", 0, 0, 'C')

        pdf = PDF(orientation='P', unit='mm', format='A4')
        pdf.add_page()

        pdf.set_y(pdf.header_height + 10)

        y_before_details = pdf.get_y()

        pdf.set_x(15)
        pdf.set_font("Helvetica", 'B', 11)
        pdf.set_text_color(80, 80, 80)
        pdf.cell(95, 7, "Billed To")
        pdf.ln()
        pdf.set_x(15)
        pdf.set_font("Helvetica", '', 11)
        pdf.set_text_color(0, 0, 0)
        user_name = f"{user.first_name or ''} {user.last_name or ''}".strip()
        pdf.cell(95, 6, user_name)
        pdf.ln()
        pdf.set_x(15)
        pdf.cell(95, 6, user.email)

        pdf.set_y(y_before_details)
        pdf.set_x(115)
        pdf.set_font("Helvetica", 'B', 11)
        pdf.set_text_color(80, 80, 80)
        pdf.cell(95, 7, "Invoice Details")
        pdf.ln()

        pdf.set_x(115)
        pdf.set_font("Helvetica", 'B', 10)
        pdf.cell(40, 6, "Invoice Number:")
        pdf.set_font("Helvetica", '', 10)
        pdf.cell(55, 6, payment_details['payment_intent_id'])
        pdf.ln()

        pdf.set_x(115)
        pdf.set_font("Helvetica", 'B', 10)
        pdf.cell(40, 6, "Payment Date:")
        pdf.set_font("Helvetica", '', 10)
        pdf.cell(55, 6, datetime.now().strftime('%B %d, %Y'))
        pdf.ln()

        pdf.set_x(115)
        pdf.set_font("Helvetica", 'B', 10)
        pdf.cell(40, 6, "Payment Method:")
        
        brand = payment_details.get('payment_method_brand')
        logo_path = None
        if brand:
            logo_filename = f"{brand}.png"
            logo_path = os.path.join(os.path.dirname(__file__), '..', '..', 'src', 'assets', 'payment_logos', logo_filename)

        if logo_path and os.path.exists(logo_path):
            pdf.image(logo_path, x=pdf.get_x(), y=pdf.get_y() + 1, h=4)
            pdf.set_x(pdf.get_x() + 8)
            pdf.set_font("Helvetica", '', 10)
            pdf.cell(47, 6, payment_details.get('payment_method_info', 'Not available'))
        else:
            pdf.set_font("Helvetica", '', 10)
            pdf.cell(55, 6, payment_details.get('payment_method_info', 'Not available'))

        pdf.ln(20)

        pdf.set_font("Helvetica", 'B', 11)
        pdf.set_fill_color(230, 126, 80)
        pdf.set_text_color(255, 255, 255)
        pdf.cell(130, 10, 'Description', 'LTB', 0, 'L', 1)
        pdf.cell(30, 10, 'Quantity', 'TB', 0, 'C', 1)
        pdf.cell(30, 10, 'Amount', 'RTB', 1, 'R', 1)

        pdf.set_font("Helvetica", '', 11)
        pdf.set_text_color(0, 0, 0)
        pdf.set_fill_color(253, 253, 253)
        pdf.cell(130, 12, "Enhancement Credits Top-Up", 'LRB', 0, 'L', 1)
        pdf.cell(30, 12, str(payment_details['credits_purchased']), 'RB', 0, 'C', 1)
        pdf.cell(30, 12, f"${payment_details['amount_paid']:.2f}", 'RB', 1, 'R', 1)
        pdf.ln(15)

        pdf.set_font("Helvetica", '', 11)
        pdf.set_x(-80)
        pdf.cell(40, 8, "Subtotal:", 0, 0, 'R')
        pdf.cell(30, 8, f"${payment_details['amount_paid']:.2f}", 0, 1, 'R')

        pdf.set_x(-80)
        pdf.cell(40, 8, "Taxes:", 0, 0, 'R')
        pdf.cell(30, 8, "$0.00", 0, 1, 'R')
        
        pdf.set_x(-80)
        pdf.set_font("Helvetica", 'B', 12)
        pdf.set_fill_color(240, 240, 240)
        pdf.cell(40, 10, "Total Paid (USD):", 0, 0, 'R', 1)
        pdf.cell(30, 10, f"${payment_details['amount_paid']:.2f}", 0, 1, 'R', 1)

        temp_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'temp')
        os.makedirs(temp_dir, exist_ok=True)
        file_path = os.path.join(temp_dir, f"invoice_{payment_details['payment_intent_id']}.pdf")
        
        pdf.output(file_path)
        return file_path