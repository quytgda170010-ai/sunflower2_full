package http.authz

import data.helpers

# ============================================
# DEFAULT VALUES - Mặc định từ chối tất cả
# ============================================
default allow = false
default reason = "ok"
default obligations = []

# Lấy danh sách roles của user từ request
# Ensure roles is always an array (fallback to empty array if not provided)
roles := input.user.roles if input.user.roles
roles := [] if not input.user.roles

# ============================================
# ROLE CHECKS - 11 VAI TRÒ (CÓ PHÂN CẤP QUẢN LÝ)
# ============================================
is_receptionist if { roles[_] == "receptionist" }         # Lễ tân - Đón tiếp và phân luồng
is_head_reception if { roles[_] == "head_reception" }     # 👑 Trưởng lễ tân - Quản lý đội lễ tân
is_doctor if { roles[_] == "doctor" }                     # Bác sĩ - Quyết định y tế
is_doctor if {
  startswith(roles[_], "doctor_")
}
is_nurse if { roles[_] == "nurse" }                       # Điều dưỡng - Thực hiện y lệnh
is_head_nurse if { roles[_] == "head_nurse" }             # 👑 Điều dưỡng trưởng - Quản lý chuyên môn
is_pharmacist if { roles[_] == "pharmacist" }             # Dược sĩ - Quản lý thuốc
is_lab_technician if { roles[_] == "lab_technician" }     # Kỹ thuật viên XN
is_accountant if { roles[_] == "accountant" }             # Kế toán - Kiêm thu ngân
is_admin_hospital if { roles[_] == "admin_hospital" }     # Giám đốc - Kiểm toán
is_admin if { roles[_] == "admin" }                       # Admin CNTT - Quản lý hệ thống
is_patient if { roles[_] == "patient" }                   # Bệnh nhân - Xem hồ sơ của mình

# ============================================
# ACCESS CHECKS - Kiểm tra quyền truy cập
# ============================================
is_own_record if {
  is_patient
  input.user.id == input.patient.id
}

is_attending if {
  input.patient.care_team_ids[_] == input.user.id
}

# ============================================
# PURPOSE CHECKS - Kiểm tra mục đích truy cập
# ============================================
allowed_purposes := {"treatment","care","emergency","audit","billing","research","patient_access","system_maintenance","administrative","dashboard","queue_management"}
purpose_ok if { allowed_purposes[input.purpose] }

receptionist_purpose_ok if {
  is_receptionist
  # Receptionist can access administrative, dashboard, queue_management, billing and treatment purposes
  receptionist_allowed_purposes := {"administrative", "dashboard", "queue_management", "billing", "treatment"}
  receptionist_allowed_purposes[input.purpose]
}

head_reception_purpose_ok if {
  is_head_reception
  head_reception_allowed_purposes := {"administrative", "audit"}
  head_reception_allowed_purposes[input.purpose]
}

doctor_purpose_ok if {
  is_doctor
  doctor_allowed_purposes := {"treatment", "care", "emergency", "queue_management"}
  doctor_allowed_purposes[input.purpose]
}

nurse_purpose_ok if {
  is_nurse
  nurse_allowed_purposes := {"treatment", "care", "emergency", "queue_management"}
  nurse_allowed_purposes[input.purpose]
}

head_nurse_purpose_ok if {
  is_head_nurse
  head_nurse_allowed_purposes := {"treatment", "care", "emergency", "audit"}
  head_nurse_allowed_purposes[input.purpose]
}

pharmacist_purpose_ok if {
  is_pharmacist
  input.purpose == "treatment"
}

lab_technician_purpose_ok if {
  is_lab_technician
  lab_technician_allowed_purposes := {"treatment", "queue_management"}
  lab_technician_allowed_purposes[input.purpose]
}

accountant_purpose_ok if {
  is_accountant
  input.purpose == "billing"
}

admin_hospital_purpose_ok if {
  is_admin_hospital
  input.purpose == "audit"
}

admin_hospital_purpose_ok if {
  is_admin_hospital
  input.purpose == "system_maintenance"
}

admin_purpose_ok if {
  is_admin
  input.purpose == "system_maintenance"
}

patient_purpose_ok if {
  is_patient
  input.purpose == "patient_access"
}

# ============================================
# RESEARCH & EMERGENCY CHECKS
# ============================================
research_ok if { input.purpose != "research" }
research_ok if {
  input.purpose == "research"
  input.patient.consent_ok == true
  input.request.director_approval == true
}

is_break_the_glass if {
  input.purpose == "emergency"
  input.request.emergency_reason != ""
}

# ============================================
# PATH PARSING HELPERS
# ============================================
path_array := split(trim(input.path, "/"), "/")

is_patients_list if {
  count(path_array) == 1
  path_array[0] == "patients"
}

is_specific_patient if {
  count(path_array) >= 2
  path_array[0] == "patients"
  path_array[1] != ""
}

is_patient_visits if {
  count(path_array) >= 3
  path_array[0] == "patients"
  path_array[2] == "visits"
}

is_patient_diagnoses if {
  count(path_array) >= 3
  path_array[0] == "patients"
  path_array[2] == "diagnoses"
}

is_patient_prescriptions if {
  count(path_array) >= 3
  path_array[0] == "patients"
  path_array[2] == "prescriptions"
}

is_patient_lab_orders if {
  count(path_array) >= 3
  path_array[0] == "patients"
  path_array[2] == "lab_orders"
}

is_patient_vitals if {
  count(path_array) >= 3
  path_array[0] == "patients"
  path_array[2] == "vitals"
}

