# EHR Sentinel - Hệ thống Giám sát Tuân thủ Bảo mật Hồ sơ Y tế Điện tử

## 📋 Tổng quan

Hệ thống giám sát tuân thủ bảo mật dành cho cơ sở y tế vừa và nhỏ, bao gồm:
- **EHR Core**: API quản lý bệnh nhân, xác thực, kiểm soát truy cập
- **SIEM Dashboard**: Bảng điều khiển giám sát bảo mật, cảnh báo, báo cáo tuân thủ
- **Keycloak**: Quản lý danh tính (IAM), SSO
- **OPA (Open Policy Agent)**: Kiểm tra chính sách truy cập (PDP)
- **Gateway**: Nginx với Lua để thực thi chính sách (PEP)

## 🖥️ Yêu cầu hệ thống

### Phần cứng tối thiểu
- CPU: 2 cores
- RAM: 4 GB
- Disk: 20 GB

### Phần mềm
- **Docker Desktop** (Windows/Mac) hoặc **Docker Engine + Docker Compose** (Linux)
- **Git** (để clone repository)

## 🚀 Hướng dẫn cài đặt

### Bước 1: Clone repository

```bash
git clone https://github.com/quytgda170010-ai/sunflower2_full.git
cd sunflower2_full
```

### Bước 2: Cấu hình môi trường

Copy file `.env.example` thành `.env` và chỉnh sửa các thông số:

```bash
cp .env.example .env
```

Các thông số quan trọng cần cấu hình:

```bash
# ===== KEYCLOAK =====
KC_VERSION=23.0.0
KC_ADMIN=admin
KC_ADMIN_PASS=123456789          # Thay đổi mật khẩu admin

# ===== POSTGRESQL (for Keycloak) =====
PG_DB=keycloak
PG_USER=keycloak
PG_PASS=keycloak123              # Thay đổi mật khẩu database

# ===== MARIADB (for EHR) =====
MARIADB_ROOT_PASSWORD=emrdbpass  # Thay đổi mật khẩu root
MARIADB_DATABASE=ehr_core
MARIADB_USER=openemr
MARIADB_PASSWORD=Openemr!123     # Thay đổi mật khẩu user
```

### Bước 3: Khởi động hệ thống

**Trên Windows (PowerShell):**
```powershell
cd sunflower2_full
.\SETUP.ps1
```

**Trên Linux/Mac (Bash):**
```bash
cd sunflower2_full/ehr_migration_package
docker-compose up -d
```

Đợi khoảng **2-3 phút** để tất cả containers khởi động.

### Bước 4: Kiểm tra containers

```bash
docker-compose ps
```

Tất cả services nên ở trạng thái `Up`:

| Container          | Port  | Mô tả                     |
|--------------------|-------|---------------------------|
| pg-keycloak        | -     | PostgreSQL cho Keycloak   |
| keycloak           | 8080  | IAM Server                |
| mariadb            | 3306  | Database EHR              |
| opa                | 8181  | Policy Decision Point     |
| gateway            | 80    | Nginx + Lua (PEP)         |
| ehr-core           | 8000  | EHR API                   |
| siem-backend-v2    | 8003  | SIEM API                  |
| siem-frontend      | 3002  | SIEM Dashboard UI         |
| nginx-proxy        | 3000  | Reverse Proxy             |

---

## 📦 Import dữ liệu cũ vào hệ thống

### Import Database EHR Core (MariaDB)

Nếu bạn có file backup database EHR (`database_backup.sql`):

**Windows PowerShell:**
```powershell
Get-Content "database_backup.sql" | docker exec -i mariadb mysql -u root -pemrdbpass ehr_core
```

**Linux/Mac:**
```bash
docker exec -i mariadb mysql -u root -pemrdbpass ehr_core < database_backup.sql
```

### Import Database Keycloak (PostgreSQL)

Nếu bạn có file backup Keycloak (`keycloak_backup.sql`):

**Windows PowerShell:**
```powershell
Get-Content "keycloak_backup.sql" | docker exec -i pg-keycloak psql -U keycloak keycloak
```

**Linux/Mac:**
```bash
docker exec -i pg-keycloak psql -U keycloak keycloak < keycloak_backup.sql
```

Sau khi import Keycloak, **khởi động lại** để áp dụng:
```bash
docker restart keycloak
```

### Import SIEM Rules (Compliance Rules)

Nếu bạn có file rules (`backups/siem_rules_backup.sql`):

```bash
docker exec -i mariadb mysql -u root -pemrdbpass ehr_core < backups/siem_rules_backup.sql
```

### Import Access Logs cũ

Nếu bạn có các file backup access logs trong thư mục `backups/access_logs/`:

```bash
# Import từng file
docker exec -i mariadb mysql -u root -pemrdbpass ehr_core < backups/access_logs/access_logs_YYYYMMDD.sql
```

---

## 🔐 Truy cập hệ thống

Sau khi cài đặt thành công, truy cập:

