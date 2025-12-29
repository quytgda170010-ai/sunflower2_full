-- waf_filter.lua: Input Validation via pattern matching for SQLi/XSS
-- This module runs BEFORE OPA authorization to block malicious payloads
-- Logs blocked attacks to SIEM backend

local http = require "resty.http"
local cjson = require "cjson.safe"

-- SQLi patterns (optimized for common attacks, URL-decoded)
local sqli_patterns = {
    -- Basic SQL injection patterns
    "['\"`;]%s*(?:or|and)%s+['\"%d]",
    "union%s+(?:all%s+)?select",
    "select%s+.*%s+from%s+",
    "insert%s+into%s+",
    "update%s+.*%s+set%s+",
    "delete%s+from%s+",
    "drop%s+(?:table|database|index)",
    "truncate%s+",
    "exec%s*%(",
    "execute%s*%(",
    "xp_%w+",
    "sp_%w+",
    "0x%x+",
    "char%s*%(%s*%d+%s*%)",
    "concat%s*%(",
    "concat_ws%s*%(",
    "group_concat%s*%(",
    "load_file%s*%(",
    "into%s+(?:out|dump)file",
    "information_schema",
    "@@%w+",
    "sleep%s*%(%s*%d+%s*%)",
    "benchmark%s*%(",
    "waitfor%s+delay",
    "having%s+",
    "group%s+by%s+",
    "order%s+by%s+%d+",
    -- Comment-based bypass
    "/%*.*%*/",
    "%-%-[%s%w]",
    "#[%s%w]",
    -- Tautology attacks
    "'%s*=%s*'",
    "\"%s*=%s*\"",
    "1%s*=%s*1",
    "'%s*or%s*'",
    "'%s*and%s*'"
}

-- XSS patterns
local xss_patterns = {
    "<script[^>]*>",
    "</script>",
    "javascript:",
    "vbscript:",
    "onload%s*=",
    "onerror%s*=",
    "onclick%s*=",
    "onmouseover%s*=",
    "onfocus%s*=",
    "onblur%s*=",
    "<iframe[^>]*>",
    "<object[^>]*>",
    "<embed[^>]*>",
    "<svg[^>]*onload",
    "expression%s*%(",
    "document%.cookie",
    "document%.write",
    "window%.location"
}

-- Function to URL decode
local function url_decode(str)
    if not str then return "" end
    str = string.gsub(str, "%%(%x%x)", function(h)
        return string.char(tonumber(h, 16))
    end)
    str = string.gsub(str, "+", " ")
    return str
end

-- Function to check for patterns
local function check_patterns(input, patterns)
    if not input or input == "" then
        return false, nil
    end
    
    -- Normalize: lowercase and URL decode
    local normalized = string.lower(url_decode(input))
    -- Double URL decode (for bypass attempts)
    normalized = string.lower(url_decode(normalized))
    
    for _, pattern in ipairs(patterns) do
        if string.match(normalized, pattern) then
            return true, pattern
        end
    end
    return false, nil
end