is_patient_care_notes if {
  count(path_array) >= 3
  path_array[0] == "patients"
  path_array[2] == "care_notes"
}

is_prescriptions_list if {
  count(path_array) == 1
  path_array[0] == "prescriptions"
}

is_lab_orders_list if {
  count(path_array) == 1
  path_array[0] == "lab_orders"
}

# ============================================
# PHARMACY PATHS - Đường dẫn cho dược sĩ
# ============================================
is_medication_inventory if {
  count(path_array) >= 1
  path_array[0] == "pharmacy"
  path_array[1] == "inventory"
}

is_medication_stock if {
  count(path_array) >= 2
  path_array[0] == "pharmacy"
  path_array[1] == "stock"
}

is_medication_expiry if {
  count(path_array) >= 2
  path_array[0] == "pharmacy"
  path_array[1] == "expiry"
}

is_pharmacy_consultations if {
  count(path_array) >= 2
  path_array[0] == "pharmacy"
  path_array[1] == "consultations"
}

is_drug_interactions if {
  count(path_array) >= 2
  path_array[0] == "pharmacy"
  path_array[1] == "drug_interactions"
}

is_medication_history if {
  count(path_array) >= 3
  path_array[0] == "patients"
  path_array[2] == "medication_history"
}

is_adverse_drug_reactions if {
  count(path_array) >= 2
  path_array[0] == "pharmacy"
  path_array[1] == "adverse_reactions"
}

is_pharmacy_quality_control if {
  count(path_array) >= 2
  path_array[0] == "pharmacy"
  path_array[1] == "quality_control"
}

is_pharmacy_formulary if {
  count(path_array) >= 2
  path_array[0] == "pharmacy"
  path_array[1] == "formulary"
}

is_invoices if {
  startswith(input.path, "/invoices")
}

is_appointments if {
  startswith(input.path, "/appointments")
}

is_login_log if {
  startswith(input.path, "/admin/login/log")
}

is_login_log if {
  startswith(input.path, "/api/user/login")
}

# ============================================
# PERMIT RULES - 11 VAI TRÒ (CÓ PHÂN CẤP)
# ============================================

# Allow login/log endpoint for all authenticated users (logging only, no sensitive data access)
# This endpoint is used to log login events, so we allow it if user_id is present
# This rule must be checked first and bypass all deny rules
base_allow if {
  is_login_log
  input.method == "POST"
  input.user.id  # User must have an ID (authenticated) - in OPA, this checks for truthy value
}

# ========== 1. LỄ TÂN (receptionist) ==========
base_allow if {
  is_receptionist
  receptionist_purpose_ok
  is_patients_list
  input.method == "POST"
}

base_allow if {
  is_receptionist
  receptionist_purpose_ok
  is_patients_list
  input.method == "GET"
}

base_allow if {
  is_receptionist
  receptionist_purpose_ok
  is_specific_patient
  input.method == "GET"
}

base_allow if {
  is_receptionist
  receptionist_purpose_ok
  is_appointments
}

base_allow if {
  is_receptionist
  receptionist_purpose_ok
  is_invoices
}

# Receptionist: Admin API endpoints for queue management, appointments, billing
base_allow if {
  is_receptionist
  receptionist_purpose_ok
  startswith(input.path, "/admin/appointments")
  input.method == "GET"
}

# Receptionist: POST appointments (add patient to queue)
base_allow if {
  is_receptionist
  receptionist_purpose_ok
  startswith(input.path, "/admin/appointments")
  input.method == "POST"
}

# Allow departments and reason-tags for all authenticated users (master data)
base_allow if {
  input.user.id  # User must be authenticated
  startswith(input.path, "/admin/departments")
  input.method == "GET"
}

base_allow if {
  input.user.id  # User must be authenticated
  startswith(input.path, "/admin/reason-tags")
  input.method == "GET"
}

base_allow if {
  input.user.id  # User must be authenticated
  startswith(input.path, "/admin/doctors")
  input.method == "GET"
}


base_allow if {
  is_receptionist
  receptionist_purpose_ok
  startswith(input.path, "/admin/bills")
}

base_allow if {
  is_receptionist
  receptionist_purpose_ok
  startswith(input.path, "/admin/patients")
  input.method == "GET"
}

base_allow if {
  is_receptionist
  receptionist_purpose_ok
  startswith(input.path, "/admin/patients")
  input.method == "POST"
}

# Receptionist có quyền sửa thông tin bệnh nhân (PUT)
base_allow if {
  is_receptionist
  receptionist_purpose_ok
  startswith(input.path, "/admin/patients")
  input.method == "PUT"
}

#
# Receptionist KHÔNG có quyền xóa bệnh nhân (DELETE) - không cần thêm rule, mặc định sẽ deny

base_allow if {
  is_receptionist
  receptionist_purpose_ok
  startswith(input.path, "/admin/medications")
  input.method == "GET"
}

base_allow if {
  is_receptionist
  receptionist_purpose_ok
  startswith(input.path, "/admin/dashboard")
  input.method == "GET"
}

# Receptionist: Access to services catalog for billing
base_allow if {
  is_receptionist
  receptionist_purpose_ok
  startswith(input.path, "/admin/services")
  input.method == "GET"
}

# Receptionist: Access to lab-tests catalog for billing
base_allow if {
  is_receptionist
  receptionist_purpose_ok
  startswith(input.path, "/admin/lab-tests")
  input.method == "GET"
}

# Receptionist: Access to imaging catalog for billing
base_allow if {
  is_receptionist
  receptionist_purpose_ok
  startswith(input.path, "/admin/imaging")
  input.method == "GET"
}

