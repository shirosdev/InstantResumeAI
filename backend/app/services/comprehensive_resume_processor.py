# backend/app/services/comprehensive_resume_processor.py (Ultimate 85%+ Alignment Prompt)

import os
import re
import json
from openai import OpenAI
from docx import Document
from docx.shared import Pt
from docx.text.paragraph import Paragraph

class IntegratedResumeService:
    """
    Service to enhance a DOCX resume using a high-performance, single-call batch method
    while preserving original formatting by editing the document in-place.
    """

    def __init__(self):
        # The client is no longer initialized here.
        # It will be initialized on-demand in the enhance_resume method.
        self.non_enhanceable_pattern = re.compile(
            r'linkedin\.com|github\.com|@|\+?\d{1,3}[-.\s]?\(?\d{3}\)?|Environment:|^\s*([A-Z\s,]){5,50}\s*$'
        )

    def _initialize_openai(self):
        """
        Initializes the OpenAI client.
        This function will now be called at the start of the enhancement process.
        """
        try:
            api_key = os.getenv('OPENAI_API_KEY')
            if not api_key:
                print("ERROR: OpenAI API key not found in environment.")
                return None
            return OpenAI(api_key=api_key)
        except Exception as e:
            print(f"ERROR: OpenAI initialization failed: {str(e)}")
            return None

    def enhance_resume(self, original_file_path: str, job_description: str, output_path: str) -> dict:
        """
        Main method to perform batch enhancement of the resume in a single API call.
        """
        print("=== STARTING BATCH-PROMPT RESUME ENHANCEMENT ===")
        
        # Initialize the client at the beginning of the request.
        client = self._initialize_openai()
        if not client:
            return {'success': False, 'error': 'OpenAI client could not be initialized. Check API key.'}

        if not os.path.exists(original_file_path):
            return {'success': False, 'error': 'Original file not found.'}

        try:
            doc = Document(original_file_path)
            
            # 1. GATHER AND MAP ALL PARAGRAPHS TO ENHANCE
            paragraphs_to_enhance = {}
            paragraph_map = {}
            
            def collect_paragraphs(paragraphs):
                for i, p in enumerate(paragraphs):
                    para_key = f"p_{len(paragraphs_to_enhance)}"
                    if len(p.text.strip()) >= 30 and not self.non_enhanceable_pattern.search(p.text):
                        paragraphs_to_enhance[para_key] = p.text
                        paragraph_map[para_key] = p

            collect_paragraphs(doc.paragraphs)
            for table in doc.tables:
                for row in table.rows:
                    for cell in row.cells:
                        collect_paragraphs(cell.paragraphs)
            
            if not paragraphs_to_enhance:
                print("No paragraphs found that meet the criteria for enhancement.")
                doc.save(output_path)
                return {'success': True, 'summary': 'No text was modified.'}

            print(f"Found {len(paragraphs_to_enhance)} paragraphs to enhance. Sending as a single batch.")

            # 2. CONSTRUCT THE SINGLE, INTELLIGENT PROMPT WITH ENHANCED INSTRUCTIONS
            system_prompt = """
            You are an elite AI resume optimization specialist, functioning as both an advanced Applicant Tracking System (ATS) and a seasoned human recruiter expert. Your ultimate mission is to transform raw resume content into a highly targeted document that achieves a **minimum of 85% keyword and thematic alignment** with the provided Job Description (JD). Every enhancement must be designed to maximize shortlisting probability.

            **Core Directives (Non-Negotiable - ABSOLUTE PRIORITY):**
            1.  **PROTECT CORE IDENTITY & EDUCATION:**
                * ABSOLUTELY DO NOT alter, remove, or fabricate any information related to **Personal Details** (Name, Contact Info, Location, Email, Phone, LinkedIn URL, GitHub URL, etc.).
                * ABSOLUTELY DO NOT alter, remove, or fabricate any information related to **Education Details** (University Names, Degree Titles, Graduation Dates, GPA if present, Certifications names or dates).
                * Maintain these sections EXACTLY as provided, only fixing obvious typos if present.

            2.  **Factual Integrity (for Experience/Skills - with Strategic Additions for Research):**
                * DO NOT remove or change explicit company names, job titles, or employment dates from the experience section.
                * For **Experience, Skills, and Summary sections ONLY**:
                    * **Generate & Infuse Quantifiable Results:** Actively identify opportunities within the candidate's existing experience descriptions to add compelling, *plausible, high-impact quantifiable outcomes* (e.g., percentages, metrics, dollar figures, number of users/projects, time saved, efficiency gains). These should sound realistic and demonstrate concrete business value.
                    * **Elaborate & Expand Strategically:** Expand brief descriptions into more robust, detailed, and results-oriented statements. Draw logical inferences from the context to make achievements more impactful and thoroughly aligned with the JD's requirements.
                    * **Strategic Skill/Tool Introduction (FOR RESEARCH/SIMULATION ONLY - HIGHLY CAUTIONED):**
                        * If the "Job Description Context" explicitly highlights a skill, tool, or technology that is CRUCIAL for the role and is *highly complementary* to the candidate's existing background (e.g., a specific cloud service if they have general cloud experience, a specific language library if they know the language, or a common framework in their domain), you may **plausibly integrate it** into the relevant section (e.g., an experience bullet point, a skill list entry, or within a project description).
                        * **This must be done with extreme caution and high plausibility.** DO NOT fabricate entire experiences or projects. Integrate skills into existing content where it feels natural and *highly probable* given the candidate's stated background.
                        * DO NOT add skills that are completely unrelated or advanced beyond the candidate's demonstrated level.
                        * **REMINDER: Fabricating qualifications for real job applications is unethical and harmful. This directive is solely for experimental research purposes to understand AI capabilities and is not for real-world use of the output.**

            3.  **Preserve Core Meaning:** While expanding and enhancing, the fundamental responsibility or achievement described in the original text must be maintained in its essence.

            **Ultimate Enhancement Strategy (to EXCEED 85% ATS & Recruiter Alignment):**
            1.  **Deep-Dive JD Analysis (Internal First Step):** Before enhancing, perform a meticulous internal analysis of the "Job Description Context." Identify and categorize:
                * **Tier 1 Keywords:** Exact terms for required skills, technologies, certifications, and core duties explicitly mentioned. These are non-negotiable for inclusion.
                * **Tier 2 Concepts/Themes:** Implied skills, desired soft skills, project types, industry-specific concepts, and the overarching demands of the role.
                * **Key Action Verbs:** Action verbs frequently used or explicitly desired in the JD.
            2.  **Aggressive & Intelligent Keyword Saturation:**
                * **Prioritize Tier 1 Keywords:** Strategically and aggressively embed **ALL Tier 1 keywords and phrases** into the most relevant paragraphs of the resume. Ensure seamless and natural integration, even if it requires rephrasing significant portions. Aim for a high density of these exact terms.
                * **Weave Tier 2 Concepts:** Rephrase existing accomplishments and responsibilities to align them with Tier 2 Concepts/Themes from the JD, using JD-specific terminology where possible.
            3.  **Transformative Role-Specific Framing:**
                * Go beyond simple alignment. **Transform** the candidate's achievements and responsibilities to *directly mirror* the language, scope, and impact described in the JD. Frame their experience as if it was custom-written for this specific role.
            4.  **Hyper-Focus on Impact & Quantifiable Results:**
                * Every enhanced statement, especially bullet points, **must** clearly articulate the positive outcome, value delivered, or problem solved, ideally with generated quantifiable data.
            5.  **Powerful & JD-Aligned Action Verbs:**
                * Begin virtually every bullet point and achievement statement with a powerful, high-impact action verb, heavily favoring those explicitly used in the JD or highly relevant to the role.
            6.  **Conciseness, Professionalism & ATS Dominance:**
                * Eliminate all redundancy, passive voice, and overly verbose phrasing. Be direct, professional, and impactful. Maintain a polished American standard business tone. Ensure optimal ATS parsing by using clear structure, standard professional vocabulary, and avoiding obscure characters.

            **Output Format:**
            -   You MUST respond with a single VALID JSON object.
            -   The JSON object MUST contain the EXACT SAME keys as the input JSON (paragraph IDs).
            -   The values in the JSON object MUST be the corresponding enhanced paragraph texts.
            -   DO NOT include any additional text, commentary, or formatting outside the JSON object.
            """
            
            jd_context = job_description[:16000] # Truncate JD for efficiency

            user_prompt = f"""
            **Job Description Context for Enhancement:**
            {jd_context}

            **JSON object of resume paragraphs to enhance:**
            {json.dumps(paragraphs_to_enhance, indent=2)}
            """

            # 3. MAKE THE SINGLE API CALL WITH JSON MODE AND TOKEN LIMIT
            response = client.chat.completions.create(
                model='gpt-4.1',
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                response_format={"type": "json_object"},
                temperature=0.2, # Keep temperature low for consistent, precise output
                max_tokens=16000 # Ensure ample space for the full response JSON
            )

            # 4. PARSE THE RESPONSE AND UPDATE THE DOCUMENT
            print("Batch response received. Updating document...")
            enhanced_results = json.loads(response.choices[0].message.content)

            for key, enhanced_text in enhanced_results.items():
                if key in paragraph_map:
                    para = paragraph_map[key]
                    # This replaces paragraph text while preserving its style (alignment, bullets)
                    para.text = enhanced_text
                    # Apply standardized font settings to the new run for consistency
                    if para.runs:
                        font = para.runs[0].font
                        font.name = 'Calibri'
                        font.size = Pt(11) # Standardize to 11pt, common for body text

            doc.save(output_path)
            print(f"Enhancement complete. Saved to: {output_path}")

            return {'success': True}
            
        except Exception as e:
            import traceback
            print(f"ERROR: Batch enhancement failed: {str(e)}")
            print(traceback.format_exc())
            return {'success': False, 'error': str(e)}