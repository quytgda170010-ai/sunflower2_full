import mysql.connector
import json
import re

conn = mysql.connector.connect(
    host='mariadb', 
    user='openemr', 
    password='Openemr!123', 
    database='ehr_core',
    charset='utf8mb4'
)
cur = conn.cursor()

print("=== COMPREHENSIVE SCAN FOR ALL BROKEN PATTERNS ===\n")

# Get all distinct values from changed_fields to find patterns
cur.execute("SELECT changed_fields FROM access_logs WHERE changed_fields IS NOT NULL")
rows = cur.fetchall()

# Collect all unique broken patterns
broken_patterns = set()
vietnamese_chars = set('aàảãáạăằẳẵắặâầẩẫấậeèẻẽéẹêềểễếệiìỉĩíịoòỏõóọôồổỗốộơờởỡớợuùủũúụưừửữứựyỳỷỹýỵAÀẢÃÁẠĂẰẲẴẮẶÂẦẨẪẤẬEÈẺẼÉẸÊỀỂỄẾỆIÌỈĨÍỊOÒỎÕÓỌÔỒỔỖỐỘƠỜỞỠỚỢUÙỦŨÚỤƯỪỬỮỨỰYỲỶỸÝỴĐđ')

for row in rows:
    if row[0]:
        try:
            data = json.loads(row[0])
            
            # Extract all string values recursively
            def extract_strings(obj, path=""):
                results = []
                if isinstance(obj, dict):
                    for k, v in obj.items():
                        results.extend(extract_strings(v, f"{path}.{k}"))
                elif isinstance(obj, list):
                    for i, v in enumerate(obj):
                        results.extend(extract_strings(v, f"{path}[{i}]"))
                elif isinstance(obj, str):
                    results.append((path, obj))
                return results
            
            strings = extract_strings(data)
            for path, value in strings:
                # Look for suspicious patterns
                if value:
                    # Pattern 1: Characters that shouldn't be at end of Vietnamese words
                    if re.search(r'[a-z]v$', value):  # ends with consonant+v
                        print(f"Suspicious: {path} = {value}")
                        broken_patterns.add(('v_ending', value))
                    
                    # Pattern 2: Double consonants that are unusual
                    if re.search(r'[bcdfghjklmnpqrstvwxz]{3,}', value.lower()):
                        print(f"Triple consonant: {path} = {value}")
                    
                    # Pattern 3: Look for specific fields
                    if 'notes' in path.lower():
                        print(f"Notes field: {value}")
                    if 'full_name' in path.lower():
                        print(f"Full_name: {value}")
                    if 'department' in path.lower() and 'id' not in path.lower():
                        print(f"Department: {value}")
                        
        except json.JSONDecodeError:
            pass

print("\n=== Summary of unique broken patterns ===")
for pattern_type, value in list(broken_patterns)[:10]:
    print(f"  {pattern_type}: {value}")
