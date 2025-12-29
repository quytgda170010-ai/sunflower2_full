import React, { useState, useEffect, useCallback } from 'react';
import {
    Container,
    Typography,
    Box,
    Card,
    CardContent,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    CircularProgress,
    Alert,
    IconButton,
    TextField,
    FormControlLabel,
    Switch,
    Pagination,
    Tooltip,
} from '@mui/material';
import {
    Refresh as RefreshIcon,
    Warning as WarningIcon,
    CheckCircle as CheckIcon,
    Storage as StorageIcon,
} from '@mui/icons-material';
import api from '../services/api';

function MySQLLogs() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [total, setTotal] = useState(0);
    const [suspiciousCount, setSuspiciousCount] = useState(0);
    const [generalLogEnabled, setGeneralLogEnabled] = useState(true);
    const [showOnlySuspicious, setShowOnlySuspicious] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [autoRefresh, setAutoRefresh] = useState(true);
    // Date filter - default to today
    const today = new Date().toISOString().split('T')[0];
    const [fromDate, setFromDate] = useState(today);
    const [toDate, setToDate] = useState(today);

    const fetchLogs = useCallback(async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: page.toString(),
                page_size: '200',  // Increased to show more logs per page
            });

            if (showOnlySuspicious) {
                params.append('filter_type', 'suspicious');
            }
            if (searchQuery) {
                params.append('search', searchQuery);
            }
            // Add date filter
            if (fromDate) {
                params.append('from_date', fromDate);
            }
            if (toDate) {
                params.append('to_date', toDate);
            }

            const res = await api.get(`/api/mysql-logs?${params.toString()}`);
            setLogs(res.data.logs || []);
            setTotalPages(res.data.total_pages || 0);
            setTotal(res.data.total || 0);
            setSuspiciousCount(res.data.suspicious_count || 0);
            setGeneralLogEnabled(res.data.general_log_enabled);
            setError(null);
        } catch (err) {
            console.error('Failed to fetch MySQL logs:', err);
            setError('Không thể tải MySQL logs');
        } finally {
            setLoading(false);
        }
    }, [page, showOnlySuspicious, searchQuery, fromDate, toDate]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    useEffect(() => {
        if (!autoRefresh) return;
        const interval = setInterval(fetchLogs, 5000);
        return () => clearInterval(interval);
    }, [autoRefresh, fetchLogs]);

    const getQueryTypeColor = (type) => {
        switch (type) {
            case 'SELECT': return 'primary';
            case 'INSERT': return 'success';
            case 'UPDATE': return 'warning';
            case 'DELETE': return 'error';
            case 'SET': return 'secondary';
            case 'DROP': return 'error';
            case 'TRUNCATE': return 'error';
            case 'CONNECT': return 'info';
            default: return 'default';
        }
    };

    return (
        <Container maxWidth="xl">
            <Box sx={{ mb: 3 }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    <StorageIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    MySQL Query Logs
                </Typography>
                <Typography variant="body2" color="textSecondary">
                    Giám sát các câu lệnh SQL được thực thi trực tiếp trên database
                </Typography>
            </Box>

            {/* Status Bar */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center', flexWrap: 'wrap' }}>
                <Chip
                    icon={generalLogEnabled ? <CheckIcon /> : <WarningIcon />}
                    label={generalLogEnabled ? 'General Log: ON' : 'General Log: OFF'}
                    color={generalLogEnabled ? 'success' : 'error'}
                    variant="outlined"
                />
                <Chip
                    icon={<WarningIcon />}
                    label={`Suspicious: ${suspiciousCount}`}
                    color={suspiciousCount > 0 ? 'error' : 'default'}
                    variant={suspiciousCount > 0 ? 'filled' : 'outlined'}
                />
                <Chip label={`Total: ${total}`} variant="outlined" />

                <Box sx={{ flexGrow: 1 }} />

                {/* Date filter inputs */}
                <TextField
                    size="small"
                    type="date"
                    label="Từ ngày"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    sx={{ width: 150 }}
                />
                <TextField
                    size="small"
                    type="date"
                    label="Đến ngày"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    sx={{ width: 150 }}
                />

                <TextField
                    size="small"
                    placeholder="Tìm kiếm query..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    sx={{ width: 200 }}
                />

                <FormControlLabel
                    control={
                        <Switch
                            checked={showOnlySuspicious}
                            onChange={(e) => setShowOnlySuspicious(e.target.checked)}
                            color="error"
                        />
                    }
                    label="Chỉ hiện nghi ngờ"
                />

                <FormControlLabel
                    control={
                        <Switch
                            checked={autoRefresh}
                            onChange={(e) => setAutoRefresh(e.target.checked)}
                        />
                    }
                    label="Auto-refresh"
                />

                <Tooltip title="Refresh">
                    <IconButton onClick={fetchLogs} disabled={loading}>
                        <RefreshIcon />
                    </IconButton>
                </Tooltip>
            </Box>

            {!generalLogEnabled && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    ⚠️ CẢNH BÁO: general_log đang TẮT! Các câu lệnh SQL hiện tại KHÔNG được ghi lại!
                </Alert>
            )}

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {loading && logs.length === 0 ? (
                <Box display="flex" justifyContent="center" p={4}>
                    <CircularProgress />
                </Box>
            ) : (
                <Card>
                    <CardContent sx={{ p: 0 }}>
                        <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
                            <Table stickyHeader size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell width={160}>Thời gian</TableCell>
                                        <TableCell width={100}>User</TableCell>
                                        <TableCell width={120}>IP Address</TableCell>
                                        <TableCell width={100}>Loại</TableCell>
                                        <TableCell width={80}>Trạng thái</TableCell>
                                        <TableCell>Câu lệnh SQL</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {logs.map((log, index) => (
                                        <TableRow
                                            key={index}
                                            sx={{
                                                backgroundColor: log.is_suspicious ? '#fff5f5' : 'inherit',
                                                '&:hover': { backgroundColor: log.is_suspicious ? '#ffe0e0' : '#f5f5f5' }
                                            }}
                                        >
                                            <TableCell>
                                                <Typography variant="body2" sx={{ fontSize: '0.75rem', color: '#666' }}>
                                                    {log.timestamp || '-'}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 500 }}>
                                                    {log.user || '-'}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={log.ip_address || 'localhost'}
                                                    size="small"
                                                    variant="outlined"
                                                    sx={{
                                                        fontFamily: 'monospace',
                                                        fontSize: '0.7rem',
                                                        bgcolor: log.ip_address && !log.ip_address.startsWith('172.') && !log.ip_address.startsWith('127.') ? '#fff3e0' : 'inherit',
                                                        borderColor: log.ip_address && !log.ip_address.startsWith('172.') && !log.ip_address.startsWith('127.') ? '#ff9800' : 'default'
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={log.query_type}
                                                    color={getQueryTypeColor(log.query_type)}
                                                    size="small"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                {log.is_suspicious ? (
                                                    <Chip
                                                        icon={<WarningIcon />}
                                                        label="⚠️"
                                                        color="error"
                                                        size="small"
                                                    />
                                                ) : (
                                                    <Chip label="OK" color="success" size="small" variant="outlined" />
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Typography
                                                    variant="body2"
                                                    sx={{
                                                        fontFamily: 'monospace',
                                                        fontSize: '0.8rem',
                                                        color: log.is_suspicious ? '#d32f2f' : 'inherit',
                                                        fontWeight: log.is_suspicious ? 'bold' : 'normal'
                                                    }}
                                                >
                                                    {log.query || log.raw}
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {logs.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={6} align="center">
                                                <Typography color="textSecondary">
                                                    Không có dữ liệu
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </CardContent>
                </Card>
            )}

            {totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                    <Pagination
                        count={totalPages}
                        page={page}
                        onChange={(e, value) => setPage(value)}
                        color="primary"
                    />
                </Box>
            )}
        </Container>
    );
}

export default MySQLLogs;
