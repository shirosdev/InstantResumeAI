import os
import re
import json
import asyncio
import aiohttp
import logging
from openai import OpenAI
from docx import Document
from docx.shared import Pt, RGBColor
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

class IntegratedResumeService:
    def __init__(self):
        self.xml_illegal_char_re = re.compile(r'[\x00-\x08\x0b\x0c\x0e-\x1F\uD800-\uDFFF\uFFFE\uFFFF]')
        self.logger = logging.getLogger(__name__)
        logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
        self.client = self._initialize_openai()

    def _sanitize_text(self, text):
        """Removes illegal XML characters from a string."""
        if not isinstance(text, str):
            return ""
        return self.xml_illegal_char_re.sub('', text)

    def _initialize_openai(self):
        """Initializes the OpenAI client once."""
        try:
            api_key = os.getenv('OPENAI_API_KEY')
            if not api_key:
                self.logger.error("OpenAI API key not found in environment.")
                return None
            return OpenAI(api_key=api_key)
        except Exception as e:
            self.logger.error(f"OpenAI initialization failed: {str(e)}")
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
                self.logger.warning(f"Heading style for level {level} not found. Applying manual formatting.")
                p = doc.add_paragraph()
                run = p.add_run(text)
                run.bold = True
                font_size = {1: 16, 2: 14}.get(level, 12)
                run.font.size = Pt(font_size)

    def enhance_resume(self, original_file_path: str, job_description: str, output_path: str) -> dict:
        """
        Main method that orchestrates the enhancement pipeline with diff highlighting.
        """
        if not self.client:
            self.logger.error("OpenAI client not initialized.")
            return {"success": False, "error": "OpenAI client could not be initialized. Check API key."}

        if not original_file_path or not os.path.exists(original_file_path):
            self.logger.error(f"Original file not found or path is invalid: {original_file_path}")
            return {"success": False, "error": "Original file not found or path is invalid."}

        if not job_description or not isinstance(job_description, str) or len(job_description.strip()) < 10:
            self.logger.error(f"Invalid job description provided. Length: {len(job_description.strip()) if isinstance(job_description, str) else 'N/A'}")
            return {"success": False, "error": "Job description must be a non-empty string of at least 10 characters."}

        output_dir = os.path.dirname(output_path)
        if output_dir and not os.path.exists(output_dir):
            try:
                os.makedirs(output_dir)
                self.logger.info(f"Created output directory: {output_dir}")
            except OSError as e:
                self.logger.error(f"Could not create output directory {output_dir}: {e}")
                return {"success": False, "error": f"Could not create output directory: {e}"}

        try:
            doc = Document(original_file_path)
            self.logger.info(f"Successfully loaded document from {original_file_path}")
            original_paragraphs = {}
            paragraphs_to_enhance = {}
            paragraph_map = {}

            # Keywords that indicate a line has special formatting and should not be touched.
            exclusion_keywords = ["Client:", "Job Title:"]

            def collect_paragraphs(paragraphs):
                for p in paragraphs:
                    para_key = f"p_{len(paragraph_map)}"
                    paragraph_map[para_key] = p
                    original_text = self._sanitize_text(p.text)
                    original_paragraphs[para_key] = original_text
                    
                    # Check if any exclusion keyword is in the paragraph.
                    if any(keyword in original_text for keyword in exclusion_keywords):
                        continue # Skip this paragraph entirely

                    # Enhance any other paragraph with enough content.
                    if len(original_text.strip()) >= 20:
                        paragraphs_to_enhance[para_key] = original_text

            all_paragraphs = list(doc.paragraphs)
            for table in doc.tables:
                for row in table.rows:
                    for cell in row.cells:
                        all_paragraphs.extend(cell.paragraphs)
            collect_paragraphs(all_paragraphs)

            if not paragraphs_to_enhance:
                self.logger.info("No paragraphs required enhancement. Saving original document.")
                doc.save(output_path)
                return {'success': True, 'summary': 'No text required enhancement; formatting preserved.'}

            # Enhanced text processing only (no report generation)
            enhanced_paragraph_texts = asyncio.run(
                self._async_enhance_text(paragraphs_to_enhance, job_description)
            )

            # Apply diff highlighting with original formatting logic
            for key, enhanced_text in enhanced_paragraph_texts.items():
                if key in paragraph_map and key in original_paragraphs:
                    original_text = original_paragraphs[key]
                    self._apply_diff_highlighting_with_formatting(
                        paragraph_map[key], 
                        original_text, 
                        enhanced_text
                    )

            doc.save(output_path)
            self.logger.info("Enhancement with diff highlighting complete.")
            return {"success": True}

        except FileNotFoundError:
            self.logger.exception(f"Error: Original file not found at {original_file_path}")
            return {"success": False, "error": "Original resume file not found."}
        except Exception as e:
            self.logger.exception(f"Main enhancement pipeline failed: {str(e)}")
            return {"success": False, "error": str(e)}

    def _apply_diff_highlighting_with_formatting(self, paragraph, original_text, enhanced_text):
        """
        Applies word-level diff highlighting while preserving the existing formatting logic.
        Maintains heading detection and tab spacing as in the original implementation.
        """
        sanitized_text = self._sanitize_text(enhanced_text)

        heading_text = ""
        content_text = sanitized_text
        
        if ':' in sanitized_text:
            parts = sanitized_text.split(':', 1)
            if 0 < len(parts[0]) < 60: 
                heading_text = parts[0] + ':'
                content_text = parts[1]

        base_style = None
        if paragraph.runs:
            first_run = paragraph.runs[0]
            base_style = {
                'font_name': first_run.font.name,
                'font_size': first_run.font.size,
                'font_color_rgb': first_run.font.color.rgb if first_run.font.color and first_run.font.color.rgb else None
            }
        
        for run in paragraph.runs:
            paragraph._p.remove(run._r)

        # Add heading if present (no diff highlighting for headings)
        if heading_text:
            run_heading = paragraph.add_run(heading_text)
            run_heading.bold = True
            if base_style:
                if base_style['font_name']: run_heading.font.name = base_style['font_name']
                if base_style['font_size']: run_heading.font.size = base_style['font_size']
                if base_style['font_color_rgb']: run_heading.font.color.rgb = base_style['font_color_rgb']
            
            paragraph.add_run('\t')

        # Apply diff highlighting to content
        if content_text:
            self._apply_word_level_highlighting(
                paragraph, 
                original_text, 
                content_text.lstrip(),
                base_style,
                heading_text
            )

    def _apply_word_level_highlighting(self, paragraph, original_text, content_text, base_style, heading_text):
        """
        Applies word-level highlighting to identify and highlight new or changed words.
        """
        # Extract original content for comparison (remove heading if present)
        original_content = original_text
        if heading_text and ':' in original_text:
            original_content = original_text.split(':', 1)[1].lstrip()
        
        # Split into words for comparison
        original_words = set(original_content.split())
        enhanced_words = content_text.split()
        
        # Identify new words that weren't in the original
        new_words = set(enhanced_words) - original_words
        
        # Rebuild content word by word with highlighting
        for i, word in enumerate(enhanced_words):
            if i > 0:
                # Add space before each word except the first
                paragraph.add_run(' ')
            
            run = paragraph.add_run(self._sanitize_text(word))
            run.bold = False
            
            # Apply base styling
            if base_style:
                if base_style['font_name']: run.font.name = base_style['font_name']
                if base_style['font_size']: run.font.size = base_style['font_size']
                if base_style['font_color_rgb']: run.font.color.rgb = base_style['font_color_rgb']
            
            # Apply brighter yellow font color for new/changed words
            if word in new_words:
                run.font.color.rgb = RGBColor(0xB8, 0x86, 0x0B)  # Brighter yellow-gold font color

    async def _async_enhance_text(self, paragraphs_to_enhance, job_description):
        """
        Async enhancement with original prompts preserved.
        """
        api_key = os.getenv('OPENAI_API_KEY')
        
        async with aiohttp.ClientSession() as session:
            system_prompt = """
            You are an elite AI resume optimization specialist. Your sole task is to rewrite and enhance the provided resume paragraphs to align with the Job Description (JD).
            - Return ONLY the enhanced text as a plain string.
            - Do NOT add any markdown, formatting, or special characters like asterisks.
            - Focus on improving the content by integrating skills and quantifiable metrics from the JD where appropriate.
            - Maintain a professional, concise, and action-oriented tone.
            Your entire response MUST be a single JSON object where keys are the original paragraph IDs and values are the enhanced plain text strings.
            """
            user_prompt = f"""
            **Job Description Context:**
            {job_description[:16000]}

            **JSON object of resume paragraphs to enhance:**
            {json.dumps(paragraphs_to_enhance, indent=2)}
            """
            payload = {
                "model": "gpt-4o",
                "messages": [{"role": "system", "content": system_prompt}, {"role": "user", "content": user_prompt}],
                "response_format": {"type": "json_object"},
                "temperature": 0.3
            }
            headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
            
            async with session.post("https://api.openai.com/v1/chat/completions", json=payload, headers=headers) as response:
                try:
                    response.raise_for_status()
                    result = await response.json()
                    return json.loads(result["choices"][0]["message"]["content"])
                except Exception as e:
                    self.logger.error(f"OpenAI API call failed (enhancement): {e}")
                    return paragraphs_to_enhance