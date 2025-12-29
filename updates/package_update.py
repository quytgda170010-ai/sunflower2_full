#!/usr/bin/env python3
"""
Script đóng gói bản cập nhật SIEM

Sử dụng:
    python package_update.py --version 1.1.0 --message "Thêm 10 rules mới"
    
Tác dụng:
    1. Export rules từ database
    2. Tạo package.json với rules + policies + config
    3. Cập nhật manifest.json
    4. Sẵn sàng push lên GitHub
"""

import os
import sys
import json
import argparse
import mysql.connector
from datetime import datetime

# Configuration
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'database': os.getenv('DB_NAME', 'ehr_core'),
    'user': os.getenv('DB_USER', 'root'),
    'password': os.getenv('DB_PASSWORD', 'emrdbpass')
}

UPDATES_DIR = os.path.dirname(os.path.abspath(__file__))


def export_rules_from_database():
    """Export tất cả rules từ database"""
    print("📦 Đang export rules từ database...")
    
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("""
            SELECT 
                rule_id, rule_name, functional_group, rule_scope,
                article, clause, point, allowed_status,
                description, law_source, effective_date,
                details, evaluation_criteria
            FROM siem_law_rules
            ORDER BY rule_id
        """)
        
        rules = cursor.fetchall()
        
        # Convert date objects to strings
        for rule in rules:
            for key, value in rule.items():
                if hasattr(value, 'isoformat'):
                    rule[key] = value.isoformat()
        
        cursor.close()
        conn.close()
        
        print(f"   ✅ Đã export {len(rules)} rules")
        return rules
        
    except Exception as e:
        print(f"   ❌ Lỗi: {e}")
        return []


def create_package(version: str, changelog: str, rules: list):
    """Tạo update package"""
    print(f"📦 Đang tạo package version {version}...")
    
    # Create version directory
    version_dir = os.path.join(UPDATES_DIR, f"v{version}")
    os.makedirs(version_dir, exist_ok=True)
    
    # Create package.json
    package = {
        "version": version,
        "created_at": datetime.now().isoformat(),
        "changelog": changelog,
        "rules_count": len(rules),
        "policies_count": 0,
        "rules": rules,
        "policies": [],
        "config": {}
    }
    
    package_path = os.path.join(version_dir, "package.json")
    with open(package_path, 'w', encoding='utf-8') as f:
        json.dump(package, f, ensure_ascii=False, indent=2)
    
    print(f"   ✅ Đã tạo {package_path}")
    
    # Create changelog.md
    changelog_path = os.path.join(version_dir, "changelog.md")
    with open(changelog_path, 'w', encoding='utf-8') as f:
        f.write(f"# Version {version}\n\n")
        f.write(f"**Ngày phát hành:** {datetime.now().strftime('%d/%m/%Y')}\n\n")
        f.write(f"## Thay đổi\n\n{changelog}\n\n")
        f.write(f"## Thống kê\n\n")
        f.write(f"- Tổng số rules: {len(rules)}\n")
    
    print(f"   ✅ Đã tạo {changelog_path}")
    
    return package


def update_manifest(version: str, changelog: str, rules_count: int):
    """Cập nhật manifest.json"""
    print("📝 Đang cập nhật manifest.json...")
    
    manifest_path = os.path.join(UPDATES_DIR, "manifest.json")
    
    # Read existing manifest or create new
    if os.path.exists(manifest_path):
        with open(manifest_path, 'r', encoding='utf-8') as f:
            manifest = json.load(f)
    else:
        manifest = {
            "name": "SIEM Law Rules Update",
            "description": "Cập nhật quy tắc tuân thủ cho hệ thống SIEM",
            "latest_version": version,
            "update_server": "https://raw.githubusercontent.com/quytgda170010-ai/sunflower2_full/main/updates",
            "packages": []
        }
    
    # Check if version already exists
    for pkg in manifest["packages"]:
        if pkg["version"] == version:
            print(f"   ⚠️ Version {version} đã tồn tại, đang cập nhật...")
            pkg["release_date"] = datetime.now().strftime("%Y-%m-%d")
            pkg["changelog"] = changelog
            pkg["rules_count"] = rules_count
            break
    else:
        # Add new package entry
        manifest["packages"].insert(0, {
            "version": version,
            "release_date": datetime.now().strftime("%Y-%m-%d"),
            "changelog": changelog,
            "rules_count": rules_count,
            "policies_count": 0,
            "download_url": f"v{version}/package.json",
            "checksum": "",
            "min_app_version": "1.0.0"
        })
    
    # Update latest version
    manifest["latest_version"] = version
    
    # Save manifest
    with open(manifest_path, 'w', encoding='utf-8') as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)
    
    print(f"   ✅ Đã cập nhật manifest.json (latest: {version})")


def main():
    parser = argparse.ArgumentParser(description='Đóng gói bản cập nhật SIEM')
    parser.add_argument('--version', '-v', required=True, help='Version number (e.g., 1.1.0)')
    parser.add_argument('--message', '-m', required=True, help='Changelog message')
    parser.add_argument('--db-host', default='localhost', help='Database host')
    parser.add_argument('--db-password', default='emrdbpass', help='Database password')
    
    args = parser.parse_args()
    
    # Update DB config
    DB_CONFIG['host'] = args.db_host
    DB_CONFIG['password'] = args.db_password
    
    print(f"\n🚀 SIEM Update Packager")
    print(f"   Version: {args.version}")
    print(f"   Message: {args.message}")
    print(f"   Database: {DB_CONFIG['host']}/{DB_CONFIG['database']}")
    print()
    
    # Export rules
    rules = export_rules_from_database()
    if not rules:
        print("\n❌ Không có rules để đóng gói!")
        sys.exit(1)
    
    # Create package
    package = create_package(args.version, args.message, rules)
    
    # Update manifest
    update_manifest(args.version, args.message, len(rules))
    
    print(f"\n✅ Đóng gói thành công!")
    print(f"\n📋 Bước tiếp theo:")
    print(f"   1. git add updates/")
    print(f"   2. git commit -m 'Release v{args.version}'")
    print(f"   3. git push origin main")
    print(f"\n   Sau khi push, khách hàng sẽ thấy bản cập nhật mới!")


if __name__ == "__main__":
    main()