# Receptionist: Access to menus for UI
base_allow if {
  is_receptionist
  receptionist_purpose_ok
  startswith(input.path, "/admin/menus")
  input.method == "GET"
}

# Receptionist: Access to logging endpoint
base_allow if {
  is_receptionist
  startswith(input.path, "/admin/logging")
  input.method == "POST"
}

# ========== 2. TRƯỞNG LỄ TÂN (head_reception) 👑 ==========
# Kế thừa tất cả quyền của receptionist + quyền quản lý
base_allow if {
  is_head_reception
  head_reception_purpose_ok
  is_patients_list
}

base_allow if {
  is_head_reception
  head_reception_purpose_ok
  is_specific_patient
}

base_allow if {
  is_head_reception
  head_reception_purpose_ok
  is_appointments
}

base_allow if {
  is_head_reception
  head_reception_purpose_ok
  is_invoices
}

# Quyền đặc biệt: Xử lý khiếu nại
base_allow if {
  is_head_reception
  head_reception_purpose_ok
  startswith(input.path, "/complaints")
}

# Quyền đặc biệt: Duyệt hoàn tiền
base_allow if {
  is_head_reception
  head_reception_purpose_ok
  startswith(input.path, "/refunds")
}

# Quyền đặc biệt: Quản lý đội nhóm
base_allow if {
  is_head_reception
  head_reception_purpose_ok
  startswith(input.path, "/team-management")
}

# Head Reception: Admin API endpoints (kế thừa từ receptionist + quyền quản lý)
base_allow if {
  is_head_reception
  head_reception_purpose_ok
  startswith(input.path, "/admin/appointments")
}

base_allow if {
  is_head_reception
  head_reception_purpose_ok
  startswith(input.path, "/admin/departments")
}

base_allow if {
  is_head_reception
  head_reception_purpose_ok
  startswith(input.path, "/admin/reason-tags")
}

base_allow if {
  is_head_reception
  head_reception_purpose_ok
  startswith(input.path, "/admin/bills")
}

base_allow if {
  is_head_reception
  head_reception_purpose_ok
  startswith(input.path, "/admin/patients")
}

base_allow if {
  is_head_reception
  head_reception_purpose_ok
  startswith(input.path, "/admin/medications")
}

base_allow if {
  is_head_reception
  head_reception_purpose_ok
  startswith(input.path, "/admin/dashboard")
}

# ========== 3. BÁC SĨ (doctor) ==========
# ⚠️ BÁC SĨ KHÔNG ĐƯỢC XEM DANH SÁCH BỆNH NHÂN
base_allow if {
  is_doctor
  doctor_purpose_ok
  is_specific_patient
  input.method == "GET"
}

base_allow if {
  is_doctor
  doctor_purpose_ok
  is_patient_visits
  input.method == "GET"
}

base_allow if {
  is_doctor
  doctor_purpose_ok
  is_patient_diagnoses
  input.method == "POST"
}

base_allow if {
  is_doctor
  doctor_purpose_ok
  is_patient_diagnoses
  input.method == "PUT"
}

base_allow if {
  is_doctor
  doctor_purpose_ok
  is_patient_prescriptions
  input.method == "POST"
}

base_allow if {
  is_doctor
  doctor_purpose_ok
  is_patient_prescriptions
  input.method == "PUT"
}

base_allow if {
  is_doctor
  doctor_purpose_ok
  startswith(input.path, "/admin/departments")
  input.method == "GET"
}

base_allow if {
  is_doctor
  doctor_purpose_ok
  startswith(input.path, "/admin/medical-records")
  input.method == "GET"
}

base_allow if {
  is_doctor
  doctor_purpose_ok
  startswith(input.path, "/admin/medical-records")
  input.method == "POST"
}

base_allow if {
  is_doctor
  doctor_purpose_ok
  startswith(input.path, "/admin/medical-records")
  input.method == "PUT"
}

base_allow if {
  is_doctor
  doctor_purpose_ok
  is_patient_lab_orders
  input.method == "POST"
}

base_allow if {
  is_doctor
  doctor_purpose_ok
  is_patient_lab_orders
  input.method == "PUT"
}

# Quyền đặc biệt: Truy cập Internal Medicine doctor workflow queues
# GET: danh sách doctor queue hoặc chi tiết
base_allow if {
  is_doctor
  doctor_purpose_ok
  input.method == "GET"
  startswith(input.path, "/admin/queues/internal-med")
  endswith(input.path, "/doctor")
}

# GET: doctor-first queue (khám lần 1)
base_allow if {
  is_doctor
  doctor_purpose_ok
  input.method == "GET"
  startswith(input.path, "/admin/queues/internal-med")
  endswith(input.path, "/doctor-first")
}

# GET: doctor-final queue (khám lần cuối)
base_allow if {
  is_doctor
  doctor_purpose_ok
  input.method == "GET"
  startswith(input.path, "/admin/queues/internal-med")
  endswith(input.path, "/doctor-final")
}

# PUT: cập nhật doctor review (chỉ cho endpoint chi tiết)
base_allow if {
  is_doctor
  doctor_purpose_ok
  input.method == "PUT"
  startswith(input.path, "/admin/queues/internal-med")
  endswith(input.path, "/doctor")
  input.path != "/admin/queues/internal-med/doctor"
}

# PUT: cập nhật doctor-first review
base_allow if {
  is_doctor
  doctor_purpose_ok
  input.method == "PUT"
  startswith(input.path, "/admin/queues/internal-med")
  endswith(input.path, "/doctor-first")
}

