"""
Multi-Model Extractor: Orchestrate OpenAI + Gemini with consensus
"""
import asyncio
import logging
from typing import List, Dict, Any, Tuple
from .consensus_engine import ConsensusEngine
from .validator import RuleValidator

# Optional imports - handle gracefully if not available
try:
    from .extractors.openai_extractor import OpenAIExtractor
except ImportError:
    OpenAIExtractor = None

try:
    from .extractors.gemini_extractor import GeminiExtractor
except ImportError:
    GeminiExtractor = None

logger = logging.getLogger(__name__)


class MultiModelExtractor:
    """Extract rules using multiple AI models with consensus"""
    
    def __init__(self):
        self.openai_extractor = None
        self.gemini_extractor = None
        self.validator = RuleValidator()
        
        # Initialize extractors (may fail if API keys not set or import errors)
        if OpenAIExtractor:
            try:
                self.openai_extractor = OpenAIExtractor()
            except Exception as e:
                logger.warning(f"OpenAI extractor not available: {e}")
        else:
            logger.warning("OpenAIExtractor class not available (import failed)")
        
        if GeminiExtractor:
            try:
                self.gemini_extractor = GeminiExtractor()
            except Exception as e:
                logger.warning(f"Gemini extractor not available: {e}")
        else:
            logger.warning("GeminiExtractor class not available (import failed)")
    
    async def extract(self, text: str) -> Dict[str, Any]:
        """
        Extract rules from text using multiple models with consensus
        
        Returns:
            {
                'rules': List[Dict],
                'confidence': float,
                'needs_review': bool,
                'validation': Dict
            }
        """
        results = []
        
        # Run extractors in parallel
        tasks = []
        if self.openai_extractor:
            tasks.append(self._extract_with_openai(text))
        if self.gemini_extractor:
            tasks.append(self._extract_with_gemini(text))
        
        if not tasks:
            raise ValueError("No AI extractors available. Please configure at least one API key.")
        
        # Wait for all extractions to complete
        extraction_results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Collect successful results
        for result in extraction_results:
            if isinstance(result, Exception):
                logger.error(f"Extraction error: {result}")
                continue
            if result:
                results.append(result)
        
        if not results:
            raise ValueError("All AI extractors failed. Please check API keys and try again.")
        
        # Apply consensus if multiple results
        if len(results) > 1:
            consensus_engine = ConsensusEngine()
            final_rules, confidence = consensus_engine.consensus_vote(results)
        else:
            final_rules = results[0].get('rules', [])
            confidence = 0.8  # Single model confidence
        
        # Validate rules
        validation = self.validator.validate_rules(final_rules)
        
        return {
            'rules': validation['valid_rules'],
            'confidence': confidence,
            'needs_review': validation['invalid_count'] > 0 or confidence < 0.7,
            'validation': validation
        }
    
    async def _extract_with_openai(self, text: str) -> Dict[str, Any]:
        """Extract using OpenAI"""
        try:
            rules = self.openai_extractor.extract(text)
            return {
                'rules': rules,
                'model': 'openai'
            }
        except Exception as e:
            logger.error(f"OpenAI extraction failed: {e}")
            return None
    
    async def _extract_with_gemini(self, text: str) -> Dict[str, Any]:
        """Extract using Gemini"""
        try:
            result = await self.gemini_extractor.extract(text)
            return result
        except Exception as e:
            logger.error(f"Gemini extraction failed: {e}")
            return None






