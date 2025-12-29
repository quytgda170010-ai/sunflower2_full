# Load SMTP config
. "G:\DoAnVV\sunflower2_full\scripts\smtp_config.ps1"

# ============================================
# LAY THONG TIN TU DATABASE
# ============================================

# 1. Patient Data
$patientCount = docker exec mariadb mysql -u root -pemrdbpass -N -e "SELECT COUNT(*) FROM ehr_core.ehr_patients"
$patientHash = docker exec mariadb mysql -u root -pemrdbpass -N -e "SELECT MD5(GROUP_CONCAT(id, full_name, date_of_birth, IFNULL(phone,'') ORDER BY id)) FROM ehr_core.ehr_patients"

# 2. Access Logs (phat hien xoa dau vet)
$logCount = docker exec mariadb mysql -u root -pemrdbpass -N -e "SELECT COUNT(*) FROM ehr_core.access_logs"
$oldestLog = docker exec mariadb mysql -u root -pemrdbpass -N -e "SELECT MIN(timestamp) FROM ehr_core.access_logs"

# 3. Security Status
$generalLogStatus = docker exec mariadb mysql -u root -pemrdbpass -N -e "SELECT @@general_log"
$alertCount = docker exec mariadb mysql -u root -pemrdbpass -N -e "SELECT COUNT(*) FROM ehr_core.watchdog_alerts WHERE acknowledged = 0"

# 4. IP Blacklist
$blockedIpCount = docker exec mariadb mysql -u root -pemrdbpass -N -e "SELECT COUNT(*) FROM ehr_core.ip_blacklist WHERE is_active = 1"

$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

# ============================================
# TAO NOI DUNG EMAIL
# ============================================
$body = @"
=== EHR ANCHOR HASH REPORT ===
Thoi gian: $timestamp

------------------------------------------------------------
PATIENT DATA (Phat hien sua/xoa ho so)
------------------------------------------------------------
So benh nhan: $patientCount
Patient Hash: $patientHash

Neu hash nay KHAC voi lan truoc -> DATA TAMPERING!

------------------------------------------------------------
ACCESS LOGS (Phat hien xoa dau vet)
------------------------------------------------------------
Tong so dong: $logCount
Dong log cu nhat: $oldestLog

Neu so dong GIAM hoac dong cu nhat thay doi -> LOG BI XOA!

------------------------------------------------------------
SECURITY STATUS
------------------------------------------------------------
General Log: $(if($generalLogStatus -eq '1'){'ON'}else{'OFF - WARNING!'})
Alerts chua xu ly: $alertCount
IP bi block: $blockedIpCount

------------------------------------------------------------
HUONG DAN
------------------------------------------------------------
1. Luu email nay de so sanh voi lan sau
2. Neu Patient Hash thay doi -> Kiem tra ai sua ho so
3. Neu so dong log giam -> Kiem tra ai xoa log
4. Neu General Log = OFF -> Kiem tra SIEM Dashboard

SIEM Dashboard: http://localhost:3002
"@

# ============================================
# GUI EMAIL
# ============================================
$securePass = ConvertTo-SecureString $SmtpPass -AsPlainText -Force
$credential = New-Object System.Management.Automation.PSCredential($SmtpUser, $securePass)

try {
    Send-MailMessage -To $AdminEmail `
        -From $SmtpUser `
        -Subject "[EHR Anchor] $timestamp | Patients: $patientCount | Logs: $logCount" `
        -Body $body `
        -SmtpServer $SmtpServer `
        -Port $SmtpPort `
        -UseSsl `
        -Credential $credential
    
    Write-Host "Email sent successfully to $AdminEmail!"
}
catch {
    Write-Host "Error sending email: $_"
}

# Log locally
Add-Content -Path "G:\DoAnVV\sunflower2_full\scripts\anchor_hash.log" -Value $body
Add-Content -Path "G:\DoAnVV\sunflower2_full\scripts\anchor_hash.log" -Value "---"