# PUT: cập nhật doctor-final review
base_allow if {
  is_doctor
  doctor_purpose_ok
  input.method == "PUT"
  startswith(input.path, "/admin/queues/internal-med")
  endswith(input.path, "/doctor-final")
}

# Quyền truy cập appointments để xem danh sách bệnh nhân chờ (cho Patient Lookup)
base_allow if {
  is_doctor
  doctor_purpose_ok
  input.method == "GET"
  startswith(input.path, "/admin/appointments")
  # Chỉ cho phép với query params status=waiting,in_progress,waiting_doctor_review
  # OPA không thể kiểm tra query params một cách chính xác, nên cho phép tất cả GET /admin/appointments
}

# Quyền truy cập dashboard stats - cho tất cả roles cần thiết
base_allow if {
  is_doctor
  doctor_purpose_ok
  input.method == "GET"
  input.path == "/admin/dashboard/stats"
}

base_allow if {
  is_nurse
  nurse_purpose_ok
  input.method == "GET"
  input.path == "/admin/dashboard/stats"
}

base_allow if {
  is_head_nurse
  head_nurse_purpose_ok
  input.method == "GET"
  input.path == "/admin/dashboard/stats"
}

base_allow if {
  is_pharmacist
  pharmacist_purpose_ok
  input.method == "GET"
  input.path == "/admin/dashboard/stats"
}

base_allow if {
  is_accountant
  accountant_purpose_ok
  input.method == "GET"
  input.path == "/admin/dashboard/stats"
}

base_allow if {
  is_lab_technician
  lab_technician_purpose_ok
  input.method == "GET"
  input.path == "/admin/dashboard/stats"
}

# Quyền truy cập danh sách patients với status cụ thể (cho Patient Lookup)
# Chỉ cho phép với query params status=waiting,in_progress,waiting_doctor_review
base_allow if {
  is_doctor
  doctor_purpose_ok
  input.method == "GET"
  input.path == "/admin/patients"
  # OPA không thể kiểm tra query params một cách chính xác, nên cho phép tất cả GET /admin/patients
  # Backend sẽ filter dữ liệu dựa trên query params
}

# Quyền truy cập chi tiết patient (đã có trong is_specific_patient, nhưng đảm bảo rõ ràng)
base_allow if {
  is_doctor
  doctor_purpose_ok
  input.method == "GET"
  startswith(input.path, "/admin/patients/")
  # Không phải là /admin/patients (danh sách), mà là /admin/patients/{id} (chi tiết)
}

# Quyền truy cập patient endpoints: /patients/{id}/diagnoses, /patients/{id}/prescriptions, /patients/{id}/lab_orders
base_allow if {
  is_doctor
  doctor_purpose_ok
  input.method == "GET"
  startswith(input.path, "/patients/")
  # Cho phép tất cả GET requests đến /patients/{id}/* (diagnoses, prescriptions, lab_orders, etc.)
}

# Doctor có quyền truy cập health-check API
base_allow if {
  is_doctor
  doctor_purpose_ok
  startswith(input.path, "/api/health-check")
  input.method == "GET"
}

base_allow if {
  is_doctor
  doctor_purpose_ok
  startswith(input.path, "/api/health-check")
  input.method == "POST"
}

base_allow if {
  is_doctor
  doctor_purpose_ok
  startswith(input.path, "/api/health-check")
  input.method == "PUT"
}

# ========== 4. ĐIỀU DƯỠNG (nurse) ==========
base_allow if {
  is_nurse
  nurse_purpose_ok
  is_patients_list
  input.method == "GET"
}

base_allow if {
  is_nurse
  nurse_purpose_ok
  is_specific_patient
  input.method == "GET"
}

# Nurse có quyền truy cập admin patients endpoints
base_allow if {
  is_nurse
  nurse_purpose_ok
  startswith(input.path, "/admin/patients")
  input.method == "GET"
}

# Nurse có quyền truy cập appointments để xem lịch hẹn và hồ sơ bệnh án
base_allow if {
  is_nurse
  nurse_purpose_ok
  startswith(input.path, "/admin/appointments")
  input.method == "GET"
}

# Nurse có quyền cập nhật screening data cho bệnh nhân (PUT /admin/appointments/{id}/screening)
base_allow if {
  is_nurse
  nurse_purpose_ok
  startswith(input.path, "/admin/appointments")
  endswith(input.path, "/screening")
  input.method == "PUT"
}

base_allow if {
  is_nurse
  nurse_purpose_ok
  startswith(input.path, "/admin/patients")
  input.method == "POST"
}

base_allow if {
  is_nurse
  nurse_purpose_ok
  startswith(input.path, "/admin/patients")
  input.method == "PUT"
}

# Nurse có quyền truy cập admin departments để xem danh sách khoa
base_allow if {
  is_nurse
  nurse_purpose_ok
  startswith(input.path, "/admin/departments")
  input.method == "GET"
}

# Nurse có quyền truy cập admin reason-tags để xem danh sách lý do khám
base_allow if {
  is_nurse
  nurse_purpose_ok
  startswith(input.path, "/admin/reason-tags")
  input.method == "GET"
}

base_allow if {
  is_nurse
  nurse_purpose_ok
  is_patient_visits
  input.method == "GET"
}

base_allow if {
  is_nurse
  nurse_purpose_ok
  is_patient_diagnoses
  input.method == "GET"
}

base_allow if {
  is_nurse
  nurse_purpose_ok
  is_patient_prescriptions
  input.method == "GET"
}

base_allow if {
  is_nurse
  nurse_purpose_ok
  is_patient_vitals
  input.method == "POST"
}

base_allow if {
  is_nurse
  nurse_purpose_ok
  is_patient_vitals
  input.method == "PUT"
}