-- Function to log WAF event to SIEM
local function log_waf_event(attack_type, pattern, payload, uri, ip, rule_id)
    -- Determine rule_code for compliance monitoring
    local rule_code = "R-SEC-01"  -- Default: SQL Injection
    if attack_type == "XSS" then
        rule_code = "R-SEC-02"  -- XSS Attack
    end
    
    local log_payload = {
        timestamp = os.date("%Y-%m-%d %H:%M:%S"),  -- MariaDB compatible format (local time)
        log_type = "SECURITY_ALERT",
        action = "🛡️ [WAF] " .. attack_type .. " Attack Blocked",
        attack_type = attack_type,
        rule_id = rule_id,
        rule_code = rule_code,  -- For compliance monitoring (R-SEC-01 = SQLi, R-SEC-02 = XSS)
        matched_pattern = pattern,
        payload = string.sub(payload or "", 1, 500),  -- Limit payload size
        uri = uri,
        ip = ngx.var.remote_addr,
        method = ngx.var.request_method,
        user_agent = ngx.var.http_user_agent or "unknown",
        request_id = ngx.var.request_id or "",
        blocked = true,
        -- Add user info for SIEM display
        user = "unknown",  -- Hacker has no authenticated user
        username = "unknown",
        role = "attacker",  -- Mark as attacker
        has_violation = true,  -- Mark as violation for compliance
        failed_rules = 1,  -- At least 1 rule failed (WAF blocked)
        ground_truth_label = 1  -- Confirmed security alert
    }
    
    -- Send async to SIEM backend
    -- Note: We need to serialize log_payload before timer because upvalues may not work in timer context
    local payload_json = cjson.encode(log_payload)
    
    ngx.timer.at(0, function(premature)
        if premature then return end
        
        -- Require modules inside timer callback (upvalues don't work properly in timer context)
        local timer_http = require "resty.http"
        local timer_cjson = require "cjson.safe"
        
        local httpc = timer_http.new()
        httpc:set_timeout(2000)
        
        local backend_url = os.getenv("EHR_CORE_URL") or "http://ehr-core:8000"
        local res, err = httpc:request_uri(backend_url .. "/admin/internal/log-waf-event", {
            method = "POST",
            body = payload_json,
            headers = {["Content-Type"] = "application/json"}
        })
        
        if not res then
            ngx.log(ngx.ERR, "[WAF] Failed to log to SIEM: ", err)
        else
            ngx.log(ngx.INFO, "[WAF] Successfully logged attack to SIEM, status: ", res.status)
        end
    end)
end

-- Main WAF check function
local function waf_check()
    local uri = ngx.var.request_uri or ""
    local args = ngx.var.args or ""
    local method = ngx.req.get_method()
    
    -- Skip health check endpoints
    if string.match(uri, "^/health") or string.match(uri, "^/healthz") then
        return true
    end
    
    -- Check URI and query string for SQLi
    local is_sqli, sqli_pattern = check_patterns(uri .. "?" .. args, sqli_patterns)
    if is_sqli then
        ngx.log(ngx.WARN, "[WAF] SQLi detected in URI: ", uri, " Pattern: ", sqli_pattern)
        log_waf_event("SQL Injection", sqli_pattern, uri, uri, ngx.var.remote_addr, "WAF-SQLi-001")
        
        -- Block the request
        ngx.status = ngx.HTTP_FORBIDDEN
        ngx.header["Content-Type"] = "application/json"
        ngx.header["X-WAF-Blocked"] = "true"
        ngx.header["X-WAF-Rule"] = "WAF-SQLi-001"
        ngx.say(cjson.encode({
            error = "waf_blocked",
            message = "Request blocked: Potential SQL Injection detected",
            rule = "WAF-SQLi-001"
        }))
        return ngx.exit(ngx.HTTP_FORBIDDEN)
    end
    
    -- Check URI for XSS
    local is_xss, xss_pattern = check_patterns(uri .. "?" .. args, xss_patterns)
    if is_xss then
        ngx.log(ngx.WARN, "[WAF] XSS detected in URI: ", uri, " Pattern: ", xss_pattern)
        log_waf_event("XSS", xss_pattern, uri, uri, ngx.var.remote_addr, "WAF-XSS-001")
        
        -- Block the request
        ngx.status = ngx.HTTP_FORBIDDEN
        ngx.header["Content-Type"] = "application/json"
        ngx.header["X-WAF-Blocked"] = "true"
        ngx.header["X-WAF-Rule"] = "WAF-XSS-001"
        ngx.say(cjson.encode({
            error = "waf_blocked",
            message = "Request blocked: Potential XSS attack detected",
            rule = "WAF-XSS-001"
        }))
        return ngx.exit(ngx.HTTP_FORBIDDEN)
    end
    
    -- Check POST/PUT body for SQLi/XSS
    if method == "POST" or method == "PUT" or method == "PATCH" then
        ngx.req.read_body()
        local body = ngx.req.get_body_data()
        
        if body then
            -- Check body for SQLi
            local is_body_sqli, body_sqli_pattern = check_patterns(body, sqli_patterns)
            if is_body_sqli then
                ngx.log(ngx.WARN, "[WAF] SQLi detected in body, Pattern: ", body_sqli_pattern)
                log_waf_event("SQL Injection", body_sqli_pattern, body, uri, ngx.var.remote_addr, "WAF-SQLi-002")
                
                ngx.status = ngx.HTTP_FORBIDDEN
                ngx.header["Content-Type"] = "application/json"
                ngx.header["X-WAF-Blocked"] = "true"
                ngx.header["X-WAF-Rule"] = "WAF-SQLi-002"
                ngx.say(cjson.encode({
                    error = "waf_blocked",
                    message = "Request blocked: Potential SQL Injection in request body",
                    rule = "WAF-SQLi-002"
                }))
                return ngx.exit(ngx.HTTP_FORBIDDEN)
            end
            
            -- Check body for XSS
            local is_body_xss, body_xss_pattern = check_patterns(body, xss_patterns)
            if is_body_xss then
                ngx.log(ngx.WARN, "[WAF] XSS detected in body, Pattern: ", body_xss_pattern)
                log_waf_event("XSS", body_xss_pattern, body, uri, ngx.var.remote_addr, "WAF-XSS-002")
                
                ngx.status = ngx.HTTP_FORBIDDEN
                ngx.header["Content-Type"] = "application/json"
                ngx.header["X-WAF-Blocked"] = "true"
                ngx.header["X-WAF-Rule"] = "WAF-XSS-002"
                ngx.say(cjson.encode({
                    error = "waf_blocked",
                    message = "Request blocked: Potential XSS in request body",
                    rule = "WAF-XSS-002"
                }))
                return ngx.exit(ngx.HTTP_FORBIDDEN)
            end
        end
    end
    
    -- Request passed WAF checks, continue to OPA
    return true
end

-- Execute WAF check
waf_check()
