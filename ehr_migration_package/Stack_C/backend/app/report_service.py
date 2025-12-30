# Off-Hours Log Report Email Service
# Auto-generates and sends email reports for logs during 18h-6h

import os
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
import mysql.connector
from jinja2 import Template

logger = logging.getLogger(__name__)

# Email configuration from environment
SMTP_HOST = os.getenv('SMTP_HOST', 'smtp.gmail.com')
SMTP_PORT = int(os.getenv('SMTP_PORT', '587'))
SMTP_EMAIL = os.getenv('SMTP_EMAIL', '')
SMTP_PASSWORD = os.getenv('SMTP_PASSWORD', '')
REPORT_RECIPIENTS = os.getenv('REPORT_RECIPIENTS', '').split(',')

# Database configuration
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'mariadb'),
    'user': os.getenv('DB_USER', 'openemr'),
    'password': os.getenv('DB_PASSWORD', 'Openemr!123'),
    'database': os.getenv('DB_NAME', 'ehr_core'),
    'charset': 'utf8mb4'
}

# Timezone offset for Vietnam (UTC+7)
TIMEZONE_OFFSET = 7


def get_off_hours_logs(from_time: datetime, to_time: datetime) -> List[Dict[str, Any]]:
    """
    Get all logs from access_logs table within the specified time range.
    Typically used for off-hours: 18:00 -> 06:00 next day
    """
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor(dictionary=True)
        
        sql = """
            SELECT 
                id, timestamp, user_id, actor_name, role, action, 
                operation, method, status, purpose, uri, ip_address,
                user_agent, log_type, patient_name, patient_code, details
            FROM access_logs
            WHERE timestamp >= %s AND timestamp < %s
            ORDER BY timestamp DESC
            LIMIT 500
        """
        cursor.execute(sql, (from_time, to_time))
        logs = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return logs
    except Exception as e:
        logger.error(f"Error fetching off-hours logs: {e}")
        return []


def categorize_logs(logs: List[Dict]) -> Dict[str, Any]:
    """Categorize logs into violations, successes, warnings"""
    violations = []
    successes = []
    warnings = []
    users_active = set()
    ip_addresses = set()
    
    for log in logs:
        action = (log.get('action') or '').lower()
        status = log.get('status') or 0
        log_type = (log.get('log_type') or '').upper()
        user = log.get('user_id') or log.get('actor_name') or 'unknown'
        ip = log.get('ip_address') or ''
        
        users_active.add(user)
        if ip:
            ip_addresses.add(ip)
        
        # Categorize based on status and action
        if 'brute' in action or 'attack' in action or log_type == 'SECURITY_ALERT':
            violations.append(log)
        elif status >= 400 or 'thất bại' in action or 'failed' in action or 'locked' in action:
            warnings.append(log)
        else:
            successes.append(log)
    
    return {
        'violations': violations,
        'successes': successes,
        'warnings': warnings,
        'users_active': list(users_active),
        'ip_addresses': list(ip_addresses),
        'total': len(logs)
    }


