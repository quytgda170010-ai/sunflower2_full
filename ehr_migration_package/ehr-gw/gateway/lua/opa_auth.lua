local http  = require "resty.http"
local cjson = require "cjson.safe"

-- ============================================
-- OPA Authorization (Policy Decision Point)
-- NOTE: WAF check is now handled by separate waf_filter.lua
--       which runs via rewrite_by_lua_file BEFORE this script
-- ============================================

local function split_csv(s)
  if not s or s == "" then return {} end
  local t = {}
  for part in string.gmatch(s, "([^,]+)") do
    t[#t+1] = string.lower((part or ""):gsub("^%s+",""):gsub("%s+$",""))
  end
  return t
end

local function to_bool(v)
  if not v then return false end
  v = string.lower(tostring(v))
  return (v == "true" or v == "1" or v == "yes")
end

local function vn_hour()
  local now = ngx.time()
  local t = os.date("!*t", now + 7*60*60)  -- UTC+7
  return t.hour
end

local function add_cors_headers()
  -- Clear any existing CORS headers first to avoid duplicates
  ngx.header["Access-Control-Allow-Origin"] = nil
  ngx.header["Access-Control-Allow-Methods"] = nil
  ngx.header["Access-Control-Allow-Headers"] = nil
  ngx.header["Access-Control-Expose-Headers"] = nil
  ngx.header["Access-Control-Allow-Credentials"] = nil
  ngx.header["Vary"] = nil
  
  -- Set CORS headers - use origin from request if present, otherwise use *
  -- IMPORTANT: Only set ONE value to avoid "multiple values" error
  local origin = ngx.var.http_origin
  if origin and origin ~= "" then
    -- Use the request origin (e.g., http://localhost:3000)
    ngx.header["Access-Control-Allow-Origin"] = origin
    ngx.header["Vary"] = "Origin"
  else
    -- Fallback to * if no origin header
    ngx.header["Access-Control-Allow-Origin"] = "*"
  end
  
  -- Set other CORS headers
  ngx.header["Access-Control-Allow-Methods"] = "GET, POST, PUT, PATCH, DELETE, OPTIONS"
  ngx.header["Access-Control-Allow-Headers"] = "Origin,Authorization,Content-Type,Accept,X-Requested-With,X-Roles,X-User,X-User-Id,X-Dept,X-Purpose,X-Patient-Id,X-Patient,X-Patient-Dept,X-Specialty"
  ngx.header["Access-Control-Expose-Headers"] = "X-Decision,X-Request-ID"
  ngx.header["Access-Control-Allow-Credentials"] = "true"
end

local method = ngx.req.get_method()
if method == "OPTIONS" then
  add_cors_headers()
  ngx.header["Content-Length"] = 0
  return ngx.exit(ngx.HTTP_NO_CONTENT)
end

ngx.req.read_body()
local hdr = ngx.req.get_headers()

-- Helper function to get header (case-insensitive, nginx lowercases headers)
local function get_header(name)
  local name_lower = string.lower(name)
  return hdr[name_lower] or hdr[name] or ""
end

-- Đọc nhiều biến thể header để tương thích index.html sẵn có
-- Nginx lowercases headers, so check both lowercase and original case
local user_id       = get_header("X-User") or get_header("X-User-Id") or ""
local user_roles_str = get_header("X-Roles") or ""
local user_roles    = split_csv(user_roles_str)
local user_dept     = get_header("X-Dept") or get_header("X-User-Dept") or ""

-- If user_id is empty, try to extract from JWT Bearer token
local auth_header = get_header("Authorization")
if (user_id == "" or #user_roles == 0) and auth_header and string.find(auth_header, "Bearer ") then
  local token = string.match(auth_header, "Bearer%s+(.+)")
  if token then
    -- Split JWT into parts
    local parts = {}
    for part in string.gmatch(token, "([^%.]+)") do
      table.insert(parts, part)
    end
    if #parts >= 2 then
      -- Decode payload (second part of JWT)
      local payload_b64 = parts[2]
      -- Add padding if needed for base64
      local padding = 4 - (string.len(payload_b64) % 4)
      if padding ~= 4 then
        payload_b64 = payload_b64 .. string.rep("=", padding)
      end
      -- Decode base64
      local ok, payload_json = pcall(function()
        return ngx.decode_base64(payload_b64)
      end)
      if ok and payload_json then
        local payload = cjson.decode(payload_json)
        if payload then
          -- Extract user_id from token if not set
          if user_id == "" then
            user_id = payload.preferred_username or payload.username or payload.sub or ""
          end
          -- Extract roles from token if not set
          if #user_roles == 0 then
            -- Roles can be in realm_access.roles or roles directly
            local token_roles = payload.roles or (payload.realm_access and payload.realm_access.roles) or {}
            for _, role in ipairs(token_roles) do
              table.insert(user_roles, string.lower(role))
            end
            user_roles_str = table.concat(user_roles, ",")
          end
          ngx.log(ngx.INFO, "Extracted from JWT - user: ", user_id, " roles: ", user_roles_str)
        end
      end
    end
  end
end

-- Infer roles from username if not present in Keycloak roles
-- This is critical for users like letan.hoa who don't have roles assigned in Keycloak
local username_lower = string.lower(user_id or "")
if username_lower ~= "" then
  -- Check if receptionist role should be inferred
  if string.find(username_lower, "letan") or string.find(username_lower, "reception") or string.find(username_lower, "tieptan") then
    local has_receptionist = false
    for _, role in ipairs(user_roles) do
      if role == "receptionist" or role == "head_reception" then
        has_receptionist = true
        break
      end
    end
    if not has_receptionist then
      table.insert(user_roles, "receptionist")
    end
  end
  -- Check if head_reception role should be inferred
  if string.find(username_lower, "truongletan") or string.find(username_lower, "head_reception") or string.find(username_lower, "truongtieptan") then
    local has_head_reception = false
    for _, role in ipairs(user_roles) do
      if role == "head_reception" then
        has_head_reception = true
        break
      end
    end
    if not has_head_reception then
      table.insert(user_roles, "head_reception")
    end
  end
  -- Check if nurse role should be inferred
  if string.find(username_lower, "dieuduong") or string.find(username_lower, "nurse") or string.find(username_lower, "yd") or string.find(username_lower, "dd") then
    local has_nurse = false
    for _, role in ipairs(user_roles) do
      if role == "nurse" or role == "head_nurse" then
        has_nurse = true
        break
      end
    end
    if not has_nurse then
      table.insert(user_roles, "nurse")
    end
  end
  -- Check if doctor role should be inferred
  if string.find(username_lower, "bacsi") or string.find(username_lower, "doctor") or string.find(username_lower, "bs") then
    local has_doctor = false
    for _, role in ipairs(user_roles) do
      if role == "doctor" then
        has_doctor = true
        break
      end
    end
    if not has_doctor then
      table.insert(user_roles, "doctor")
    end
  end
end

local patient_id    = get_header("X-Patient") or get_header("X-Patient-Id") or ""
local patient_dept  = get_header("X-Patient-Dept") or ""

local purpose_str   = get_header("X-Purpose") or ""
local purpose       = string.lower(purpose_str)

-- Debug: Log headers for troubleshooting
ngx.log(ngx.ERR, "OPA Auth - User ID: ", user_id, " Roles string: ", user_roles_str, " Roles array: ", cjson.encode(user_roles), " Purpose: ", purpose, " Path: ", ngx.var.uri)

-- Get path without query string for OPA (OPA policies use startswith which should work with query, but let's be safe)
local request_uri = ngx.var.uri or "/"
-- Remove query string from path if present (OPA policies check path, not full URI)
local path_only = string.match(request_uri, "^([^?]+)") or request_uri

local input = {
  method      = method,
  path        = path_only,  -- Use path without query string
  query       = ngx.var.args or "",
  ip          = ngx.var.remote_addr,
  request_id  = ngx.var.request_id,
  local_hour  = vn_hour(),

  user = {
    id    = user_id,
    roles = user_roles,
    dept  = user_dept,
  },
  patient       = patient_id,
  patient_dept  = patient_dept,

  purpose = purpose,
  mfa     = to_bool(get_header("X-MFA")),
  consent = to_bool(get_header("X-Consent")),
}

local opa_url = os.getenv("OPA_URL") or "http://opa:8181/v1/data/http/authz/decision"

local httpc = http.new()
httpc:set_timeout(3000)

-- Debug: Log the full input being sent to OPA
ngx.log(ngx.ERR, "OPA Input: ", cjson.encode(input))

local res, err = httpc:request_uri(opa_url, {
  method = "POST",
  body   = cjson.encode({ input = input }),
  headers = { ["Content-Type"] = "application/json" }
})

if not res then
  ngx.header["X-Decision"] = "deny"
  ngx.status = ngx.HTTP_FORBIDDEN
  ngx.say(cjson.encode({ error = "opa_unreachable", detail = err }))
  return ngx.exit(ngx.HTTP_FORBIDDEN)
end

local data = cjson.decode(res.body) or {}
local decision = data.result or {}

-- Debug: Log OPA decision
ngx.log(ngx.ERR, "OPA Decision: allow=", tostring(decision.allow), " reason=", tostring(decision.reason or "none"))

add_cors_headers()

if decision.allow then
  ngx.header["X-Decision"]   = "permit"
  ngx.header["X-Request-ID"] = input.request_id
  if decision.obligations and decision.obligations.set_headers then
    for k, v in pairs(decision.obligations.set_headers) do ngx.header[k] = v end
  end
  
  -- Log allowed access for security monitoring
  -- Extract patient info from path if available
  local patient_id_from_path = nil
  local patient_code_from_path = nil
  if string.find(path_only, "/patients/") then
    -- Extract patient_id from path like /admin/patients/{patient_id}
    local match = string.match(path_only, "/patients/([^/]+)")
    if match then
      patient_id_from_path = match
    end
  end
  
  -- Extract username from user_id (if user_id is UUID, try to get username from header or token)
  local username_for_log = user_id  -- Default to user_id
  
  -- Try to get username from X-User header first
  local x_user_header = get_header("X-User")
  if x_user_header and x_user_header ~= "" then
    -- If X-User is short (likely username like "bs.noikhoa"), use it
    if string.len(x_user_header) < 30 and (string.find(x_user_header, "%.") or string.len(x_user_header) < 20) then
      username_for_log = x_user_header
    end
  end
  
  -- If user_id is UUID (long string), try to extract username from Authorization token
  if string.len(username_for_log) > 30 or (not string.find(username_for_log, "%.") and string.len(username_for_log) > 20) then
    -- user_id is likely UUID, try to get username from token
    local auth_header = get_header("Authorization")
    if auth_header and string.find(auth_header, "Bearer ") then
      -- Try to decode JWT token to get username (preferred_username or username claim)
      -- For now, we'll use a simple approach: check if we can get username from token
      -- In production, you might want to decode the JWT properly
      local token = string.match(auth_header, "Bearer%s+(.+)")
      if token then
        -- Try to extract username from token (base64 decode payload)
        -- This is a simplified approach - in production use proper JWT library
        local parts = {}
        for part in string.gmatch(token, "([^%.]+)") do
          table.insert(parts, part)
        end
        if #parts >= 2 then
          -- Decode payload (second part of JWT)
          local payload_b64 = parts[2]
          -- Add padding if needed
          local padding = 4 - (string.len(payload_b64) % 4)
          if padding ~= 4 then
            payload_b64 = payload_b64 .. string.rep("=", padding)
          end
          -- Try to decode (simplified - in production use proper base64 decoder)
          local ok, payload_json = pcall(function()
            -- Use ngx.decode_base64 if available, otherwise skip
            return ngx.decode_base64(payload_b64)
          end)
          if ok and payload_json then
            local payload = cjson.decode(payload_json)
            if payload then
              -- Try to get username from token claims
              local token_username = payload.preferred_username or payload.username or payload.sub
              if token_username and string.len(token_username) < 30 and string.find(token_username, "%.") then
                username_for_log = token_username
              end
            end
          end
        end
      end
    end
  end
  
  -- Determine primary role (filter out system roles)
  local primary_role = nil
  if user_roles and #user_roles > 0 then
    local system_roles = {
      offline_access = true,
      ["default-roles-clinicrealm"] = true,
      uma_authorization = true,
      ["manage-account"] = true,
      ["manage-account-links"] = true,
      ["view-profile"] = true
    }
    for _, role in ipairs(user_roles) do
      if not system_roles[role] then
        primary_role = role
        break
      end
    end
    -- If no primary role found, try to infer from username
    if not primary_role then
      local username_lower = string.lower(username_for_log or "")
      -- Check in order of priority (most specific first)
      if string.find(username_lower, "giamdoc") or string.find(username_lower, "admin_hospital") or string.find(username_lower, "hospital_admin") then
        primary_role = "admin_hospital"
      elseif string.find(username_lower, "truongdieuduong") or string.find(username_lower, "head_nurse") or string.find(username_lower, "truongyd") then
        primary_role = "head_nurse"
      elseif string.find(username_lower, "truongletan") or string.find(username_lower, "head_reception") or string.find(username_lower, "truongtieptan") then
        primary_role = "head_reception"
      elseif string.find(username_lower, "ketoan") or string.find(username_lower, "accountant") or string.find(username_lower, "thungan") then
        primary_role = "accountant"
      elseif string.find(username_lower, "duocsi") or string.find(username_lower, "pharmacist") or string.find(username_lower, "ds") then
        primary_role = "pharmacist"
      elseif string.find(username_lower, "ktv") or string.find(username_lower, "lab") or string.find(username_lower, "xetnghiem") or string.find(username_lower, "technician") then
        primary_role = "lab_technician"
      elseif string.find(username_lower, "dieuduong") or string.find(username_lower, "nurse") or string.find(username_lower, "yd") or string.find(username_lower, "dd") then
        primary_role = "nurse"
      elseif string.find(username_lower, "letan") or string.find(username_lower, "reception") or string.find(username_lower, "tieptan") then
        primary_role = "receptionist"
      elseif string.find(username_lower, "bacsi") or string.find(username_lower, "doctor") or string.find(username_lower, "bs") then
        primary_role = "doctor"
      elseif string.find(username_lower, "benhnhan") or string.find(username_lower, "patient") or string.find(username_lower, "bn") then
        primary_role = "patient"
      elseif string.find(username_lower, "admin") or string.find(username_lower, "quanly") or string.find(username_lower, "quantri") then
        primary_role = "admin"
      else
        primary_role = user_roles[1] or "UNKNOWN"
      end
    end
  else
    -- No roles in user_roles, try to infer from username
    local username_lower = string.lower(username_for_log or "")
    if string.find(username_lower, "giamdoc") or string.find(username_lower, "admin_hospital") or string.find(username_lower, "hospital_admin") then
      primary_role = "admin_hospital"
    elseif string.find(username_lower, "truongdieuduong") or string.find(username_lower, "head_nurse") or string.find(username_lower, "truongyd") then
      primary_role = "head_nurse"
    elseif string.find(username_lower, "truongletan") or string.find(username_lower, "head_reception") or string.find(username_lower, "truongtieptan") then
      primary_role = "head_reception"
    elseif string.find(username_lower, "ketoan") or string.find(username_lower, "accountant") or string.find(username_lower, "thungan") then
      primary_role = "accountant"
    elseif string.find(username_lower, "duocsi") or string.find(username_lower, "pharmacist") or string.find(username_lower, "ds") then
      primary_role = "pharmacist"
    elseif string.find(username_lower, "ktv") or string.find(username_lower, "lab") or string.find(username_lower, "xetnghiem") or string.find(username_lower, "technician") then
      primary_role = "lab_technician"
    elseif string.find(username_lower, "dieuduong") or string.find(username_lower, "nurse") or string.find(username_lower, "yd") or string.find(username_lower, "dd") then
      primary_role = "nurse"
    elseif string.find(username_lower, "letan") or string.find(username_lower, "reception") or string.find(username_lower, "tieptan") then
      primary_role = "receptionist"
    elseif string.find(username_lower, "bacsi") or string.find(username_lower, "doctor") or string.find(username_lower, "bs") then
      primary_role = "doctor"
    elseif string.find(username_lower, "benhnhan") or string.find(username_lower, "patient") or string.find(username_lower, "bn") then
      primary_role = "patient"
    elseif string.find(username_lower, "admin") or string.find(username_lower, "quanly") or string.find(username_lower, "quantri") then
      primary_role = "admin"
    else
      primary_role = "UNKNOWN"
    end
  end
  
  -- Determine operation from method and path
  local operation = "view"
  if method == "POST" then
    operation = "create"
  elseif method == "PUT" or method == "PATCH" then
    operation = "update"
  elseif method == "DELETE" then
    operation = "delete"
  end
  
  -- Determine action from URI
  local action_desc = "Access"
  if string.find(path_only, "/appointments") then
    action_desc = "View appointment"
  elseif string.find(path_only, "/patients") then
    if operation == "create" then
      action_desc = "Create patient"
    elseif operation == "update" then
      action_desc = "Update patient"
    else
      action_desc = "View patient"
    end
  elseif string.find(path_only, "/bills") or string.find(path_only, "/billing") then
    action_desc = "View billing"
  end
  
  -- Read request body if available (for POST/PUT/PATCH)
  local request_body = nil
  if method == "POST" or method == "PUT" or method == "PATCH" then
    local body_data = ngx.req.get_body_data()
    if body_data then
      request_body = body_data
    else
      -- Try to read body file if body was saved to file
      local body_file = ngx.req.get_body_file()
      if body_file then
        local file = io.open(body_file, "r")
        if file then
          request_body = file:read("*all")
          file:close()
        end
      end
    end
  end
  
  -- Determine log_type based on URI for proper compliance rule matching
  -- This ensures Behavior Monitoring can apply correct rules (EMR-READ-*, RX-*, etc.)
  local log_type = "emr_access_log"  -- default for user activity
  if string.find(path_only, "/medical-records") or string.find(path_only, "/encounters") or string.find(path_only, "/visits") then
    log_type = "encounter_log"
  elseif string.find(path_only, "/prescriptions") or string.find(path_only, "/medications") or string.find(path_only, "/pharmacy") then
    log_type = "prescription_log"
  elseif string.find(path_only, "/admin/menus") or string.find(path_only, "/admin/settings") or string.find(path_only, "/admin/roles") then
    log_type = "admin_activity_log"
  elseif string.find(path_only, "/queue") or string.find(path_only, "/waiting") then
    log_type = "emr_access_log"
  elseif string.find(path_only, "/patients") or string.find(path_only, "/appointments") or string.find(path_only, "/bills") then
    log_type = "emr_access_log"
  end
  
  -- Send log to backend asynchronously (fire and forget)
  local log_payload = {
    username = username_for_log,
    user_id = user_id,
    role = primary_role,
    roles = user_roles,
    method = method,
    path = path_only,
    uri = ngx.var.request_uri or path_only,
    purpose = purpose,
    patient_id = patient_id_from_path,
    patient_code = patient_code_from_path,
    operation = operation,
    action = action_desc,
    ip_address = ngx.var.remote_addr,
    user_agent = ngx.var.http_user_agent or "unknown",
    request_id = input.request_id or "",
    status = 200,  -- Will be updated after backend response
    request_body = request_body,  -- Include request body for logging
    log_type = log_type  -- Log type for compliance rule matching
  }
  
  -- Send async HTTP request to backend to log allowed access
  -- Use ngx.timer.at to make it non-blocking
  local ok, err = ngx.timer.at(0, function(premature)
    if premature then
      return
    end
    
    local httpc = http.new()
    httpc:set_timeout(2000)  -- 2 second timeout
    
    local backend_url = os.getenv("EHR_CORE_URL") or "http://ehr-core:8000"
    local log_url = backend_url .. "/admin/internal/log-access"
    
    local res, err = httpc:request_uri(log_url, {
      method = "POST",
      body = cjson.encode(log_payload),
      headers = {
        ["Content-Type"] = "application/json"
      }
    })
    
    if not res then
      ngx.log(ngx.ERR, "Failed to send allowed access log to backend: ", err)
    elseif res.status ~= 200 and res.status ~= 201 then
      ngx.log(ngx.ERR, "Backend returned error when logging allowed access: ", res.status, " ", res.body)
    else
      ngx.log(ngx.INFO, "Successfully logged allowed access to backend")
    end
  end)
  
  if not ok then
    ngx.log(ngx.ERR, "Failed to create timer for logging allowed access: ", err)
  end
  
  return
else
  -- Log denied access attempt for security monitoring
  -- Extract patient info from path if available
  local patient_id_from_path = nil
  if string.find(path_only, "/patients/") then
    -- Extract patient_id from path like /admin/patients/{patient_id}
    local match = string.match(path_only, "/patients/([^/]+)")
    if match then
      patient_id_from_path = match
    end
  end
  
  -- Log the denied access attempt to nginx log
  ngx.log(ngx.WARN, 
    "🚫 ACCESS DENIED: User=", user_id, 
    " Roles=", user_roles_str,
    " Method=", method,
    " Path=", path_only,
    " Patient=", patient_id_from_path or "N/A",
    " Purpose=", purpose,
    " Reason=", decision.reason or "policy_deny"
  )
  
  -- Extract username from user_id (if user_id is UUID, try to get username from token or header)
  -- Gateway receives user_id which might be UUID or username
  local username_for_log = user_id  -- Default to user_id
  
  -- If user_id looks like UUID (long string), try to get username from X-User header
  -- X-User header might contain username if set by frontend
  local x_user_header = get_header("X-User")
  if x_user_header and x_user_header ~= "" and string.len(x_user_header) < 30 then
    -- If X-User is short (likely username), use it
    if string.find(x_user_header, "%.") or string.len(x_user_header) < 20 then
      username_for_log = x_user_header
    end
  end
  
  -- If still UUID, try to extract from user_id pattern (e.g., if user_id contains username info)
  if string.len(username_for_log) > 30 then
    -- user_id is likely UUID, keep it but we'll try to get username from database later
    -- For now, use user_id as-is
  end
  
  -- Send log to backend asynchronously (fire and forget)
  -- This ensures denied access attempts are logged to database
  local log_payload = {
    username = username_for_log,  -- Use extracted username
    user_id = user_id,  -- Keep original user_id (UUID)
    roles = user_roles,
    method = method,
    path = path_only,
    purpose = purpose,
    patient_id = patient_id_from_path,
    reason = decision.reason or "policy_deny",
    ip_address = ngx.var.remote_addr,
    client_ip = ngx.var.remote_addr,
    remote_ip = ngx.var.remote_addr,
    user_agent = ngx.var.http_user_agent or "unknown",
    request_id = input.request_id or ""
  }
  
  -- Send async HTTP request to backend to log denied access
  -- Use ngx.timer.at to make it non-blocking
  local ok, err = ngx.timer.at(0, function(premature)
    if premature then
      return
    end
    
    local httpc = http.new()
    httpc:set_timeout(2000)  -- 2 second timeout
    
    local backend_url = os.getenv("EHR_CORE_URL") or "http://ehr-core:8000"
    local log_url = backend_url .. "/admin/internal/log-denied-access"
    
    local res, err = httpc:request_uri(log_url, {
      method = "POST",
      body = cjson.encode(log_payload),
      headers = {
        ["Content-Type"] = "application/json"
      }
    })
    
    if not res then
      ngx.log(ngx.ERR, "Failed to send denied access log to backend: ", err)
    elseif res.status ~= 200 then
      ngx.log(ngx.ERR, "Backend returned error when logging denied access: ", res.status, " ", res.body)
    else
      ngx.log(ngx.INFO, "Successfully logged denied access to backend")
    end
  end)
  
  if not ok then
    ngx.log(ngx.ERR, "Failed to create timer for logging denied access: ", err)
  end
  
  ngx.header["X-Decision"]   = "deny"
  ngx.header["Content-Type"] = "application/json"
  ngx.status = ngx.HTTP_FORBIDDEN
  ngx.say(cjson.encode({
    allow  = false,
    reason = decision.reason or "policy_deny",
    req_id = input.request_id
  }))
  return ngx.exit(ngx.HTTP_FORBIDDEN)
end
