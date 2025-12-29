"""
Consensus Engine: Compare results from multiple AI models and select best
"""
import logging
from typing import List, Dict, Any, Tuple, Optional
from collections import Counter

logger = logging.getLogger(__name__)


class ConsensusEngine:
    """Compare and merge results from multiple AI models"""
    
    @staticmethod
    def consensus_vote(results: List[List[Dict[str, Any]]]) -> Tuple[List[Dict[str, Any]], float]:
        """
        Compare results from multiple models and return consensus
        
        Args:
            results: List of rule lists from each model
            
        Returns:
            (consensus_rules, confidence_score)
        """
        if not results:
            return [], 0.0
        
        # Filter out empty results
        valid_results = [r for r in results if r and len(r) > 0]
        
        if not valid_results:
            return [], 0.0
        
        if len(valid_results) == 1:
            return valid_results[0], 0.7  # Lower confidence with single model
        
        # Strategy: Use OpenAI as primary, Gemini as validation
        # If both agree on a rule → high confidence
        # If conflict → use OpenAI (more accurate for Vietnamese)
        
        primary_rules = valid_results[0]  # Assume first is OpenAI
        secondary_rules = valid_results[1] if len(valid_results) > 1 else []
        
        consensus = []
        total_confidence = 0.0
        
        # Match rules by rule_code or rule_name similarity
        for primary_rule in primary_rules:
            matched_secondary = ConsensusEngine._find_matching_rule(
                primary_rule, secondary_rules
            )
            
            if matched_secondary:
                # Both models agree → high confidence
                merged = ConsensusEngine._merge_rules(primary_rule, matched_secondary)
                consensus.append(merged)
                total_confidence += 0.9
            else:
                # Only primary model found → medium confidence
                consensus.append(primary_rule)
                total_confidence += 0.6
        
        # Add rules only in secondary (if any)
        for secondary_rule in secondary_rules:
            if not ConsensusEngine._find_matching_rule(secondary_rule, primary_rules):
                # Only secondary found → low confidence, but include
                consensus.append(secondary_rule)
                total_confidence += 0.4
        
        avg_confidence = total_confidence / len(consensus) if consensus else 0.0
        
        logger.info(f"Consensus: {len(consensus)} rules, confidence: {avg_confidence:.2f}")
        return consensus, avg_confidence
    
    @staticmethod
    def _find_matching_rule(rule: Dict[str, Any], rule_list: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        """Find matching rule in list by code or name similarity"""
        rule_code = rule.get('rule_code', '').upper()
        rule_name = rule.get('rule_name', '').lower()
        
        for other_rule in rule_list:
            other_code = other_rule.get('rule_code', '').upper()
            other_name = other_rule.get('rule_name', '').lower()
            
            # Exact code match
            if rule_code and other_code and rule_code == other_code:
                return other_rule
            
            # Name similarity (simple check)
            if rule_name and other_name:
                # Check if significant words match
                rule_words = set(rule_name.split()[:3])  # First 3 words
                other_words = set(other_name.split()[:3])
                if len(rule_words & other_words) >= 2:
                    return other_rule
        
        return None
    
    @staticmethod
    def _merge_rules(rule1: Dict[str, Any], rule2: Dict[str, Any]) -> Dict[str, Any]:
        """Merge two rules, preferring more complete data"""
        merged = rule1.copy()
        
        # Prefer longer/more detailed fields
        for key in ['rule_name', 'explanation', 'legal_basis']:
            if rule2.get(key) and len(str(rule2[key])) > len(str(merged.get(key, ''))):
                merged[key] = rule2[key]
        
        # Merge arrays (log_fields, auto_checks)
        for key in ['required_log_fields', 'auto_checks']:
            list1 = set(merged.get(key, []))
            list2 = set(rule2.get(key, []))
            merged[key] = list(list1 | list2)  # Union
        
        # Prefer 'required' over other statuses
        if rule2.get('allowed_status') == 'required':
            merged['allowed_status'] = 'required'
        
        return merged

















