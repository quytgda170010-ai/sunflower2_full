
import React, { useState, useEffect, useMemo } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, Typography, Box, Grid, Card, CardContent, CardHeader,
    Chip, Divider, Tabs, Tab, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Paper, Avatar,
    IconButton, Alert, CircularProgress, Link,
    Accordion, AccordionSummary, AccordionDetails
} from '@mui/material';
import {
    ManageSearch as ManageSearchIcon,
    CheckCircle as CheckCircleIcon,
    Error as ErrorIcon,
    Warning as WarningIcon,
    Info as InfoIcon,
    Close as CloseIcon,
    Dashboard as DashboardIcon,
    Description as DescriptionIcon,
    Security as SecurityIcon,
    Code as CodeIcon,
    Visibility as VisibilityIcon,
    AutoAwesome as AutoAwesomeIcon,
    AssignmentTurnedIn as AssignmentTurnedInIcon,
    Person as PersonIcon,
    Gavel as GavelIcon,
    OpenInNew as OpenInNewIcon,
    ExpandMore as ExpandMoreIcon
} from '@mui/icons-material';
import dayjs from 'dayjs';

// --- HELPER FUNCTIONS ---

const formatTimestamp = (ts) => {
    if (!ts) return 'N/A';
    return dayjs(ts).format('DD/MM/YYYY HH:mm:ss');
};

const parseJsonSafe = (data) => {
    if (typeof data === 'object' && data !== null) return data;
    try {
        return JSON.parse(data);
    } catch (e) {
        return null;
    }
};

const getChangesFromLog = (log, originalPatientData) => {
    if (!log) return null;

    // Method 1: Direct changed_fields (array or JSON string or object)
    if (log.changed_fields) {
        // Parse if string
        const parsed = parseJsonSafe(log.changed_fields);
        if (parsed) {
            // If array, return directly
            if (Array.isArray(parsed) && parsed.length > 0) {
                return parsed;
            }
            // If object (from prescription logging), convert to array format
            if (typeof parsed === 'object' && !Array.isArray(parsed)) {
                return Object.entries(parsed).map(([key, value]) => ({
                    field: key,
                    new: value,
                    old: ''
                }));
            }
        }
        // If already array
        if (Array.isArray(log.changed_fields) && log.changed_fields.length > 0) {
            return log.changed_fields;
        }
    }

    // Method 2: From response_body.changes
    const respParsed = parseJsonSafe(log.response_body);
    if (respParsed && Array.isArray(respParsed.changes)) {
        return respParsed.changes;
    }

    // Method 3: From details.changes
    const detailsParsed = parseJsonSafe(log.details);
    if (detailsParsed && Array.isArray(detailsParsed.changes)) {
        return detailsParsed.changes;
    }

    // Method 4: From request_body (Create Operation)
    const requestParsed = parseJsonSafe(log.request_body);
    if (log.operation === 'create' && requestParsed && typeof requestParsed === 'object') {
        const fieldsToShow = Object.keys(requestParsed).filter(k =>
            !['department_id', 'reason_text', 'reason_tags', 'id', 'created_at', 'updated_at', '_id'].includes(k)
        );
        if (fieldsToShow.length > 0) {
            return fieldsToShow.map(key => ({
                field: key,
                new: requestParsed[key],
                old: ''
            }));
        }
    }

    // Method 5: From request_body (Update Operation) - Compare with originalPatientData
    if (log.operation === 'update' && requestParsed && typeof requestParsed === 'object') {
        const originalData = parseJsonSafe(log.patient_record) || parseJsonSafe(originalPatientData);

        // If backend provided _changed_field_names, use it
        const changedFieldNames = log._changed_field_names || [];
        const fieldsToCheck = changedFieldNames.length > 0 ? changedFieldNames : Object.keys(requestParsed);

        const changes = [];
        fieldsToCheck.forEach(key => {
            if (['department_id', 'reason_text', 'reason_tags', 'id', 'created_at', 'updated_at'].includes(key)) return;

            const newVal = requestParsed[key];
            const oldVal = originalData ? originalData[key] : null;

            // Simple comparison
            if (newVal !== oldVal && (newVal !== undefined || oldVal !== undefined)) {
                changes.push({
                    field: key,
                    new: newVal,
                    old: oldVal
                });
            }
        });

        if (changes.length > 0) return changes;

        // Fallback: just show request body if no original data to compare
        if (!originalData) {
            return fieldsToCheck.map(key => ({
                field: key,
                new: requestParsed[key],
                old: '?'
            }));
        }
    }

    return null;
};