HTML_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; }
        .header { background: linear-gradient(135deg, #1a237e 0%, #0d47a1 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .header h1 { margin: 0; font-size: 24px; }
        .header p { margin: 5px 0 0 0; opacity: 0.9; }
        .content { padding: 20px; background: #f5f5f5; }
        .summary { display: flex; gap: 15px; margin-bottom: 20px; flex-wrap: wrap; }
        .stat-box { flex: 1; min-width: 120px; padding: 15px; border-radius: 8px; text-align: center; }
        .stat-box.total { background: #e3f2fd; border-left: 4px solid #1976d2; }
        .stat-box.violations { background: #ffebee; border-left: 4px solid #c62828; }
        .stat-box.warnings { background: #fff3e0; border-left: 4px solid #ef6c00; }
        .stat-box.success { background: #e8f5e9; border-left: 4px solid #2e7d32; }
        .stat-number { font-size: 28px; font-weight: bold; }
        .stat-label { font-size: 12px; text-transform: uppercase; opacity: 0.8; }
        .section { background: white; border-radius: 8px; padding: 15px; margin-bottom: 15px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .section h3 { margin: 0 0 15px 0; color: #1a237e; border-bottom: 2px solid #e0e0e0; padding-bottom: 10px; }
        table { width: 100%; border-collapse: collapse; font-size: 13px; }
        th { background: #f5f5f5; text-align: left; padding: 10px 8px; border-bottom: 2px solid #e0e0e0; }
        td { padding: 8px; border-bottom: 1px solid #eee; }
        tr:hover { background: #fafafa; }
        .badge { display: inline-block; padding: 3px 8px; border-radius: 12px; font-size: 11px; font-weight: bold; }
        .badge-danger { background: #ffcdd2; color: #c62828; }
        .badge-warning { background: #ffe0b2; color: #e65100; }
        .badge-success { background: #c8e6c9; color: #2e7d32; }
        .users-list { display: flex; flex-wrap: wrap; gap: 8px; }
        .user-chip { background: #e3f2fd; color: #1565c0; padding: 5px 12px; border-radius: 16px; font-size: 13px; }
        .ip-chip { background: #fce4ec; color: #c2185b; padding: 5px 12px; border-radius: 16px; font-size: 13px; font-family: monospace; }
        .footer { text-align: center; padding: 15px; color: #666; font-size: 12px; }
        .no-data { text-align: center; color: #999; padding: 20px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🌙 Báo Cáo Log Ngoài Giờ Làm Việc</h1>
        <p>Khung giờ: {{ from_time }} → {{ to_time }}</p>
    </div>
    
    <div class="content">
        <div class="summary">
            <div class="stat-box total">
                <div class="stat-number">{{ stats.total }}</div>
                <div class="stat-label">Tổng logs</div>
            </div>
            <div class="stat-box violations">
                <div class="stat-number">{{ stats.violations | length }}</div>
                <div class="stat-label">Vi phạm / Tấn công</div>
            </div>
            <div class="stat-box warnings">
                <div class="stat-number">{{ stats.warnings | length }}</div>
                <div class="stat-label">Cảnh báo</div>
            </div>
            <div class="stat-box success">
                <div class="stat-number">{{ stats.successes | length }}</div>
                <div class="stat-label">Thành công</div>
            </div>
        </div>
        
        <div class="section">
            <h3>👤 Users hoạt động ngoài giờ ({{ stats.users_active | length }})</h3>
            {% if stats.users_active %}
            <div class="users-list">
                {% for user in stats.users_active %}
                <span class="user-chip">{{ user }}</span>
                {% endfor %}
            </div>
            {% else %}
            <p class="no-data">Không có user hoạt động</p>
            {% endif %}
        </div>
        
        <div class="section">
            <h3>🌐 IP Addresses ({{ stats.ip_addresses | length }})</h3>
            {% if stats.ip_addresses %}
            <div class="users-list">
                {% for ip in stats.ip_addresses %}
                <span class="ip-chip">{{ ip }}</span>
                {% endfor %}
            </div>
            {% else %}
            <p class="no-data">Không có IP</p>
            {% endif %}
        </div>
        
        {% if stats.violations %}
        <div class="section">
            <h3>🚨 Vi phạm & Tấn công ({{ stats.violations | length }})</h3>
            <table>
                <tr>
                    <th>Thời gian</th>
                    <th>User</th>
                    <th>Hành động</th>
                    <th>IP</th>
                </tr>
                {% for log in stats.violations[:20] %}
                <tr>
                    <td>{{ log.timestamp }}</td>
                    <td>{{ log.user_id or log.actor_name or 'N/A' }}</td>
                    <td><span class="badge badge-danger">{{ (log.action or '')[:60] }}</span></td>
                    <td>{{ log.ip_address or 'N/A' }}</td>
                </tr>
                {% endfor %}
            </table>
            {% if stats.violations | length > 20 %}
            <p style="text-align: center; color: #666;">... và {{ stats.violations | length - 20 }} vi phạm khác</p>
            {% endif %}
        </div>
        {% endif %}
        
        {% if stats.warnings %}
        <div class="section">
            <h3>⚠️ Cảnh báo ({{ stats.warnings | length }})</h3>
            <table>
                <tr>
                    <th>Thời gian</th>
                    <th>User</th>
                    <th>Hành động</th>
                    <th>Status</th>
                </tr>
                {% for log in stats.warnings[:15] %}
                <tr>
                    <td>{{ log.timestamp }}</td>
                    <td>{{ log.user_id or log.actor_name or 'N/A' }}</td>
                    <td>{{ (log.action or '')[:50] }}</td>
                    <td><span class="badge badge-warning">{{ log.status }}</span></td>
                </tr>
                {% endfor %}
            </table>
        </div>
        {% endif %}
        
        <div class="section">
            <h3>✅ Hoạt động thành công gần nhất</h3>
            {% if stats.successes %}
            <table>
                <tr>
                    <th>Thời gian</th>
                    <th>User</th>
                    <th>Hành động</th>
                    <th>Log Type</th>
                </tr>
                {% for log in stats.successes[:10] %}
                <tr>
                    <td>{{ log.timestamp }}</td>
                    <td>{{ log.user_id or log.actor_name or 'N/A' }}</td>
                    <td>{{ (log.action or '')[:50] }}</td>
                    <td><span class="badge badge-success">{{ log.log_type or 'N/A' }}</span></td>
                </tr>
                {% endfor %}
            </table>
            {% else %}
            <p class="no-data">Không có hoạt động thành công</p>
            {% endif %}
        </div>
    </div>
    
    <div class="footer">
        <p>📧 Báo cáo tự động từ SIEM Dashboard | {{ generated_at }}</p>
        <p>Khung giờ giám sát: 18:00 → 06:00 (ngoài giờ làm việc)</p>
    </div>
</body>
</html>
"""


def generate_html_report(logs: List[Dict], from_time: datetime, to_time: datetime) -> str:
    """Generate HTML email content from logs"""
    stats = categorize_logs(logs)
    
    template = Template(HTML_TEMPLATE)
    html = template.render(
        stats=stats,
        from_time=from_time.strftime('%d/%m/%Y %H:%M'),
        to_time=to_time.strftime('%d/%m/%Y %H:%M'),
        generated_at=datetime.now().strftime('%d/%m/%Y %H:%M:%S')
    )
    
    return html


def send_email_report(subject: str, html_content: str, recipients: List[str]) -> bool:
    """Send HTML email via Gmail SMTP"""
    if not SMTP_EMAIL or not SMTP_PASSWORD:
        logger.error("SMTP_EMAIL or SMTP_PASSWORD not configured")
        return False
    
    if not recipients or not recipients[0]:
        logger.error("No recipients configured")
        return False
    
    try:
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = f"SIEM Dashboard <{SMTP_EMAIL}>"
        msg['To'] = ', '.join(recipients)
        
        # Attach HTML content
        html_part = MIMEText(html_content, 'html', 'utf-8')
        msg.attach(html_part)
        
        # Send via SMTP
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_EMAIL, SMTP_PASSWORD)
            server.sendmail(SMTP_EMAIL, recipients, msg.as_string())
        
        logger.info(f"Email report sent successfully to {recipients}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send email: {e}")
        return False


def run_daily_off_hours_report():
    """
    Main function called by scheduler at 6:00 AM daily.
    Collects logs from 18:00 yesterday to 06:00 today and sends report.
    """
    logger.info("Starting daily off-hours report generation...")
    
    try:
        # Calculate time range: 18:00 yesterday -> 06:00 today
        now = datetime.now()
        to_time = now.replace(hour=6, minute=0, second=0, microsecond=0)
        from_time = (to_time - timedelta(days=1)).replace(hour=18, minute=0, second=0, microsecond=0)
        
        logger.info(f"Fetching logs from {from_time} to {to_time}")
        
        # Get logs
        logs = get_off_hours_logs(from_time, to_time)
        logger.info(f"Found {len(logs)} logs in off-hours period")
        
        # Generate report
        html_content = generate_html_report(logs, from_time, to_time)
        
        # Prepare subject
        stats = categorize_logs(logs)
        subject = f"🌙 Báo cáo ngoài giờ {from_time.strftime('%d/%m')} | {len(logs)} logs | {len(stats['violations'])} vi phạm"
        
        # Send email
        recipients = [r.strip() for r in REPORT_RECIPIENTS if r.strip()]
        if not recipients:
            logger.warning("No recipients configured, skipping email send")
            return
        
        success = send_email_report(subject, html_content, recipients)
        
        if success:
            logger.info("Daily off-hours report sent successfully")
        else:
            logger.error("Failed to send daily off-hours report")
            
    except Exception as e:
        logger.error(f"Error in run_daily_off_hours_report: {e}")


def send_test_report(recipient_email: Optional[str] = None) -> Dict[str, Any]:
    """
    Send a test report for the last off-hours period.
    Used for testing email configuration.
    """
    try:
        # Use last night's off-hours period for test
        now = datetime.now()
        if now.hour < 6:
            # If before 6 AM, use yesterday 18:00 to now
            from_time = (now - timedelta(days=1)).replace(hour=18, minute=0, second=0, microsecond=0)
            to_time = now
        elif now.hour >= 18:
            # If after 6 PM, use today 18:00 to now
            from_time = now.replace(hour=18, minute=0, second=0, microsecond=0)
            to_time = now
        else:
            # During work hours, use last night
            from_time = (now - timedelta(days=1)).replace(hour=18, minute=0, second=0, microsecond=0)
            to_time = now.replace(hour=6, minute=0, second=0, microsecond=0)
        
        logs = get_off_hours_logs(from_time, to_time)
        html_content = generate_html_report(logs, from_time, to_time)
        
        stats = categorize_logs(logs)
        subject = f"[TEST] 🌙 Báo cáo ngoài giờ | {len(logs)} logs"
        
        recipients = [recipient_email] if recipient_email else [r.strip() for r in REPORT_RECIPIENTS if r.strip()]
        
        success = send_email_report(subject, html_content, recipients)
        
        return {
            'success': success,
            'logs_count': len(logs),
            'violations': len(stats['violations']),
            'warnings': len(stats['warnings']),
            'recipients': recipients,
            'time_range': f"{from_time} -> {to_time}"
        }
        
    except Exception as e:
        logger.error(f"Error in send_test_report: {e}")
        return {'success': False, 'error': str(e)}
