#!/bin/sh
# Watchdog: Tu dong bat lai general_log neu bi tat
# Tinh nang:
# 1. Email Alert - Gui email khi phat hien log bi tat
# 2. Kill Connection - Ngat ket noi nghi ngo
# 3. Log IP - Ghi lai IP de block
# 4. Foreign IP Detection - Phat hien IP la truy cap MySQL

# Set timezone to Vietnam (GMT+7)
export TZ='Asia/Ho_Chi_Minh'

# SMTP config (lay tu bien moi truong)
SMTP_SERVER="${SMTP_SERVER:-smtp.gmail.com}"
SMTP_PORT="${SMTP_PORT:-587}"
SMTP_USER="${SMTP_USER:-}"
SMTP_PASS="${SMTP_PASS:-}"
ALERT_EMAIL="${ALERT_EMAIL:-}"

# Whitelist IPs (localhost, docker networks)
WHITELIST_IPS="127.0.0.1 localhost 172.17. 172.18. 172.19. 172.20. 172.21. 172.22. 172.23. 172.24. 172.25. 172.26. 172.27. 172.28. 172.29. 172.30. 172.31. 192.168. 10."

echo "MySQL Log Watchdog started - checking every 1 second..."
echo "Timezone: $TZ"
echo "Email alerts: ${ALERT_EMAIL:-DISABLED}"
echo "Foreign IP detection: ENABLED"

# Ham gui email
send_email_alert() {
    MESSAGE="$1"
    ALERT_TYPE="${2:-LOG_TAMPERING}"
    TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
    
    if [ -n "$ALERT_EMAIL" ] && [ -n "$SMTP_USER" ]; then
        echo "Sending email alert to $ALERT_EMAIL..."
        
        # Su dung curl de gui email qua SMTP
        curl --ssl-reqd \
            --url "smtps://${SMTP_SERVER}:465" \
            --user "${SMTP_USER}:${SMTP_PASS}" \
            --mail-from "${SMTP_USER}" \
            --mail-rcpt "${ALERT_EMAIL}" \
            --upload-file - <<EOF
From: SIEM Alert <${SMTP_USER}>
To: ${ALERT_EMAIL}
Subject: [SIEM ALERT] ${ALERT_TYPE} - ${TIMESTAMP}
Content-Type: text/plain; charset=UTF-8

CẢNH BÁO BẢO MẬT!

Thời gian: ${TIMESTAMP}
Loại: ${ALERT_TYPE}
Nội dung: ${MESSAGE}

Hệ thống đã tự động:
- Bật lại general_log
- Ngắt kết nối nghi ngờ
- Ghi nhận IP để theo dõi

Vui lòng kiểm tra SIEM Dashboard ngay!
http://localhost:3002/mysql-logs

---
SIEM Automatic Alert System
EOF
        echo "Email sent!"
    fi
}

# Ham phat hien IP la (khong phai localhost/docker network)
check_foreign_ips() {
    # Lay danh sach IP dang ket noi MySQL
    CONNECTIONS=$(mysql -h mariadb -u root -pemrdbpass -N -e "
        SELECT DISTINCT HOST FROM information_schema.PROCESSLIST 
        WHERE USER != 'event_scheduler' 
        AND HOST IS NOT NULL
        AND HOST != ''
    " 2>/dev/null)
    
    for HOST_INFO in $CONNECTIONS; do
        # Tach IP tu HOST (format: ip:port hoac hostname)
        IP=$(echo "$HOST_INFO" | cut -d':' -f1)
        
        # Bo qua neu IP trong whitelist
        IS_WHITELISTED=0
        for WHITELIST in $WHITELIST_IPS; do
            case "$IP" in
                $WHITELIST*) IS_WHITELISTED=1 ;;
            esac
        done
        
        if [ "$IS_WHITELISTED" = "0" ] && [ -n "$IP" ] && [ "$IP" != "NULL" ]; then
            TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
            echo "$TIMESTAMP - ALERT: Foreign IP detected: $IP"
            
            # Ghi alert vao database
            mysql -h mariadb -u root -pemrdbpass ehr_core -e "
                INSERT INTO watchdog_alerts (alert_type, message, detected_at, status)
                VALUES ('FOREIGN_IP_ACCESS', 'Phat hien IP la truy cap MySQL: $IP. Nghi ngo truy cap trai phep vao co so du lieu.', NOW(), 'WARNING');
            " 2>/dev/null
            
            # Gui email canh bao
            send_email_alert "Phat hien IP la ($IP) truy cap truc tiep MySQL. Co the la hacker dang doc trom du lieu!" "FOREIGN_IP_ACCESS"
        fi
    done
}