base_allow if {
  is_nurse
  nurse_purpose_ok
  is_patient_care_notes
  input.method == "POST"
}

base_allow if {
  is_nurse
  nurse_purpose_ok
  is_patient_care_notes
  input.method == "PUT"
}

# Quyền đặc biệt: Tạo test nhanh (đường huyết, que thử nước tiểu)
base_allow if {
  is_nurse
  nurse_purpose_ok
  startswith(input.path, "/quick-tests")
  input.method == "POST"
}

base_allow if {
  is_nurse
  nurse_purpose_ok
  startswith(input.path, "/quick-tests")
  input.method == "PUT"
}

# Quyền đặc biệt: Truy cập Internal Medicine workflow queues
# Cho phép tất cả các endpoint liên quan đến internal-med queues
base_allow if {
  is_nurse
  nurse_purpose_ok
  contains(input.path, "/admin/queues/internal-med")
  input.method == "GET"
}

base_allow if {
  is_nurse
  nurse_purpose_ok
  contains(input.path, "/admin/queues/internal-med")
  input.method == "PUT"
}

base_allow if {
  is_nurse
  nurse_purpose_ok
  contains(input.path, "/admin/queues/internal-med")
  input.method == "POST"
}

# Nurse có quyền truy cập medical records để ghi chép thông tin bệnh nhân
# GET: Xem hồ sơ bệnh án
base_allow if {
  is_nurse
  nurse_purpose_ok
  startswith(input.path, "/admin/medical-records")
  input.method == "GET"
}

# POST: Tạo mới hồ sơ bệnh án (ghi chép thông tin, triệu chứng, kết quả xét nghiệm)
base_allow if {
  is_nurse
  nurse_purpose_ok
  startswith(input.path, "/admin/medical-records")
  input.method == "POST"
}

# PUT: Cập nhật hồ sơ bệnh án (theo dõi triệu chứng, cập nhật thông tin bệnh sử, kết quả xét nghiệm)
# Lưu ý: Logic kiểm tra khoa sẽ được xử lý ở backend
base_allow if {
  is_nurse
  nurse_purpose_ok
  startswith(input.path, "/admin/medical-records")
  input.method == "PUT"
}

# Nurse KHÔNG có quyền DELETE medical records
# (Không cần thêm rule, mặc định sẽ deny)

# Nurse có quyền quản lý thuốc (prescriptions và medications)
# GET: Xem đơn thuốc và danh sách thuốc
base_allow if {
  is_nurse
  nurse_purpose_ok
  startswith(input.path, "/admin/prescriptions")
  input.method == "GET"
}

base_allow if {
  is_nurse
  nurse_purpose_ok
  startswith(input.path, "/admin/medications")
  input.method == "GET"
}

# POST: Tạo đơn thuốc mới (hỗ trợ kế hoạch chăm sóc)
base_allow if {
  is_nurse
  nurse_purpose_ok
  startswith(input.path, "/admin/prescriptions")
  input.method == "POST"
}

base_allow if {
  is_nurse
  nurse_purpose_ok
  startswith(input.path, "/admin/medications")
  input.method == "POST"
}

# PUT: Cập nhật đơn thuốc và thuốc (thực hiện y lệnh)
base_allow if {
  is_nurse
  nurse_purpose_ok
  startswith(input.path, "/admin/prescriptions")
  input.method == "PUT"
}

base_allow if {
  is_nurse
  nurse_purpose_ok
  startswith(input.path, "/admin/medications")
  input.method == "PUT"
}

# Nurse KHÔNG có quyền DELETE prescriptions và medications
# (Không cần thêm rule, mặc định sẽ deny)

# ========== 5. ĐIỀU DƯỠNG TRƯỞNG (head_nurse) 👑 ==========
# Kế thừa tất cả quyền của nurse + quyền quản lý
base_allow if {
  is_head_nurse
  head_nurse_purpose_ok
  is_patients_list
}

base_allow if {
  is_head_nurse
  head_nurse_purpose_ok
  is_specific_patient
}

base_allow if {
  is_head_nurse
  head_nurse_purpose_ok
  is_patient_vitals
}

base_allow if {
  is_head_nurse
  head_nurse_purpose_ok
  is_patient_care_notes
}

# Head Nurse kế thừa quyền Internal Medicine workflow từ nurse
base_allow if {
  is_head_nurse
  head_nurse_purpose_ok
  contains(input.path, "/admin/queues/internal-med")
  input.method == "GET"
}

base_allow if {
  is_head_nurse
  head_nurse_purpose_ok
  contains(input.path, "/admin/queues/internal-med")
  input.method == "PUT"
}

base_allow if {
  is_head_nurse
  head_nurse_purpose_ok
  contains(input.path, "/admin/queues/internal-med")
  input.method == "POST"
}

# Head Nurse có quyền truy cập appointments để giám sát
base_allow if {
  is_head_nurse
  head_nurse_purpose_ok
  startswith(input.path, "/admin/appointments")
  input.method == "GET"
}

# Head Nurse có quyền cập nhật screening data (kế thừa từ nurse)
base_allow if {
  is_head_nurse
  head_nurse_purpose_ok
  startswith(input.path, "/admin/appointments")
  endswith(input.path, "/screening")
  input.method == "PUT"
}

# Head Nurse có quyền truy cập patients để giám sát
base_allow if {
  is_head_nurse
  head_nurse_purpose_ok
  startswith(input.path, "/admin/patients")
  input.method == "GET"
}

base_allow if {
  is_head_nurse
  head_nurse_purpose_ok
  startswith(input.path, "/admin/patients")
  input.method == "PUT"
}

