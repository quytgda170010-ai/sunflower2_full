"""
Law Rules Repository: Database operations for law rules
"""
import os
import mysql.connector
import logging
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime

logger = logging.getLogger(__name__)


class LawRuleRepository:
    """Repository for law rules database operations"""
    
    def __init__(self):
        self.db_config = {
            'host': os.getenv('DB_HOST', 'mariadb'),
            'user': os.getenv('DB_USER', 'openemr'),
            'password': os.getenv('DB_PASS', 'Openemr!123'),
            'database': os.getenv('DB_NAME', 'ehr_core'),
            'charset': 'utf8mb4'
        }
        self._ensure_table_exists()
    
    def _get_connection(self):
        """Get database connection"""
        return mysql.connector.connect(**self.db_config)
    
    def _ensure_table_exists(self):
        """Create table if not exists"""
        conn = self._get_connection()
        cursor = conn.cursor()
        try:
            # Create table with both column names for backward compatibility
            # Database may have 'log_fields' (old) or 'required_log_fields' (new)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS siem_law_rules (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    law_source VARCHAR(255) NOT NULL,
                    rule_code VARCHAR(50) NOT NULL UNIQUE,
                    rule_name TEXT NOT NULL,
                    allowed_status ENUM('required', 'allowed', 'not_allowed', 'conditional') NOT NULL,
                    legal_basis TEXT,
                    legal_refs TEXT,
                    explanation TEXT,
                    log_fields JSON,
                    required_log_fields JSON,
                    auto_checks JSON,
                    functional_group VARCHAR(255),
                    tags JSON,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    INDEX idx_law_source (law_source),
                    INDEX idx_rule_code (rule_code),
                    INDEX idx_functional_group (functional_group)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """)
            
            # Add required_log_fields column if it doesn't exist (for new installations)
            try:
                cursor.execute("""
                    ALTER TABLE siem_law_rules 
                    ADD COLUMN IF NOT EXISTS required_log_fields JSON
                """)
            except Exception:
                # Column may already exist, ignore
                pass
            
            # Add legal_basis column if it doesn't exist (for backward compatibility)
            try:
                cursor.execute("""
                    ALTER TABLE siem_law_rules 
                    ADD COLUMN IF NOT EXISTS legal_basis TEXT
                """)
            except Exception:
                # Column may already exist, ignore
                pass
            conn.commit()
        finally:
            cursor.close()
            conn.close()
    
    def _parse_rule_fields(self, rule: Dict[str, Any]) -> Dict[str, Any]:
        """Helper to parse JSON fields for a rule"""
        import json
        
        # Map log_fields (database) to log_fields (frontend)
        log_fields = rule.get('log_fields') or rule.get('required_log_fields')
        if log_fields and isinstance(log_fields, str):
            try:
                rule['log_fields'] = json.loads(log_fields)
            except:
                rule['log_fields'] = []
        elif log_fields and isinstance(log_fields, list):
            rule['log_fields'] = log_fields
        else:
            rule['log_fields'] = []
        
        # Map auto_checks
        if rule.get('auto_checks') and isinstance(rule['auto_checks'], str):
            try:
                rule['auto_checks'] = json.loads(rule['auto_checks'])
            except:
                rule['auto_checks'] = []
        elif not rule.get('auto_checks'):
            rule['auto_checks'] = []
        
        # Map tags
        if rule.get('tags') and isinstance(rule['tags'], str):
            try:
                rule['tags'] = json.loads(rule['tags'])
            except:
                rule['tags'] = []
        elif not rule.get('tags'):
            rule['tags'] = []
        
        # Map legal_refs (database) to legal_refs (frontend)
        if not rule.get('legal_refs'):
            rule['legal_refs'] = rule.get('legal_basis', '')
            
        return rule

    def create_rule(self, rule: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new rule"""
        conn = self._get_connection()
        cursor = conn.cursor(dictionary=True)
        try:
            import json
            # Save to both log_fields (for backward compatibility) and required_log_fields (new)
            log_fields_json = json.dumps(rule.get('required_log_fields', []), ensure_ascii=False)
            legal_basis_value = rule.get('legal_basis') or rule.get('legal_refs', '')
            
            cursor.execute("""
                INSERT INTO siem_law_rules 
                (law_source, rule_code, rule_name, allowed_status, legal_basis, legal_refs,
                 explanation, log_fields, required_log_fields, auto_checks, functional_group, tags)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                rule.get('law_source'),
                rule.get('rule_code'),
                rule.get('rule_name'),
                rule.get('allowed_status'),
                legal_basis_value,
                legal_basis_value,  # Also save to legal_refs for backward compatibility
                rule.get('explanation'),
                log_fields_json,  # Save to log_fields (old column)
                log_fields_json,  # Save to required_log_fields (new column)
                json.dumps(rule.get('auto_checks', []), ensure_ascii=False),
                rule.get('functional_group'),
                json.dumps(rule.get('tags', []), ensure_ascii=False)
            ))
            conn.commit()
            rule_id = cursor.lastrowid
            return self.get_rule_by_id(rule_id)
        except mysql.connector.IntegrityError as e:
            if 'Duplicate entry' in str(e):
                raise ValueError(f"Rule code {rule.get('rule_code')} already exists")
            raise
        finally:
            cursor.close()
            conn.close()
    
    def get_rule_by_id(self, rule_id: int) -> Optional[Dict[str, Any]]:
        """Get rule by ID"""
        conn = self._get_connection()
        cursor = conn.cursor(dictionary=True)
        try:
            cursor.execute("SELECT * FROM siem_law_rules WHERE id = %s", (rule_id,))
            rule = cursor.fetchone()
            if rule:
                # Parse JSON fields using helper
                self._parse_rule_fields(rule)
            return rule
        finally:
            cursor.close()
            conn.close()
    
    def search_rules(self, filters: Dict[str, Any], page: int = 1, page_size: int = 20) -> Tuple[List[Dict[str, Any]], int]:
        """Search rules with filters"""
        conn = self._get_connection()
        cursor = conn.cursor(dictionary=True)
        try:
            where_clauses = []
            params = []
            
            if filters.get('keyword'):
                where_clauses.append("""
                    (rule_code LIKE %s OR rule_name LIKE %s OR explanation LIKE %s)
                """)
                keyword = f"%{filters['keyword']}%"
                params.extend([keyword, keyword, keyword])
            
            if filters.get('law_source'):
                where_clauses.append("law_source = %s")
                params.append(filters['law_source'])
            
            if filters.get('functional_group'):
                where_clauses.append("functional_group = %s")
                params.append(filters['functional_group'])
            
            if filters.get('allowed_status'):
                where_clauses.append("allowed_status = %s")
                params.append(filters['allowed_status'])
            
            if filters.get('rule_scope'):
                where_clauses.append("rule_scope = %s")
                params.append(filters['rule_scope'])
            
            where_sql = " AND ".join(where_clauses) if where_clauses else "1=1"
            
            # Count total
            cursor.execute(f"SELECT COUNT(*) as total FROM siem_law_rules WHERE {where_sql}", params)
            total = cursor.fetchone()['total']
            
            # Get paginated results
            offset = (page - 1) * page_size
            cursor.execute(f"""
                SELECT * FROM siem_law_rules 
                WHERE {where_sql}
                ORDER BY created_at DESC
                LIMIT %s OFFSET %s
            """, params + [page_size, offset])
            
            rules = cursor.fetchall()
            # Parse JSON fields for all rules
            for rule in rules:
                self._parse_rule_fields(rule)
            return rules, total
        finally:
            cursor.close()
            conn.close()
    
    
    def get_active_rules(self) -> List[Dict[str, Any]]:
        """Get all active rules (where allowed_status != 'not_allowed')"""
        conn = self._get_connection()
        cursor = conn.cursor(dictionary=True)
        try:
            cursor.execute("SELECT * FROM siem_law_rules WHERE allowed_status != 'not_allowed' ORDER BY created_at DESC")
            rules = cursor.fetchall()
            # Parse JSON fields
            for rule in rules:
                self._parse_rule_fields(rule)
            return rules
        finally:
            cursor.close()
            conn.close()

    def get_meta(self) -> Dict[str, Any]:
        """Get metadata for filters (law sources, functional groups, etc.)"""
        conn = self._get_connection()
        cursor = conn.cursor(dictionary=True)
        try:
            # Get unique law sources
            cursor.execute("SELECT DISTINCT law_source FROM siem_law_rules WHERE law_source IS NOT NULL ORDER BY law_source")
            law_sources = [row['law_source'] for row in cursor.fetchall()]
            
            # Get unique functional groups
            cursor.execute("SELECT DISTINCT functional_group FROM siem_law_rules WHERE functional_group IS NOT NULL")
            functional_groups_raw = [row['functional_group'] for row in cursor.fetchall()]
            
            # Helper to parse Roman numerals
            def roman_to_int(s):
                rom_val = {'I': 1, 'V': 5, 'X': 10, 'L': 50, 'C': 100, 'D': 500, 'M': 1000}
                int_val = 0
                for i in range(len(s)):
                    if i > 0 and rom_val[s[i]] > rom_val[s[i - 1]]:
                        int_val += rom_val[s[i]] - 2 * rom_val[s[i - 1]]
                    else:
                        int_val += rom_val[s[i]]
                return int_val

            def sort_key(text):
                import re
                # Match "PHẦN [ROMAN]" with optional emoji prefix
                match = re.search(r'PHẦN\s+([IVXLCDM]+)', text, re.IGNORECASE)
                if match:
                    return roman_to_int(match.group(1).upper())
                return 999  # Put non-matching items at the end

            functional_groups = sorted(functional_groups_raw, key=sort_key)
            
            # Get unique allowed statuses
            cursor.execute("SELECT DISTINCT allowed_status FROM siem_law_rules WHERE allowed_status IS NOT NULL ORDER BY allowed_status")
            statuses = [row['allowed_status'] for row in cursor.fetchall()]
            
            return {
                'law_sources': law_sources,
                'functional_groups': functional_groups,
                'statuses': statuses
            }
        finally:
            cursor.close()
            conn.close()

