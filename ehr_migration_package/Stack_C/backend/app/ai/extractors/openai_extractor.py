"""
OpenAI GPT-4 Extractor
"""
import os
import json
import logging
from typing import List, Dict, Any
from openai import OpenAI

from ..prompts import EXTRACTION_PROMPT

logger = logging.getLogger(__name__)


class OpenAIExtractor:
    """Extract rules using OpenAI GPT-4"""
    
    def __init__(self):
        api_key = os.getenv('OPENAI_API_KEY')
        if not api_key:
            raise ValueError("OPENAI_API_KEY not set")
        self.client = OpenAI(api_key=api_key)
        # Support GPT-5.1 if available, fallback to GPT-4 Turbo
        self.model = os.getenv('OPENAI_MODEL', 'gpt-4-turbo-preview')  # Change to 'gpt-5.1' when available
    
    def extract(self, text: str) -> List[Dict[str, Any]]:
        """
        Extract rules from text using OpenAI GPT-4
        
        Returns:
            List of rule dictionaries
        """
        try:
            prompt = EXTRACTION_PROMPT.format(text=text[:150000])  # Limit to 150k chars
            
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "Bạn là chuyên gia phân tích văn bản pháp lý y tế Việt Nam. Trả về CHỈ JSON, không có text thêm."},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.1,  # Low temperature for accuracy
                max_tokens=4000
            )
            
            content = response.choices[0].message.content
            result = json.loads(content)
            
            # Handle both single object and array
            if isinstance(result, dict):
                if 'rules' in result:
                    rules = result['rules']
                else:
                    rules = [result]
            elif isinstance(result, list):
                rules = result
            else:
                raise ValueError(f"Unexpected response format: {type(result)}")
            
            logger.info(f"OpenAI extracted {len(rules)} rules")
            return rules
            
        except json.JSONDecodeError as e:
            logger.error(f"OpenAI JSON decode error: {e}, content: {content[:500]}")
            raise ValueError(f"Invalid JSON from OpenAI: {e}")
        except Exception as e:
            logger.error(f"OpenAI extraction error: {e}")
            raise

