# Head Nurse có quyền truy cập departments và reason-tags
base_allow if {
  is_head_nurse
  head_nurse_purpose_ok
  startswith(input.path, "/admin/departments")
  input.method == "GET"
}

base_allow if {
  is_head_nurse
  head_nurse_purpose_ok
  startswith(input.path, "/admin/reason-tags")
  input.method == "GET"
}

# Quyền đặc biệt: Xem danh sách BN toàn viện (giám sát chéo)
base_allow if {
  is_head_nurse
  head_nurse_purpose_ok
  startswith(input.path, "/patients")
  input.method == "GET"
}

# Quyền đặc biệt: Duyệt lịch trực
base_allow if {
  is_head_nurse
  head_nurse_purpose_ok
  startswith(input.path, "/schedules")
}

# Quyền đặc biệt: Quản lý vật tư
base_allow if {
  is_head_nurse
  head_nurse_purpose_ok
  startswith(input.path, "/supplies")
}

# Quyền đặc biệt: Quản lý đội nhóm
base_allow if {
  is_head_nurse
  head_nurse_purpose_ok
  startswith(input.path, "/team-management")
}

# ========== 6. DƯỢC SĨ (pharmacist) ==========
# 4.1. QUẢN LÝ VÀ CUNG ỨNG THUỐC

# Xem danh sách đơn thuốc
base_allow if {
  is_pharmacist
  pharmacist_purpose_ok
  is_prescriptions_list
  input.method == "GET"
}

# Pharmacist có quyền truy cập admin prescriptions endpoints
base_allow if {
  is_pharmacist
  pharmacist_purpose_ok
  startswith(input.path, "/admin/prescriptions")
  input.method == "GET"
}

base_allow if {
  is_pharmacist
  pharmacist_purpose_ok
  startswith(input.path, "/admin/prescriptions")
  input.method == "PUT"
}

# Pharmacist có quyền truy cập admin medications endpoints
base_allow if {
  is_pharmacist
  pharmacist_purpose_ok
  startswith(input.path, "/admin/medications")
  input.method == "GET"
}

base_allow if {
  is_pharmacist
  pharmacist_purpose_ok
  startswith(input.path, "/admin/medications")
  input.method == "POST"
}

base_allow if {
  is_pharmacist
  pharmacist_purpose_ok
  startswith(input.path, "/admin/medications")
  input.method == "PUT"
}

# Xem chi tiết đơn thuốc
base_allow if {
  is_pharmacist
  pharmacist_purpose_ok
  is_patient_prescriptions
  input.method == "GET"
}

# Cập nhật trạng thái phát thuốc
base_allow if {
  is_pharmacist
  pharmacist_purpose_ok
  is_patient_prescriptions
  input.method == "PUT"
}

# Ghi nhận đã phát thuốc
base_allow if {
  is_pharmacist
  pharmacist_purpose_ok
  startswith(input.path, "/prescriptions/")
  contains(input.path, "/dispense")
  input.method == "POST"
}

# Xem danh sách thuốc trong kho
base_allow if {
  is_pharmacist
  pharmacist_purpose_ok
  is_medication_inventory
  input.method == "GET"
}

# Xem tồn kho theo thuốc
base_allow if {
  is_pharmacist
  pharmacist_purpose_ok
  is_medication_stock
  input.method == "GET"
}

# Cập nhật số lượng tồn kho
base_allow if {
  is_pharmacist
  pharmacist_purpose_ok
  is_medication_stock
  input.method == "PUT"
}

# Ghi nhận nhập kho thuốc mới
base_allow if {
  is_pharmacist
  pharmacist_purpose_ok
  is_medication_inventory
  input.method == "POST"
}

# Ghi nhận xuất kho (phân phối đến khoa)
base_allow if {
  is_pharmacist
  pharmacist_purpose_ok
  startswith(input.path, "/pharmacy/inventory/")
  contains(input.path, "/dispense")
  input.method == "POST"
}

# Theo dõi hạn sử dụng thuốc
base_allow if {
  is_pharmacist
  pharmacist_purpose_ok
  is_medication_expiry
  input.method == "GET"
}

# 4.2. THAM GIA VÀO QUÁ TRÌNH ĐIỀU TRỊ

# Ghi nhận tư vấn cho bác sĩ (lựa chọn thuốc)
base_allow if {
  is_pharmacist
  pharmacist_purpose_ok
  is_pharmacy_consultations
  input.method == "POST"
}

# Xem tư vấn đã ghi nhận
base_allow if {
  is_pharmacist
  pharmacist_purpose_ok
  is_pharmacy_consultations
  input.method == "GET"
}

# Cảnh báo tương tác thuốc
base_allow if {
  is_pharmacist
  pharmacist_purpose_ok
  is_drug_interactions
  input.method == "GET"
}

# Ghi nhận kiểm tra tương tác thuốc
base_allow if {
  is_pharmacist
  pharmacist_purpose_ok
  is_drug_interactions
  input.method == "POST"
}

# Xem lịch sử sử dụng thuốc của bệnh nhân
base_allow if {
  is_pharmacist
  pharmacist_purpose_ok
  is_medication_history
  input.method == "GET"
}

# Ghi nhận phản ứng có hại của thuốc
base_allow if {
  is_pharmacist
  pharmacist_purpose_ok
  is_adverse_drug_reactions
  input.method == "POST"
}

# Xem phản ứng có hại của thuốc
base_allow if {
  is_pharmacist
  pharmacist_purpose_ok
  is_adverse_drug_reactions
  input.method == "GET"
}

