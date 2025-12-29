from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class LawRuleResponse(BaseModel):
    id: Optional[int] = None
    law_source: str
    rule_code: str
    rule_name: str
    allowed_status: str
    legal_basis: Optional[str] = None
    explanation: Optional[str] = None
    required_log_fields: Optional[List[str]] = None
    auto_checks: Optional[List[str]] = None
    functional_group: Optional[str] = None
    tags: Optional[List[str]] = None

class LawRulesSearchResponse(BaseModel):
    rules: List[LawRuleResponse]
    total: int
    page: int
    page_size: int
    total_pages: int

class DocumentImportResponse(BaseModel):
    success: bool
    message: str
    rules_created: int
    rules_skipped: int
    confidence: float
    needs_review: bool
    invalid_rules: Optional[List[Dict]] = None








