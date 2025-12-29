import React, { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    CircularProgress,
    Alert,
    AlertTitle,
    Chip,
    LinearProgress,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Divider,
    Paper,
} from '@mui/material';
import {
    SystemUpdate as UpdateIcon,
    CheckCircle as CheckCircleIcon,
    CloudDownload as DownloadIcon,
    History as HistoryIcon,
    NewReleases as NewReleasesIcon,
    Refresh as RefreshIcon,
} from '@mui/icons-material';
import api from '../services/api';

const SystemUpdates = () => {
    const [currentVersion, setCurrentVersion] = useState(null);
    const [updateInfo, setUpdateInfo] = useState(null);
    const [loading, setLoading] = useState(false);
    const [checking, setChecking] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [updateProgress, setUpdateProgress] = useState(0);
    const [updateResult, setUpdateResult] = useState(null);
    const [error, setError] = useState(null);

    // Load current version on mount
    useEffect(() => {
        loadCurrentVersion();
    }, []);

    const loadCurrentVersion = async () => {
        setLoading(true);
        try {
            const response = await api.get('/api/updates/current');
            setCurrentVersion(response.data);
        } catch (err) {
            console.error('Error loading version:', err);
            setError('Không thể tải thông tin phiên bản');
        } finally {
            setLoading(false);
        }
    };

    const checkForUpdates = async () => {
        setChecking(true);
        setError(null);
        setUpdateResult(null);

        try {
            const response = await api.get('/api/updates/check');
            setUpdateInfo(response.data);

            if (!response.data.has_update) {
                setUpdateResult({
                    type: 'success',
                    message: 'Hệ thống đang sử dụng phiên bản mới nhất!'
                });
            }
        } catch (err) {
            console.error('Error checking updates:', err);
            setError('Không thể kết nối đến máy chủ cập nhật. Vui lòng kiểm tra kết nối internet.');
        } finally {
            setChecking(false);
        }
    };

    const applyUpdate = async () => {
        setUpdating(true);
        setError(null);
        setUpdateProgress(0);

        // Simulate progress
        const progressInterval = setInterval(() => {
            setUpdateProgress(prev => Math.min(prev + 10, 90));
        }, 500);

        try {
            const response = await api.post('/api/updates/apply');

            clearInterval(progressInterval);
            setUpdateProgress(100);

            if (response.data.success) {
                setUpdateResult({
                    type: 'success',
                    message: response.data.message
                });
                // Reload current version
                await loadCurrentVersion();
                setUpdateInfo(null);
            } else {
                setError(response.data.message || 'Cập nhật thất bại');
            }
        } catch (err) {
            clearInterval(progressInterval);
            console.error('Error applying update:', err);
            setError('Cập nhật thất bại: ' + (err.response?.data?.detail || err.message));
        } finally {
            setUpdating(false);
            setUpdateProgress(0);
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
            <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <UpdateIcon fontSize="large" />
                Cập Nhật Hệ Thống
            </Typography>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Kiểm tra và cập nhật quy tắc tuân thủ, chính sách bảo mật mới nhất
            </Typography>

            {/* Current Version Card */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        Phiên bản hiện tại
                    </Typography>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Chip
                            label={`v${currentVersion?.version || '1.0.0'}`}
                            color="primary"
                            size="large"
                            sx={{ fontSize: '1.2rem', py: 2.5 }}
                        />
                        <Box>
                            <Typography variant="body2" color="text.secondary">
                                Rules: {currentVersion?.rules_count || 0} quy tắc
                            </Typography>
                            {currentVersion?.installed_at && (
                                <Typography variant="body2" color="text.secondary">
                                    Cài đặt: {new Date(currentVersion.installed_at).toLocaleDateString('vi-VN')}
                                </Typography>
                            )}
                        </Box>
                    </Box>
                </CardContent>
            </Card>

            {/* Error Alert */}
            {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                    <AlertTitle>Lỗi</AlertTitle>
                    {error}
                </Alert>
            )}

            {/* Success Alert */}
            {updateResult && (
                <Alert severity={updateResult.type} sx={{ mb: 3 }} onClose={() => setUpdateResult(null)}>
                    {updateResult.message}
                </Alert>
            )}

            {/* Update Available Card */}
            {updateInfo?.has_update && (
                <Card sx={{ mb: 3, border: '2px solid', borderColor: 'warning.main' }}>
                    <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                            <NewReleasesIcon color="warning" />
                            <Typography variant="h6" color="warning.main">
                                Có bản cập nhật mới!
                            </Typography>
                        </Box>

                        <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1, mb: 2 }}>
                            <Typography variant="h5" gutterBottom>
                                Version {updateInfo.latest_version}
                            </Typography>

                            {updateInfo.release_date && (
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                    Ngày phát hành: {new Date(updateInfo.release_date).toLocaleDateString('vi-VN')}
                                </Typography>
                            )}

                            <Divider sx={{ my: 1 }} />

                            <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                                {updateInfo.changelog || 'Không có ghi chú'}
                            </Typography>

                            {updateInfo.rules_count > 0 && (
                                <Chip
                                    label={`${updateInfo.rules_count} quy tắc`}
                                    size="small"
                                    sx={{ mt: 1 }}
                                />
                            )}
                        </Box>

                        {updating ? (
                            <Box>
                                <Typography variant="body2" gutterBottom>
                                    Đang cập nhật... {updateProgress}%
                                </Typography>
                                <LinearProgress variant="determinate" value={updateProgress} />
                            </Box>
                        ) : (
                            <Button
                                variant="contained"
                                color="warning"
                                size="large"
                                startIcon={<DownloadIcon />}
                                onClick={applyUpdate}
                                fullWidth
                            >
                                Cập nhật ngay
                            </Button>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Check for Updates Button */}
            <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Button
                    variant="contained"
                    size="large"
                    startIcon={checking ? <CircularProgress size={20} color="inherit" /> : <RefreshIcon />}
                    onClick={checkForUpdates}
                    disabled={checking || updating}
                    sx={{ minWidth: 250 }}
                >
                    {checking ? 'Đang kiểm tra...' : 'Kiểm tra cập nhật'}
                </Button>

                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    Bấm để kiểm tra bản cập nhật mới từ nhà cung cấp
                </Typography>
            </Paper>
        </Box>
    );
};

export default SystemUpdates;