# Cập nhật phản ứng có hại của thuốc
base_allow if {
  is_pharmacist
  pharmacist_purpose_ok
  is_adverse_drug_reactions
  input.method == "PUT"
}

# 4.3. ĐẢMBẢO AN TOÀN VÀ CHẤT LƯỢNG THUỐC

# Xem thông tin chất lượng thuốc
base_allow if {
  is_pharmacist
  pharmacist_purpose_ok
  is_pharmacy_quality_control
  input.method == "GET"
}

# Ghi nhận kiểm tra chất lượng thuốc
base_allow if {
  is_pharmacist
  pharmacist_purpose_ok
  is_pharmacy_quality_control
  input.method == "POST"
}

# 4.4. THAM GIA VÀO HOẠT ĐỘNG CỦA BỆNH VIỆN

# Xem danh mục thuốc của bệnh viện
base_allow if {
  is_pharmacist
  pharmacist_purpose_ok
  is_pharmacy_formulary
  input.method == "GET"
}

# Đề xuất thêm/bớt thuốc vào danh mục
base_allow if {
  is_pharmacist
  pharmacist_purpose_ok
  is_pharmacy_formulary
  input.method == "POST"
}

# ========== 7. KỸ THUẬT VIÊN XN (lab_technician) ==========
base_allow if {
  is_lab_technician
  lab_technician_purpose_ok
  is_lab_orders_list
  input.method == "GET"
}

base_allow if {
  is_lab_technician
  lab_technician_purpose_ok
  is_patient_lab_orders
  input.method == "GET"
}

base_allow if {
  is_lab_technician
  lab_technician_purpose_ok
  is_patient_lab_orders
  input.method == "POST"
}

base_allow if {
  is_lab_technician
  lab_technician_purpose_ok
  is_patient_lab_orders
  input.method == "PUT"
}

# Quyền đặc biệt: Truy cập Internal Medicine lab workflow queues
# Cho phép tất cả các endpoint liên quan đến internal-med lab queues
# Pattern: /admin/queues/internal-med/lab hoặc /admin/queues/internal-med/{id}/lab

# GET: danh sách lab queue hoặc chi tiết
base_allow if {
  is_lab_technician
  lab_technician_purpose_ok
  input.method == "GET"
  startswith(input.path, "/admin/queues/internal-med")
  endswith(input.path, "/lab")
}

# PUT: cập nhật lab processing (chỉ cho endpoint chi tiết)
base_allow if {
  is_lab_technician
  lab_technician_purpose_ok
  input.method == "PUT"
  startswith(input.path, "/admin/queues/internal-med")
  endswith(input.path, "/lab")
  input.path != "/admin/queues/internal-med/lab"
}

# POST: tạo lab order
base_allow if {
  is_lab_technician
  lab_technician_purpose_ok
  input.method == "POST"
  startswith(input.path, "/admin/queues/internal-med")
  endswith(input.path, "/lab")
}

# Quyền truy cập lab-orders endpoint (nếu có)
base_allow if {
  is_lab_technician
  lab_technician_purpose_ok
  startswith(input.path, "/admin/lab-orders")
  input.method == "GET"
}

base_allow if {
  is_lab_technician
  lab_technician_purpose_ok
  startswith(input.path, "/admin/lab-orders")
  input.method == "PUT"
}

# ========== 8. KẾ TOÁN (accountant) - KIÊM THU NGÂN ==========
base_allow if {
  is_accountant
  accountant_purpose_ok
  is_invoices
  input.method == "GET"
}

# Quyền POST: Tạo phiếu thu, xuất hóa đơn
base_allow if {
  is_accountant
  accountant_purpose_ok
  is_invoices
  input.method == "POST"
}

# Quyền PUT: Xác nhận thanh toán BHYT, công nợ
base_allow if {
  is_accountant
  accountant_purpose_ok
  is_invoices
  input.method == "PUT"
}

# Xác nhận BHYT
base_allow if {
  is_accountant
  accountant_purpose_ok
  startswith(input.path, "/insurance")
}

# Accountant có quyền truy cập admin bills endpoints
base_allow if {
  is_accountant
  accountant_purpose_ok
  startswith(input.path, "/admin/bills")
  input.method == "GET"
}

base_allow if {
  is_accountant
  accountant_purpose_ok
  startswith(input.path, "/admin/bills")
  input.method == "POST"
}

base_allow if {
  is_accountant
  accountant_purpose_ok
  startswith(input.path, "/admin/bills")
  input.method == "PUT"
}

# Accountant có quyền truy cập patients để xem thông tin thanh toán
base_allow if {
  is_accountant
  accountant_purpose_ok
  startswith(input.path, "/admin/patients")
  input.method == "GET"
}

# Accountant có quyền truy cập appointments để xem lịch hẹn
base_allow if {
  is_accountant
  accountant_purpose_ok
  startswith(input.path, "/admin/appointments")
  input.method == "GET"
}

# ========== 9. GIÁM ĐỐC (admin_hospital) ==========
base_allow if {
  is_admin_hospital
  admin_hospital_purpose_ok
  input.method == "GET"
}

# ========== 🔟 ADMIN CNTT (admin) ==========
# Admin có quyền truy cập system paths
base_allow if {
  is_admin
  admin_purpose_ok
  helpers.is_system_path(input.path)
}

# Admin có quyền quản lý users (GET /admin/users)
base_allow if {
  is_admin
  admin_purpose_ok
  input.path == "/admin/users"
}

# Admin có quyền quản lý users (POST, PUT, DELETE /admin/users/*)
base_allow if {
  is_admin
  admin_purpose_ok
  startswith(input.path, "/admin/users/")
}

