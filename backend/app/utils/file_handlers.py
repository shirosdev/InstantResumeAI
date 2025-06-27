# backend/app/utils/file_handlers.py
import os
import re
import logging
from docx import Document
import PyPDF2
import textract
from typing import Dict

logger = logging.getLogger(__name__)

class FileHandler:
    @staticmethod
    def extract_text(file_path: str, file_extension: str) -> str:
        """Extract text with formatting markers preserved"""
        try:
            if file_extension == 'docx':
                return FileHandler._extract_docx_with_formatting(file_path)
            elif file_extension == 'pdf':
                return FileHandler._extract_pdf_with_formatting(file_path)
            elif file_extension == 'txt':
                return FileHandler._extract_text_with_formatting(file_path)
            else:
                return FileHandler._extract_fallback(file_path)
        except Exception as e:
            logger.error(f"Text extraction failed: {str(e)}")
            raise RuntimeError(f"Could not extract text: {str(e)}")
    
    @staticmethod
    def _extract_docx_with_formatting(file_path: str) -> str:
        """Extract DOCX text with formatting markers"""
        try:
            doc = Document(file_path)
            lines = []
            
            for para in doc.paragraphs:
                text = para.text
                
                # Add formatting markers
                if para.style and 'Heading' in para.style.name:
                    text = f"## {text.upper()}"
                elif para.style and 'List' in para.style.name:
                    text = f"• {text}"
                
                # Preserve bold and italic
                for run in para.runs:
                    if run.bold:
                        text = text.replace(run.text, f"**{run.text}**")
                    if run.italic:
                        text = text.replace(run.text, f"*{run.text}*")
                
                lines.append(text)
            
            return '\n'.join(lines)
        except Exception as e:
            logger.error(f"DOCX extraction failed: {str(e)}")
            return textract.process(file_path).decode('utf-8')
    
    @staticmethod
    def _extract_pdf_with_formatting(file_path: str) -> str:
        """Extract PDF text with basic formatting"""
        try:
            with open(file_path, 'rb') as file:
                reader = PyPDF2.PdfReader(file)
                text = []
                
                for page in reader.pages:
                    page_text = page.extract_text()
                    if page_text:
                        # Add simple formatting markers
                        page_text = re.sub(r'\n(\w)', r'\n• \1', page_text)  # Detect bullet points
                        text.append(page_text)
                
                return '\n'.join(text)
        except Exception as e:
            logger.error(f"PDF extraction failed: {str(e)}")
            return textract.process(file_path).decode('utf-8')
    
    @staticmethod
    def _extract_text_with_formatting(file_path: str) -> str:
        """Extract text while preserving existing formatting"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                
                # Enhance existing formatting markers
                content = re.sub(r'^(.*\S.*)$', FileHandler._enhance_line_formatting, content, flags=re.MULTILINE)
                return content
        except UnicodeDecodeError:
            with open(file_path, 'r', encoding='latin-1') as f:
                return f.read()
    
    @staticmethod
    def _enhance_line_formatting(match: re.Match) -> str:
        """Add formatting markers to plain text lines"""
        line = match.group(1)
        
        # Detect section headers
        if (len(line.split()) <= 4 and 
            any(kw in line.lower() for kw in ['experience', 'education', 'skills'])):
            return f"## {line.upper()}"
        
        # Detect bullet points
        if line.strip().startswith(('-', '*', '•')):
            return f"• {line.lstrip(' -*•')}"
        
        return line
    
    @staticmethod
    def _extract_fallback(file_path: str) -> str:
        """Fallback extraction with textract"""
        try:
            return textract.process(file_path).decode('utf-8')
        except Exception as e:
            logger.error(f"Fallback extraction failed: {str(e)}")
            raise RuntimeError("Could not extract text from file")