| Ứng dụng           | URL                          | Tài khoản                  |
|--------------------|------------------------------|----------------------------|
| **SIEM Dashboard** | http://localhost:3000/siem/  | Đăng nhập SSO qua Keycloak |
| **Keycloak Admin** | http://localhost:8080        | admin / 123456789          |
| **EHR Gateway**    | http://localhost:3000/gateway| Via Keycloak SSO           |

### Tài khoản mặc định

| Người dùng     | Username     | Password     | Vai trò          |
|----------------|--------------|--------------|------------------|
| Admin          | admin        | admin        | Administrator    |
| Bác sĩ         | dr.nguyen    | test123      | Physician        |
| Y tá           | nurse.tran   | test123      | Nurse            |
| IT Admin       | it.admin     | test123      | IT Support       |

---

## 🛠️ Các lệnh hữu ích

### Khởi động/Dừng hệ thống

```bash
# Khởi động tất cả services
docker-compose up -d

# Dừng tất cả services
docker-compose down

# Xem logs của service cụ thể
docker logs siem-backend-v2 --tail 100
docker logs siem-frontend --tail 50

# Restart một service
docker restart siem-frontend
```

### Backup dữ liệu

**Backup EHR Database:**
```bash
docker exec mariadb mysqldump -u root -pemrdbpass ehr_core > backup_ehr_$(date +%Y%m%d).sql
```

**Backup Keycloak Database:**
```bash
docker exec pg-keycloak pg_dump -U keycloak keycloak > backup_keycloak_$(date +%Y%m%d).sql
```

### Rebuild Frontend sau khi sửa code

```bash
cd ehr_migration_package
docker-compose build --no-cache siem-frontend
docker-compose up -d siem-frontend
```

---

## 🌐 Deploy lên Server (Production)

### 1. Cập nhật IP/Domain trong docker-compose.yml

Thay đổi `103.82.39.79` thành IP hoặc domain của server:

```yaml
REACT_APP_API_URL: http://YOUR_SERVER_IP:3000
REACT_APP_KEYCLOAK_URL: http://YOUR_SERVER_IP:8080
```

### 2. Build và chạy trên server

```bash
# SSH vào server
ssh root@YOUR_SERVER_IP

# Clone repo
git clone https://github.com/quytgda170010-ai/sunflower2_full.git
cd sunflower2_full/ehr_migration_package

# Build tất cả images
docker-compose build

# Chạy
docker-compose up -d

# Import data (nếu có)
docker exec -i mariadb mysql -u root -pemrdbpass ehr_core < ../database_backup.sql
docker exec -i pg-keycloak psql -U keycloak keycloak < ../keycloak_backup.sql
docker restart keycloak
```

---

## 📁 Cấu trúc thư mục

```
sunflower2_full/
├── ehr_migration_package/           # Main deployment package
│   ├── docker-compose.yml           # Docker Compose config
│   ├── Stack_C/                     # SIEM Dashboard
│   │   ├── frontend/                # React Frontend
│   │   └── backend/                 # FastAPI Backend
│   ├── ehr-gw/                      # Gateway (Nginx + Lua + OPA)
│   │   ├── gateway/                 # Nginx config
│   │   └── opa/policies/            # Rego policies
│   ├── ehr-on-windows/              # EHR Core
│   │   ├── ehr-core/                # FastAPI EHR API
│   │   └── mariadb/                 # MariaDB config
│   ├── linh/                        # Keycloak & Nginx Proxy config
│   └── watchdog/                    # MySQL Watchdog service
├── backups/                         # Database backups
│   ├── keycloak_sql.sql
│   ├── rules_clean.sql
│   └── siem_rules_backup.sql
├── database_backup.sql              # EHR Core database backup
├── keycloak_backup.sql              # Keycloak database backup
├── SETUP.ps1                        # Windows auto-setup script
└── .env.example                     # Environment template
```

---

## ❓ Xử lý sự cố

### Container không khởi động được

```bash
# Xem logs chi tiết
docker logs <container_name>

# Kiểm tra port conflicts
docker ps -a
netstat -tuln | grep <port>
```

### Keycloak bị lỗi sau import

```bash
# Restart Keycloak
docker restart keycloak

# Đợi 30 giây và kiểm tra
docker logs keycloak --tail 50
```

### SIEM Dashboard hiển thị 502 Bad Gateway

```bash
# Kiểm tra siem-frontend container
docker-compose ps siem-frontend

# Rebuild nếu cần
docker-compose build --no-cache siem-frontend
docker-compose up -d siem-frontend
```

### Database connection refused

```bash
# Kiểm tra MariaDB
docker logs mariadb --tail 50

# Restart MariaDB
docker restart mariadb
```

---

## 📞 Liên hệ hỗ trợ

- **Email**: tran.giaquy301003@gmail.com
- **GitHub Issues**: https://github.com/quytgda170010-ai/sunflower2_full/issues

---

## 📄 License

MIT License - Free for educational and small healthcare facilities use.
