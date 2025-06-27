# backend/app/services/token_service.py - Accurate Token Management

import tiktoken
import os
from typing import Tuple

class TokenManagementService:
    """Service for accurate token counting and management"""
    
    def __init__(self, model: str = "gpt-4o"):
        self.model = model
        try:
            self.encoding = tiktoken.encoding_for_model(model)
        except KeyError:
            # Fallback to a default encoding if model is not recognized
            print(f"Warning: Model {model} not found in tiktoken, using cl100k_base encoding")
            self.encoding = tiktoken.get_encoding("cl100k_base")
        self.max_input_tokens = int(os.getenv('MAX_INPUT_TOKENS', 15000))
        self.reserved_tokens = int(os.getenv('RESERVED_TOKENS', 500))
        
    def count_tokens(self, text: str) -> int:
        """Get accurate token count for text"""
        return len(self.encoding.encode(text))
    
    def calculate_limits(self, resume_text: str, job_description: str, system_prompt: str) -> Tuple[int, int, bool]:
        """
        Calculate token usage and limits
        Returns: (input_tokens, max_response_tokens, is_within_limits)
        """
        resume_tokens = self.count_tokens(resume_text)
        job_desc_tokens = self.count_tokens(job_description)
        system_tokens = self.count_tokens(system_prompt)
        
        total_input_tokens = resume_tokens + job_desc_tokens + system_tokens
        
        # Calculate available tokens for response
        available_for_response = self.max_input_tokens - total_input_tokens - self.reserved_tokens
        max_response_tokens = min(4000, max(500, available_for_response))
        
        is_within_limits = total_input_tokens <= self.max_input_tokens
        
        return total_input_tokens, max_response_tokens, is_within_limits
    
    def truncate_if_needed(self, resume_text: str, job_description: str) -> Tuple[str, str]:
        """
        Truncate content if it exceeds token limits while preserving important information
        """
        resume_tokens = self.count_tokens(resume_text)
        job_desc_tokens = self.count_tokens(job_description)
        
        # If within limits, return as is
        if resume_tokens + job_desc_tokens <= self.max_input_tokens - 2000:  # Reserve for system prompt and response
            return resume_text, job_description
        
        # Prioritize resume content over job description
        max_resume_tokens = min(resume_tokens, 8000)  # Allow up to 8000 tokens for resume
        max_job_desc_tokens = self.max_input_tokens - max_resume_tokens - 2000
        
        truncated_resume = self._truncate_text(resume_text, max_resume_tokens)
        truncated_job_desc = self._truncate_text(job_description, max_job_desc_tokens)
        
        return truncated_resume, truncated_job_desc
    
    def _truncate_text(self, text: str, max_tokens: int) -> str:
        """Truncate text to specified token limit while preserving structure"""
        if self.count_tokens(text) <= max_tokens:
            return text
        
        # Split into sections and preserve important parts
        lines = text.split('\n')
        current_text = ""
        current_tokens = 0
        
        for line in lines:
            line_tokens = self.count_tokens(line + '\n')
            if current_tokens + line_tokens <= max_tokens:
                current_text += line + '\n'
                current_tokens += line_tokens
            else:
                # Try to add a truncation indicator
                truncation_note = "\n[Content truncated due to length limits]"
                if current_tokens + self.count_tokens(truncation_note) <= max_tokens:
                    current_text += truncation_note
                break
        
        return current_text.strip()