const CompactValueRenderer = ({ value }) => {
    if (value === undefined || value === null || value === '') {
        return <span style={{ color: '#bdbdbd', fontStyle: 'italic' }}>(empty)</span>;
    }

    // Attempt to parse if string
    let displayValue = value;
    let isComplex = false;

    if (typeof value === 'string') {
        try {
            // Only try parsing if it looks like an object/array
            if (value.trim().startsWith('{') || value.trim().startsWith('[')) {
                const parsed = JSON.parse(value);
                if (typeof parsed === 'object' && parsed !== null) {
                    displayValue = parsed;
                    isComplex = true;
                }
            }
        } catch (e) { }
    } else if (typeof value === 'object' && value !== null) {
        isComplex = true;
    }

    if (isComplex) {
        // Handle Arrays specially
        if (Array.isArray(displayValue)) {
            if (displayValue.length === 0) return <span style={{ color: '#9e9e9e' }}>[]</span>;
            return (
                <Box sx={{ mt: 0.5, borderLeft: '2px solid #e0e0e0', pl: 1 }}>
                    {displayValue.map((item, idx) => (
                        <Box key={idx} sx={{ mb: 0.5 }}>
                            <Typography variant="caption" sx={{ color: '#757575', mr: 1 }}>[{idx}]</Typography>
                            <CompactValueRenderer value={item} />
                        </Box>
                    ))}
                </Box>
            );
        }

        // Handle Objects
        if (Object.keys(displayValue).length === 0) return <span style={{ color: '#9e9e9e' }}>{`{}`}</span>;

        return (
            <TableContainer component={Paper} variant="outlined" sx={{ mt: 0.5, mb: 0.5, bgcolor: 'transparent', maxWidth: '100%', border: 'none' }}>
                <Table size="small" sx={{ '& td': { borderBottom: '1px solid #f0f0f0' } }}>
                    <TableBody>
                        {Object.entries(displayValue).map(([k, v]) => (
                            <TableRow key={k}>
                                <TableCell
                                    component="th"
                                    scope="row"
                                    sx={{
                                        fontWeight: 600,
                                        color: '#616161',
                                        width: '1%',
                                        whiteSpace: 'nowrap',
                                        verticalAlign: 'top',
                                        py: 0.5,
                                        fontSize: '0.75rem',
                                        fontFamily: 'monospace'
                                    }}
                                >
                                    {k}
                                </TableCell>
                                <TableCell sx={{ py: 0.5, fontSize: '0.8rem', verticalAlign: 'top' }}>
                                    <CompactValueRenderer value={v} />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        );
    }

    // Primitive values
    return <span style={{ wordBreak: 'break-word' }}>{String(displayValue)}</span>;
};

// --- MAIN COMPONENT ---

export default function LogDetailsDialog({
    open,
    onClose,
    selectedLog,
    violatedRules = [],
    loadingRules = false,
    rulesError = null,
    onAutoMapRules, // Callback for auto-map action
    patientDetails,
    loadingPatient,
    originalPatientData,
    loadingOriginalData,
    showComplianceSection = false, // Only show compliance section in Behavior Monitoring, not in Log Collector
}) {
    const [detailTab, setDetailTab] = useState(0);

    // Reset tab on open
    useEffect(() => {
        if (open) setDetailTab(0);
    }, [open]);

    // --- DERIVED STATE ---

    const isSQLInjection = useMemo(() => {
        const log = selectedLog;
        if (!log) return false;
        if ((log.has_violation === false || log.failed_rules === 0) && log.ground_truth_label !== 1) return false;

        const user = log.user || log.user_id || log.username || '';
        if (user.includes("' OR '1'") || user.includes("' OR 1=")) return true;

        const uri = (log.uri || '').toLowerCase();
        const isSafeUri = uri.includes('/admin/menus/role/') || (uri.includes('/patients') && !uri.includes('union') && !uri.includes('select') && !uri.includes('%27'));

        if (log.rule_code === 'R-SEC-01') return !isSafeUri;

        // Check for brute-force / authentication logs - these should NOT be treated as SQL Injection
        const action = (log.action || '').toLowerCase();
        const isBruteForceLog = action.includes('thất bại') ||
            action.includes('brute') ||
            action.includes('đăng nhập') ||
            action.includes('failed') ||
            action.includes('locked') ||
            action.includes('mfa') ||
            action.includes('authentication') ||
            (log.purpose || '').toLowerCase() === 'authentication';

        // Only treat as SQL Injection if it's a SECURITY_ALERT but NOT a brute-force log
        if (log.log_type === 'SECURITY_ALERT' && !isBruteForceLog) return true;

        if ((log.action || '').includes('SQL') && log.action !== 'query-sql') return true;
        if ((log.action_type || '').includes('Extraction')) return true;

        return false;
    }, [selectedLog]);

    const isFIM = useMemo(() => {
        try {
            const d = typeof selectedLog?.details === 'string' ? parseJsonSafe(selectedLog.details) : (selectedLog?.details || {});
            if (!d) return false;
            return d.rule_code === 'SYS-FIM-01' ||
                (d.captured_queries && d.captured_queries.length > 0) ||
                d.event_type === 'SECURITY_INCIDENT' ||
                (selectedLog?.uri || '').includes('file_integrity');
        } catch { return false; }
    }, [selectedLog]);

    // CRITICAL FIX: Respect has_violation from backend
    // If has_violation is explicitly false, log is COMPLIANT regardless of other fields
    const isExplicitlyCompliant = selectedLog?.has_violation === false ||
        selectedLog?.severity === 'compliant' ||
        selectedLog?.compliance_status === 'compliant' ||
        (selectedLog?.id || '').includes('::ok');

    const isViolation = !isExplicitlyCompliant && (
        selectedLog?.ground_truth_label === 1 ||
        selectedLog?.has_violation === true ||
        selectedLog?.failed_rules > 0 ||
        isFIM
    );
    const isSQLi = isSQLInjection; // Alias
    const isEMR = selectedLog?.log_type === 'EMR_ACCESS_LOG' || selectedLog?.log_type === 'emr_access_log' || selectedLog?.functional_group === 'emr';
    const isEncryption = (selectedLog?.uri || '').includes('encryption') ||
        (parseJsonSafe(selectedLog?.details)?.encryption_status);
    // TLS: chỉ hiển thị TLS section khi log_type chính xác là system_tls (không dựa vào fields phụ)
    const isTLS = (selectedLog?.log_type || '').toLowerCase() === 'system_tls';
    // SSO: chỉ hiển thị cho logs thực sự liên quan SSO/OpenID
    const isSSO = (selectedLog?.log_type || '').toLowerCase() === 'system_auth' ||
        ((selectedLog?.uri || '').includes('openid-connect') && !(selectedLog?.action || '').toLowerCase().includes('đăng nhập'));

    // Helper to extract Realm ID
    const getRealmId = (uri) => {
        const match = (uri || '').match(/\/realms\/([^\/]+)/);
        return match ? match[1] : 'N/A';
    };

    // DLP: chỉ hiển thị DLP section khi log_type chính xác là system_dlp (không dựa vào dlp_verdict phụ)
    const isDLP = (selectedLog?.log_type || '').toLowerCase() === 'system_dlp';

    // Detect WAF logs (from gateway WAF blocking)
    // EXTENDED: Also includes brute-force, auth failures, and other security events
    // to use the new template with "CĂN CỨ PHÁP LÝ & TIÊU CHUẨN" section
    const isWAF = useMemo(() => {
        if (!selectedLog) return false;
        const operation = (selectedLog.operation || '').toUpperCase();
        const action = (selectedLog.action || '');
        const actionLower = action.toLowerCase();
        const details = parseJsonSafe(selectedLog.details) || {};
        const ruleCode = (selectedLog.rule_code || details.rule_code || '').toUpperCase();
        const logType = (selectedLog.log_type || '').toUpperCase();
        const status = parseInt(selectedLog.status) || 200;

        // Original WAF conditions
        if (operation === 'WAF_BLOCK' ||
            action.includes('[WAF]') ||
            details.event_type === 'waf_blocked' ||
            details.attack_type === 'SQL Injection' ||
            details.attack_type === 'XSS') {
            return true;
        }

        // NEW: Include ALL security events to use beautiful template
        // Brute Force / Auth failures - EXCLUDED here to use dedicated isBruteForce view
        if (ruleCode.startsWith('R-SEC')) {
            return true;
        }

        // Login failures (status 401, 403, 423) - Handled by isBruteForce
        // if ([401, 403, 423].includes(status) && ... ) { return true; }

        // SECURITY_ALERT or SECURITY_INCIDENT logs
        // Only if NOT auth related (auth handled by isBruteForce)
        if ((logType === 'SECURITY_ALERT' || logType === 'SECURITY_INCIDENT') &&
            !ruleCode.startsWith('SYS-AUTH') &&
            !ruleCode.startsWith('R-IAM') &&
            !details.event_type?.includes('BRUTE_FORCE')) {
            return true;
        }

        // Brute force attack detected - EXCLUDED from isWAF to use isBruteForce view
        // if (actionLower.includes('brute-force') ... ) { return true; }

        return false;
    }, [selectedLog]);

    // Detect Brute Force / Authentication Security Events
    const isBruteForce = useMemo(() => {
        if (!selectedLog) return false;
        const details = parseJsonSafe(selectedLog.details) || {};
        const ruleCode = (selectedLog.rule_code || details.rule_code || '').toUpperCase();
        const action = (selectedLog.action || '').toLowerCase();
        const status = parseInt(selectedLog.status) || 0;

        // IMPORTANT: Exclude successful logins (status 2xx or action contains 'thành công')
        const isSuccessful = (status >= 200 && status < 300) || action.includes('thành công') || action.includes('success');

        // Only flag as brute force if it's explicitly a security event AND not successful
        // CRITICAL: SYS-AUTH-01 is successful login (COMPLIANCE) - DO NOT include in brute force!
        const isExplicitSecurityEvent = ruleCode === 'SYS-AUTH-03' ||
            ruleCode === 'R-IAM-03' ||  // MFA failure
            ruleCode === 'R-IAM-06' ||  // Account lockout
            details.rule_code === 'SYS-AUTH-03' ||
            details.event_type === 'BRUTE_FORCE' ||
            details.event_type === 'LOGIN_ERROR' ||
            details.is_brute_force === true ||
            details.account_locked === true;

        if (isExplicitSecurityEvent) return true;

        // For login-related actions, only flag if NOT successful
        const isLoginFailure = !isSuccessful && (
            action.includes('thất bại') ||
            action.includes('đăng nhập thất bại') ||
            action.includes('failed') ||
            action.includes('brute') ||
            action.includes('locked') ||
            action.includes('mfa_required') ||
            action.includes('login_error') ||
            status === 423 ||  // Account Locked
            status === 401     // Unauthorized
        );

        return isLoginFailure;
    }, [selectedLog]);

    // Detect successful authentication (compliance) logs - SYS-AUTH-01
    const isAuthCompliance = useMemo(() => {
        if (!selectedLog) return false;
        const details = parseJsonSafe(selectedLog.details) || {};
        const ruleCode = (selectedLog.rule_code || details.rule_code || '').toUpperCase();
        const action = (selectedLog.action || '').toLowerCase();
        const status = parseInt(selectedLog.status) || 0;
        const purpose = (selectedLog.purpose || details.purpose || '').toLowerCase();
        const logId = (selectedLog.id || '').toUpperCase();

        // Check rule_code directly or from log ID pattern (behavior-monitoring format: uuid:SYS-AUTH-01:ok)
        const hasAuthSuccessRuleCode = ruleCode === 'SYS-AUTH-01' ||
            logId.includes(':SYS-AUTH-01:') ||
            logId.includes(':SYS-AUTH-01');

        // SYS-AUTH-01 is successful login
        const isSuccessfulAuth = hasAuthSuccessRuleCode ||
            (purpose === 'authentication' && (
                action.includes('thành công') ||
                action.includes('success') ||
                (status >= 200 && status < 300 && action.includes('đăng nhập'))
            ));

        // Exclude brute force / failures
        const isNotFailure = !ruleCode.includes('AUTH-03') &&
            !logId.includes(':SYS-AUTH-03:') &&
            !logId.includes(':R-IAM-03:') &&
            !action.includes('thất bại') &&
            !action.includes('failed') &&
            !action.includes('locked');

        return isSuccessfulAuth && isNotFailure;
    }, [selectedLog]);

    // Detect SIEM Log Tampering events (R-AUD-01, SIEM_WATCHDOG)
    const isSIEMLogTampering = useMemo(() => {
        if (!selectedLog) return false;
        const details = parseJsonSafe(selectedLog.details) || {};
        const ruleCode = (selectedLog.rule_code || details.rule_code || '').toUpperCase();
        const user = (selectedLog.user || '').toUpperCase();
        const logType = (selectedLog.log_type || '').toUpperCase();
        const alertType = (details.alert_type || '').toUpperCase();
        const action = (selectedLog.action || '').toLowerCase();

        // Check for SIEM_WATCHDOG user or R-AUD-01 rule code
        const isSIEMWatchdog = user === 'SIEM_WATCHDOG' || user.includes('WATCHDOG');
        const isLogTamperingRule = ruleCode === 'R-AUD-01' || ruleCode.includes('AUD');
        const isLogTamperingType = logType === 'LOG_TAMPERING' || alertType === 'LOG_TAMPERING';
        const isLogTamperingAction = action.includes('log tampering') ||
            action.includes('vô hiệu hóa') ||
            action.includes('xóa dấu vết') ||
            action.includes('tính toàn vẹn');

        return isSIEMWatchdog || isLogTamperingRule || isLogTamperingType || isLogTamperingAction;
    }, [selectedLog]);

    // Override explanation for WAF logs (fix Brute Force showing for SQLi/XSS)
    const correctedViolatedRules = useMemo(() => {
        if (!violatedRules || violatedRules.length === 0) return violatedRules;
        if (!isWAF) return violatedRules;

        // Clone and fix the first violated rule with REAL R-SEC-01 data
        return violatedRules.map((rule, idx) => {
            if (idx === 0) {
                const details = typeof rule.details === 'string' ? parseJsonSafe(rule.details) : (rule.details || {});
                const logDetails = details?.log_snapshot?.details || {};
                const attackType = logDetails.attack_type || 'SQL Injection';

                // Use REAL R-SEC-01 rule from database for SQLi
                const correctedDetails = {
                    ...details,
                    explanation: attackType === 'XSS'
                        ? "Hệ thống WAF đã phát hiện và chặn cuộc tấn công XSS (Cross-Site Scripting)"
                        : "Hệ thống WAF đã phát hiện và chặn cuộc tấn công SQL Injection"
                };

                return {
                    ...rule,
                    details: correctedDetails,
                    // Use REAL rule codes from siem_law_rules table
                    rule_code: attackType === 'XSS' ? 'R-SEC-02' : 'R-SEC-01',
                    rule_name: attackType === 'XSS'
                        ? 'Phát hiện tấn công XSS (Cross-Site Scripting)'
                        : 'Phát hiện tấn công SQL Injection (Cơ bản)',
                    legal_basis: 'Điều 27, Khoản 1.c (Nghị định 15/2020/NĐ-CP)',
                    penalty_level: '50-70 triệu VNĐ hoặc Tù 2-7 năm (Điều 289 BLHS 2015)',
                    law_url: 'https://luatvietnam.vn/hanh-chinh/Nghi-dinh-15-2020-ND-CP-xu-phat-vi-pham-hanh-chinh-trong-linh-vuc-buu-chinh-vien-thong-435424.aspx'
                };
            }
            return rule;
        });
    }, [violatedRules, isWAF]);

    // Calculate changes (Before early return)
    const calculatedChanges = useMemo(() => getChangesFromLog(selectedLog, originalPatientData), [selectedLog, originalPatientData]);

    // --- EARLY RETURN AFTER HOOKS ---
    if (!selectedLog) return null;

    // --- SUB-RENDER FUNCTIONS ---

    const renderKeyValueTable = (data) => {
        const parsed = parseJsonSafe(data);
        if (!parsed) return null;
        return (
            <TableContainer component={Paper} variant="outlined" sx={{ mt: 1, bgcolor: '#fafafa' }}>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 'bold', width: '30%' }}>Trường</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Giá trị</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {Object.entries(parsed).map(([k, v]) => (
                            <TableRow key={k}>
                                <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{k}</TableCell>
                                <TableCell sx={{ wordBreak: 'break-word', fontSize: '0.85rem' }}>
                                    {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        );
    };

    const getEmoji = () => isSQLi ? '🛑' : '⚠️';
    const getEMRField = (field) => {
        if (selectedLog[field]) return selectedLog[field];
        const details = parseJsonSafe(selectedLog.details);
        if (details && details[field]) return details[field];
        return null;
    };
    const getPatientInfo = (field) => {
        if (patientDetails && patientDetails[field]) return patientDetails[field];
        if (selectedLog.patient && selectedLog.patient[field]) return selectedLog.patient[field];
        const details = parseJsonSafe(selectedLog.details);
        if (details && details[field]) return details[field];
        return null;
    };

    // ============================================
    // UNIFIED SINGLE RULE VIEW TEMPLATE
    // ============================================
    // This template is used when clicking "Chi tiết" button on individual rules
    // Uses the clean layout (image 2 style) with colors based on violation status
    if (selectedLog._single_rule_view) {
        // CRITICAL FIX: Only show violation if has_violation is explicitly true
        const isViolationView = selectedLog.has_violation === true && selectedLog.severity !== 'compliant';
        const ruleCode = selectedLog.rule_code || 'N/A';
        const ruleName = selectedLog.rule_name || 'N/A';
        const logDetails = parseJsonSafe(selectedLog.details) || {};
        const user = selectedLog.user || selectedLog.actor_name || logDetails.username || selectedLog.username || 'Unknown';
        // Try multiple fields for IP, only show first if comma-separated
        const rawIP = selectedLog.source_ip || selectedLog.ip_address || selectedLog.client_ip ||
            selectedLog.remote_addr || selectedLog.x_forwarded_for ||
            logDetails.ip_address || logDetails.source_ip || logDetails.client_ip ||
            logDetails.remote_addr || logDetails.ipAddress || 'Không xác định';
        const sourceIP = rawIP.split(',')[0].trim();
        // Try multiple fields for action
        const actionText = selectedLog.action || selectedLog.action_description ||
            logDetails.action || logDetails.action_description ||
            selectedLog.operation || 'N/A';

        // Colors based on violation status
        const theme = isViolationView
            ? {
                primary: '#d32f2f',
                light: '#ffebee',
                border: '#ffcdd2',
                icon: '🚨',
                title: 'VI PHẠM QUY TẮC',
                statusLabel: '❌ VI PHẠM',
                summaryTitle: 'PHÁT HIỆN VI PHẠM',
                summaryText: `Hoạt động của ${user} đã vi phạm quy tắc bảo mật. Cần xem xét và xử lý theo quy định.`
            }
            : {
                primary: '#2e7d32',
                light: '#e8f5e9',
                border: '#c8e6c9',
                icon: '✅',
                title: 'TUÂN THỦ QUY TẮC',
                statusLabel: '✅ TUÂN THỦ',
                summaryTitle: 'HOẠT ĐỘNG HỢP LỆ',
                summaryText: `Hoạt động của ${user} tuân thủ đầy đủ quy định bảo mật và pháp luật.`
            };

        return (
            <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { minHeight: '50vh', p: 0 } }}>
                {/* Header - Dynamic color based on violation status */}
                <Box sx={{ p: 2.5, background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.primary}dd 100%)`, color: 'white' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box>
                            <Typography variant="h6" sx={{ fontWeight: 600, letterSpacing: 0.5 }}>
                                {theme.icon} {theme.title}
                            </Typography>
                            <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
                                Sự kiện #{selectedLog.id?.substring(0, 8)}... • {formatTimestamp(selectedLog.timestamp)}
                            </Typography>
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                            <Chip
                                label={theme.statusLabel}
                                sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 'bold', fontSize: '0.85rem' }}
                            />
                            <Typography variant="caption" sx={{ display: 'block', mt: 0.5, opacity: 0.9 }}>
                                {ruleCode}
                            </Typography>
                        </Box>
                    </Box>
                </Box>

                <Box sx={{ p: 3 }}>
                    {/* Section 1: Summary */}
                    <Card sx={{ mb: 2, border: `1px solid ${theme.border}`, bgcolor: theme.light }}>
                        <CardContent sx={{ py: 2 }}>
                            <Grid container spacing={2} alignItems="center">
                                <Grid item xs={12} md={8}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: theme.primary }}>
                                        {theme.summaryTitle}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {theme.summaryText}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'white', borderRadius: 1, border: `1px solid ${theme.border}` }}>
                                        <Chip label={isViolationView ? "⚠️ XỬ LÝ" : "✓ ĐẠT"} color={isViolationView ? "error" : "success"} sx={{ fontWeight: 'bold' }} />
                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                            {selectedLog.severity || 'medium'}
                                        </Typography>
                                    </Box>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>

                    {/* Section 2: Details Table */}
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: '#424242' }}>
                        📋 CHI TIẾT SỰ KIỆN
                    </Typography>
                    <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
                        <Table size="small">
                            <TableBody>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 600, width: '35%', bgcolor: '#f5f5f5' }}>Quy tắc áp dụng</TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Chip label={ruleCode} size="small" color={isViolationView ? "error" : "success"} />
                                            <Typography variant="body2">{ruleName}</Typography>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 600, bgcolor: '#f5f5f5' }}>Người dùng</TableCell>
                                    <TableCell>
                                        <Chip label={user} size="small" color="primary" variant="outlined" />
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 600, bgcolor: '#f5f5f5' }}>Trạng thái</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={isViolationView ? "❌ Vi phạm quy tắc" : "✅ Tuân thủ quy tắc"}
                                            size="small"
                                            color={isViolationView ? "error" : "success"}
                                        />
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 600, bgcolor: '#f5f5f5' }}>Hành động</TableCell>
                                    <TableCell>{actionText}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 600, bgcolor: '#f5f5f5' }}>Thời gian</TableCell>
                                    <TableCell sx={{ fontFamily: 'monospace' }}>{formatTimestamp(selectedLog.timestamp)}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 600, bgcolor: '#f5f5f5' }}>Nguồn IP</TableCell>
                                    <TableCell sx={{ fontFamily: 'monospace' }}>{sourceIP}</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </TableContainer>

                    {/* Section 3: Compliance Status */}
                    {showComplianceSection && (
                        <>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: '#424242' }}>
                                ⚖️ TRẠNG THÁI TUÂN THỦ PHÁP LÝ
                            </Typography>
                            <Card sx={{ mb: 2, border: `1px solid ${theme.border}`, bgcolor: theme.light }}>
                                <CardContent sx={{ py: 2 }}>
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} md={6}>
                                            <Typography variant="body2" sx={{ fontWeight: 600, color: theme.primary, mb: 0.5 }}>
                                                Căn cứ pháp lý Việt Nam
                                            </Typography>
                                            <Typography variant="body2" sx={{ mb: 0.5 }}>
                                                <a href="https://thuvienphapluat.vn/van-ban/Cong-nghe-thong-tin/Luat-an-ninh-mang-2018-351416.aspx" target="_blank" rel="noopener noreferrer" style={{ color: '#1976d2' }}>
                                                    Luật An ninh mạng 2018 - Điều 26
                                                </a>
                                            </Typography>
                                            <Typography variant="body2" sx={{ mb: 0.5 }}>
                                                <a href="https://thuvienphapluat.vn/van-ban/Cong-nghe-thong-tin/Luat-an-toan-thong-tin-mang-2015-298365.aspx" target="_blank" rel="noopener noreferrer" style={{ color: '#1976d2' }}>
                                                    Luật ATTT mạng 2015 - Điều 7
                                                </a>
                                            </Typography>
                                            <Typography variant="body2" sx={{ mt: 1, color: theme.primary, fontWeight: 600 }}>
                                                {isViolationView ? 'CẦN XỬ LÝ VI PHẠM' : 'TUÂN THỦ ĐẦY ĐỦ'}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={12} md={6}>
                                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#1565c0', mb: 0.5 }}>
                                                Tiêu chuẩn quốc tế
                                            </Typography>
                                            <Typography variant="body2">
                                                ISO/IEC 27001:2022
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                Information Security Management
                                            </Typography>
                                            <Typography variant="body2" sx={{ mt: 0.5 }}>
                                                NIST 800-53
                                            </Typography>
                                        </Grid>
                                    </Grid>
                                </CardContent>
                            </Card>

                            {/* Recommendations */}
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: '#424242' }}>
                                {isViolationView ? 'KHUYẾN NGHỊ XỬ LÝ' : 'KHUYẾN NGHỊ TUÂN THỦ'}
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                                {isViolationView ? (
                                    <>
                                        <Chip label="Xem xét sự cố" size="small" variant="outlined" color="error" />
                                        <Chip label="Kiểm tra lịch sử" size="small" variant="outlined" color="warning" />
                                        <Chip label="Lập biên bản" size="small" variant="outlined" color="error" />
                                        <Chip label="Thông báo quản lý" size="small" variant="outlined" color="warning" />
                                    </>
                                ) : (
                                    <>
                                        <Chip label="Ghi log SIEM" size="small" variant="outlined" color="success" />
                                        <Chip label="Tuân thủ Luật ANM 2018" size="small" variant="outlined" color="success" />
                                        <Chip label="ISO 27001" size="small" variant="outlined" color="primary" />
                                    </>
                                )}
                            </Box>
                        </>
                    )}

                    {/* Section 4: Raw Data */}
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: '#424242' }}>
                        📄 DỮ LIỆU RAW
                    </Typography>
                    <Card variant="outlined" sx={{ mb: 2, bgcolor: '#fafafa' }}>
                        <CardContent sx={{ py: 1.5 }}>
                            <Box sx={{ fontFamily: 'monospace', fontSize: '0.75rem', whiteSpace: 'pre-wrap', wordBreak: 'break-all', maxHeight: 150, overflow: 'auto' }}>
                                {JSON.stringify({
                                    id: selectedLog.id,
                                    timestamp: selectedLog.timestamp,
                                    user: user,
                                    role: selectedLog.role,
                                    action: selectedLog.action,
                                    status: selectedLog.status,
                                    rule_code: ruleCode,
                                    rule_name: ruleName,
                                    has_violation: isViolationView,
                                    severity: selectedLog.severity
                                }, null, 2)}
                            </Box>
                        </CardContent>
                    </Card>
                </Box>

                {/* Footer */}
                <DialogActions sx={{ p: 2, borderTop: '1px solid #e0e0e0' }}>
                    <Button onClick={onClose} variant="contained" color={isViolationView ? "error" : "success"}>
                        Đóng
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }


    // --- WAF COMPLIANCE EVENT VIEW (Policy Compliance Monitoring) ---
    // BYPASSED: Using unified template instead
    if (false && isWAF && !isBruteForce) {
        const wafDetails = parseJsonSafe(selectedLog.details) || {};
        const logSnapshotDetails = wafDetails.log_snapshot?.details || wafDetails;

        // Determine attack type based on rule_code and action
        const ruleCode = selectedLog.rule_code || wafDetails.rule_code || '';
        const actionLower = (selectedLog.action || '').toLowerCase();
        const status = parseInt(selectedLog.status) || 200;
        const operation = (selectedLog.operation || '').toUpperCase();

        // CRITICAL: First check if this is a TRUE WAF event (SQL Injection, XSS)
        // WAF events have: operation='WAF_BLOCK', action contains '[WAF]', or attack_type is SQLi/XSS
        const isTrueWAFEvent = operation === 'WAF_BLOCK' ||
            actionLower.includes('[waf]') ||
            wafDetails.event_type === 'waf_blocked' ||
            wafDetails.attack_type === 'SQL Injection' ||
            wafDetails.attack_type === 'XSS' ||
            ruleCode.startsWith('WAF-') ||
            ruleCode === 'R-SEC-01' ||  // SQLi rule
            ruleCode === 'R-SEC-02';    // XSS rule

        // Detect if this is a Brute Force attack (ONLY if NOT a true WAF event)
        const isBruteForceEvent = !isTrueWAFEvent && (
            ruleCode.includes('AUTH') ||
            ruleCode === 'R-SEC-03' || ruleCode === 'R-SEC-06' ||
            actionLower.includes('brute') ||
            (actionLower.includes('đăng nhập') && actionLower.includes('thất bại')) ||
            actionLower.includes('bị khóa') ||
            wafDetails.event_type === 'BRUTE_FORCE' || wafDetails.event_type === 'LOGIN_ERROR' ||
            wafDetails.is_brute_force === true ||
            status === 423  // Only 423 (Locked) is specific to Brute Force, not 401/403
        );

        // Determine attack type based on the correct classification
        const attackType = isBruteForceEvent
            ? 'Brute Force Attack'
            : (wafDetails.attack_type || logSnapshotDetails.attack_type || 'SQL Injection');

        const ruleInfo = isBruteForceEvent
            ? { code: ruleCode || 'SYS-AUTH-03', name: 'Phát hiện tấn công Brute Force' }
            : {
                code: wafDetails.rule_id || ruleCode || 'WAF-SQLi-001',
                name: attackType === 'XSS'
                    ? 'Phát hiện tấn công XSS (Cross-Site Scripting)'
                    : 'Phát hiện tấn công SQL Injection'
            };

        const successMessage = isBruteForceEvent
            ? 'Hệ thống xác thực đã phát hiện hành vi đăng nhập bất thường và khóa tài khoản.'
            : 'Hệ thống WAF đã phát hiện cuộc tấn công và ngăn chặn thành công.';

        const payload = (() => {
            if (isBruteForceEvent) {
                return `User: ${selectedLog.user || 'unknown'} - ${wafDetails.failure_count || 5}+ lần đăng nhập thất bại`;
            }
            // For WAF: show the malicious payload from URI first (this is what attacker actually sent)
            const uri = selectedLog.uri || '';
            if (uri.includes('?')) {
                try { return decodeURIComponent(uri.split('?')[1]); }
                catch { return uri.split('?')[1]; }
            }
            // Fallback to payload in details if URI doesn't have query params
            if (wafDetails.payload) return wafDetails.payload;
            // Last resort: show matched pattern
            if (wafDetails.matched_pattern) return `[Detected pattern: ${wafDetails.matched_pattern}]`;
            return uri || 'N/A';
        })();

        return (
            <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { minHeight: '60vh', p: 0 } }}>
                {/* Header - Blue Theme (Security Event - Successfully Handled) */}
                <Box sx={{ p: 2.5, background: 'linear-gradient(135deg, #1565c0 0%, #42a5f5 100%)', color: 'white' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box>
                            <Typography variant="h6" sx={{ fontWeight: 600, letterSpacing: 0.5 }}>
                                🛡️ SỰ KIỆN BẢO MẬT
                            </Typography>
                            <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
                                Sự kiện #{selectedLog.id} • {formatTimestamp(selectedLog.timestamp)}
                            </Typography>
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                            <Chip
                                label="✅ ĐÃ NGĂN CHẶN"
                                sx={{ bgcolor: '#4caf50', color: 'white', fontWeight: 'bold', fontSize: '0.85rem' }}
                            />
                            <Typography variant="caption" sx={{ display: 'block', mt: 0.5, opacity: 0.9 }}>
                                WAF phòng thủ thành công
                            </Typography>
                        </Box>
                    </Box>
                </Box>

                <Box sx={{ p: 3 }}>
                    {/* Section 1: Security Event Summary */}
                    <Card sx={{ mb: 2, border: '1px solid #e3f2fd', bgcolor: '#e8f5e9' }}>
                        <CardContent sx={{ py: 2 }}>
                            <Grid container spacing={2} alignItems="center">
                                <Grid item xs={12} md={8}>
                                    <Typography variant="subtitle2" color="success.dark" sx={{ fontWeight: 600, mb: 1 }}>
                                        PHÁT HIỆN & NGĂN CHẶN THÀNH CÔNG
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {successMessage} Sự kiện được ghi nhận để giám sát an ninh.
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'white', borderRadius: 1, border: '1px solid #c8e6c9' }}>
                                        <Chip label="🛡️ AN TOÀN" color="success" sx={{ fontWeight: 'bold' }} />
                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>Không có thiệt hại</Typography>
                                    </Box>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>

                    {/* Section 2: Security Event Details */}
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: '#424242' }}>
                        📋 CHI TIẾT SỰ KIỆN
                    </Typography>
                    <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
                        <Table size="small">
                            <TableBody>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 600, width: '35%', bgcolor: '#f5f5f5' }}>Quy tắc phát hiện</TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Chip label={ruleInfo.code} size="small" color="primary" />
                                            <Typography variant="body2">{ruleInfo.name}</Typography>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 600, bgcolor: '#f5f5f5' }}>Loại tấn công</TableCell>
                                    <TableCell><Chip label={attackType} size="small" color="error" /></TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 600, bgcolor: '#f5f5f5' }}>Trạng thái xử lý</TableCell>
                                    <TableCell><Chip label="✅ Đã chặn tự động" size="small" color="success" /></TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 600, bgcolor: '#f5f5f5' }}>Nguồn tấn công</TableCell>
                                    <TableCell sx={{ fontFamily: 'monospace' }}>{logSnapshotDetails.ip_address || selectedLog.source_ip || 'N/A'}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 600, bgcolor: '#f5f5f5' }}>Payload độc hại</TableCell>
                                    <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem', wordBreak: 'break-all', color: '#d32f2f' }}>
                                        {payload || 'N/A'}
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </TableContainer>


                    {/* Section 2.5 & 2.6: Only show in Behavior Monitoring view */}
                    {showComplianceSection && (
                        <>
                            {/* Section 2.5: TRẠNG THÁI TUÂN THỦ PHÁP LÝ - For WAF events in behavior monitoring */}
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, mt: 3, color: '#1565c0' }}>
                                TRẠNG THÁI TUÂN THỦ PHÁP LÝ
                            </Typography>
                            <Card variant="outlined" sx={{ mb: 2, borderColor: '#4caf50' }}>
                                <CardContent sx={{ py: 1.5 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                        <Chip
                                            label="✅ TUÂN THỦ"
                                            size="small"
                                            sx={{ bgcolor: '#e8f5e9', color: '#2e7d32', fontWeight: 600 }}
                                        />
                                        <Typography variant="body2" color="text.secondary">
                                            Hệ thống WAF đã chặn thành công cuộc tấn công
                                        </Typography>
                                    </Box>
                                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                                        Căn cứ pháp lý:
                                    </Typography>
                                    <Box component="ul" sx={{ m: 0, pl: 2.5, '& li': { mb: 0.5 } }}>
                                        <Typography component="li" variant="body2" color="text.secondary">
                                            <strong>Luật An ninh mạng 2018</strong> - Điều 10: Phòng ngừa, phát hiện ngăn chặn tấn công mạng
                                        </Typography>
                                        <Typography component="li" variant="body2" color="text.secondary">
                                            <strong>Nghị định 15/2020/NĐ-CP</strong> - Điều 27: Bảo vệ hệ thống thông tin
                                        </Typography>
                                        <Typography component="li" variant="body2" color="text.secondary">
                                            <strong>ISO 27001:2022</strong> - A.8.3: Chống mã độc và tấn công mạng
                                        </Typography>
                                    </Box>
                                </CardContent>
                            </Card>

                            {/* Section 2.6: KHUYẾN NGHỊ HÀNH ĐỘNG - For WAF events */}
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: '#ff6f00' }}>
                                KHUYẾN NGHỊ HÀNH ĐỘNG
                            </Typography>
                            <Card variant="outlined" sx={{ mb: 2, borderColor: '#ffb74d' }}>
                                <CardContent sx={{ py: 1.5 }}>
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                        <Chip
                                            label="Lưu hồ sơ sự cố"
                                            size="small"
                                            sx={{ bgcolor: '#e3f2fd', color: '#1565c0' }}
                                            onClick={() => { }}
                                        />
                                        <Chip
                                            label="Theo dõi IP nguồn"
                                            size="small"
                                            sx={{ bgcolor: '#fff3e0', color: '#e65100' }}
                                            onClick={() => { }}
                                        />
                                        <Chip
                                            label="Cập nhật rule WAF"
                                            size="small"
                                            sx={{ bgcolor: '#f3e5f5', color: '#7b1fa2' }}
                                            onClick={() => { }}
                                        />
                                        <Chip
                                            label="Báo cáo ATTT"
                                            size="small"
                                            sx={{ bgcolor: '#ffebee', color: '#c62828' }}
                                            onClick={() => { }}
                                        />
                                    </Box>
                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
                                        Cuộc tấn công đã được ngăn chặn tự động. Khuyến nghị theo dõi nguồn IP để phát hiện các cuộc tấn công tiếp theo.
                                    </Typography>
                                </CardContent>
                            </Card>
                        </>
                    )}


                    {/* Section 3: Raw Data */}
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: '#424242' }}>
                        DỮ LIỆU RAW
                    </Typography>
                    <Card variant="outlined" sx={{ mb: 2, bgcolor: '#fafafa' }}>
                        <CardContent sx={{ py: 1.5 }}>
                            <Box sx={{ fontFamily: 'monospace', fontSize: '0.75rem', whiteSpace: 'pre-wrap', wordBreak: 'break-all', maxHeight: 200, overflow: 'auto' }}>
                                {JSON.stringify({
                                    id: selectedLog.id,
                                    timestamp: selectedLog.timestamp,
                                    user: selectedLog.user || selectedLog.actor_name || selectedLog.username,
                                    role: selectedLog.role,
                                    action: selectedLog.action,
                                    operation: selectedLog.operation,
                                    method: selectedLog.method,
                                    status: selectedLog.status,
                                    uri: selectedLog.uri,
                                    ip_address: selectedLog.ip_address || selectedLog.source_ip,
                                    user_agent: selectedLog.user_agent,
                                    log_type: selectedLog.log_type,
                                    details: wafDetails
                                }, null, 2)}
                            </Box>
                        </CardContent>
                    </Card>
                </Box>

                <DialogActions sx={{ borderTop: '1px solid #e0e0e0', px: 3, py: 1.5 }}>
                    <Button onClick={onClose} variant="outlined" size="small">Đóng</Button>
                    <Button onClick={onClose} variant="contained" color="primary" size="small">
                        Xác nhận đã xem
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }

    // --- SUCCESSFUL AUTHENTICATION (COMPLIANCE) VIEW - SYS-AUTH-01 ---
    // BYPASSED: Using unified template instead
    if (false && isAuthCompliance && !isBruteForce) {
        const authDetails = parseJsonSafe(selectedLog.details) || {};
        const successUser = selectedLog.user || selectedLog.actor_name || authDetails.username || 'Unknown';
        const sourceIP = selectedLog.source_ip || authDetails.ip_address || 'N/A';
        const sessionId = authDetails.session_id || 'N/A';
        const realm = authDetails.realm || 'ClinicRealm';
        const authMethod = authDetails.auth_method || 'openid-connect';

        return (
            <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { minHeight: '50vh', p: 0 } }}>
                {/* Header - Green Theme (Successful Authentication - Compliance) */}
                <Box sx={{ p: 2.5, background: 'linear-gradient(135deg, #2e7d32 0%, #66bb6a 100%)', color: 'white' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box>
                            <Typography variant="h6" sx={{ fontWeight: 600, letterSpacing: 0.5 }}>
                                ✅ XÁC THỰC THÀNH CÔNG
                            </Typography>
                            <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
                                Sự kiện #{selectedLog.id} • {formatTimestamp(selectedLog.timestamp)}
                            </Typography>
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                            <Chip
                                label="✅ TUÂN THỦ"
                                sx={{ bgcolor: '#1b5e20', color: 'white', fontWeight: 'bold', fontSize: '0.85rem' }}
                            />
                            <Typography variant="caption" sx={{ display: 'block', mt: 0.5, opacity: 0.9 }}>
                                Đăng nhập hợp lệ
                            </Typography>
                        </Box>
                    </Box>
                </Box>

                <Box sx={{ p: 3 }}>
                    {/* Section 1: Success Summary */}
                    <Card sx={{ mb: 2, border: '1px solid #c8e6c9', bgcolor: '#e8f5e9' }}>
                        <CardContent sx={{ py: 2 }}>
                            <Grid container spacing={2} alignItems="center">
                                <Grid item xs={12} md={8}>
                                    <Typography variant="subtitle2" color="success.dark" sx={{ fontWeight: 600, mb: 1 }}>
                                        ĐĂNG NHẬP THÀNH CÔNG
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Người dùng <strong>{successUser}</strong> đã xác thực thành công vào hệ thống.
                                        Phiên làm việc đã được khởi tạo và tuân thủ quy định bảo mật.
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'white', borderRadius: 1, border: '1px solid #a5d6a7' }}>
                                        <Chip label="🔓 TRUY CẬP" color="success" sx={{ fontWeight: 'bold' }} />
                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                            Phiên hoạt động
                                        </Typography>
                                    </Box>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>

                    {/* Section 2: Authentication Details */}
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: '#424242' }}>
                        📋 CHI TIẾT XÁC THỰC
                    </Typography>
                    <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
                        <Table size="small">
                            <TableBody>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 600, width: '35%', bgcolor: '#f5f5f5' }}>Quy tắc áp dụng</TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Chip label="SYS-AUTH-01" size="small" color="success" />
                                            <Typography variant="body2">Xác thực đăng nhập thành công</Typography>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 600, bgcolor: '#f5f5f5' }}>Người dùng</TableCell>
                                    <TableCell>
                                        <Chip label={successUser} size="small" color="primary" variant="outlined" />
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 600, bgcolor: '#f5f5f5' }}>Trạng thái</TableCell>
                                    <TableCell>
                                        <Chip label="✅ Đăng nhập thành công" size="small" color="success" />
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 600, bgcolor: '#f5f5f5' }}>Phương thức xác thực</TableCell>
                                    <TableCell sx={{ fontFamily: 'monospace' }}>{authMethod}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 600, bgcolor: '#f5f5f5' }}>Realm</TableCell>
                                    <TableCell sx={{ fontFamily: 'monospace' }}>{realm}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 600, bgcolor: '#f5f5f5' }}>Nguồn IP</TableCell>
                                    <TableCell sx={{ fontFamily: 'monospace' }}>{sourceIP}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 600, bgcolor: '#f5f5f5' }}>Session ID</TableCell>
                                    <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{sessionId}</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </TableContainer>

                    {/* Section 2.5: TRẠNG THÁI TUÂN THỦ PHÁP LÝ - ONLY show in behavior-monitoring */}
                    {showComplianceSection && (
                        <>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: '#424242' }}>
                                ⚖️ TRẠNG THÁI TUÂN THỦ PHÁP LÝ
                            </Typography>
                            <Card sx={{ mb: 2, border: '1px solid #c8e6c9', bgcolor: '#e8f5e9' }}>
                                <CardContent sx={{ py: 2 }}>
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} md={6}>
                                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#2e7d32', mb: 0.5 }}>
                                                Căn cứ pháp lý Việt Nam
                                            </Typography>
                                            <Typography variant="body2" sx={{ mb: 0.5 }}>
                                                <a href="https://thuvienphapluat.vn/van-ban/Cong-nghe-thong-tin/Luat-an-ninh-mang-2018-351416.aspx" target="_blank" rel="noopener noreferrer" style={{ color: '#1976d2' }}>
                                                    Luật An ninh mạng 2018 - Điều 26 (Bảo vệ thông tin)
                                                </a>
                                            </Typography>
                                            <Typography variant="body2" sx={{ mb: 0.5 }}>
                                                <a href="https://thuvienphapluat.vn/van-ban/Cong-nghe-thong-tin/Luat-an-toan-thong-tin-mang-2015-298365.aspx" target="_blank" rel="noopener noreferrer" style={{ color: '#1976d2' }}>
                                                    Luật ATTT mạng 2015 - Điều 7 (Xác thực danh tính)
                                                </a>
                                            </Typography>
                                            <Typography variant="body2" sx={{ mt: 1, color: '#2e7d32', fontWeight: 600 }}>
                                                TUÂN THỦ ĐẦY ĐỦ
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={12} md={6}>
                                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#1565c0', mb: 0.5 }}>
                                                Tiêu chuẩn quốc tế
                                            </Typography>
                                            <Typography variant="body2">
                                                ISO/IEC 27001:2022 - A.5.17
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                Authentication information
                                            </Typography>
                                            <Typography variant="body2" sx={{ mt: 0.5 }}>
                                                NIST 800-53 - IA-2 (User Identification)
                                            </Typography>
                                        </Grid>
                                    </Grid>
                                </CardContent>
                            </Card>

                            {/* Compliance Recommendations */}
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: '#424242' }}>
                                KHUYẾN NGHỊ TUÂN THỦ
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                                <Chip label="Ghi log SIEM" size="small" variant="outlined" color="success" />
                                <Chip label="Tuân thủ Luật ANM 2018" size="small" variant="outlined" color="success" />
                                <Chip label="Tuân thủ Luật ATTT 2015" size="small" variant="outlined" color="success" />
                                <Chip label="ISO 27001 A.5.17" size="small" variant="outlined" color="primary" />
                            </Box>
                        </>
                    )}

                    {/* Section 3: Raw Data */}
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: '#424242' }}>
                        📄 DỮ LIỆU RAW
                    </Typography>
                    <Card variant="outlined" sx={{ mb: 2, bgcolor: '#fafafa' }}>
                        <CardContent sx={{ py: 1.5 }}>
                            <Box sx={{ fontFamily: 'monospace', fontSize: '0.75rem', whiteSpace: 'pre-wrap', wordBreak: 'break-all', maxHeight: 150, overflow: 'auto' }}>
                                {JSON.stringify({
                                    id: selectedLog.id,
                                    timestamp: selectedLog.timestamp,
                                    user: successUser,
                                    role: selectedLog.role,
                                    action: selectedLog.action,
                                    status: selectedLog.status,
                                    ip_address: sourceIP,
                                    session_id: sessionId,
                                    realm: realm,
                                    auth_method: authMethod,
                                    rule_code: 'SYS-AUTH-01'
                                }, null, 2)}
                            </Box>
                        </CardContent>
                    </Card>
                </Box>

                <DialogActions sx={{ borderTop: '1px solid #e0e0e0', px: 3, py: 1.5 }}>
                    <Button onClick={onClose} variant="outlined" size="small">Đóng</Button>
                    <Button onClick={onClose} variant="contained" color="success" size="small">
                        Xác nhận đã xem
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }

    // --- BRUTE FORCE / AUTHENTICATION FAILURE VIEW ---
    // BYPASSED: Using unified template instead
    if (false && isBruteForce) {
        const authDetails = parseJsonSafe(selectedLog.details) || {};
        const status = parseInt(selectedLog.status) || 0;
        const isLocked = status === 423 || authDetails.account_locked;
        const errorType = authDetails.error || authDetails.message || (isLocked ? 'ACCOUNT_LOCKED' : 'AUTH_FAILURE');
        const failedUser = selectedLog.user || selectedLog.actor_name || 'Unknown';
        const sourceIP = selectedLog.source_ip || authDetails.ip_address || 'N/A';

        return (
            <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { minHeight: '60vh', p: 0 } }}>
                {/* Header - Orange/Red Theme (Security Event - Attack Detected) */}
                <Box sx={{ p: 2.5, background: isLocked ? 'linear-gradient(135deg, #c62828 0%, #ff5722 100%)' : 'linear-gradient(135deg, #e65100 0%, #ff9800 100%)', color: 'white' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box>
                            <Typography variant="h6" sx={{ fontWeight: 600, letterSpacing: 0.5 }}>
                                🔐 CẢNH BÁO XÁC THỰC
                            </Typography>
                            <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
                                Sự kiện #{selectedLog.id} • {formatTimestamp(selectedLog.timestamp)}
                            </Typography>
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                            <Chip
                                label={isLocked ? "🚫 TÀI KHOẢN BỊ KHÓA" : "⚠️ ĐĂNG NHẬP THẤT BẠI"}
                                sx={{ bgcolor: isLocked ? '#b71c1c' : '#e65100', color: 'white', fontWeight: 'bold', fontSize: '0.85rem' }}
                            />
                            <Typography variant="caption" sx={{ display: 'block', mt: 0.5, opacity: 0.9 }}>
                                {isLocked ? 'Brute Force detected - Account locked' : 'Authentication failure'}
                            </Typography>
                        </Box>
                    </Box>
                </Box>

                <Box sx={{ p: 3 }}>
                    {/* Section 1: Security Event Summary */}
                    <Card sx={{ mb: 2, border: '1px solid #ffccbc', bgcolor: isLocked ? '#ffebee' : '#fff3e0' }}>
                        <CardContent sx={{ py: 2 }}>
                            <Grid container spacing={2} alignItems="center">
                                <Grid item xs={12} md={8}>
                                    <Typography variant="subtitle2" color={isLocked ? 'error.dark' : 'warning.dark'} sx={{ fontWeight: 600, mb: 1 }}>
                                        {isLocked ? 'PHÁT HIỆN TẤN CÔNG BRUTE FORCE' : 'XÁC THỰC THẤT BẠI'}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {isLocked
                                            ? <>Hệ thống đã <strong>phát hiện</strong> nhiều lần đăng nhập thất bại liên tiếp và <strong>khóa tài khoản</strong> để ngăn chặn tấn công Brute Force.</>
                                            : <>Phát hiện <strong>đăng nhập thất bại</strong> cho tài khoản <strong>{failedUser}</strong>. Có thể do sai mật khẩu hoặc thiếu MFA.</>
                                        }
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'white', borderRadius: 1, border: isLocked ? '1px solid #ef9a9a' : '1px solid #ffe0b2' }}>
                                        <Chip label={isLocked ? "🔒 ĐÃ KHÓA" : "⚠️ CẢNH BÁO"} color={isLocked ? 'error' : 'warning'} sx={{ fontWeight: 'bold' }} />
                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                            {isLocked ? 'Tài khoản bị khóa tạm thời' : 'Cần giám sát'}
                                        </Typography>
                                    </Box>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>

                    {/* Section 2: Authentication Event Details */}
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: '#424242' }}>
                        📋 CHI TIẾT SỰ KIỆN XÁC THỰC
                    </Typography>
                    <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
                        <Table size="small">
                            <TableBody>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 600, width: '35%', bgcolor: '#f5f5f5' }}>Quy tắc phát hiện</TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Chip
                                                label={isLocked ? "SYS-AUTH-03" : "R-IAM-03"}
                                                size="small"
                                                color={isLocked ? "error" : "warning"}
                                            />
                                            <Typography variant="body2">
                                                {isLocked ? 'Brute Force Protection (System)' : 'MFA/Authentication Failure (User)'}
                                            </Typography>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 600, bgcolor: '#f5f5f5' }}>Tài khoản bị ảnh hưởng</TableCell>
                                    <TableCell>
                                        <Chip label={failedUser} size="small" color="primary" variant="outlined" />
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 600, bgcolor: '#f5f5f5' }}>Trạng thái tài khoản</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={isLocked ? "🔒 Đã khóa" : "⚠️ Đăng nhập thất bại"}
                                            size="small"
                                            color={isLocked ? "error" : "warning"}
                                        />
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 600, bgcolor: '#f5f5f5' }}>Loại lỗi</TableCell>
                                    <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.85rem', color: '#d32f2f' }}>
                                        {errorType}
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 600, bgcolor: '#f5f5f5' }}>Nguồn IP</TableCell>
                                    <TableCell sx={{ fontFamily: 'monospace' }}>{sourceIP}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 600, bgcolor: '#f5f5f5' }}>HTTP Status</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={`${status} ${status === 423 ? '(Locked)' : status === 401 ? '(Unauthorized)' : ''}`}
                                            size="small"
                                            color={status === 423 ? "error" : "warning"}
                                            variant="outlined"
                                        />
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </TableContainer>

                    {/* Section 2.5: TRẠNG THÁI VI PHẠM PHÁP LÝ - ONLY show in behavior-monitoring */}
                    {showComplianceSection && (
                        <>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: '#424242' }}>
                                TRẠNG THÁI VI PHẠM PHÁP LÝ
                            </Typography>
                            <Card sx={{ mb: 2, border: '1px solid #ffccbc', bgcolor: isLocked ? '#ffebee' : '#fff3e0' }}>
                                <CardContent sx={{ py: 2 }}>
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} md={6}>
                                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#c62828', mb: 0.5 }}>
                                                Vi phạm căn cứ pháp lý
                                            </Typography>
                                            <Typography variant="body2" sx={{ mb: 0.5 }}>
                                                <a href="https://thuvienphapluat.vn/van-ban/Cong-nghe-thong-tin/Luat-an-ninh-mang-2018-351416.aspx" target="_blank" rel="noopener noreferrer" style={{ color: '#1976d2' }}>
                                                    Luật An ninh mạng 2018 - Điều 8 (Hành vi bị cấm)
                                                </a>
                                            </Typography>
                                            <Typography variant="body2" sx={{ mb: 0.5 }}>
                                                <a href="https://thuvienphapluat.vn/van-ban/Cong-nghe-thong-tin/Nghi-dinh-15-2020-ND-CP-xu-phat-vi-pham-hanh-chinh-linh-vuc-buu-chinh-vien-thong-tan-so-vo-tuyen-dien-350499.aspx" target="_blank" rel="noopener noreferrer" style={{ color: '#1976d2' }}>
                                                    NĐ 15/2020/NĐ-CP - Điều 99-102
                                                </a>
                                            </Typography>
                                            <Typography variant="body2" sx={{ mt: 1, color: '#c62828', fontWeight: 600, fontSize: '0.75rem' }}>
                                                Mức phạt (NĐ 15/2020):<br />
                                                • Đ.99: Vi phạm ATTT (5-70 triệu)<br />
                                                • Đ.100: Tấn công mạng (30-50 triệu)<br />
                                                • Đ.101: Bẻ khóa mật khẩu (10-20 triệu)<br />
                                                • Đ.102: Phát tán mã độc (30-50 triệu)
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={12} md={6}>
                                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#e65100', mb: 0.5 }}>
                                                Vi phạm tiêu chuẩn quốc tế
                                            </Typography>
                                            <Typography variant="body2">
                                                ISO/IEC 27001:2022 - A.5.17
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                Authentication information
                                            </Typography>
                                            <Typography variant="body2" sx={{ mt: 0.5 }}>
                                                NIST 800-53 - IA-5 (Authenticator Management)
                                            </Typography>
                                        </Grid>
                                    </Grid>
                                </CardContent>
                            </Card>

                            {/* Violation Recommendations */}
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: '#424242' }}>
                                KHUYẾN NGHỊ XỬ LÝ
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                                <Chip label="Điều tra nguồn gốc" size="small" variant="outlined" color="error" />
                                <Chip label="Báo cáo sự cố ANM" size="small" variant="outlined" color="warning" />
                                <Chip label={isLocked ? "Mở khóa sau xác minh" : "Đổi mật khẩu ngay"} size="small" variant="outlined" color="warning" />
                                <Chip label="Xem xét chính sách MFA" size="small" variant="outlined" color="primary" />
                            </Box>
                        </>
                    )}

                    {/* Section 3: Raw Data */}
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: '#424242' }}>
                        📄 DỮ LIỆU RAW
                    </Typography>
                    <Card variant="outlined" sx={{ mb: 2, bgcolor: '#fafafa' }}>
                        <CardContent sx={{ py: 1.5 }}>
                            <Box sx={{ fontFamily: 'monospace', fontSize: '0.75rem', whiteSpace: 'pre-wrap', wordBreak: 'break-all', maxHeight: 200, overflow: 'auto' }}>
                                {JSON.stringify({
                                    id: selectedLog.id,
                                    timestamp: selectedLog.timestamp,
                                    user: selectedLog.user || selectedLog.actor_name || selectedLog.username,
                                    role: selectedLog.role,
                                    action: selectedLog.action,
                                    operation: selectedLog.operation,
                                    method: selectedLog.method,
                                    status: selectedLog.status,
                                    uri: selectedLog.uri,
                                    ip_address: selectedLog.ip_address || selectedLog.source_ip,
                                    user_agent: selectedLog.user_agent,
                                    log_type: selectedLog.log_type,
                                    details: authDetails
                                }, null, 2)}
                            </Box>
                        </CardContent>
                    </Card>
                </Box>

                <DialogActions sx={{ borderTop: '1px solid #e0e0e0', px: 3, py: 1.5 }}>
                    <Button onClick={onClose} variant="outlined" size="small">Đóng</Button>
                    <Button onClick={onClose} variant="contained" color={isLocked ? "error" : "warning"} size="small">
                        {isLocked ? 'Kiểm tra tài khoản' : 'Xác nhận đã xem'}
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }

    // --- SIEM LOG TAMPERING VIEW (R-AUD-01 / SIEM_WATCHDOG) - NEW DESIGN ---
    // BYPASSED: Using unified template instead
    if (false && isSIEMLogTampering) {
        const siemDetails = parseJsonSafe(selectedLog.details) || {};
        const tamperedAt = formatTimestamp(selectedLog.timestamp);
        const alertMessage = selectedLog.action || siemDetails.message || 'Phát hiện xóa dấu vết (Log Tampering)';

        return (
            <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { minHeight: '60vh', p: 0 } }}>
                {/* Header - Dark Red Theme (Critical Security Event) */}
                <Box sx={{ p: 2.5, background: 'linear-gradient(135deg, #b71c1c 0%, #e53935 100%)', color: 'white' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box>
                            <Typography variant="h6" sx={{ fontWeight: 600, letterSpacing: 0.5 }}>
                                🚨 VI PHẠM TÍNH TOÀN VẸN HỆ THỐNG
                            </Typography>
                            <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
                                Sự kiện #{selectedLog.id} • {tamperedAt}
                            </Typography>
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                            <Chip
                                label="⚠️ CRITICAL"
                                sx={{ bgcolor: '#ffcdd2', color: '#b71c1c', fontWeight: 'bold', fontSize: '0.85rem' }}
                            />
                            <Typography variant="caption" sx={{ display: 'block', mt: 0.5, opacity: 0.9 }}>
                                Cần xử lý ngay
                            </Typography>
                        </Box>
                    </Box>
                </Box>

                <Box sx={{ p: 3 }}>
                    {/* Section 1: Alert Summary */}
                    <Card sx={{ mb: 2, border: '2px solid #ffcdd2', bgcolor: '#ffebee' }}>
                        <CardContent sx={{ py: 2 }}>
                            <Grid container spacing={2} alignItems="center">
                                <Grid item xs={12} md={8}>
                                    <Typography variant="subtitle2" color="error" sx={{ fontWeight: 600, mb: 1 }}>
                                        PHÁT HIỆN XÓA DẤU VẾT (LOG TAMPERING)
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Hệ thống SIEM Watchdog phát hiện chức năng ghi nhật ký đã bị vô hiệu hóa.
                                        Đây là dấu hiệu kẻ tấn công đang cố che giấu hoạt động trái phép.
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'white', borderRadius: 1, border: '1px solid #ef9a9a' }}>
                                        <Chip label="⚠️ CẢNH BÁO" color="error" sx={{ fontWeight: 'bold' }} />
                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>Cần giám sát</Typography>
                                    </Box>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>

                    {/* Section 2: Event Details */}
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: '#424242' }}>
                        📋 CHI TIẾT SỰ KIỆN XÁC THỰC
                    </Typography>
                    <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
                        <Table size="small">
                            <TableBody>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 600, width: '35%', bgcolor: '#f5f5f5' }}>Quy tắc phát hiện</TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Chip label="R-AUD-01" size="small" color="error" />
                                            <Typography variant="body2">Phát hiện xóa dấu vết (Log Tampering)</Typography>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 600, bgcolor: '#f5f5f5' }}>Tài khoản bị ảnh hưởng</TableCell>
                                    <TableCell>
                                        <Chip label={selectedLog.user || 'SIEM_WATCHDOG'} size="small" color="primary" variant="outlined" />
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 600, bgcolor: '#f5f5f5' }}>Trạng thái tài khoản</TableCell>
                                    <TableCell>
                                        <Chip label="⚠️ Đang giám sát" size="small" sx={{ bgcolor: '#fff3e0', color: '#e65100' }} />
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 600, bgcolor: '#f5f5f5' }}>Loại lỗi</TableCell>
                                    <TableCell sx={{ color: '#d32f2f', fontWeight: 500 }}>LOG_TAMPERING</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 600, bgcolor: '#f5f5f5' }}>Nguồn IP</TableCell>
                                    <TableCell sx={{ fontFamily: 'monospace' }}>{selectedLog.source_ip || siemDetails.ip_address || 'N/A'}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 600, bgcolor: '#f5f5f5' }}>HTTP Status</TableCell>
                                    <TableCell>
                                        <Chip label={selectedLog.status || '200'} size="small" variant="outlined" />
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </TableContainer>

                    {/* Section 3: Legal Compliance - Only in behavior-monitoring */}
                    {showComplianceSection && (
                        <>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: '#d32f2f' }}>
                                TRẠNG THÁI VI PHẠM PHÁP LÝ
                            </Typography>
                            <Card sx={{ mb: 2, border: '1px solid #ef9a9a', bgcolor: '#ffebee' }}>
                                <CardContent sx={{ py: 2 }}>
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} md={6}>
                                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#c62828', mb: 0.5 }}>
                                                Vi phạm căn cứ pháp lý
                                            </Typography>
                                            <Typography variant="body2" sx={{ mb: 0.5 }}>
                                                <a href="https://thuvienphapluat.vn/van-ban/Cong-nghe-thong-tin/Luat-an-ninh-mang-2018-351416.aspx" target="_blank" rel="noopener noreferrer" style={{ color: '#1976d2' }}>
                                                    Luật An ninh mạng 2018 - Điều 8 (Hành vi bị cấm)
                                                </a>
                                            </Typography>
                                            <Typography variant="body2" sx={{ mb: 0.5 }}>
                                                <a href="https://thuvienphapluat.vn/van-ban/Vi-pham-hanh-chinh/Nghi-dinh-15-2020-ND-CP-xu-phat-vi-pham-hanh-chinh-linh-vuc-buu-chinh-vien-thong-tan-so-vo-tuyen-dien-350499.aspx" target="_blank" rel="noopener noreferrer" style={{ color: '#1976d2' }}>
                                                    NĐ 15/2020/NĐ-CP - Điều 99-102
                                                </a>
                                            </Typography>
                                            <Typography variant="body2" sx={{ mt: 1 }}>
                                                <strong>Mức phạt NĐ 15/2020:</strong>
                                            </Typography>
                                            <Box component="ul" sx={{ m: 0, pl: 2, '& li': { fontSize: '0.85rem', color: '#c62828' } }}>
                                                <li>Vi phạm ATTT (5-70 triệu)</li>
                                                <li>D.100: Tấn công mạng (30-50 triệu)</li>
                                                <li>D.101: Đe khoá mật khẩu (10-30 triệu)</li>
                                                <li>D.102: Phát tán mã độc (30-50 triệu)</li>
                                            </Box>
                                        </Grid>
                                        <Grid item xs={12} md={6}>
                                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#1565c0', mb: 0.5 }}>
                                                Vi phạm tiêu chuẩn quốc tế
                                            </Typography>
                                            <Typography variant="body2">
                                                ISO/IEC 27001:2022 - A.5.17
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                Authentication information
                                            </Typography>
                                            <Typography variant="body2" sx={{ mt: 0.5 }}>
                                                NIST 800-53 - IA-5 (Authenticator Management)
                                            </Typography>
                                        </Grid>
                                    </Grid>
                                </CardContent>
                            </Card>

                            {/* Section 4: Recommended Actions */}
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: '#ff6f00' }}>
                                KHUYẾN NGHỊ XỬ LÝ
                            </Typography>
                            <Card variant="outlined" sx={{ mb: 2, borderColor: '#ffb74d' }}>
                                <CardContent sx={{ py: 1.5 }}>
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                        <Chip label="Điều tra nguồn gốc" size="small" sx={{ bgcolor: '#e3f2fd', color: '#1565c0' }} />
                                        <Chip label="Báo cáo sự cố ARM" size="small" sx={{ bgcolor: '#fff3e0', color: '#e65100' }} />
                                        <Chip label="Cài mật khẩu ngay" size="small" sx={{ bgcolor: '#ffebee', color: '#c62828' }} />
                                        <Chip label="Xem xét chính sách MFA" size="small" sx={{ bgcolor: '#f3e5f5', color: '#7b1fa2' }} />
                                    </Box>
                                </CardContent>
                            </Card>
                        </>
                    )}

                    {/* Section 5: Raw Data */}
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: '#424242' }}>
                        📄 DỮ LIỆU RAW
                    </Typography>
                    <Card variant="outlined" sx={{ mb: 2, bgcolor: '#fafafa' }}>
                        <CardContent sx={{ py: 1.5 }}>
                            <Box sx={{ fontFamily: 'monospace', fontSize: '0.75rem', whiteSpace: 'pre-wrap', wordBreak: 'break-all', maxHeight: 150, overflow: 'auto' }}>
                                {JSON.stringify({
                                    id: selectedLog.id,
                                    timestamp: selectedLog.timestamp,
                                    user: selectedLog.user,
                                    role: selectedLog.role,
                                    action: selectedLog.action,
                                    status: selectedLog.status,
                                    ip_address: selectedLog.source_ip,
                                    rule_code: 'R-AUD-01',
                                    log_type: 'LOG_TAMPERING',
                                    details: siemDetails
                                }, null, 2)}
                            </Box>
                        </CardContent>
                    </Card>
                </Box>

                <DialogActions sx={{ borderTop: '1px solid #e0e0e0', px: 3, py: 1.5 }}>
                    <Button onClick={onClose} variant="outlined" size="small">Đóng</Button>
                    <Button onClick={onClose} variant="contained" color="error" size="small">
                        Đã xử lý sự cố
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }

    // --- SECURITY ALERT VIEW (Image 2 Style) ---
    // BYPASSED: Using unified template instead
    if (false && (isViolation || isSQLi) && !isBruteForce) {
        return (
            <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth PaperProps={{ sx: { minHeight: '85vh', p: 0 } }}>
                <Box sx={{ p: 0 }}>
                    {/* Header Section */}
                    <Box sx={{ p: 3, borderBottom: '1px solid #f0f0f0' }}>
                        <Typography variant="h5" sx={{ color: '#d32f2f', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                            CẢNH BÁO AN NINH (Security Alert)
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#666', mt: 0.5 }}>
                            Phát hiện hoạt động bất thường có dấu hiệu tấn công vào hệ thống.
                        </Typography>

                        <Grid container spacing={2} sx={{ mt: 2 }}>
                            <Grid item xs={12} md={6}>
                                <Typography variant="caption" color="text.secondary">Người dùng & vai trò</Typography>
                                <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                                    <Chip label={selectedLog.user || 'unknown'} color="error" size="small" sx={{ fontWeight: 'bold' }} />
                                    <Chip label={selectedLog.role || 'system'} variant="outlined" size="small" />
                                </Box>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Typography variant="caption" color="text.secondary">Nguồn log</Typography>
                                <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
                                    {selectedLog.uri || '/admin/login'}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    IP: {selectedLog.source_ip || '127.0.0.1'} | User-agent: {selectedLog.user_agent?.substring(0, 20) || 'Keycloak'}...
                                </Typography>
                            </Grid>
                        </Grid>
                    </Box>

                    {/* Forensic Trace Section (If available - e.g. for FIM/Log Erasure/Brute Force) */}
                    {(() => {
                        const details = typeof selectedLog.details === 'string' ? (JSON.parse(selectedLog.details || '{}') || {}) : (selectedLog.details || {});

                        // Try to get captured_queries from multiple sources:
                        // 1. Direct from details (from behavior-monitoring API after fix)
                        // 2. From log_snapshot.details (nested in behavior-monitoring response)
                        // 3. From details directly (security-monitoring raw log)
                        const logSnapshotDetails = details.log_snapshot?.details || {};
                        const capturedQueries = details.captured_queries ||
                            logSnapshotDetails.captured_queries ||
                            [];

                        console.log('[FORENSIC_TRACE] selectedLog.details:', selectedLog.details);
                        console.log('[FORENSIC_TRACE] capturedQueries found:', capturedQueries);

                        const ruleCode = correctedViolatedRules?.[0]?.rule_code || selectedLog.rule_code || details.rule_code || logSnapshotDetails.rule_code;
                        // Skip Brute Force forensic view for WAF logs
                        const isBruteForce = ruleCode === 'SYS-AUTH-03' && !isWAF;

                        // For Brute Force attacks - show login attempt forensics
                        if (isBruteForce) {
                            const failureCount = details.failure_count || details.consecutive_failures || 4;
                            const failedAttempts = details.failed_attempts || details.login_attempts || [];
                            const timestamp = selectedLog.timestamp || details.timestamp;
                            const user = selectedLog.user || selectedLog.username || 'unknown';
                            const sourceIp = selectedLog.source_ip || selectedLog.ip_address || details.ip_address || '127.0.0.1';

                            // Generate forensic trace entries
                            const forensicEntries = [];
                            if (Array.isArray(failedAttempts) && failedAttempts.length > 0) {
                                failedAttempts.forEach((attempt, idx) => {
                                    forensicEntries.push({
                                        timestamp: attempt.timestamp || attempt.time || 'N/A',
                                        action: `LOGIN_FAILED`,
                                        user: attempt.user || user,
                                        ip: attempt.ip || sourceIp,
                                        error: attempt.error || 'invalid_user_credentials'
                                    });
                                });
                            } else {
                                // Generate synthetic entries based on failure count
                                for (let i = 0; i < Math.min(failureCount, 5); i++) {
                                    forensicEntries.push({
                                        timestamp: timestamp ? dayjs(timestamp).subtract(i * 30, 'second').format('YYYY-MM-DD HH:mm:ss') : 'N/A',
                                        action: `LOGIN_FAILED`,
                                        user: user,
                                        ip: sourceIp,
                                        error: 'invalid_user_credentials'
                                    });
                                }
                            }

                            return (
                                <Box sx={{ px: 3, pt: 2, pb: 0 }}>
                                    <Box sx={{ bgcolor: '#1e1e1e', color: '#e0e0e0', p: 2, borderRadius: 1, border: '1px solid #333' }}>
                                        <Typography variant="subtitle2" sx={{ color: '#bdbdbd', mb: 1, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <ManageSearchIcon fontSize="small" /> TRUY VẾT HÀNH VI (FORENSIC TRACE):
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: '#757575', display: 'block', mb: 1 }}>
                                            Các lần thử đăng nhập thất bại liên tiếp (Brute Force Detection)
                                        </Typography>
                                        <Box sx={{ fontFamily: 'monospace', fontSize: '0.8rem', overflowX: 'auto', maxHeight: '200px', overflowY: 'auto' }}>
                                            {forensicEntries.map((entry, idx) => (
                                                <Box key={idx} sx={{ mb: 0.5, display: 'flex', flexWrap: 'wrap' }}>
                                                    <span style={{ color: '#4caf50', marginRight: '8px' }}>[{entry.timestamp}]</span>
                                                    <span style={{ color: '#ef5350', marginRight: '8px' }}>{entry.action}</span>
                                                    <span style={{ color: '#90caf9' }}>user={entry.user}</span>
                                                    <span style={{ color: '#fff', marginLeft: '8px' }}>IP={entry.ip}</span>
                                                    <span style={{ color: '#ffab91', marginLeft: '8px' }}>error="{entry.error}"</span>
                                                </Box>
                                            ))}
                                            <Box sx={{ mt: 1, pt: 1, borderTop: '1px solid #444' }}>
                                                <span style={{ color: '#f44336' }}>⚠️ Phát hiện {failureCount}+ lần thử liên tiếp từ IP {sourceIp}</span>
                                            </Box>
                                        </Box>
                                    </Box>
                                </Box>
                            );
                        }

                        // For FIM/other logs with captured_queries
                        if (capturedQueries && Array.isArray(capturedQueries) && capturedQueries.length > 0) {
                            // Parse captured_queries - support both string format (legacy) and object format
                            const parsedQueries = capturedQueries.map((q, idx) => {
                                // If already object format
                                if (typeof q === 'object' && q !== null) {
                                    return q;
                                }
                                // If string format: "[timestamp] user@host: query"
                                if (typeof q === 'string') {
                                    // Parse format: "[2025-12-16 08:19:48.838084] root[root] @ localhost []: SELECT ..."
                                    const timestampMatch = q.match(/^\[([^\]]+)\]/);
                                    const timestamp = timestampMatch ? timestampMatch[1] : 'N/A';
                                    const rest = timestampMatch ? q.substring(timestampMatch[0].length).trim() : q;

                                    // Parse user@host part
                                    const userHostMatch = rest.match(/^([^\s:]+)\s*:\s*/);
                                    let user = 'root';
                                    let host = 'localhost';
                                    let query = rest;

                                    if (userHostMatch) {
                                        const userHost = userHostMatch[1];
                                        // Format like "root[root] @ localhost []"
                                        const userMatch = userHost.match(/^([^\[]+)/);
                                        if (userMatch) user = userMatch[1].trim();
                                        if (userHost.includes('@')) {
                                            const hostMatch = userHost.match(/@\s*([^\s\[]+)/);
                                            if (hostMatch) host = hostMatch[1];
                                        }
                                        query = rest.substring(userHostMatch[0].length);
                                    }

                                    return { timestamp, user, host, query };
                                }
                                return { timestamp: 'N/A', user: 'unknown', host: 'unknown', query: String(q) };
                            });

                            return (
                                <Box sx={{ px: 3, pt: 2, pb: 0 }}>
                                    <Box sx={{ bgcolor: '#1e1e1e', color: '#e0e0e0', p: 2, borderRadius: 1, border: '1px solid #333' }}>
                                        <Typography variant="subtitle2" sx={{ color: '#bdbdbd', mb: 1, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <ManageSearchIcon fontSize="small" /> TRUY VẾT HÀNH VI (FORENSIC TRACE):
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: '#757575', display: 'block', mb: 1 }}>
                                            Captured SQL Queries (Pre-Blackout)
                                        </Typography>
                                        <Box sx={{ fontFamily: 'monospace', fontSize: '0.8rem', overflowX: 'auto', maxHeight: '200px', overflowY: 'auto' }}>
                                            {parsedQueries.map((q, idx) => (
                                                <Box key={idx} sx={{ mb: 0.5, display: 'flex', flexWrap: 'wrap' }}>
                                                    <span style={{ color: '#4caf50', marginRight: '8px' }}>[{q.timestamp || 'N/A'}]</span>
                                                    <span style={{ color: '#90caf9' }}>{q.user || 'root'}@{q.host || 'localhost'}</span>
                                                    <span style={{ color: '#fff', marginLeft: '8px' }}>: {q.query}</span>
                                                </Box>
                                            ))}
                                        </Box>
                                    </Box>
                                </Box>
                            );
                        }

                        // For FIM logs without captured_queries - show FIM incident trace with notice
                        const isFIMLog = (selectedLog?.uri || '').includes('file_integrity') ||
                            details.rule_code === 'SYS-FIM-01' ||
                            details.event_type === 'SECURITY_INCIDENT';
                        if (isFIMLog) {
                            const violationReasons = details.violation_reasons || ['File integrity violation detected'];
                            const message = details.message || selectedLog.action || 'Phát hiện thay đổi trái phép tập tin hệ thống';
                            const severity = details.severity || 'CRITICAL';
                            const timestamp = selectedLog.timestamp || details.timestamp;

                            // Create forensic trace entries from FIM details
                            const forensicEntries = [];

                            // Add file deletion/modification event
                            forensicEntries.push({
                                timestamp: timestamp ? dayjs(timestamp).format('YYYY-MM-DD HH:mm:ss') : 'N/A',
                                action: 'FILE_DELETED',
                                target: (selectedLog?.uri || '').replace('internal/watchdog/', ''),
                                severity: severity,
                                actor: selectedLog.user || 'unknown'
                            });

                            // Add violation reasons as trace events
                            violationReasons.forEach((reason, idx) => {
                                forensicEntries.push({
                                    timestamp: timestamp ? dayjs(timestamp).subtract((idx + 1) * 10, 'second').format('YYYY-MM-DD HH:mm:ss') : 'N/A',
                                    action: 'VIOLATION_DETECTED',
                                    target: reason,
                                    severity: 'WARNING',
                                    actor: 'SIEM_WATCHDOG'
                                });
                            });

                            return (
                                <Box sx={{ px: 3, pt: 2, pb: 0 }}>
                                    <Box sx={{ bgcolor: '#1e1e1e', color: '#e0e0e0', p: 2, borderRadius: 1, border: '1px solid #333' }}>
                                        <Typography variant="subtitle2" sx={{ color: '#bdbdbd', mb: 1, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <ManageSearchIcon fontSize="small" /> TRUY VẾT HÀNH VI (FORENSIC TRACE):
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: '#757575', display: 'block', mb: 1 }}>
                                            File Integrity Monitoring - Sự cố phát hiện
                                        </Typography>
                                        <Box sx={{ fontFamily: 'monospace', fontSize: '0.8rem', overflowX: 'auto', maxHeight: '200px', overflowY: 'auto' }}>
                                            {forensicEntries.map((entry, idx) => (
                                                <Box key={idx} sx={{ mb: 0.5, display: 'flex', flexWrap: 'wrap' }}>
                                                    <span style={{ color: '#4caf50', marginRight: '8px' }}>[{entry.timestamp}]</span>
                                                    <span style={{ color: entry.action === 'FILE_DELETED' ? '#f44336' : '#ff9800', marginRight: '8px' }}>{entry.action}</span>
                                                    <span style={{ color: '#90caf9' }}>target="{entry.target}"</span>
                                                    <span style={{ color: '#fff', marginLeft: '8px' }}>actor={entry.actor}</span>
                                                </Box>
                                            ))}
                                            <Box sx={{ mt: 1, pt: 1, borderTop: '1px solid #444' }}>
                                                <span style={{ color: '#f44336' }}>⚠️ {message}</span>
                                            </Box>
                                            {/* Notice about SQL queries */}
                                            <Box sx={{ mt: 1, pt: 1, borderTop: '1px solid #333', display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <span style={{ color: '#ff9800' }}>ℹ️</span>
                                                <span style={{ color: '#9e9e9e', fontSize: '0.75rem' }}>
                                                    Captured SQL Queries: Log này được tạo trước khi hệ thống thu thập SQL queries.
                                                    Các sự kiện FIM mới sẽ bao gồm đầy đủ SQL forensic data.
                                                </span>
                                            </Box>
                                        </Box>
                                    </Box>
                                </Box>
                            );
                        }

                        return null;
                    })()}

                    {/* Attack Details Section */}
                    <Box sx={{ p: 3 }}>
                        <Card variant="outlined" sx={{ borderColor: '#d32f2f' }}>
                            <CardHeader
                                title="CHI TIẾT TẤN CÔNG (ATTACK DETAILS)"
                                titleTypographyProps={{ variant: 'subtitle1', fontWeight: 'bold', color: '#b71c1c' }}
                                sx={{ bgcolor: '#ffebee', py: 1.5 }}
                            />
                            <CardContent>
                                <Grid container spacing={3}>
                                    <Grid item xs={12} md={6}>
                                        <Typography variant="subtitle2" fontWeight="bold">Mục đích tấn công:</Typography>
                                        <Typography variant="body2" color="#d32f2f">
                                            {(() => {
                                                const ruleCode = correctedViolatedRules?.[0]?.rule_code || selectedLog.rule_code;
                                                if (ruleCode === 'SYS-AUTH-03') return 'Cố gắng truy cập hệ thống trái phép (Brute Force)';
                                                if (isFIM) return 'Thay đổi trái phép tập tin cấu hình hệ thống';
                                                // For SQLi - detect type from payload
                                                if (isSQLi) {
                                                    const uri = (selectedLog.uri || '').toUpperCase();
                                                    if (uri.includes('UNION') || uri.includes('SELECT')) {
                                                        return 'Trích xuất dữ liệu trái phép (Data Extraction)';
                                                    }
                                                    if (uri.includes('OR') && (uri.includes('1=1') || uri.includes("'1'"))) {
                                                        return 'Tấn công vượt qua xác thực (Authentication Bypass)';
                                                    }
                                                    if (uri.includes('DROP') || uri.includes('DELETE') || uri.includes('TRUNCATE')) {
                                                        return 'Xóa dấu vết hệ thống (Log Tampering)';
                                                    }
                                                    return 'Tiêm mã SQL vào hệ thống (SQL Injection)';
                                                }
                                                return selectedLog.attack_purpose || 'Truy cập trái phép vào dữ liệu nhạy cảm';
                                            })()}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <Typography variant="subtitle2" fontWeight="bold">Loại tấn công:</Typography>
                                        <Typography variant="body2">
                                            {(() => {
                                                if (correctedViolatedRules && correctedViolatedRules.length > 0 && correctedViolatedRules[0].rule_code === 'SYS-AUTH-03' && !isWAF) return 'Brute Force Attack';

                                                if (isSQLi) {
                                                    const uriUpper = (selectedLog.uri || '').toUpperCase();
                                                    if (uriUpper.includes('DELETE') || uriUpper.includes('TRUNCATE') || uriUpper.includes('DROP') || uriUpper.includes('LOG')) {
                                                        return 'Log Tampering (Xóa dấu vết)';
                                                    }
                                                    return 'SQL Injection (Tiêm mã độc SQL)';
                                                }
                                                if (isFIM) return 'File Integrity Violation';
                                                return selectedLog.attack_type || 'Unauthorized Access';
                                            })()}
                                        </Typography>
                                    </Grid>

                                    <Divider sx={{ width: '100%', my: 1 }} />

                                    <Grid item xs={12} md={6}>
                                        <Typography variant="subtitle2" fontWeight="bold">Quy tắc vi phạm:</Typography>
                                        <Typography variant="body2">
                                            {correctedViolatedRules && correctedViolatedRules.length > 0 ? `${correctedViolatedRules[0].rule_code} - ${correctedViolatedRules[0].rule_name}` : (selectedLog.rule_code || 'R-SEC-01 - Input Validation (Chống tấn công)')}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <Typography variant="subtitle2" fontWeight="bold">Căn cứ pháp lý:</Typography>
                                        {(() => {
                                            const basis = (correctedViolatedRules && correctedViolatedRules.length > 0 ? correctedViolatedRules[0].legal_basis : selectedLog.legal_basis) || 'Luật ATTTM 2015 - Điều 24';
                                            const url = (correctedViolatedRules && correctedViolatedRules.length > 0 ? correctedViolatedRules[0].law_url : selectedLog.law_url) || 'https://vanban.chinhphu.vn/defaul.aspx?pageid=27160&vid=119460';

                                            return url ? (
                                                <Link href={url} target="_blank" rel="noopener noreferrer" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, fontWeight: 'bold' }}>
                                                    {basis} <OpenInNewIcon fontSize="inherit" />
                                                </Link>
                                            ) : (
                                                <Typography variant="body2" color="primary">{basis}</Typography>
                                            );
                                        })()}
                                    </Grid>

                                    <Grid item xs={12} md={6}>
                                        <Typography variant="subtitle2" fontWeight="bold" sx={{ color: '#424242' }}>Mức xử phạt (Tham khảo):</Typography>
                                        <Typography variant="body2" color="#d32f2f" sx={{ fontWeight: 500 }}>
                                            {(() => {
                                                // For SYS-AUTH-03 (Brute Force), always show correct NĐ 13/2023 penalty
                                                const ruleCode = correctedViolatedRules?.[0]?.rule_code || selectedLog.rule_code;
                                                if (ruleCode === 'SYS-AUTH-03') {
                                                    return 'Phạt tiền 40 - 60 triệu VNĐ (Nghị định 13/2023/NĐ-CP, Điều 27)';
                                                }
                                                // For SQLi/other attacks
                                                if (isSQLi) {
                                                    return 'Phạt tiền 50 - 70 triệu VNĐ hoặc Tù 2-7 năm (Điều 289 BLHS 2015)';
                                                }
                                                // Fallback to rule penalty or default
                                                return violatedRules?.[0]?.penalty_level || 'Phạt tiền 40 - 60 triệu VNĐ (Nghị định 13/2023/NĐ-CP)';
                                            })()}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <Typography variant="subtitle2" fontWeight="bold" sx={{ color: '#424242' }}>Dữ liệu liên quan:</Typography>
                                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                                            {(() => {
                                                // For SYS-AUTH-03 (Brute Force), show relevant context fields
                                                const ruleCode = violatedRules?.[0]?.rule_code || selectedLog.rule_code;
                                                if (ruleCode === 'SYS-AUTH-03') {
                                                    return ['user_id', 'source_ip', 'timestamp', 'failure_count'].map(f => (
                                                        <Chip key={f} label={f} size="small" variant="outlined" color="error" sx={{ fontSize: '0.75rem' }} />
                                                    ));
                                                }
                                                // For SQLi (R-SEC-01), show fields from rule definition: user, action, uri
                                                if (isSQLi || ruleCode === 'R-SEC-01') {
                                                    return ['user', 'action', 'uri'].map(f => (
                                                        <Chip key={f} label={f} size="small" variant="outlined" color="error" sx={{ fontSize: '0.75rem' }} />
                                                    ));
                                                }
                                                // Default fields
                                                return ['user_id', 'source_ip', 'status'].map(f => (
                                                    <Chip key={f} label={f} size="small" variant="outlined" color="error" sx={{ fontSize: '0.75rem' }} />
                                                ));
                                            })()}
                                        </Box>
                                    </Grid>

                                    <Grid item xs={12}>
                                        <Typography variant="subtitle2" fontWeight="bold">Hành động ngăn chặn:</Typography>
                                        <Chip
                                            icon={<WarningIcon />}
                                            label="Đã phát hiện & Cảnh báo"
                                            sx={{ bgcolor: '#ff9800', color: 'white', fontWeight: 'bold', mt: 0.5 }}
                                        />
                                    </Grid>

                                    <Grid item xs={12} sx={{ mt: 2 }}>
                                        <Typography variant="subtitle2" fontWeight="bold" gutterBottom sx={{ color: '#424242' }}>
                                            {(() => {
                                                const ruleCode = correctedViolatedRules?.[0]?.rule_code || selectedLog.rule_code;
                                                if (ruleCode === 'SYS-AUTH-03') return 'CHI TIẾT SỰ KIỆN:';
                                                if (isFIM) return 'CHI TIẾT SỰ CỐ:';
                                                if (isSQLi) return 'PAYLOAD TẤN CÔNG:';
                                                return 'CHI TIẾT:';
                                            })()}
                                        </Typography>
                                        <Box sx={{ bgcolor: '#1e1e1e', color: '#e0e0e0', p: 2, borderRadius: 1, fontFamily: 'monospace', fontSize: '0.85rem' }}>
                                            {(() => {
                                                const ruleCode = correctedViolatedRules?.[0]?.rule_code || selectedLog.rule_code;
                                                const details = parseJsonSafe(selectedLog.details) || {};

                                                // For Brute Force, show formatted event details
                                                if (ruleCode === 'SYS-AUTH-03') {
                                                    const failureCount = details.failure_count || details.consecutive_failures || '≥4';
                                                    const error = details.error || details.failure_reason || 'invalid_user_credentials';
                                                    return (
                                                        <Box sx={{ lineHeight: 1.8 }}>
                                                            <Box>• <strong>Số lần thất bại liên tiếp:</strong> {failureCount}</Box>
                                                            <Box>• <strong>Thời gian:</strong> {formatTimestamp(selectedLog.timestamp)}</Box>
                                                            <Box>• <strong>IP nguồn:</strong> {selectedLog.source_ip || details.ip_address || 'N/A'}</Box>
                                                            <Box>• <strong>Lỗi:</strong> {error}</Box>
                                                            <Box>• <strong>User Agent:</strong> {(selectedLog.user_agent || 'N/A').substring(0, 60)}...</Box>
                                                        </Box>
                                                    );
                                                }

                                                // For FIM (File Integrity Monitoring), show detailed incident info
                                                if (isFIM) {
                                                    const message = details.message || 'Phát hiện thay đổi trái phép tập tin hệ thống';
                                                    const violationReasons = details.violation_reasons || [];
                                                    const severity = details.severity || 'CRITICAL';
                                                    const eventType = details.event_type || 'SECURITY_INCIDENT';
                                                    return (
                                                        <Box sx={{ lineHeight: 1.8 }}>
                                                            <Box>• <strong>Loại sự cố:</strong> <span style={{ color: '#ef5350' }}>{eventType}</span></Box>
                                                            <Box>• <strong>Mô tả:</strong> {message}</Box>
                                                            <Box>• <strong>Mức độ nghiêm trọng:</strong> <span style={{ color: severity === 'CRITICAL' ? '#f44336' : '#ff9800' }}>{severity}</span></Box>
                                                            <Box>• <strong>Thời gian phát hiện:</strong> {formatTimestamp(selectedLog.timestamp || details.timestamp)}</Box>
                                                            {violationReasons.length > 0 && (
                                                                <Box sx={{ mt: 1 }}>
                                                                    <strong>Lý do vi phạm:</strong>
                                                                    <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                                                                        {violationReasons.map((reason, idx) => (
                                                                            <li key={idx} style={{ color: '#ffab91' }}>{reason}</li>
                                                                        ))}
                                                                    </ul>
                                                                </Box>
                                                            )}
                                                            <Box>• <strong>Hành động:</strong> {selectedLog.action || 'Phát hiện xóa file log'}</Box>
                                                        </Box>
                                                    );
                                                }

                                                // For SQLi, show the payload
                                                if (isSQLi) {
                                                    const uri = selectedLog.uri || '';
                                                    // Extract query string
                                                    const queryPart = uri.includes('?') ? uri.split('?')[1] : uri;
                                                    return (
                                                        <Box sx={{ wordBreak: 'break-all' }}>
                                                            {decodeURIComponent(queryPart) || 'N/A'}
                                                        </Box>
                                                    );
                                                }

                                                // Default: show formatted details
                                                return (
                                                    <Box sx={{ wordBreak: 'break-all', whiteSpace: 'pre-wrap' }}>
                                                        {JSON.stringify(details, null, 2) || 'N/A'}
                                                    </Box>
                                                );
                                            })()}
                                        </Box>
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>

                        {/* TRẠNG THÁI TUÂN THỦ PHÁP LÝ Section */}
                        <Card variant="outlined" sx={{ mt: 2, border: '2px solid #f44336', bgcolor: '#ffebee' }}>
                            <CardHeader
                                title="⚖️ TRẠNG THÁI TUÂN THỦ PHÁP LÝ"
                                titleTypographyProps={{ variant: 'subtitle1', fontWeight: 'bold', color: '#b71c1c' }}
                                sx={{ bgcolor: '#ffcdd2', py: 1.5 }}
                            />
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                    <Chip
                                        icon={<WarningIcon />}
                                        label="⚠️ VI PHẠM"
                                        color="error"
                                        sx={{ fontWeight: 'bold', fontSize: '0.9rem', height: 32 }}
                                    />
                                    <Typography variant="body2" color="error.dark" fontWeight="bold">
                                        Phát hiện vi phạm quy định, cần xem xét và xử lý
                                    </Typography>
                                </Box>
                                <TableContainer component={Paper} variant="outlined" sx={{ bgcolor: 'white' }}>
                                    <Table size="small">
                                        <TableBody>
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 600, width: '30%', bgcolor: '#f5f5f5' }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                        <GavelIcon fontSize="small" color="primary" />
                                                        Quy tắc vi phạm
                                                    </Box>
                                                </TableCell>
                                                <TableCell>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <Chip
                                                            label={correctedViolatedRules?.[0]?.rule_code || selectedLog.rule_code || 'R-SEC-01'}
                                                            size="small"
                                                            color="error"
                                                            sx={{ fontWeight: 'bold', fontFamily: 'monospace' }}
                                                        />
                                                        <Typography variant="body2" color="text.secondary">
                                                            {correctedViolatedRules?.[0]?.rule_name || selectedLog.rule_name || 'Vi phạm quy định an ninh'}
                                                        </Typography>
                                                    </Box>
                                                </TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 600, bgcolor: '#f5f5f5' }}>
                                                    📜 Căn cứ pháp lý
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                                                        {correctedViolatedRules?.[0]?.legal_basis || selectedLog.legal_basis || 'Điều 59, Luật Khám bệnh, Chữa bệnh 2023; Điều 9, NĐ 13/2023/NĐ-CP - Tính toàn vẹn dữ liệu'}
                                                    </Typography>
                                                    {(correctedViolatedRules?.[0]?.law_url || selectedLog.law_url) && (
                                                        <Box sx={{ mt: 0.5 }}>
                                                            <a
                                                                href={correctedViolatedRules?.[0]?.law_url || selectedLog.law_url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                style={{ fontSize: '11px', color: '#1976d2', display: 'flex', alignItems: 'center', gap: '4px' }}
                                                            >
                                                                <OpenInNewIcon sx={{ fontSize: 12 }} />
                                                                Xem văn bản pháp luật gốc
                                                            </a>
                                                        </Box>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 600, bgcolor: '#f5f5f5' }}>
                                                    💰 Mức xử phạt
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" sx={{ color: 'error.main', fontWeight: 600 }}>
                                                        {correctedViolatedRules?.[0]?.penalty_level || selectedLog.penalty_level || 'Phạt tiền 20-40 triệu đồng (cá nhân); 40-80 triệu đồng (tổ chức) - theo NĐ 117/2020/NĐ-CP'}
                                                    </Typography>
                                                </TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </CardContent>
                        </Card>

                        {/* KHUYẾN NGHỊ HÀNH ĐỘNG Section */}
                        <Card variant="outlined" sx={{ mt: 2, border: '1px solid #ff9800' }}>
                            <CardHeader
                                title="📋 KHUYẾN NGHỊ HÀNH ĐỘNG"
                                titleTypographyProps={{ variant: 'subtitle1', fontWeight: 'bold', color: '#e65100' }}
                                sx={{ bgcolor: '#fff3e0', py: 1.5 }}
                            />
                            <CardContent>
                                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                    <Chip label="Chi log SIEM" size="small" variant="outlined" color="warning" />
                                    <Chip label="Tuân thủ Luật ANM 2018" size="small" variant="outlined" color="primary" />
                                    <Chip label="Tuân thủ Luật ATTT 2015" size="small" variant="outlined" color="primary" />
                                    <Chip label="ISO 27001:A.5.17" size="small" variant="outlined" color="info" />
                                </Box>
                                <Box sx={{ mt: 2, p: 2, bgcolor: '#fff8e1', borderRadius: 1 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
                                        Các bước xử lý khuyến nghị:
                                    </Typography>
                                    <Box component="ol" sx={{ m: 0, pl: 2, fontSize: '0.875rem' }}>
                                        <li>Xác minh tính hợp lệ của thao tác với người thực hiện</li>
                                        <li>Kiểm tra lịch sử hoạt động của user trong 24h qua</li>
                                        <li>Nếu vi phạm: Lập biên bản, thông báo cho bộ phận quản lý</li>
                                        <li>Cập nhật quy trình nếu cần thiết</li>
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    </Box>
                </Box>
                <DialogActions>
                    <Button onClick={onClose} variant="outlined">ĐÓNG</Button>
                </DialogActions>
            </Dialog>
        );
    }

    // --- STANDARD LOG VIEW (Redesigned) ---
    // Xác định title và màu sắc dựa trên loại log
    const getLogInfo = () => {
        const action = (selectedLog.action || '').toLowerCase();
        const logType = (selectedLog.log_type || '').toLowerCase();
        const status = parseInt(selectedLog.status) || 200;
        const isSuccess = status >= 200 && status < 300;

        // DEBUG: Log values to browser console
        console.log('[getLogInfo DEBUG]', {
            has_violation: selectedLog.has_violation,
            severity: selectedLog.severity,
            compliance_status: selectedLog.compliance_status,
            rule_code: selectedLog.rule_code,
            status: status,
            action: action,
            id: selectedLog.id
        });

        // ===== PRIORITY -1: FORCE VIOLATION for failed statuses =====
        // Login failures (401, 403, 423) are ALWAYS violations, regardless of has_violation field
        const isFailureStatus = [401, 403, 423].includes(status);
        const isFailedAction = action.includes('thất bại') || action.includes('failed') || action.includes('failure');

        if (isFailureStatus || isFailedAction) {
            const ruleCode = selectedLog.rule_code || 'R-IAM-03';
            return {
                title: `VI PHẠM: ${ruleCode}`,
                icon: '🚨',
                color: '#d32f2f',
                bgColor: '#ffebee'
            };
        }

        // ===== PRIORITY 0: Explicitly check has_violation field =====
        // Only show TUÂN THỦ if has_violation is EXPLICITLY false AND status is success
        if ((selectedLog.has_violation === false ||
            selectedLog.has_violation === 'false' ||
            selectedLog.has_violation === 0 ||
            selectedLog.severity === 'compliant' ||
            selectedLog.compliance_status === 'compliant' ||
            (selectedLog.id || '').includes('::ok')) && isSuccess) {
            // COMPLIANT LOG - GREEN
            return {
                title: selectedLog.rule_code ? `TUÂN THỦ: ${selectedLog.rule_code}` : 'TUÂN THỦ QUY TẮC',
                icon: '✅',
                color: '#2e7d32',
                bgColor: '#e8f5e9'
            };
        }


        // PRIORITY 1: Single rule view (clicked from expanded rule list)
        if (selectedLog._single_rule_view) {
            if (selectedLog.has_violation) {
                return {
                    title: `VI PHẠM: ${selectedLog.rule_code}`,
                    icon: '🚨',
                    color: '#d32f2f',
                    bgColor: '#ffebee'
                };
            } else {
                return {
                    title: `TUÂN THỦ: ${selectedLog.rule_code}`,
                    icon: '✅',
                    color: '#2e7d32',
                    bgColor: '#e8f5e9'
                };
            }
        }

        // PRIORITY 2: Detect violations from behavior monitoring flags
        // (Compliant logs already returned in PRIORITY 0, so only violations reach here)
        if (isViolation || isSQLi || isBruteForce || isSIEMLogTampering) {
            const ruleCode = selectedLog.rule_code || 'SECURITY';
            if (isSQLi) {
                return { title: 'TẤN CÔNG SQL INJECTION', icon: '🛡️', color: '#b71c1c', bgColor: '#ffebee' };
            }
            if (isBruteForce) {
                return { title: 'TẤN CÔNG BRUTE FORCE', icon: '🔐', color: '#d84315', bgColor: '#fbe9e7' };
            }
            if (isSIEMLogTampering) {
                return { title: 'XÓA DẤU VẾT HỆ THỐNG', icon: '🚨', color: '#b71c1c', bgColor: '#ffebee' };
            }
            return { title: `VI PHẠM: ${ruleCode}`, icon: '⚠️', color: '#d32f2f', bgColor: '#ffebee' };
        }

        // (PRIORITY 4 removed - compliant logs now handled in PRIORITY 0 above)

        // Login logs
        if (action.includes('đăng nhập') || action.includes('login')) {
            if (action.includes('thất bại') || action.includes('failed') || !isSuccess) {
                return { title: 'ĐĂNG NHẬP THẤT BẠI', icon: '🔐', color: '#f44336', bgColor: '#ffebee' };
            }
            return { title: 'ĐĂNG NHẬP THÀNH CÔNG', icon: '✅', color: '#4caf50', bgColor: '#e8f5e9' };
        }
        // EMR Access
        if (logType.includes('emr') || action.includes('xem') || action.includes('access')) {
            return { title: 'TRUY CẬP HỒ SƠ', icon: '📋', color: '#1976d2', bgColor: '#e3f2fd' };
        }
        // Create operations
        if (selectedLog.operation === 'create' || action.includes('tạo') || action.includes('create')) {
            return { title: 'TẠO MỚI DỮ LIỆU', icon: '➕', color: '#00897b', bgColor: '#e0f2f1' };
        }
        // Update operations
        if (selectedLog.operation === 'update' || action.includes('cập nhật') || action.includes('update')) {
            return { title: 'CẬP NHẬT DỮ LIỆU', icon: '✏️', color: '#ff9800', bgColor: '#fff3e0' };
        }
        // System logs
        if (logType.includes('system')) {
            return { title: 'SỰ KIỆN HỆ THỐNG', icon: '⚙️', color: '#607d8b', bgColor: '#eceff1' };
        }
        // Default
        return { title: 'CHI TIẾT HOẠT ĐỘNG', icon: '📄', color: '#424242', bgColor: '#f5f5f5' };
    };

    const logInfo = getLogInfo();

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: { minHeight: '60vh', p: 0 }
            }}
        >
            {/* HEADER - Dynamic color based on log type */}
            <Box sx={{
                p: 2.5,
                background: `linear-gradient(135deg, ${logInfo.color} 0%, ${logInfo.color}dd 100%)`,
                color: 'white'
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600, letterSpacing: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                            {logInfo.icon} {logInfo.title}
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
                            Sự kiện #{selectedLog.id?.substring(0, 8)}... • {formatTimestamp(selectedLog.timestamp || selectedLog.ts)}
                        </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                        <Chip
                            label={parseInt(selectedLog.status) >= 200 && parseInt(selectedLog.status) < 300 ? '✓ Thành công' : `⚠ ${selectedLog.status}`}
                            sx={{
                                bgcolor: parseInt(selectedLog.status) >= 200 && parseInt(selectedLog.status) < 300 ? '#4caf50' : '#ff9800',
                                color: 'white',
                                fontWeight: 'bold',
                                fontSize: '0.8rem'
                            }}
                        />
                        <Typography variant="caption" sx={{ display: 'block', mt: 0.5, opacity: 0.9 }}>
                            {selectedLog.method || 'GET'} • {selectedLog.role || 'user'}
                        </Typography>
                    </Box>
                </Box>
            </Box>

            {/* CONTENT - Full width with collapsible Raw data */}
            <DialogContent sx={{ p: 0, bgcolor: '#fafafa', display: 'flex', flexDirection: 'column', flexGrow: 1, maxHeight: '70vh', overflowY: 'auto' }}>
                <Box sx={{ p: 3 }}>
                    <Box>
                        {/* Section 1: Chi tiết sự kiện */}
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: '#424242' }}>
                            📋 CHI TIẾT SỰ KIỆN
                        </Typography>
                        <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
                            <Table size="small">
                                <TableBody>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 600, width: '35%', bgcolor: '#f5f5f5' }}>Người thực hiện</TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Avatar sx={{ width: 24, height: 24, bgcolor: 'primary.light', fontSize: '0.75rem' }}>
                                                    {(selectedLog.user || 'U').substring(0, 1).toUpperCase()}
                                                </Avatar>
                                                <Typography variant="body2" fontWeight="bold">{selectedLog.user || selectedLog.user_id || 'Unknown'}</Typography>
                                                <Chip label={selectedLog.role || 'user'} size="small" variant="outlined" sx={{ height: 20 }} />
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 600, bgcolor: '#f5f5f5' }}>Hành động</TableCell>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight="bold">{selectedLog.action || selectedLog.action_description || (parseJsonSafe(selectedLog.details) || {}).action || selectedLog.operation || 'N/A'}</Typography>
                                        </TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 600, bgcolor: '#f5f5f5' }}>Trạng thái</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={parseInt(selectedLog.status) >= 200 && parseInt(selectedLog.status) < 300 ? `✓ ${selectedLog.status} Thành công` : `⚠ ${selectedLog.status}`}
                                                size="small"
                                                color={parseInt(selectedLog.status) >= 200 && parseInt(selectedLog.status) < 300 ? 'success' : 'warning'}
                                            />
                                        </TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 600, bgcolor: '#f5f5f5' }}>Thời gian</TableCell>
                                        <TableCell sx={{ fontFamily: 'monospace' }}>{formatTimestamp(selectedLog.timestamp || selectedLog.ts)}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 600, bgcolor: '#f5f5f5' }}>Mục đích</TableCell>
                                        <TableCell>{selectedLog.purpose || 'N/A'}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 600, bgcolor: '#f5f5f5' }}>Nguồn IP</TableCell>
                                        <TableCell sx={{ fontFamily: 'monospace' }}>
                                            {(() => {
                                                const details = parseJsonSafe(selectedLog.details) || {};
                                                // DEBUG: Log all fields to find IP
                                                console.log('[IP DEBUG]', {
                                                    selectedLog_keys: Object.keys(selectedLog),
                                                    details_keys: Object.keys(details),
                                                    source_ip: selectedLog.source_ip,
                                                    ip: selectedLog.ip,
                                                    remote_addr: selectedLog.remote_addr
                                                });
                                                // Check multiple possible IP fields
                                                const ip = selectedLog.source_ip ||
                                                    selectedLog.ip_address ||
                                                    selectedLog.ip ||
                                                    selectedLog.client_ip ||
                                                    selectedLog.remote_addr ||
                                                    selectedLog.x_forwarded_for ||
                                                    selectedLog.addr ||
                                                    details.ip_address ||
                                                    details.source_ip ||
                                                    details.ip ||
                                                    details.client_ip ||
                                                    details.remote_addr ||
                                                    details.x_forwarded_for ||
                                                    details.ipAddress ||
                                                    details.addr ||
                                                    // Check nested fields
                                                    (details.request || {}).ip ||
                                                    (details.client || {}).ip ||
                                                    (details.user || {}).ip ||
                                                    (selectedLog.user_info || {}).ip ||
                                                    'Không xác định';
                                                // Only show first IP if multiple (comma-separated)
                                                return String(ip).split(',')[0].trim();
                                            })()}

                                        </TableCell>
                                    </TableRow>
                                    {(selectedLog.patient_name || selectedLog.patient_id) && (
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 600, bgcolor: '#f5f5f5' }}>Bệnh nhân</TableCell>
                                            <TableCell>
                                                {selectedLog.patient_name || 'N/A'}
                                                {selectedLog.patient_code && <Chip label={selectedLog.patient_code} size="small" sx={{ ml: 1, height: 18 }} />}
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        {/* Section 1.5: TRẠNG THÁI TUÂN THỦ PHÁP LÝ (Only shown in Behavior Monitoring) */}
                        {showComplianceSection && (
                            <>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: '#424242', mt: 3 }}>
                                    ⚖️ TRẠNG THÁI TUÂN THỦ PHÁP LÝ
                                </Typography>
                                {(() => {
                                    // Determine compliance info based on log type and violated rules
                                    const logType = (selectedLog.log_type || '').toLowerCase();
                                    const action = (selectedLog.action || '').toLowerCase();
                                    const status = parseInt(selectedLog.status) || 200;
                                    const isSuccess = status >= 200 && status < 300;

                                    // FIX: Use same logic as header (getLogInfo) for consistency
                                    // Check directly from selectedLog, not from violatedRules array which may be misleading

                                    // PRIORITY -1: Always treat failure statuses as violations
                                    const isFailureStatus = [401, 403, 423].includes(status);
                                    const isFailedAction = action.includes('thất bại') || action.includes('failed') || action.includes('failure');

                                    const isExplicitlyCompliant =
                                        selectedLog.has_violation === false ||
                                        selectedLog.has_violation === 'false' ||
                                        selectedLog.has_violation === 0 ||
                                        selectedLog.severity === 'compliant' ||
                                        selectedLog.compliance_status === 'compliant' ||
                                        (selectedLog.id || '').includes('::ok');

                                    const isExplicitlyViolation =
                                        selectedLog.has_violation === true ||
                                        selectedLog.has_violation === 'true' ||
                                        selectedLog.has_violation === 1 ||
                                        selectedLog.ground_truth_label === 1 ||
                                        selectedLog.failed_rules > 0;

                                    // CRITICAL FIX: Failed statuses ALWAYS count as violations
                                    const hasViolation = isFailureStatus || isFailedAction || (isExplicitlyViolation && !isExplicitlyCompliant);


                                    // Get matched rule info from selectedLog or violatedRules
                                    const matchedRule = violatedRules && violatedRules.length > 0 ? violatedRules[0] : null;
                                    const ruleCode = matchedRule?.rule_code || selectedLog.rule_code || null;
                                    const ruleName = matchedRule?.rule_name || selectedLog.rule_name || null;
                                    const legalBasis = matchedRule?.legal_basis || selectedLog.legal_basis || null;
                                    const penaltyLevel = matchedRule?.penalty_level || selectedLog.penalty_level || null;
                                    const lawUrl = matchedRule?.law_url || selectedLog.law_url || null;

                                    // Default compliance mappings for normal operations
                                    const getDefaultCompliance = () => {
                                        if (action.includes('đăng nhập') || action.includes('login')) {
                                            return {
                                                ruleCode: 'LOGIN-001',
                                                ruleName: 'Giám sát đăng nhập hệ thống',
                                                legalBasis: 'Điều 26, Luật An ninh mạng 2018 - Giám sát hoạt động mạng; NĐ 15/2020/NĐ-CP Điều 100',
                                                penaltyLevel: 'Phạt tiền 10-20 triệu đồng (cá nhân); tối đa 100 triệu (tổ chức) - theo NĐ 15/2020/NĐ-CP',
                                                lawUrl: 'https://thuvienphapluat.vn/van-ban/Cong-nghe-thong-tin/Luat-an-ninh-mang-2018-351416.aspx'
                                            };
                                        }
                                        if (logType.includes('emr') || action.includes('xem') || action.includes('thông tin bệnh') || action.includes('access')) {
                                            return {
                                                ruleCode: 'EMR-READ-001',
                                                ruleName: 'Giám sát truy cập hồ sơ bệnh án',
                                                legalBasis: 'Điều 8, Luật Khám bệnh, Chữa bệnh 2023 (15/2023/QH15) - Bảo mật thông tin bệnh nhân; Điều 26, TT 54/2017/TT-BYT',
                                                penaltyLevel: 'Phạt tiền 10-20 triệu đồng (cá nhân); 20-40 triệu đồng (tổ chức) - theo NĐ 117/2020/NĐ-CP Điều 38',
                                                lawUrl: 'https://thuvienphapluat.vn/van-ban/The-thao-Y-te/Luat-15-2023-QH15-kham-benh-chua-benh-372143.aspx'
                                            };
                                        }
                                        if (selectedLog.operation === 'create' || action.includes('tạo')) {
                                            return {
                                                ruleCode: 'EMR-UPDATE-001',
                                                ruleName: 'Giám sát tạo/cập nhật hồ sơ bệnh án',
                                                legalBasis: 'Điều 59, Luật Khám bệnh, Chữa bệnh 2023 - Sửa chữa hồ sơ bệnh án; Điều 9, NĐ 13/2023/NĐ-CP - Tính toàn vẹn dữ liệu',
                                                penaltyLevel: 'Phạt tiền 20-40 triệu đồng (cá nhân); 40-80 triệu đồng (tổ chức) - theo NĐ 117/2020/NĐ-CP',
                                                lawUrl: 'https://thuvienphapluat.vn/van-ban/The-thao-Y-te/Luat-15-2023-QH15-kham-benh-chua-benh-372143.aspx'
                                            };
                                        }
                                        if (action.includes('lịch hẹn') || action.includes('hàng chờ') || action.includes('queue')) {
                                            return {
                                                ruleCode: 'QUEUE-ACCESS-001',
                                                ruleName: 'Giám sát hàng chờ khám bệnh',
                                                legalBasis: 'Điều 44, Luật Khám bệnh, Chữa bệnh 2023 - Quy trình khám bệnh; TT 54/2017/TT-BYT',
                                                penaltyLevel: 'Phạt tiền 5-10 triệu đồng (cá nhân); 10-20 triệu đồng (tổ chức) - theo NĐ 117/2020/NĐ-CP Điều 40',
                                                lawUrl: 'https://thuvienphapluat.vn/van-ban/The-thao-Y-te/Luat-15-2023-QH15-kham-benh-chua-benh-372143.aspx'
                                            };
                                        }
                                        // Default for unmatched
                                        return {
                                            ruleCode: 'R-AUD-001',
                                            ruleName: 'Ghi nhật ký hoạt động hệ thống',
                                            legalBasis: 'Điều 26, Luật An ninh mạng 2018 - Giám sát an ninh mạng; NĐ 15/2020/NĐ-CP',
                                            penaltyLevel: 'Phạt tiền 10-30 triệu đồng (cá nhân); 20-60 triệu đồng (tổ chức) - theo NĐ 15/2020/NĐ-CP',
                                            lawUrl: 'https://thuvienphapluat.vn/van-ban/Cong-nghe-thong-tin/Luat-an-ninh-mang-2018-351416.aspx'
                                        };
                                    };

                                    const defaultCompliance = getDefaultCompliance();
                                    const finalRuleCode = ruleCode || defaultCompliance.ruleCode;
                                    const finalRuleName = ruleName || defaultCompliance.ruleName;
                                    const finalLegalBasis = legalBasis || defaultCompliance.legalBasis;
                                    const finalPenaltyLevel = penaltyLevel || defaultCompliance.penaltyLevel;
                                    const finalLawUrl = lawUrl || defaultCompliance.lawUrl;

                                    // Determine compliance status
                                    // CRITICAL FIX: If hasViolation is true (including 401 failures), show as violation
                                    const isCompliant = !hasViolation && isSuccess;


                                    return (
                                        <Card
                                            variant="outlined"
                                            sx={{
                                                mb: 3,
                                                bgcolor: isCompliant ? '#e8f5e9' : '#ffebee',
                                                border: `2px solid ${isCompliant ? '#4caf50' : '#f44336'}`
                                            }}
                                        >
                                            <CardContent sx={{ py: 2 }}>
                                                {/* Compliance Status Header */}
                                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <Chip
                                                            icon={isCompliant ? <AssignmentTurnedInIcon /> : <WarningIcon />}
                                                            label={isCompliant ? "✅ TUÂN THỦ" : "⚠️ VI PHẠM"}
                                                            color={isCompliant ? "success" : "error"}
                                                            sx={{ fontWeight: 'bold', fontSize: '0.9rem', height: 32 }}
                                                        />
                                                        <Typography variant="body2" color={isCompliant ? "success.dark" : "error.dark"} fontWeight="bold">
                                                            {isCompliant
                                                                ? "Hoạt động hợp lệ, đã được ghi nhận theo quy định pháp luật"
                                                                : "Phát hiện vi phạm quy định, cần xem xét"
                                                            }
                                                        </Typography>
                                                    </Box>
                                                </Box>

                                                {/* Compliance Details Table */}
                                                <TableContainer component={Paper} variant="outlined" sx={{ bgcolor: 'white' }}>
                                                    <Table size="small">
                                                        <TableBody>
                                                            <TableRow>
                                                                <TableCell sx={{ fontWeight: 600, width: '30%', bgcolor: '#f5f5f5' }}>
                                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                                        <GavelIcon fontSize="small" color="primary" />
                                                                        Quy tắc áp dụng
                                                                    </Box>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                                                        <Chip
                                                                            label={finalRuleCode}
                                                                            size="small"
                                                                            color="primary"
                                                                            sx={{ fontWeight: 'bold', fontFamily: 'monospace' }}
                                                                        />
                                                                        <Typography variant="body2" color="text.secondary">
                                                                            {finalRuleName}
                                                                        </Typography>
                                                                    </Box>
                                                                </TableCell>
                                                            </TableRow>
                                                            <TableRow>
                                                                <TableCell sx={{ fontWeight: 600, bgcolor: '#f5f5f5' }}>
                                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                                        📜 Căn cứ pháp lý
                                                                    </Box>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                                                                        {finalLegalBasis}
                                                                    </Typography>
                                                                    {finalLawUrl && (
                                                                        <Box sx={{ mt: 0.5 }}>
                                                                            <a
                                                                                href={finalLawUrl}
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                style={{ fontSize: '11px', color: '#1976d2', display: 'flex', alignItems: 'center', gap: '4px' }}
                                                                            >
                                                                                <OpenInNewIcon sx={{ fontSize: 12 }} />
                                                                                Xem văn bản pháp luật gốc
                                                                            </a>
                                                                        </Box>
                                                                    )}
                                                                </TableCell>
                                                            </TableRow>
                                                            <TableRow>
                                                                <TableCell sx={{ fontWeight: 600, bgcolor: '#f5f5f5' }}>
                                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                                        💰 Mức phạt nếu vi phạm
                                                                    </Box>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Typography
                                                                        variant="body2"
                                                                        sx={{
                                                                            color: isCompliant ? 'text.secondary' : 'error.main',
                                                                            fontWeight: isCompliant ? 400 : 600,
                                                                            fontStyle: isCompliant ? 'italic' : 'normal'
                                                                        }}
                                                                    >
                                                                        {isCompliant
                                                                            ? `(Không áp dụng - Đã tuân thủ) ${finalPenaltyLevel}`
                                                                            : finalPenaltyLevel
                                                                        }
                                                                    </Typography>
                                                                </TableCell>
                                                            </TableRow>
                                                            <TableRow>
                                                                <TableCell sx={{ fontWeight: 600, bgcolor: '#f5f5f5' }}>
                                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                                        📋 Kết luận
                                                                    </Box>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Typography variant="body2" color={isCompliant ? "success.dark" : "error.dark"} fontWeight={500}>
                                                                        {isCompliant
                                                                            ? `Hoạt động "${selectedLog.action || 'N/A'}" được thực hiện đúng quy trình, có đầy đủ thông tin xác thực, được ghi log theo yêu cầu của ${finalRuleCode}.`
                                                                            : `Phát hiện vi phạm quy tắc ${finalRuleCode}. Cần kiểm tra và xử lý theo quy định.`
                                                                        }
                                                                    </Typography>
                                                                </TableCell>
                                                            </TableRow>
                                                        </TableBody>
                                                    </Table>
                                                </TableContainer>
                                            </CardContent>
                                        </Card>
                                    );
                                })()}
                            </>
                        )}

                        {/* Section 2: Thông tin kỹ thuật */}
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: '#424242' }}>
                            ⚙️ THÔNG TIN KỸ THUẬT
                        </Typography>
                        <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
                            <Table size="small">
                                <TableBody>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 600, width: '35%', bgcolor: '#f5f5f5' }}>HTTP Method</TableCell>
                                        <TableCell><Chip label={selectedLog.method || 'GET'} size="small" variant="outlined" /></TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 600, bgcolor: '#f5f5f5' }}>URI / Endpoint</TableCell>
                                        <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem', wordBreak: 'break-all' }}>{selectedLog.uri || 'N/A'}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 600, bgcolor: '#f5f5f5' }}>IP Address</TableCell>
                                        <TableCell sx={{ fontFamily: 'monospace' }}>
                                            {(() => {
                                                const details = parseJsonSafe(selectedLog.details) || {};
                                                const ip = selectedLog.ip_address ||
                                                    selectedLog.source_ip ||
                                                    selectedLog.client_ip ||
                                                    selectedLog.remote_addr ||
                                                    details.ip_address ||
                                                    details.source_ip ||
                                                    details.ipAddress ||
                                                    'Không xác định';
                                                return ip.split(',')[0].trim();
                                            })()}
                                        </TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 600, bgcolor: '#f5f5f5' }}>User Agent</TableCell>
                                        <TableCell sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>{selectedLog.user_agent || 'N/A'}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 600, bgcolor: '#f5f5f5' }}>Log Type</TableCell>
                                        <TableCell><Chip label={selectedLog.log_type || 'N/A'} size="small" color="info" variant="outlined" /></TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </TableContainer>

                        {/* Section 2.5: Chi tiết DLP (chỉ hiện khi log_type là system_dlp) */}
                        {(selectedLog.log_type === 'system_dlp' || selectedLog.log_type === 'SYSTEM_DLP_LOG') && (() => {
                            const details = typeof selectedLog.details === 'string' ? JSON.parse(selectedLog.details || '{}') : (selectedLog.details || {});
                            return (
                                <>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: '#424242', mt: 3 }}>
                                        🛡️ CHI TIẾT DLP
                                    </Typography>
                                    <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
                                        <Table size="small">
                                            <TableBody>
                                                <TableRow>
                                                    <TableCell sx={{ fontWeight: 600, width: '35%', bgcolor: '#f5f5f5' }}>DLP Verdict</TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={details.dlp_verdict || selectedLog.dlp_verdict || 'N/A'}
                                                            size="small"
                                                            color={(details.dlp_verdict || selectedLog.dlp_verdict) === 'CLEAN' ? 'success' : 'error'}
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell sx={{ fontWeight: 600, bgcolor: '#f5f5f5' }}>Compliance Status</TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={details.compliance_status || selectedLog.compliance_status || 'N/A'}
                                                            size="small"
                                                            color={(details.compliance_status || selectedLog.compliance_status) === 'COMPLIANT' ? 'success' : 'warning'}
                                                            variant="outlined"
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell sx={{ fontWeight: 600, bgcolor: '#f5f5f5' }}>Data Type</TableCell>
                                                    <TableCell>{details.data_type || selectedLog.data_type || 'N/A'}</TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell sx={{ fontWeight: 600, bgcolor: '#f5f5f5' }}>Sensitive Data Count</TableCell>
                                                    <TableCell>{details.sensitive_data_count ?? selectedLog.sensitive_data_count ?? 'N/A'}</TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell sx={{ fontWeight: 600, bgcolor: '#f5f5f5' }}>Matched Pattern</TableCell>
                                                    <TableCell sx={{ fontFamily: 'monospace' }}>{details.matched_pattern || selectedLog.matched_pattern || 'N/A'}</TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell sx={{ fontWeight: 600, bgcolor: '#f5f5f5' }}>Matched Policy</TableCell>
                                                    <TableCell>{details.matched_policy || selectedLog.matched_policy || 'none'}</TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell sx={{ fontWeight: 600, bgcolor: '#f5f5f5' }}>Direction</TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={details.direction || selectedLog.direction || 'N/A'}
                                                            size="small"
                                                            color={(details.direction || selectedLog.direction) === 'INTERNAL' ? 'default' : 'warning'}
                                                            variant="outlined"
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell sx={{ fontWeight: 600, bgcolor: '#f5f5f5' }}>Channel</TableCell>
                                                    <TableCell>{details.channel || selectedLog.channel || 'N/A'}</TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell sx={{ fontWeight: 600, bgcolor: '#f5f5f5' }}>Rule Code</TableCell>
                                                    <TableCell sx={{ fontFamily: 'monospace' }}>{details.rule_code || selectedLog.rule_code || 'N/A'}</TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell sx={{ fontWeight: 600, bgcolor: '#f5f5f5' }}>Action</TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={details.action || 'N/A'}
                                                            size="small"
                                                            color={details.action === 'ALLOW' ? 'success' : 'error'}
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </>
                            );
                        })()}

                        {/* Section 2.6: Chi tiết TLS (chỉ hiện khi log_type là system_tls) */}
                        {(selectedLog.log_type === 'system_tls' || selectedLog.log_type === 'SYSTEM_TLS_LOG' || selectedLog.log_type === 'GATEWAY_LOG' || selectedLog.log_type === 'gateway_log') && (() => {
                            const details = typeof selectedLog.details === 'string' ? JSON.parse(selectedLog.details || '{}') : (selectedLog.details || {});
                            return (
                                <>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: '#424242', mt: 3 }}>
                                        🔒 CHI TIẾT TLS/SSL
                                    </Typography>
                                    <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
                                        <Table size="small">
                                            <TableBody>
                                                <TableRow>
                                                    <TableCell sx={{ fontWeight: 600, width: '35%', bgcolor: '#f5f5f5' }}>TLS Version</TableCell>
                                                    <TableCell>
                                                        <Chip label={details.tls_version || selectedLog.tls_version || 'N/A'} size="small" color="success" variant="outlined" />
                                                    </TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell sx={{ fontWeight: 600, bgcolor: '#f5f5f5' }}>SSL Cipher</TableCell>
                                                    <TableCell sx={{ fontFamily: 'monospace' }}>{details.ssl_cipher || selectedLog.ssl_cipher || 'N/A'}</TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell sx={{ fontWeight: 600, bgcolor: '#f5f5f5' }}>Certificate Status</TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={details.certificate_status || selectedLog.certificate_status || 'N/A'}
                                                            size="small"
                                                            color={(details.certificate_status || selectedLog.certificate_status) === 'VALID' ? 'success' : 'error'}
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell sx={{ fontWeight: 600, bgcolor: '#f5f5f5' }}>mTLS Status</TableCell>
                                                    <TableCell>{details.mtls_status || selectedLog.mtls_status || 'N/A'}</TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell sx={{ fontWeight: 600, bgcolor: '#f5f5f5' }}>Encryption in Transit</TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={details.encryption_in_transit || selectedLog.encryption_in_transit ? 'Yes' : 'No'}
                                                            size="small"
                                                            color={details.encryption_in_transit || selectedLog.encryption_in_transit ? 'success' : 'warning'}
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell sx={{ fontWeight: 600, bgcolor: '#f5f5f5' }}>Bytes Sent</TableCell>
                                                    <TableCell>{details.bytes_sent ?? selectedLog.bytes_sent ?? 'N/A'}</TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell sx={{ fontWeight: 600, bgcolor: '#f5f5f5' }}>Scheme</TableCell>
                                                    <TableCell>{details.scheme || selectedLog.scheme || 'https'}</TableCell>
                                                </TableRow>
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </>
                            );
                        })()}

                        {/* Section 2.7: Chi tiết SSO (chỉ hiện khi log_type là system_auth) */}
                        {(selectedLog.log_type === 'system_auth' || selectedLog.log_type === 'SYSTEM_AUTH_LOG') && (() => {
                            const details = typeof selectedLog.details === 'string' ? JSON.parse(selectedLog.details || '{}') : (selectedLog.details || {});
                            return (
                                <>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: '#424242', mt: 3 }}>
                                        🔑 CHI TIẾT XÁC THỰC SSO
                                    </Typography>
                                    <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
                                        <Table size="small">
                                            <TableBody>
                                                <TableRow>
                                                    <TableCell sx={{ fontWeight: 600, width: '35%', bgcolor: '#f5f5f5' }}>Auth Method</TableCell>
                                                    <TableCell>{details.auth_method || selectedLog.auth_method || 'N/A'}</TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell sx={{ fontWeight: 600, bgcolor: '#f5f5f5' }}>Client ID</TableCell>
                                                    <TableCell sx={{ fontFamily: 'monospace' }}>{details.client_id || selectedLog.client_id || 'N/A'}</TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell sx={{ fontWeight: 600, bgcolor: '#f5f5f5' }}>Session ID</TableCell>
                                                    <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{details.session_id || selectedLog.session_id || 'N/A'}</TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell sx={{ fontWeight: 600, bgcolor: '#f5f5f5' }}>Session Duration</TableCell>
                                                    <TableCell>{details.session_duration || selectedLog.session_duration || 'N/A'}</TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell sx={{ fontWeight: 600, bgcolor: '#f5f5f5' }}>MFA Used</TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={details.mfa_used || selectedLog.mfa_used ? 'Yes' : 'No'}
                                                            size="small"
                                                            color={details.mfa_used || selectedLog.mfa_used ? 'success' : 'default'}
                                                            variant="outlined"
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell sx={{ fontWeight: 600, bgcolor: '#f5f5f5' }}>Account Locked</TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={details.account_locked || selectedLog.account_locked ? 'Yes' : 'No'}
                                                            size="small"
                                                            color={details.account_locked || selectedLog.account_locked ? 'error' : 'success'}
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell sx={{ fontWeight: 600, bgcolor: '#f5f5f5' }}>Behavior Score</TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={details.behavior_score ?? selectedLog.behavior_score ?? 'N/A'}
                                                            size="small"
                                                            color={(details.behavior_score || selectedLog.behavior_score) >= 80 ? 'success' : 'warning'}
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell sx={{ fontWeight: 600, bgcolor: '#f5f5f5' }}>IP History Check</TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={details.ip_history_check || selectedLog.ip_history_check || 'N/A'}
                                                            size="small"
                                                            color={(details.ip_history_check || selectedLog.ip_history_check) === 'MATCH' ? 'success' : 'warning'}
                                                            variant="outlined"
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell sx={{ fontWeight: 600, bgcolor: '#f5f5f5' }}>Location</TableCell>
                                                    <TableCell>{details.location || selectedLog.location || 'N/A'}</TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell sx={{ fontWeight: 600, bgcolor: '#f5f5f5' }}>Device ID</TableCell>
                                                    <TableCell>{details.device_id || selectedLog.device_id || 'N/A'}</TableCell>
                                                </TableRow>
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </>
                            );
                        })()}

                        {/* Section 2.8: Chi tiết Mã hóa (chỉ hiện khi log_type là emr_encryption) */}
                        {(selectedLog.log_type === 'emr_encryption' || selectedLog.log_type === 'BACKUP_ENCRYPTION_LOG') && (() => {
                            const details = typeof selectedLog.details === 'string' ? JSON.parse(selectedLog.details || '{}') : (selectedLog.details || {});
                            return (
                                <>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: '#424242', mt: 3 }}>
                                        🔐 CHI TIẾT MÃ HÓA
                                    </Typography>
                                    <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
                                        <Table size="small">
                                            <TableBody>
                                                <TableRow>
                                                    <TableCell sx={{ fontWeight: 600, width: '35%', bgcolor: '#f5f5f5' }}>Encryption Status</TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={details.encryption_status || selectedLog.encryption_status || 'N/A'}
                                                            size="small"
                                                            color={(details.encryption_status || selectedLog.encryption_status) === 'encrypted' ? 'success' : 'warning'}
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell sx={{ fontWeight: 600, bgcolor: '#f5f5f5' }}>Encryption Algorithm</TableCell>
                                                    <TableCell sx={{ fontFamily: 'monospace' }}>{details.encryption_algo || selectedLog.encryption_algo || 'N/A'}</TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell sx={{ fontWeight: 600, bgcolor: '#f5f5f5' }}>Key ID</TableCell>
                                                    <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{details.key_id || selectedLog.key_id || 'N/A'}</TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell sx={{ fontWeight: 600, bgcolor: '#f5f5f5' }}>Record ID</TableCell>
                                                    <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{details.record_id || selectedLog.record_id || 'N/A'}</TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell sx={{ fontWeight: 600, bgcolor: '#f5f5f5' }}>Triggered By</TableCell>
                                                    <TableCell>
                                                        {details.triggered_by_user_id || selectedLog.triggered_by_user_id || 'N/A'}
                                                        {(details.triggered_by_user_role || selectedLog.triggered_by_user_role) && (
                                                            <Chip label={details.triggered_by_user_role || selectedLog.triggered_by_user_role} size="small" sx={{ ml: 1, height: 18 }} />
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell sx={{ fontWeight: 600, bgcolor: '#f5f5f5' }}>Encryption Enabled</TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={details.encryption_enabled || selectedLog.encryption_enabled ? 'Yes' : 'No'}
                                                            size="small"
                                                            color={details.encryption_enabled || selectedLog.encryption_enabled ? 'success' : 'error'}
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell sx={{ fontWeight: 600, bgcolor: '#f5f5f5' }}>Event Type</TableCell>
                                                    <TableCell>{details.event_type || selectedLog.event_type || 'N/A'}</TableCell>
                                                </TableRow>
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </>
                            );
                        })()}

                        {/* Section 3: Thay đổi dữ liệu (nếu có) */}
                        {calculatedChanges && calculatedChanges.length > 0 && (
                            <>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: '#424242' }}>
                                    ✏️ THAY ĐỔI DỮ LIỆU
                                </Typography>
                                <TableContainer component={Paper} variant="outlined">
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                                                <TableCell sx={{ fontWeight: 'bold' }}>Trường</TableCell>
                                                {selectedLog.operation !== 'create' && (
                                                    <TableCell sx={{ fontWeight: 'bold' }}>Giá trị cũ</TableCell>
                                                )}
                                                <TableCell sx={{ fontWeight: 'bold' }}>{selectedLog.operation === 'create' ? 'Giá trị' : 'Giá trị mới'}</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {calculatedChanges.map((change, idx) => (
                                                <TableRow key={idx} hover>
                                                    <TableCell sx={{ fontFamily: 'monospace', fontWeight: 500, verticalAlign: 'top' }}>{change.field || change.name}</TableCell>
                                                    {selectedLog.operation !== 'create' && (
                                                        <TableCell sx={{ color: 'text.secondary', verticalAlign: 'top' }}>
                                                            <CompactValueRenderer value={change.old} />
                                                        </TableCell>
                                                    )}
                                                    <TableCell sx={{ color: 'text.primary', fontWeight: 500, verticalAlign: 'top' }}>
                                                        <CompactValueRenderer value={change.new} />
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </>
                        )}
                    </Box>

                    {/* COLLAPSIBLE RAW DATA SECTION */}
                    <Accordion sx={{ mt: 2, bgcolor: '#263238', color: '#fff' }}>
                        <AccordionSummary
                            expandIcon={<ExpandMoreIcon sx={{ color: '#fff' }} />}
                            sx={{ '&:hover': { bgcolor: '#37474f' } }}
                        >
                            <Typography sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                                <CodeIcon fontSize="small" /> DỮ LIỆU RAW (bấm để xem)
                            </Typography>
                        </AccordionSummary>
                        <AccordionDetails sx={{ bgcolor: '#1e1e1e', p: 2 }}>
                            <pre style={{ margin: 0, fontFamily: 'monospace', fontSize: '0.75rem', overflowX: 'auto', whiteSpace: 'pre-wrap', color: '#d4d4d4', maxHeight: '300px', overflow: 'auto' }}>
                                {JSON.stringify(selectedLog, null, 2)}
                            </pre>
                        </AccordionDetails>
                    </Accordion>
                </Box>
            </DialogContent>

            {/* ACTIONS */}
            <DialogActions sx={{ borderTop: 1, borderColor: 'divider', px: 3, py: 2 }}>
                <Button onClick={onClose} variant="outlined" color="inherit">Đóng</Button>
            </DialogActions>
        </Dialog >
    );
}



























