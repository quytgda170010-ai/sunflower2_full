"""
SIEM Update Service - Hệ thống cập nhật tự động

Cho phép:
- Kiểm tra version mới từ update server
- Tải và áp dụng bản cập nhật
- Backup trước khi cập nhật
"""

import os
import json
import logging
import hashlib
import shutil
from datetime import datetime
from typing import Optional, Dict, Any
import httpx

logger = logging.getLogger(__name__)

# Update server URL - Có thể override bằng environment variable
UPDATE_SERVER_URL = os.getenv(
    "UPDATE_SERVER_URL", 
    "https://raw.githubusercontent.com/quytgda170010-ai/sunflower2_full/main/updates"
)

# Local storage for version info
VERSION_FILE = "/app/data/current_version.json"
BACKUP_DIR = "/app/data/backups"


class UpdateService:
    """Service xử lý việc cập nhật hệ thống SIEM"""
    
    def __init__(self, db_connection=None):
        self.db = db_connection
        self.update_server = UPDATE_SERVER_URL
        self._ensure_directories()
    
    def _ensure_directories(self):
        """Tạo các thư mục cần thiết"""
        os.makedirs(os.path.dirname(VERSION_FILE), exist_ok=True)
        os.makedirs(BACKUP_DIR, exist_ok=True)
    
    def get_current_version(self) -> Dict[str, Any]:
        """Lấy thông tin version hiện tại đang chạy"""
        try:
            if os.path.exists(VERSION_FILE):
                with open(VERSION_FILE, 'r') as f:
                    return json.load(f)
        except Exception as e:
            logger.warning(f"Could not read version file: {e}")
        
        # Default version nếu chưa có
        return {
            "version": "1.0.0",
            "installed_at": None,
            "rules_count": 0,
            "policies_count": 0
        }
    
    def _save_current_version(self, version_info: Dict[str, Any]):
        """Lưu thông tin version hiện tại"""
        version_info["installed_at"] = datetime.now().isoformat()
        with open(VERSION_FILE, 'w') as f:
            json.dump(version_info, f, indent=2)
    
    async def check_for_updates(self) -> Dict[str, Any]:
        """
        Kiểm tra xem có bản cập nhật mới không
        
        Returns:
            {
                "has_update": bool,
                "current_version": "1.0.0",
                "latest_version": "1.1.0",
                "changelog": "...",
                "package_size": "2.5 MB"
            }
        """
        try:
            current = self.get_current_version()
            
            # Fetch manifest từ update server
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(f"{self.update_server}/manifest.json")
                response.raise_for_status()
                manifest = response.json()
            
            latest_version = manifest.get("latest_version", "1.0.0")
            current_version = current.get("version", "1.0.0")
            
            # So sánh version
            has_update = self._compare_versions(current_version, latest_version) < 0
            
            # Lấy changelog của version mới nhất
            changelog = ""
            package_info = {}
            if has_update and manifest.get("packages"):
                for pkg in manifest["packages"]:
                    if pkg.get("version") == latest_version:
                        changelog = pkg.get("changelog", "")
                        package_info = pkg
                        break
            
            return {
                "has_update": has_update,
                "current_version": current_version,
                "latest_version": latest_version,
                "changelog": changelog,
                "release_date": package_info.get("release_date", ""),
                "rules_count": package_info.get("rules_count", 0),
                "policies_count": package_info.get("policies_count", 0),
                "package_url": package_info.get("download_url", "")
            }
            
        except httpx.HTTPError as e:
            logger.error(f"Failed to check for updates: {e}")
            return {
                "has_update": False,
                "error": f"Không thể kết nối đến server cập nhật: {str(e)}",
                "current_version": self.get_current_version().get("version", "1.0.0")
            }
        except Exception as e:
            logger.error(f"Update check failed: {e}")
            return {
                "has_update": False,
                "error": f"Lỗi kiểm tra cập nhật: {str(e)}",
                "current_version": self.get_current_version().get("version", "1.0.0")
            }
    
    async def apply_update(self) -> Dict[str, Any]:
        """
        Tải và áp dụng bản cập nhật mới nhất
        
        Returns:
            {
                "success": bool,
                "message": "...",
                "new_version": "1.1.0",
                "changes": {...}
            }
        """
        try:
            # 1. Kiểm tra có update không
            update_info = await self.check_for_updates()
            if not update_info.get("has_update"):
                return {
                    "success": False,
                    "message": "Không có bản cập nhật mới"
                }
            
            new_version = update_info["latest_version"]
            package_url = update_info.get("package_url", "")
            
            if not package_url:
                package_url = f"{self.update_server}/v{new_version}/package.json"
            else:
                package_url = f"{self.update_server}/{package_url}"
            
            # 2. Tải package cập nhật
            logger.info(f"Downloading update package from: {package_url}")
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.get(package_url)
                response.raise_for_status()
                package = response.json()
            
            # 3. Backup dữ liệu hiện tại
            backup_result = await self._backup_current_data()
            if not backup_result["success"]:
                return {
                    "success": False,
                    "message": f"Backup thất bại: {backup_result.get('error')}"
                }
            
            # 4. Áp dụng rules mới
            rules_result = await self._apply_rules(package.get("rules", []))
            
            # 5. Áp dụng policies mới (nếu có)
            policies_result = await self._apply_policies(package.get("policies", []))
            
            # 6. Áp dụng config mới (nếu có)
            config_result = await self._apply_config(package.get("config", {}))
            
            # 7. Đếm tổng số rules từ database (sau khi upsert)
            total_rules = 0
            if self.db:
                cursor = self.db.cursor()
                cursor.execute("SELECT COUNT(*) FROM siem_law_rules")
                result = cursor.fetchone()
                total_rules = result[0] if result else 0
                cursor.close()
            
            # 8. Lưu version mới
            self._save_current_version({
                "version": new_version,
                "rules_count": total_rules,
                "policies_count": policies_result.get("count", 0),
                "backup_path": backup_result.get("backup_path")
            })
            
            return {
                "success": True,
                "message": f"Cập nhật thành công lên version {new_version}",
                "new_version": new_version,
                "changes": {
                    "rules": rules_result,
                    "policies": policies_result,
                    "config": config_result
                }
            }
            
        except Exception as e:
            logger.error(f"Update failed: {e}")
            return {
                "success": False,
                "message": f"Cập nhật thất bại: {str(e)}"
            }
    
    async def _backup_current_data(self) -> Dict[str, Any]:
        """Backup rules và policies hiện tại trước khi cập nhật"""
        try:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            backup_path = os.path.join(BACKUP_DIR, f"backup_{timestamp}")
            os.makedirs(backup_path, exist_ok=True)
            
            # Export rules từ database
            if self.db:
                cursor = self.db.cursor(dictionary=True)
                cursor.execute("SELECT * FROM siem_law_rules")
                rules = cursor.fetchall()
                cursor.close()
                
                with open(os.path.join(backup_path, "rules.json"), 'w', encoding='utf-8') as f:
                    json.dump(rules, f, ensure_ascii=False, indent=2, default=str)
            
            logger.info(f"Backup created at: {backup_path}")
            return {
                "success": True,
                "backup_path": backup_path
            }
            
        except Exception as e:
            logger.error(f"Backup failed: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def _apply_rules(self, rules: list) -> Dict[str, Any]:
        """Import rules mới vào database - UPSERT mode (không xóa rules cũ)"""
        if not rules:
            return {"count": 0, "status": "no_changes"}
        
        try:
            if not self.db:
                return {"count": 0, "status": "no_db_connection"}
            
            cursor = self.db.cursor()
            
            # UPSERT: Insert or Update by rule_code (không TRUNCATE)
            insert_query = """
                INSERT INTO siem_law_rules 
                (rule_code, rule_name, functional_group, law_source, allowed_status, 
                 explanation, legal_basis, log_fields, auto_checks, penalty_level, law_url, rule_scope)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE
                    rule_name = VALUES(rule_name),
                    functional_group = VALUES(functional_group),
                    law_source = VALUES(law_source),
                    allowed_status = VALUES(allowed_status),
                    explanation = VALUES(explanation),
                    legal_basis = VALUES(legal_basis),
                    log_fields = VALUES(log_fields),
                    auto_checks = VALUES(auto_checks),
                    penalty_level = VALUES(penalty_level),
                    law_url = VALUES(law_url),
                    rule_scope = VALUES(rule_scope),
                    updated_at = NOW()
            """
            
            count = 0
            for rule in rules:
                cursor.execute(insert_query, (
                    rule.get("rule_code"),
                    rule.get("rule_name"),
                    rule.get("functional_group"),
                    rule.get("law_source"),
                    rule.get("allowed_status"),
                    rule.get("explanation", rule.get("description", "")),
                    rule.get("legal_basis"),
                    rule.get("log_fields"),
                    rule.get("auto_checks"),
                    rule.get("penalty_level"),
                    rule.get("law_url"),
                    rule.get("rule_scope", "USER")
                ))
                count += 1
            
            self.db.commit()
            cursor.close()
            
            logger.info(f"Upserted {count} rules")
            return {"count": count, "status": "success"}
            
        except Exception as e:
            logger.error(f"Failed to apply rules: {e}")
            return {"count": 0, "status": "error", "error": str(e)}
    
    async def _apply_policies(self, policies: list) -> Dict[str, Any]:
        """Cập nhật OPA policies (future implementation)"""
        # TODO: Implement policy updates
        return {"count": len(policies), "status": "not_implemented"}
    
    async def _apply_config(self, config: dict) -> Dict[str, Any]:
        """Cập nhật config (future implementation)"""
        # TODO: Implement config updates
        return {"status": "not_implemented"}
    
    def _compare_versions(self, v1: str, v2: str) -> int:
        """
        So sánh 2 version strings
        Returns: -1 nếu v1 < v2, 0 nếu bằng, 1 nếu v1 > v2
        """
        try:
            parts1 = [int(x) for x in v1.split('.')]
            parts2 = [int(x) for x in v2.split('.')]
            
            # Pad với 0 nếu độ dài khác nhau
            while len(parts1) < len(parts2):
                parts1.append(0)
            while len(parts2) < len(parts1):
                parts2.append(0)
            
            for p1, p2 in zip(parts1, parts2):
                if p1 < p2:
                    return -1
                if p1 > p2:
                    return 1
            return 0
        except:
            return 0
    
    async def get_update_history(self) -> list:
        """Lấy lịch sử các bản cập nhật đã áp dụng"""
        history = []
        
        try:
            # List all backups
            if os.path.exists(BACKUP_DIR):
                for backup_name in sorted(os.listdir(BACKUP_DIR), reverse=True):
                    backup_path = os.path.join(BACKUP_DIR, backup_name)
                    if os.path.isdir(backup_path):
                        history.append({
                            "backup_name": backup_name,
                            "date": backup_name.replace("backup_", ""),
                            "path": backup_path
                        })
        except Exception as e:
            logger.error(f"Failed to get update history: {e}")
        
        return history


# Singleton instance
_update_service: Optional[UpdateService] = None

def get_update_service(db_connection=None) -> UpdateService:
    """Get or create UpdateService singleton"""
    global _update_service
    if _update_service is None:
        _update_service = UpdateService(db_connection)
    elif db_connection:
        _update_service.db = db_connection
    return _update_service