# Admin Hospital có quyền quản lý users (GET /admin/users)
base_allow if {
  is_admin_hospital
  admin_hospital_purpose_ok
  input.path == "/admin/users"
}

# Admin Hospital có quyền quản lý users (POST, PUT, DELETE /admin/users/*)
base_allow if {
  is_admin_hospital
  admin_hospital_purpose_ok
  startswith(input.path, "/admin/users/")
}

# ========== MENU ACCESS - TẤT CẢ ROLES ==========
# Tất cả roles đều có quyền lấy menu của mình (không cần kiểm tra purpose)
base_allow if {
  startswith(input.path, "/admin/menus/role/")
  input.method == "GET"
  input.user.id  # User must be authenticated
}

# ========== 1️⃣1️⃣ BỆNH NHÂN (patient) ==========
base_allow if {
  is_patient
  patient_purpose_ok
  is_own_record
  input.method == "GET"
}

base_allow if {
  is_patient
  patient_purpose_ok
  is_own_record
  startswith(input.path, "/patient/profile")
  input.method == "PUT"
}

base_allow if {
  is_patient
  patient_purpose_ok
  startswith(input.path, "/patient/appointments")
  input.method == "POST"
}

base_allow if {
  is_patient
  patient_purpose_ok
  startswith(input.path, "/patient/appointments")
  input.method == "PUT"
}

base_allow if {
  is_patient
  patient_purpose_ok
  startswith(input.path, "/patient/self_monitoring")
  input.method == "POST"
}

base_allow if {
  is_patient
  patient_purpose_ok
  startswith(input.path, "/patient/self_monitoring")
  input.method == "PUT"
}

# Patient: Simplified rules for /patient/* endpoints (no is_own_record check)
# The backend will verify patient owns the data using JWT token
base_allow if {
  is_patient
  startswith(input.path, "/patient/")
  input.method == "GET"
}

base_allow if {
  is_patient
  startswith(input.path, "/patient/profile")
  input.method == "GET"
}

base_allow if {
  is_patient
  startswith(input.path, "/patient/medical-records")
  input.method == "GET"
}

base_allow if {
  is_patient
  startswith(input.path, "/patient/activity")
  input.method == "GET"
}

# Patient can access /api/my-activity
base_allow if {
  is_patient
  startswith(input.path, "/api/my-activity")
  input.method == "GET"
}


# ============================================
# DENY RULES - Từ chối truy cập
# ============================================

# Helper: Check if path is exempt from purpose check
is_purpose_exempt if {
  startswith(input.path, "/admin/menus/role/")
}

is_purpose_exempt if {
  startswith(input.path, "/admin/departments")
  input.method == "GET"
}

is_purpose_exempt if {
  startswith(input.path, "/admin/reason-tags")
  input.method == "GET"
}

# Patient Portal endpoints don't need purpose header
is_purpose_exempt if {
  startswith(input.path, "/patient/")
}

# API endpoints for patient portal
is_purpose_exempt if {
  startswith(input.path, "/api/")
}

# Deny 1: Mục đích truy cập không hợp lệ
# Exception: Menu endpoints, departments, reason-tags don't need strict purpose check
reasons[r] if {
  not purpose_ok
  not is_purpose_exempt
  r := "purpose_not_allowed"
}

# Deny 2: Truy cập research mà không có sự đồng ý
reasons[r] if {
  input.purpose == "research"
  not research_ok
  r := "research_policy_violation"
}

# Deny 3: Bác sĩ cố gắng xem danh sách bệnh nhân
reasons[r] if {
  is_doctor
  is_patients_list
  input.method == "GET"
  r := "doctor_cannot_list_all_patients"
}

# Deny 4: Tiếp tân cố gắng xem nội dung y tế
reasons[r] if {
  is_receptionist
  is_patient_diagnoses
  r := "receptionist_cannot_access_medical_content"
}

reasons[r] if {
  is_receptionist
  is_patient_prescriptions
  r := "receptionist_cannot_access_medical_content"
}

reasons[r] if {
  is_receptionist
  is_patient_lab_orders
  r := "receptionist_cannot_access_medical_content"
}

# Deny 5: Admin CNTT không được truy cập dữ liệu lâm sàng
reasons[r] if {
  is_admin
  helpers.is_clinical_path(input.path)
  not helpers.is_system_path(input.path)
  r := "it_admin_clinical_access_denied"
}

# Deny 6: Không ai được DELETE (trừ Admin)
reasons[r] if {
  input.method == "DELETE"
  not is_admin
  r := "delete_not_allowed"
}

# ============================================
# FINAL DECISION
# ============================================
# Special case: login/log endpoint bypasses all deny rules
allow if {
  is_login_log
  input.method == "POST"
  input.user.id
}

# Normal decision: base_allow and no deny reasons
# Special case: Menu endpoints bypass purpose check
allow if {
  startswith(input.path, "/admin/menus/role/")
  input.method == "GET"
  input.user.id
}

# Normal decision: base_allow and no deny reasons
allow if {
  base_allow
  count(reasons) == 0
}

# Get first reason from set (convert set to array and get first element)
reason_array := [r | r := reasons[_]]
reason := reason_array[0] if count(reason_array) > 0
reason := "ok" if count(reason_array) == 0

# Break the glass: Truy cập khẩn cấp
allow if {
  is_break_the_glass
  input.method == "GET"
}

# ============================================
# DECISION ENDPOINT - For Gateway
# ============================================
decision := {
  "allow": allow,
  "reason": reason,
  "obligations": obligations
}
