import os
import json
import logging
import re
from typing import Dict, Any
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class LLMService:
    def __init__(self):
        self.provider = os.getenv("LLM_PROVIDER", "openai")
        self.openai_api_key = os.getenv("OPENAI_API_KEY")
        self.gemini_api_key = os.getenv("GEMINI_API_KEY")
        self.model_name = os.getenv("OPENAI_MODEL", "gpt-3.5-turbo")
        
        # Initialize OpenAI
        if self.provider == "openai" and self.openai_api_key:
            try:
                import openai
                openai.api_key = self.openai_api_key
                self.client = openai
                logger.info(f"✅ OpenAI client initialized with model: {self.model_name}")
            except ImportError:
                logger.error("❌ openai package not installed. Run: pip install openai")
                self.provider = "mock"
            except Exception as e:
                logger.error(f"❌ OpenAI init error: {e}")
                self.provider = "mock"
        elif self.provider == "gemini" and self.gemini_api_key:
            try:
                import google.generativeai as genai
                genai.configure(api_key=self.gemini_api_key)
                self.client = genai
                self.model_name = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
                logger.info(f"✅ Gemini client initialized with model: {self.model_name}")
            except ImportError:
                logger.error("❌ google-generativeai not installed")
                self.provider = "mock"
            except Exception as e:
                logger.error(f"❌ Gemini init error: {e}")
                self.provider = "mock"
        else:
            logger.info("📦 Using MOCK mode")
            self.provider = "mock"

    def analyze_proposal(self, text: str, prompt: str = None) -> Dict[str, Any]:
        """Analyze proposal using the configured LLM provider"""
        logger.info(f"📝 Analyzing proposal (length: {len(text)} chars)")
        
        if self.provider == "openai" and self.openai_api_key:
            try:
                return self._analyze_with_openai(text)
            except Exception as e:
                logger.error(f"❌ OpenAI error: {e}")
                return self._get_mock_response(text)
        elif self.provider == "gemini" and self.gemini_api_key:
            try:
                return self._analyze_with_gemini(text)
            except Exception as e:
                logger.error(f"❌ Gemini error: {e}")
                return self._get_mock_response(text)
        else:
            return self._get_mock_response(text)

    def _analyze_with_openai(self, text: str) -> Dict[str, Any]:
        """Analyze using OpenAI"""
        try:
            prompt = self._get_default_prompt() + f"\n\nProposal Text:\n{text}"
            
            response = self.client.chat.completions.create(
                model=self.model_name,
                messages=[
                    {"role": "system", "content": "You are a startup proposal analyzer. Extract structured information and return ONLY valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=1000
            )
            
            result_text = response.choices[0].message.content.strip()
            logger.info(f"📥 OpenAI response received: {result_text[:100]}...")
            
            # Extract JSON from response
            json_match = re.search(r'\{.*\}', result_text, re.DOTALL)
            if json_match:
                result = json.loads(json_match.group())
                logger.info("✅ OpenAI analysis successful")
                return result
            else:
                logger.warning("⚠️ Could not parse OpenAI response, using mock")
                return self._get_mock_response(text)
                
        except Exception as e:
            logger.error(f"❌ OpenAI error: {e}")
            raise

    def _analyze_with_gemini(self, text: str) -> Dict[str, Any]:
        """Analyze using Google Gemini"""
        try:
            prompt = self._get_default_prompt() + f"\n\nProposal Text:\n{text}"
            
            model = self.client.GenerativeModel(self.model_name)
            response = model.generate_content(prompt)
            result_text = response.text.strip()
            
            # Extract JSON from response
            json_match = re.search(r'\{.*\}', result_text, re.DOTALL)
            if json_match:
                result = json.loads(json_match.group())
                logger.info("✅ Gemini analysis successful")
                return result
            else:
                logger.warning("⚠️ Could not parse Gemini response, using mock")
                return self._get_mock_response(text)
                
        except Exception as e:
            logger.error(f"❌ Gemini error: {e}")
            raise

    def _get_default_prompt(self) -> str:
        return """
You are a startup proposal analyzer. Extract structured information from the following startup proposal.

Return ONLY valid JSON in this exact format:
{
    "summary": "A 2-3 sentence summary of the startup",
    "problemStatement": "The problem the startup is solving",
    "solution": "The proposed solution",
    "domain": "Industry domain (Healthcare, Agriculture, FinTech, EdTech, AI, IoT, Sustainability, etc.)",
    "technologyStack": "Technologies used (comma separated)",
    "keywords": "5-10 relevant keywords (comma separated)",
    "tags": "3-5 tags for categorization (comma separated)",
    "mentorRequirements": "Areas of expertise needed from mentors (comma separated)",
    "investorPitch": "A 2-3 sentence pitch for investors",
    "businessModel": "How the startup makes money",
    "fundingPurpose": "What funding will be used for"
}

Do not include any other text, only the JSON object.
"""

    def _get_mock_response(self, text: str) -> Dict[str, Any]:
        """Return mock response (fallback)"""
        # Detect domain from text
        text_lower = text.lower()
        domain = "Technology"
        
        if "sustain" in text_lower or "green" in text_lower or "eco" in text_lower:
            domain = "Sustainability"
        elif "AI" in text or "artificial" in text_lower or "machine learning" in text_lower:
            domain = "Artificial Intelligence"
        elif "health" in text_lower or "medical" in text_lower or "clinical" in text_lower:
            domain = "Healthcare"
        elif "fin" in text_lower or "bank" in text_lower or "invest" in text_lower:
            domain = "FinTech"
        elif "agri" in text_lower or "farm" in text_lower or "crop" in text_lower:
            domain = "Agriculture"
        elif "ed" in text_lower or "learn" in text_lower or "school" in text_lower:
            domain = "EdTech"
            
        return {
            "summary": f"Analysis of startup proposal in {domain} sector. The startup addresses key challenges with innovative solutions.",
            "problemStatement": "The startup identifies and solves a critical problem in the {domain} sector.",
            "solution": "A technology-driven approach to solve the identified problems.",
            "domain": domain,
            "technologyStack": "AI, Cloud Computing, IoT, Data Analytics, Blockchain",
            "keywords": f"Innovation, Technology, Startup, Growth, {domain}",
            "tags": f"Tech Startup, Innovation, {domain}",
            "mentorRequirements": "Domain Expert, Technology Strategist, Business Mentor",
            "investorPitch": "A promising startup in the {domain} space with significant growth potential and innovative solutions.",
            "businessModel": "SaaS-based subscription model with tiered pricing",
            "fundingPurpose": "Product development, team expansion, and market penetration"
        }

# Singleton instance
llm_service = LLMService()