# backend/app/services/enhancement_validator.py - Quality Assurance

import re
from typing import Dict, List, Tuple, Optional
from difflib import SequenceMatcher

class EnhancementValidator:
    """Service to validate enhancement quality and detect issues"""
    
    def __init__(self):
        self.required_sections = [
            'experience', 'education', 'skills', 'summary', 'objective'
        ]
        
        self.factual_patterns = {
            'dates': r'\b(?:19|20)\d{2}\b|\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}\b',
            'companies': r'\b[A-Z][A-Za-z\s&,\.]{2,30}(?:Inc|LLC|Corp|Corporation|Company|Ltd|Limited)\b',
            'education': r'\b(?:Bachelor|Master|PhD|Associate|Certificate|Diploma)\b',
            'locations': r'\b[A-Z][a-z]+,\s*[A-Z]{2}\b|\b[A-Z][a-z]+,\s*[A-Z][a-z]+\b',
            'emails': r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',
            'phones': r'\b(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b'
        }
    
    def validate_enhancement(self, original_text: str, enhanced_text: str, job_description: str) -> Dict:
        """
        Comprehensive validation of enhancement quality
        Returns validation results with scores and recommendations
        """
        validation_results = {
            'overall_score': 0,
            'factual_accuracy': self._check_factual_accuracy(original_text, enhanced_text),
            'structure_preservation': self._check_structure_preservation(original_text, enhanced_text),
            'job_alignment': self._check_job_alignment(enhanced_text, job_description),
            'formatting_quality': self._check_formatting_quality(enhanced_text),
            'content_enhancement': self._check_content_enhancement(original_text, enhanced_text),
            'issues_found': [],
            'recommendations': []
        }
        
        # Calculate overall score
        scores = [
            validation_results['factual_accuracy']['score'],
            validation_results['structure_preservation']['score'],
            validation_results['job_alignment']['score'],
            validation_results['formatting_quality']['score'],
            validation_results['content_enhancement']['score']
        ]
        validation_results['overall_score'] = sum(scores) / len(scores)
        
        # Collect all issues and recommendations
        for category in ['factual_accuracy', 'structure_preservation', 'job_alignment', 'formatting_quality', 'content_enhancement']:
            validation_results['issues_found'].extend(validation_results[category].get('issues', []))
            validation_results['recommendations'].extend(validation_results[category].get('recommendations', []))
        
        return validation_results
    
    def _check_factual_accuracy(self, original: str, enhanced: str) -> Dict:
        """Check if factual information is preserved"""
        score = 100
        issues = []
        recommendations = []
        
        # Extract factual elements from both versions
        original_facts = self._extract_factual_elements(original)
        enhanced_facts = self._extract_factual_elements(enhanced)
        
        # Check for missing or changed factual information
        for fact_type, original_items in original_facts.items():
            enhanced_items = enhanced_facts.get(fact_type, set())
            missing_items = original_items - enhanced_items
            
            if missing_items:
                score -= len(missing_items) * 10  # Deduct 10 points per missing fact
                issues.append(f"Missing {fact_type}: {', '.join(list(missing_items)[:3])}")
                recommendations.append(f"Ensure all {fact_type} from original resume are preserved")
        
        # Check for potential fabricated information
        for fact_type, enhanced_items in enhanced_facts.items():
            original_items = original_facts.get(fact_type, set())
            new_items = enhanced_items - original_items
            
            if new_items and fact_type in ['dates', 'companies', 'education']:
                score -= len(new_items) * 15  # Heavily penalize potential fabrication
                issues.append(f"Potentially fabricated {fact_type}: {', '.join(list(new_items)[:2])}")
                recommendations.append(f"Remove fabricated {fact_type} information")
        
        return {
            'score': max(0, min(100, score)),
            'issues': issues,
            'recommendations': recommendations
        }
    
    def _check_structure_preservation(self, original: str, enhanced: str) -> Dict:
        """Check if document structure is preserved"""
        score = 100
        issues = []
        recommendations = []
        
        # Check section presence
        original_sections = self._identify_sections(original)
        enhanced_sections = self._identify_sections(enhanced)
        
        missing_sections = original_sections - enhanced_sections
        if missing_sections:
            score -= len(missing_sections) * 20
            issues.append(f"Missing sections: {', '.join(missing_sections)}")
            recommendations.append("Ensure all original sections are preserved")
        
        # Check section order similarity
        original_order = self._get_section_order(original)
        enhanced_order = self._get_section_order(enhanced)
        
        order_similarity = SequenceMatcher(None, original_order, enhanced_order).ratio()
        if order_similarity < 0.7:
            score -= 15
            issues.append("Section order significantly changed")
            recommendations.append("Maintain original section order")
        
        # Check content length similarity (should not be drastically different)
        length_ratio = len(enhanced) / len(original) if len(original) > 0 else 1
        if length_ratio < 0.8 or length_ratio > 1.5:
            score -= 10
            issues.append(f"Content length changed significantly ({length_ratio:.2f}x)")
            recommendations.append("Maintain appropriate content length")
        
        return {
            'score': max(0, min(100, score)),
            'issues': issues,
            'recommendations': recommendations
        }
    
    def _check_job_alignment(self, enhanced: str, job_description: str) -> Dict:
        """Check alignment with job description requirements"""
        score = 70  # Base score for basic enhancement
        issues = []
        recommendations = []
        
        # Extract key requirements from job description
        job_keywords = self._extract_job_keywords(job_description)
        enhanced_keywords = set(re.findall(r'\b[A-Za-z]+\b', enhanced.lower()))
        
        # Check keyword alignment
        matched_keywords = job_keywords.intersection(enhanced_keywords)
        keyword_coverage = len(matched_keywords) / len(job_keywords) if job_keywords else 1
        
        score += keyword_coverage * 30  # Up to 30 bonus points for keyword alignment
        
        if keyword_coverage < 0.3:
            issues.append("Low alignment with job requirements")
            recommendations.append("Include more relevant keywords from job description")
        
        # Check for industry-specific terms
        industry_terms = self._identify_industry_terms(job_description)
        enhanced_industry_terms = self._identify_industry_terms(enhanced)
        
        if industry_terms and not enhanced_industry_terms.intersection(industry_terms):
            score -= 10
            issues.append("Missing industry-specific terminology")
            recommendations.append("Include relevant industry terms")
        
        return {
            'score': max(0, min(100, score)),
            'issues': issues,
            'recommendations': recommendations,
            'keyword_coverage': keyword_coverage
        }
    
    def _check_formatting_quality(self, enhanced: str) -> Dict:
        """Check formatting and presentation quality"""
        score = 100
        issues = []
        recommendations = []
        
        # Check for consistent spacing
        inconsistent_spacing = len(re.findall(r'\n\s*\n\s*\n', enhanced))
        if inconsistent_spacing > 3:
            score -= 10
            issues.append("Inconsistent line spacing detected")
            recommendations.append("Fix line spacing inconsistencies")
        
        # Check for proper capitalization
        improper_caps = len(re.findall(r'\b[a-z]+\s+[A-Z][a-z]+\b', enhanced))
        if improper_caps > 5:
            score -= 5
            issues.append("Capitalization inconsistencies found")
            recommendations.append("Standardize capitalization")
        
        # Check for bullet point consistency
        bullet_patterns = set(re.findall(r'^\s*([•\-\*\+])\s+', enhanced, re.MULTILINE))
        if len(bullet_patterns) > 1:
            score -= 5
            issues.append("Inconsistent bullet point styles")
            recommendations.append("Use consistent bullet point formatting")
        
        # Check for section header formatting
        potential_headers = re.findall(r'^[A-Z\s]{3,30}$', enhanced, re.MULTILINE)
        if len(potential_headers) < 3:
            score -= 10
            issues.append("Section headers may need better formatting")
            recommendations.append("Ensure clear section header formatting")
        
        return {
            'score': max(0, min(100, score)),
            'issues': issues,
            'recommendations': recommendations
        }
    
    def _check_content_enhancement(self, original: str, enhanced: str) -> Dict:
        """Check quality of content improvements"""
        score = 50  # Base score
        issues = []
        recommendations = []
        
        # Check for improved action verbs
        action_verbs = {
            'achieved', 'improved', 'increased', 'developed', 'implemented', 
            'managed', 'led', 'created', 'designed', 'optimized', 'enhanced',
            'streamlined', 'delivered', 'executed', 'coordinated', 'facilitated'
        }
        
        original_actions = len([word for word in re.findall(r'\b\w+\b', original.lower()) if word in action_verbs])
        enhanced_actions = len([word for word in re.findall(r'\b\w+\b', enhanced.lower()) if word in action_verbs])
        
        if enhanced_actions > original_actions:
            score += min(20, (enhanced_actions - original_actions) * 2)
        elif enhanced_actions < original_actions:
            score -= 10
            issues.append("Reduced use of strong action verbs")
            recommendations.append("Maintain or improve action verb usage")
        
        # Check for quantifiable achievements
        numbers_original = len(re.findall(r'\b\d+%?\b', original))
        numbers_enhanced = len(re.findall(r'\b\d+%?\b', enhanced))
        
        if numbers_enhanced >= numbers_original:
            score += 10
        else:
            issues.append("Some quantifiable achievements may have been lost")
            recommendations.append("Preserve all numerical achievements and metrics")
        
        # Check for professional language improvement
        professional_score = self._assess_professional_language(enhanced)
        score += professional_score
        
        if professional_score < 10:
            issues.append("Professional language could be improved")
            recommendations.append("Use more professional and impactful language")
        
        return {
            'score': max(0, min(100, score)),
            'issues': issues,
            'recommendations': recommendations
        }
    
    def _extract_factual_elements(self, text: str) -> Dict[str, set]:
        """Extract factual elements using regex patterns"""
        facts = {}
        for fact_type, pattern in self.factual_patterns.items():
            matches = re.findall(pattern, text, re.IGNORECASE)
            # Ensure all matches are strings, not tuples
            if matches and isinstance(matches[0], tuple):
                # If regex returns tuples, join them or take first element
                if fact_type == 'dates':
                    # For dates, take the full match
                    string_matches = set()
                    for match in matches:
                        if isinstance(match, tuple):
                            # Join non-empty tuple elements
                            joined_match = ''.join(filter(None, match))
                            if joined_match:
                                string_matches.add(joined_match)
                        else:
                            string_matches.add(str(match))
                    facts[fact_type] = string_matches
                else:
                    # For other patterns, convert tuples to strings appropriately
                    string_matches = set()
                    for match in matches:
                        if isinstance(match, tuple):
                            # Take the first non-empty element or join
                            match_str = next((str(item) for item in match if item), '')
                            if match_str:
                                string_matches.add(match_str)
                        else:
                            string_matches.add(str(match))
                    facts[fact_type] = string_matches
            else:
                # Direct string matches
                facts[fact_type] = set(str(match) for match in matches)
        return facts
    
    def _identify_sections(self, text: str) -> set:
        """Identify resume sections"""
        sections = set()
        lines = text.split('\n')
        for line in lines:
            clean_line = line.strip().lower()
            for section in self.required_sections:
                if section in clean_line and len(clean_line.split()) <= 3:
                    sections.add(section)
        return sections
    
    def _get_section_order(self, text: str) -> List[str]:
        """Get the order of sections in the resume"""
        order = []
        lines = text.split('\n')
        for line in lines:
            clean_line = line.strip().lower()
            for section in self.required_sections:
                if section in clean_line and len(clean_line.split()) <= 3:
                    order.append(section)
        return order
    
    def _extract_job_keywords(self, job_description: str) -> set:
        """Extract important keywords from job description"""
        # Remove common words and extract meaningful terms
        common_words = {'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'will', 'would', 'should', 'could', 'may', 'might', 'must', 'shall'}
        words = set(re.findall(r'\b[A-Za-z]{3,}\b', job_description.lower()))
        return words - common_words
    
    def _identify_industry_terms(self, text: str) -> set:
        """Identify industry-specific terms"""
        tech_terms = {
            'python', 'java', 'javascript', 'react', 'angular', 'node', 'sql', 'aws', 'azure', 'docker', 
            'kubernetes', 'agile', 'scrum', 'devops', 'ci/cd', 'api', 'database', 'frontend', 'backend'
        }
        finance_terms = {
            'financial', 'accounting', 'budget', 'forecast', 'roi', 'kpi', 'revenue', 'profit', 'loss',
            'audit', 'compliance', 'risk', 'investment', 'portfolio', 'trading', 'equity', 'bonds'
        }
        marketing_terms = {
            'marketing', 'advertising', 'campaign', 'brand', 'seo', 'sem', 'social', 'media', 'content',
            'engagement', 'conversion', 'analytics', 'digital', 'growth', 'acquisition', 'retention'
        }
        
        all_terms = tech_terms | finance_terms | marketing_terms
        words = set(re.findall(r'\b[A-Za-z]+\b', text.lower()))
        return words.intersection(all_terms)
    
    def _assess_professional_language(self, text: str) -> int:
        """Assess the professional quality of language used"""
        score = 0
        
        # Check for professional phrases
        professional_phrases = [
            'responsible for', 'collaborated with', 'successfully', 'demonstrated',
            'expertise in', 'proficient in', 'experienced in', 'specialized in'
        ]
        
        for phrase in professional_phrases:
            if phrase in text.lower():
                score += 2
        
        # Check for proper sentence structure (basic assessment)
        sentences = re.split(r'[.!?]+', text)
        proper_sentences = [s for s in sentences if len(s.split()) >= 3 and s.strip()]
        
        if len(proper_sentences) > len(sentences) * 0.8:
            score += 5
        
        return min(20, score)