"""
Rule Validator: Validate extracted rules before saving
"""
import re
import logging
from typing import Dict, Any, List, Optional
from .prompts import FUNCTIONAL_GROUPS

logger = logging.getLogger(__name__)


class RuleValidator:
    """Validate extracted rules"""
    
    VALID_STATUSES = ['required', 'allowed', 'not_allowed', 'conditional']
    RULE_CODE_PATTERN = re.compile(r'^R-[A-Z]{3,4}-\d{2,3}$')
    
    @staticmethod
    def validate_rule(rule: Dict[str, Any]) -> tuple[bool, List[str]]:
        """
        Validate a single rule
        
        Returns:
            (is_valid, list_of_errors)
        """
        errors = []
        
        # 1. Required fields
        required_fields = ['law_source', 'rule_code', 'rule_name', 'allowed_status']
        for field in required_fields:
            if not rule.get(field):
                errors.append(f"Thiếu trường bắt buộc: {field}")
        
        # 2. Rule code format
        rule_code = rule.get('rule_code', '')
        if rule_code and not RuleValidator.RULE_CODE_PATTERN.match(rule_code):
            errors.append(f"Rule code không đúng format: {rule_code} (phải là R-XXX-XX)")
        
        # 3. Allowed status
        status = rule.get('allowed_status', '')
        if status and status not in RuleValidator.VALID_STATUSES:
            errors.append(f"Allowed status không hợp lệ: {status}")
        
        # 4. Functional group
        func_group = rule.get('functional_group', '')
        if func_group and func_group not in FUNCTIONAL_GROUPS:
            # Try to find closest match
            closest = RuleValidator._find_closest_group(func_group)
            if closest:
                rule['functional_group'] = closest
                logger.warning(f"Auto-corrected functional_group: {func_group} -> {closest}")
            else:
                errors.append(f"Functional group không hợp lệ: {func_group}")
        
        # 5. Legal basis should not be too short
        legal_basis = rule.get('legal_basis', '')
        if legal_basis and len(legal_basis) < 5:
            errors.append("Căn cứ pháp lý quá ngắn")
        
        # 6. Ensure arrays are lists
        for field in ['required_log_fields', 'auto_checks']:
            value = rule.get(field)
            if value is not None and not isinstance(value, list):
                if isinstance(value, str):
                    # Try to parse comma-separated string
                    rule[field] = [item.strip() for item in value.split(',') if item.strip()]
                else:
                    errors.append(f"{field} phải là mảng")
        
        return len(errors) == 0, errors
    
    @staticmethod
    def validate_rules(rules: List[Dict[str, Any]]) -> tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
        """
        Validate multiple rules
        
        Returns:
            (valid_rules, invalid_rules_with_errors)
        """
        valid = []
        invalid = []
        
        for rule in rules:
            is_valid, errors = RuleValidator.validate_rule(rule)
            if is_valid:
                valid.append(rule)
            else:
                invalid.append({
                    'rule': rule,
                    'errors': errors
                })
        
        return valid, invalid
    
    @staticmethod
    def _find_closest_group(input_group: str) -> Optional[str]:
        """Find closest matching functional group"""
        input_lower = input_group.lower()
        for group in FUNCTIONAL_GROUPS:
            # Check if key words match
            group_lower = group.lower()
            if 'phần' in input_lower and 'phần' in group_lower:
                # Extract part number
                input_part = re.search(r'phần\s*([ivx]+|\d+)', input_lower)
                group_part = re.search(r'phần\s*([ivx]+|\d+)', group_lower)
                if input_part and group_part and input_part.group(1) == group_part.group(1):
                    return group
        return None












