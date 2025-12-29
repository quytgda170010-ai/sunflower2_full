package helpers

# ============================================
# PATH PARSING - Phân tích đường dẫn
# ============================================
# Tách đường dẫn thành các phần
# Ví dụ: /fhir/Patient/P001 -> ["fhir", "Patient", "P001"]
parts := split(trim_prefix(input.path, "/"), "/")

# Kiểm tra xem path có phải là FHIR resource không
# Định dạng: /fhir/<Resource>[/<id>...]
is_fhir_resource if {
  count(parts) >= 2
  parts[0] == "fhir"
  parts[1] != ""
}

# Lấy tên resource từ path
# Ví dụ: /fhir/Patient/P001 -> "Patient"
resource := parts[1] if { is_fhir_resource }

# Lấy ID resource từ path
# Ví dụ: /fhir/Patient/P001 -> "P001"
resource_id := parts[2] if {
  is_fhir_resource
  count(parts) >= 3
}

# Kiểm tra xem resource có ID không
has_id if { resource_id != "" }

# ============================================
# VALID RESOURCES - Danh sách resource hợp lệ
# ============================================
valid_resources := {
  "Patient", "Observation", "Encounter", "Condition",
  "Coverage", "Claim", "Practitioner", "Procedure", "MedicationRequest"
}

# ============================================
# DATA SENSITIVITY CLASSIFICATION - Phân loại độ nhạy cảm dữ liệu
# ============================================

# Kiểm tra xem path có phải là dữ liệu nhạy cảm cao không
# Dữ liệu nhạy cảm cao: Tâm thần, HIV, Di truyền, Ung thư...
# Những dữ liệu này cần bảo vệ đặc biệt
is_data_type(path, data_type) if {
  data_type == "HIGHLY_SENSITIVE"
  # Danh sách resource FHIR nhạy cảm cao
  highly_sensitive_resources := {
    "Condition",        # Có thể chứa chẩn đoán tâm thần, HIV, ung thư
    "Observation",      # Có thể chứa kết quả xét nghiệm HIV, di truyền
    "DiagnosticReport", # Báo cáo chẩn đoán chi tiết
    "Procedure"         # Thủ thuật liên quan đến bệnh nhạy cảm
  }
  parts := split(trim_prefix(path, "/"), "/")
  count(parts) >= 2
  parts[0] == "fhir"
  highly_sensitive_resources[parts[1]]
}

# ============================================
# CLINICAL DATA CLASSIFICATION - Phân loại dữ liệu lâm sàng
# ============================================

# Kiểm tra xem path có phải là dữ liệu lâm sàng không
# Dữ liệu lâm sàng: Chẩn đoán, điều trị, xét nghiệm, thuốc...
# Admin CNTT không được truy cập những dữ liệu này
is_clinical_path(path) if {
  clinical_resources := {
    "Patient",              # Thông tin bệnh nhân
    "Observation",          # Kết quả xét nghiệm, đo lường
    "Encounter",            # Lịch sử khám bệnh
    "Condition",            # Chẩn đoán bệnh
    "Procedure",            # Thủ thuật y tế
    "MedicationRequest",    # Đơn thuốc
    "DiagnosticReport",     # Báo cáo chẩn đoán
    "AllergyIntolerance",   # Dị ứng
    "Immunization",         # Tiêm chủng
    "CarePlan"              # Kế hoạch chăm sóc
  }
  parts := split(trim_prefix(path, "/"), "/")
  count(parts) >= 2
  parts[0] == "fhir"
  clinical_resources[parts[1]]
}

# ============================================
# SPECIALIST DOCTOR AUTHORIZATION - Phân quyền bác sĩ chuyên khoa
# ============================================

# Kiểm tra xem user có phải là bác sĩ chuyên khoa được phép xem dữ liệu nhạy cảm không
# Bác sĩ chuyên khoa được phép xem dữ liệu nhạy cảm cao trong chuyên môn của mình
is_specialist_doc(user) if {
  # Kiểm tra user có role là doctor
  user.roles[_] == "doctor"
  # Danh sách chuyên khoa được phép xem dữ liệu nhạy cảm
  allowed_specialties := {
    "psychiatry",           # Tâm thần - được xem dữ liệu tâm thần
    "infectious_disease",   # Bệnh truyền nhiễm - được xem dữ liệu HIV
    "genetics",             # Di truyền - được xem dữ liệu di truyền
    "oncology"              # Ung thư - được xem dữ liệu ung thư
  }
  allowed_specialties[user.specialty]
}

# ============================================
# QUERY TYPE CLASSIFICATION - Phân loại loại truy vấn
# ============================================

# Kiểm tra xem có phải là truy vấn hàng loạt (collection GET) không
# Ví dụ: GET /fhir/Patient (không có ID cụ thể)
# Truy vấn hàng loạt có thể trả về nhiều bệnh nhân, cần kiểm soát chặt chẽ
is_collection_get(path) if {
  parts := split(trim_prefix(path, "/"), "/")
  count(parts) == 2  # Chỉ có /fhir/Resource, không có ID
  parts[0] == "fhir"
  parts[1] != ""
}

# ============================================
# SYSTEM PATH CLASSIFICATION - Phân loại đường dẫn hệ thống
# ============================================

# Kiểm tra xem path có phải là system path không
# System paths: /health, /metrics, /config, /admin/... (không phải clinical data)
# Admin CNTT được phép truy cập những đường dẫn này để bảo trì hệ thống
is_system_path(path) if {
  system_paths := {
    "health",   # Kiểm tra sức khỏe hệ thống
    "metrics",  # Thống kê hiệu suất
    "config",   # Cấu hình hệ thống
    "admin",    # Quản trị hệ thống
    "system",   # Thông tin hệ thống
    "logs",     # Nhật ký hệ thống
    "audit"     # Kiểm toán hệ thống
  }
  parts := split(trim_prefix(path, "/"), "/")
  count(parts) >= 1
  system_paths[parts[0]]
}