# Ham kill connection nghi ngo
kill_suspicious_connections() {
    echo "Checking for suspicious connections..."
    
    # Tim cac connection da chay SET GLOBAL (co the la ke tan cong)
    # Lay danh sach tat ca connection dang hoat dong
    CONNECTIONS=$(mysql -h mariadb -u root -pemrdbpass -N -e "
        SELECT ID FROM information_schema.PROCESSLIST 
        WHERE COMMAND = 'Query' 
        AND USER != 'root'
        AND TIME > 0
    " 2>/dev/null)
    
    # Kill cac connection nghi ngo (khong phai root localhost)
    KILL_COUNT=0
    for CONN_ID in $CONNECTIONS; do
        mysql -h mariadb -u root -pemrdbpass -e "KILL $CONN_ID" 2>/dev/null
        KILL_COUNT=$((KILL_COUNT + 1))
    done
    
    if [ $KILL_COUNT -gt 0 ]; then
        echo "Killed $KILL_COUNT suspicious connections"
        
        # Ghi vao database
        mysql -h mariadb -u root -pemrdbpass ehr_core -e "
            INSERT INTO watchdog_alerts (alert_type, message, detected_at, status)
            VALUES ('CONNECTION_KILLED', 'Killed $KILL_COUNT suspicious connections after log tampering', NOW(), 'WARNING');
        " 2>/dev/null
    fi
}

# Vong lap chinh
while true; do
    # 1. Kiem tra general_log
    STATUS=$(mysql -h mariadb -u root -pemrdbpass -N -e "SELECT @@general_log" 2>/dev/null)
    
    if [ "$STATUS" = "0" ]; then
        TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
        echo "$TIMESTAMP - ALERT: general_log was OFF, re-enabled!"
        
        # Bat lai log NGAY LAP TUC
        mysql -h mariadb -u root -pemrdbpass -e "SET GLOBAL general_log = 'ON';"
        
        # Lay IP cua connection nghi ngo (connection cuoi cung khong phai watchdog)
        ATTACKER_IP=$(mysql -h mariadb -u root -pemrdbpass -N -e "
            SELECT SUBSTRING_INDEX(HOST, ':', 1) 
            FROM information_schema.PROCESSLIST 
            WHERE USER != 'event_scheduler' 
            AND HOST NOT LIKE '%mariadb%'
            LIMIT 1
        " 2>/dev/null)
        
        # Neu khong tim thay, lay tu general_log (query cuoi)
        if [ -z "$ATTACKER_IP" ] || [ "$ATTACKER_IP" = "NULL" ]; then
            ATTACKER_IP=$(mysql -h mariadb -u root -pemrdbpass -N -e "
                SELECT SUBSTRING_INDEX(SUBSTRING_INDEX(user_host, '[', -1), ']', 1)
                FROM mysql.general_log 
                WHERE argument LIKE '%general_log%OFF%'
                ORDER BY event_time DESC LIMIT 1
            " 2>/dev/null)
        fi
        
        echo "Attacker IP: $ATTACKER_IP"
        
        # Ghi alert vao database - Thong bao vi pham phap ly
        mysql -h mariadb -u root -pemrdbpass ehr_core -e "
            INSERT INTO watchdog_alerts (alert_type, message, detected_at, status, ip_address)
            VALUES ('LOG_TAMPERING', 'Vi phạm tính toàn vẹn hệ thống: Chức năng ghi nhật ký đã bị vô hiệu hóa. Rủi ro cao về che giấu vi phạm. (Nghị định 13, Luật Khám bệnh chữa bệnh)', NOW(), 'CRITICAL', '$ATTACKER_IP');
        " 2>/dev/null
        
        # Kill connection nghi ngo
        kill_suspicious_connections
        
        # Gui email canh bao
        send_email_alert "general_log was disabled at $TIMESTAMP from IP: $ATTACKER_IP - Connections killed, log re-enabled" "LOG_TAMPERING"
    fi
    
    # 2. Kiem tra IP la truy cap MySQL (moi 30 giay)
    CHECK_COUNT=$((${CHECK_COUNT:-0} + 1))
    if [ $((CHECK_COUNT % 3)) = 0 ]; then
        check_foreign_ips
    fi
    
    sleep 1
done
