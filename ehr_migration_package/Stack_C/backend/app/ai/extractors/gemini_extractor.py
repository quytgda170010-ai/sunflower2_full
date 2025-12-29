"""
Gemini Extractor: Extract rules using Google Gemini AI
"""
import os
import json
import logging
from typing import List, Dict, Any, Optional
import google.generativeai as genai
from ..prompts import SYSTEM_PROMPT, EXTRACTION_PROMPT

logger = logging.getLogger(__name__)


class GeminiExtractor:
    """Extract rules using Google Gemini AI"""
    
    def __init__(self):
        api_key = os.getenv('GEMINI_API_KEY')
        model_name = os.getenv('GEMINI_MODEL', 'gemini-2.5-flash')
        
        if not api_key:
            logger.warning("GEMINI_API_KEY not set, Gemini extractor will be disabled")
            self.enabled = False
            return
        
        try:
            genai.configure(api_key=api_key)
            self.model = genai.GenerativeModel(model_name)
            self.enabled = True
            logger.info(f"Gemini extractor initialized with model: {model_name}")
        except Exception as e:
            logger.error(f"Failed to initialize Gemini: {e}")
            self.enabled = False
    
    async def extract(self, text: str) -> Dict[str, Any]:
        """Extract rules from text using Gemini"""
        if not self.enabled:
            raise RuntimeError("Gemini extractor is not enabled (missing API key)")
        
        try:
            # Combine system prompt and extraction prompt
            full_prompt = f"{SYSTEM_PROMPT}\n\n{EXTRACTION_PROMPT}\n\nVăn bản cần phân tích:\n{text}"
            
            # Generate response
            response = await asyncio.to_thread(
                self.model.generate_content,
                full_prompt
            )
            
            # Parse response
            response_text = response.text if hasattr(response, 'text') else str(response)
            
            # Try to extract JSON from response
            json_start = response_text.find('[')
            json_end = response_text.rfind(']') + 1
            
            if json_start >= 0 and json_end > json_start:
                json_str = response_text[json_start:json_end]
                rules = json.loads(json_str)
            else:
                # Try to find JSON object
                json_start = response_text.find('{')
                json_end = response_text.rfind('}') + 1
                if json_start >= 0 and json_end > json_start:
                    json_str = response_text[json_start:json_end]
                    data = json.loads(json_str)
                    rules = data.get('rules', []) if isinstance(data, dict) else [data]
                else:
                    logger.warning("Could not parse JSON from Gemini response")
                    rules = []
            
            return {
                'rules': rules,
                'model': 'gemini',
                'raw_response': response_text
            }
            
        except Exception as e:
            logger.error(f"Gemini extraction error: {e}")
            raise


import asyncio








