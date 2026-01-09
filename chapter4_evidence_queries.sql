-- =====================================================
-- SCRIPT TRÍCH XUẤT SỐ LIỆU THỰC TẾ CHO CHAPTER 4
-- Chạy các query này để lấy bằng chứng cho hội đồng
-- =====================================================

-- 1. Đếm tổng số quy tắc trong hệ thống
SELECT COUNT(*) AS total_rules FROM siem_law_rules;
-- Kết quả mong đợi: 196

-- 2. Phân loại quy tắc theo nhóm chức năng
SELECT 
    functional_group,
    COUNT(*) AS rule_count
FROM siem_law_rules 
GROUP BY functional_group
ORDER BY rule_count DESC;

-- 3. Đếm tổng số access logs
SELECT COUNT(*) AS total_access_logs FROM access_logs;

-- 4. Phân loại logs theo kết quả (ALLOW/DENY)
SELECT 
    decision,
    COUNT(*) AS log_count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM access_logs), 2) AS percentage
FROM access_logs 
GROUP BY decision;

-- 5. Phân loại logs theo loại sự kiện
SELECT 
    event_type,
    COUNT(*) AS event_count
FROM access_logs 
GROUP BY event_type
ORDER BY event_count DESC;

-- 6. Đếm số alerts bảo mật (Brute force, SQLi, XSS)
SELECT 
    CASE 
        WHEN details LIKE '%brute%' OR details LIKE '%failed_login%' THEN 'Brute Force'
        WHEN details LIKE '%sql%' OR details LIKE '%injection%' THEN 'SQL Injection'
        WHEN details LIKE '%xss%' OR details LIKE '%script%' THEN 'XSS'
        ELSE 'Other'
    END AS attack_type,
    COUNT(*) AS alert_count
FROM access_logs 
WHERE decision = 'DENY' OR event_type = 'SECURITY_ALERT'
GROUP BY attack_type;

-- 7. Đếm số users theo vai trò (từ Keycloak hoặc bảng users)
SELECT 
    role,
    COUNT(*) AS user_count
FROM users 
GROUP BY role
ORDER BY user_count DESC;

-- 8. Kiểm tra watchdog/integrity logs
SELECT 
    event_type,
    COUNT(*) AS integrity_alerts
FROM access_logs 
WHERE event_type LIKE '%TAMPERING%' OR event_type LIKE '%INTEGRITY%'
GROUP BY event_type;
