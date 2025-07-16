# backend/app/services/comprehensive_resume_processor.py (True Async Latency Optimization)

import os
import re
import json
import asyncio
import aiohttp
from openai import OpenAI
from docx import Document
from docx.shared import Pt, RGBColor
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

class IntegratedResumeService:
    """
    Service to enhance a DOCX resume using a high-performance, two-stage pipeline.
    This version implements true async optimization for maximum latency reduction
    while maintaining EXACT original enhancement logic.
    """

    def __init__(self):
        self.xml_illegal_char_re = re.compile(r'[\x00-\x08\x0b\x0c\x0e-\x1F\uD800-\uDFFF\uFFFE\uFFFF]')
        self.client = self._initialize_openai()

    def _sanitize_text(self, text):
        """Removes illegal XML characters from a string."""
        if not isinstance(text, str):
            return ""
        return self.xml_illegal_char_re.sub('', text)

    def _initialize_openai(self):
        """Initializes the OpenAI client once."""
        try:
            import openai
            api_key = os.getenv('OPENAI_API_KEY')
            if not api_key:
                print("ERROR: OpenAI API key not found in environment.")
                return None
            return openai.OpenAI(api_key=api_key)
        except Exception as e:
            print(f"ERROR: OpenAI initialization failed: {str(e)}")
            return None
            
    def _add_resilient_heading(self, doc, text, level):
        """Adds a heading, falling back to manual formatting if the style is missing."""
        try:
            doc.add_heading(text, level=level)
        except KeyError:
            try:
                style_name = f'heading {level}'
                doc.add_heading(text, level=0).style = style_name
            except KeyError:
                print(f"Warning: Heading style for level {level} not found. Applying manual formatting.")
                p = doc.add_paragraph()
                run = p.add_run(text)
                run.bold = True
                font_size = {1: 16, 2: 14}.get(level, 12)
                run.font.size = Pt(font_size)

    def enhance_resume(self, original_file_path: str, job_description: str, output_path: str) -> dict:
        """
        Main method that orchestrates the two-stage enhancement and reporting pipeline.
        OPTIMIZED: Uses true async processing for maximum latency reduction.
        """
        if not self.client:
            return {'success': False, 'error': 'OpenAI client could not be initialized. Check API key.'}
        if not os.path.exists(original_file_path):
            return {'success': False, 'error': 'Original file not found.'}

        try:
            doc = Document(original_file_path)
            
            original_paragraphs = {}
            paragraphs_to_enhance = {}
            paragraph_map = {}

            def collect_paragraphs(paragraphs):
                for p in paragraphs:
                    para_key = f"p_{len(paragraph_map)}"
                    paragraph_map[para_key] = p
                    original_text = self._sanitize_text(p.text)
                    original_paragraphs[para_key] = original_text
                    if len(original_text.strip()) >= 30:
                        paragraphs_to_enhance[para_key] = original_text
            
            all_paragraphs = list(doc.paragraphs)
            for table in doc.tables:
                for row in table.rows:
                    for cell in row.cells:
                        all_paragraphs.extend(cell.paragraphs)
            collect_paragraphs(all_paragraphs)

            if not paragraphs_to_enhance:
                doc.save(output_path)
                return {'success': True, 'summary': 'No text required enhancement.'}

            # Run async optimization
            enhanced_paragraph_texts, report_data = asyncio.run(
                self._async_process_both(paragraphs_to_enhance, original_paragraphs, job_description)
            )
            
            for key, enhanced_text in enhanced_paragraph_texts.items():
                if key in paragraph_map:
                    sanitized_text = self._sanitize_text(enhanced_text)
                    paragraph_map[key].text = sanitized_text
                    if paragraph_map[key].runs:
                        font = paragraph_map[key].runs[0].font
                        font.name = 'Calibri'
                        font.size = Pt(11)

            self._append_executive_audit_report(doc, report_data)

            doc.save(output_path)
            print("Enhancement and report generation complete.")
            return {'success': True}

        except Exception as e:
            import traceback
            print(f"ERROR: Main enhancement pipeline failed: {str(e)}")
            print(traceback.format_exc())
            return {'success': False, 'error': str(e)}

    async def _async_process_both(self, paragraphs_to_enhance, original_paragraphs, job_description):
        """
        Process both enhancement and report generation with true async optimization.
        """
        api_key = os.getenv('OPENAI_API_KEY')
        
        async with aiohttp.ClientSession() as session:
            # Start enhancement immediately
            enhancement_task = self._async_enhance_text(session, paragraphs_to_enhance, job_description, api_key)
            
            # Wait for enhancement to complete
            enhanced_texts = await enhancement_task
            
            # Now start report generation with completed enhancement
            report_task = self._async_generate_report(session, original_paragraphs, enhanced_texts, job_description, api_key)
            
            # Wait for report completion
            report_data = await report_task
            
            return enhanced_texts, report_data

    async def _async_enhance_text(self, session, paragraphs_to_enhance, job_description, api_key):
        """
        Async version of _get_enhanced_text with EXACT original prompts and logic.
        """
        system_prompt = """
        You are an elite AI resume optimization specialist. Your sole task is to rewrite and enhance the provided resume paragraphs to align with the Job Description (JD).
        - Protect all personal, educational, and company details.
        - Plausibly integrate skills and quantifiable metrics from the JD.
        - Your response MUST be a single JSON object where keys are the original paragraph IDs and values are the enhanced paragraph texts. Do not include any other commentary or keys.
        """
        user_prompt = f"""
        **Job Description Context:**
        {job_description[:16000]}

        **JSON object of resume paragraphs to enhance:**
        {json.dumps(paragraphs_to_enhance, indent=2)}
        """
        
        payload = {
            "model": "gpt-4o",
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.3
        }
        
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        async with session.post(
            "https://api.openai.com/v1/chat/completions",
            json=payload,
            headers=headers
        ) as response:
            result = await response.json()
            return json.loads(result["choices"][0]["message"]["content"])

    async def _async_generate_report(self, session, original_texts, enhanced_texts, job_description, api_key):
        """
        Async version of _generate_enhancement_report with EXACT original prompts and logic.
        """
        changed_paragraphs = {
            key: {
                "original": original_texts[key],
                "enhanced": enhanced_texts.get(key, original_texts[key])
            }
            for key in enhanced_texts if original_texts[key] != enhanced_texts.get(key, original_texts[key])
        }

        if not changed_paragraphs:
            return []

        system_prompt = """
        You are an AI resume auditor. Your task is to compare the "original" and "enhanced" versions of resume paragraphs and generate a detailed report explaining the changes.
        **Output Format:**
        - You MUST respond with a single JSON object containing one key: `"enhancement_report"`.
        - The value of `"enhancement_report"` must be a list of JSON objects.
        - Each object represents one enhancement and MUST contain four keys:
            - `"original_text"`: The original paragraph text.
            - `"enhanced_text"`: The new, enhanced paragraph text.
            - `"category"`: One of: 'ATS & Keyword Alignment', 'Impact & Quantification', or 'Clarity & Professionalism'.
            - `"reasoning"`: A concise sentence explaining how the enhanced text is an improvement.
        """
        user_prompt = f"""
        **Job Description for Context:**
        {job_description[:16000]}

        **JSON object of changed paragraphs to analyze:**
        {json.dumps(changed_paragraphs, indent=2)}
        """
        
        payload = {
            "model": "gpt-4o",
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.3
        }
        
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        async with session.post(
            "https://api.openai.com/v1/chat/completions",
            json=payload,
            headers=headers
        ) as response:
            result = await response.json()
            report_data = json.loads(result["choices"][0]["message"]["content"])
            return report_data.get("enhancement_report", [])

    def _get_enhanced_text(self, paragraphs_to_enhance: dict, job_description: str) -> dict:
        """API call focused only on enhancing text."""
        system_prompt = """
        You are an elite AI resume optimization specialist. Your sole task is to rewrite and enhance the provided resume paragraphs to align with the Job Description (JD).
        - Protect all personal, educational, and company details.
        - Plausibly integrate skills and quantifiable metrics from the JD.
        - Your response MUST be a single JSON object where keys are the original paragraph IDs and values are the enhanced paragraph texts. Do not include any other commentary or keys.
        """
        user_prompt = f"""
        **Job Description Context:**
        {job_description[:16000]}

        **JSON object of resume paragraphs to enhance:**
        {json.dumps(paragraphs_to_enhance, indent=2)}
        """
        response = self.client.chat.completions.create(
            model='gpt-4o',
            messages=[{"role": "system", "content": system_prompt}, {"role": "user", "content": user_prompt}],
            response_format={"type": "json_object"},
            temperature=0.3
        )
        return json.loads(response.choices[0].message.content)

    def _generate_enhancement_report(self, original_texts: dict, enhanced_texts: dict, job_description: str) -> list:
        """API call focused only on comparing original vs. enhanced text and generating a report."""
        
        changed_paragraphs = {
            key: {
                "original": original_texts[key],
                "enhanced": enhanced_texts.get(key, original_texts[key])
            }
            for key in enhanced_texts if original_texts[key] != enhanced_texts.get(key, original_texts[key])
        }

        if not changed_paragraphs:
            return []

        system_prompt = """
        You are an AI resume auditor. Your task is to compare the "original" and "enhanced" versions of resume paragraphs and generate a detailed report explaining the changes.
        **Output Format:**
        - You MUST respond with a single JSON object containing one key: `"enhancement_report"`.
        - The value of `"enhancement_report"` must be a list of JSON objects.
        - Each object represents one enhancement and MUST contain four keys:
            - `"original_text"`: The original paragraph text.
            - `"enhanced_text"`: The new, enhanced paragraph text.
            - `"category"`: One of: 'ATS & Keyword Alignment', 'Impact & Quantification', or 'Clarity & Professionalism'.
            - `"reasoning"`: A concise sentence explaining how the enhanced text is an improvement.
        """
        user_prompt = f"""
        **Job Description for Context:**
        {job_description[:16000]}

        **JSON object of changed paragraphs to analyze:**
        {json.dumps(changed_paragraphs, indent=2)}
        """
        response = self.client.chat.completions.create(
            model='gpt-4o',
            messages=[{"role": "system", "content": system_prompt}, {"role": "user", "content": user_prompt}],
            response_format={"type": "json_object"},
            temperature=0.3
        )
        report_data = json.loads(response.choices[0].message.content)
        return report_data.get("enhancement_report", [])

    def _set_cell_color(self, cell, color_hex):
        """Helper function to set the background color of a table cell."""
        shading_elm = OxmlElement('w:shd')
        shading_elm.set(qn('w:fill'), color_hex)
        cell._tc.get_or_add_tcPr().append(shading_elm)

    def _append_executive_audit_report(self, doc, report_data):
        """Appends a professionally formatted, table-based audit report to the document."""
        if not report_data:
            return

        print("Appending Executive Audit Report to the document.")
        doc.add_page_break()
        self._add_resilient_heading(doc, 'InstantResumeAI: Executive Enhancement Report', level=1)
        
        p = doc.add_paragraph()
        p.add_run("This report provides a transparent, detailed breakdown of the strategic improvements applied to your resume.").italic = True
        doc.add_paragraph()

        changes_by_category = {
            'ATS & Keyword Alignment': [],
            'Impact & Quantification': [],
            'Clarity & Professionalism': []
        }
        for change in report_data:
            category = change.get('category')
            if category in changes_by_category:
                changes_by_category[category].append(self._sanitize_text_dict(change))

        category_order = [
            'ATS & Keyword Alignment',
            'Impact & Quantification',
            'Clarity & Professionalism'
        ]

        for category in category_order:
            changes_in_this_category = changes_by_category.get(category)
            
            if changes_in_this_category:
                self._add_resilient_heading(doc, category, level=2)

                for i, change in enumerate(changes_in_this_category):
                    reasoning = change.get('reasoning', 'No reasoning provided.')
                    p_reason = doc.add_paragraph()
                    p_reason.add_run(f'Enhancement #{i+1}: ').bold = True
                    p_reason.add_run(reasoning)

                    table = doc.add_table(rows=2, cols=2)
                    try:
                        table.style = 'Table Grid'
                    except KeyError:
                        pass

                    cell_orig_header, cell_enh_header = table.rows[0].cells
                    self._set_cell_color(cell_orig_header, "FDEBEB")
                    self._set_cell_color(cell_enh_header, "EBFDEB")
                    cell_orig_header.text, cell_enh_header.text = 'Original Text', 'Enhanced Text'
                    cell_orig_header.paragraphs[0].runs[0].bold = True
                    cell_enh_header.paragraphs[0].runs[0].bold = True
                    
                    cell_orig_content, cell_enh_content = table.rows[1].cells
                    original_text = change.get('original_text', 'N/A')
                    enhanced_text = change.get('enhanced_text', 'N/A')
                    
                    p_orig, p_enh = cell_orig_content.paragraphs[0], cell_enh_content.paragraphs[0]
                    run_orig = p_orig.add_run(original_text)
                    run_orig.font.color.rgb = RGBColor(0x9C, 0x00, 0x06)
                    run_enh = p_enh.add_run(enhanced_text)
                    run_enh.font.color.rgb = RGBColor(0x00, 0x61, 0x00)
                    
                    doc.add_paragraph()
    
    def _sanitize_text_dict(self, d: dict) -> dict:
        """Sanitizes all string values in a dictionary."""
        return {k: self._sanitize_text(v) if isinstance(v, str) else v for k, v in d.items()}