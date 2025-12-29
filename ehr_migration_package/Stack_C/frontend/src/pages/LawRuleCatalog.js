import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import GavelIcon from '@mui/icons-material/Gavel';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { fetchLawRules, createLawRule, importLawDocument } from '../services/api';

const statusOptions = [
  { value: 'allowed', label: 'Allowed' },
  { value: 'required', label: 'Required' },
  { value: 'not_allowed', label: 'Not Allowed' },
];

const defaultNewRule = {
  law_source: '',
  rule_code: '',
  rule_name: '',
  allowed_status: 'required',
  legal_refs: '',
  explanation: '',
  functional_group: '',
};

const LawRuleCatalog = () => {
  const [rules, setRules] = useState([]);
  const [meta, setMeta] = useState({
    law_sources: [],
    functional_groups: [],
    statuses: ['allowed', 'required', 'not_allowed'],
  });
  const [metaLoaded, setMetaLoaded] = useState(false);
  const [filters, setFilters] = useState({
    keyword: '',
    law_source: '',
    functional_group: '',
    allowed_status: '',
    rule_scope: '',
    log_field: '',
    auto_check: '',
  });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newRule, setNewRule] = useState(defaultNewRule);
  const [savingRule, setSavingRule] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState(null);

  const buildParams = useCallback(() => {
    const params = {
      page: page + 1,
      page_size: rowsPerPage,
    };
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        params[key] = value;
      }
    });
    return params;
  }, [filters, page, rowsPerPage]);

  const loadRules = useCallback(async (options = {}) => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        ...buildParams(),
        include_meta: options.forceMeta || !metaLoaded,
      };
      const response = await fetchLawRules(params);
      setRules(response.rules || []);
      setTotal(response.total || 0);
      if (response.meta) {
        setMeta({
          law_sources: response.meta.law_sources || [],
          functional_groups: response.meta.functional_groups || [],
          statuses: response.meta.statuses || statusOptions.map((s) => s.value),
        });
        setMetaLoaded(true);
      }
    } catch (err) {
      console.error('[LawRuleCatalog] Failed to fetch rules:', err);
      setError('Không tải được danh sách luật. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, [buildParams, metaLoaded]);

  useEffect(() => {
    loadRules();
  }, [loadRules]);

  const handleFilterChange = (field) => (event) => {
    setFilters((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
    setPage(0);
  };

  const handleClearFilters = () => {
    setFilters({
      keyword: '',
      law_source: '',
      functional_group: '',
      allowed_status: '',
      rule_scope: '',
      log_field: '',
      auto_check: '',
    });
    setPage(0);
  };

  const handleAddRuleChange = (field) => (event) => {
    setNewRule((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleAddRuleSubmit = async () => {
    if (!newRule.law_source || !newRule.rule_code || !newRule.rule_name) {
      setError('Vui lòng nhập đủ Nguồn luật, Mã quy tắc và Tên quy tắc.');
      return;
    }
    setSavingRule(true);
    setError(null);
    try {
      const payload = {
        ...newRule,
        allowed_status: newRule.allowed_status || undefined,
      };
      const response = await createLawRule(payload);
      if (response.success) {
        setSuccessMessage('Đã thêm quy tắc mới thành công.');
        setAddDialogOpen(false);
        setNewRule(defaultNewRule);
        setMetaLoaded(false); // reload filters and metadata
        await loadRules({ forceMeta: true });
      }
    } catch (err) {
      console.error('[LawRuleCatalog] Failed to create rule:', err);
      const message = err.response?.data?.detail || 'Không thể thêm quy tắc mới.';
      setError(message);
    } finally {
      setSavingRule(false);
    }
  };

  const handleImportFile = async () => {
    if (!importFile) {
      setError('Vui lòng chọn file để import.');
      return;
    }

    setImporting(true);
    setError(null);
    setImportProgress(0);
    setImportResult(null);

    try {
      const result = await importLawDocument(importFile, (progress) => {
        setImportProgress(progress);
      });

      setImportResult(result);

      if (result.success) {
        setSuccessMessage(
          `Đã tạo ${result.rules_created} quy tắc từ văn bản. ` +
          (result.rules_skipped > 0 ? `Bỏ qua ${result.rules_skipped} quy tắc trùng lặp.` : '') +
          (result.needs_review ? ' Có quy tắc cần xem xét lại.' : '')
        );
        setMetaLoaded(false);
        await loadRules({ forceMeta: true });
      }
    } catch (err) {
      console.error('[LawRuleCatalog] Failed to import document:', err);
      const message = err.response?.data?.detail || 'Không thể import văn bản.';
      setError(message);
    } finally {
      setImporting(false);
      setImportProgress(0);
    }
  };

  const renderChipList = (items = []) => {
    if (!items || items.length === 0) {
      return <Typography variant="caption" color="text.secondary">-</Typography>;
    }
    return (
      <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
        {items.map((item) => (
          <Chip key={item} label={item} size="small" sx={{ mb: 0.5 }} />
        ))}
      </Stack>
    );
  };

  const filterChips = useMemo(() => {
    const active = [];
    if (filters.keyword) active.push({ label: `Từ khóa: ${filters.keyword}`, field: 'keyword' });
    if (filters.law_source) active.push({ label: `Nguồn: ${filters.law_source}`, field: 'law_source' });
    if (filters.functional_group) active.push({ label: `Nhóm: ${filters.functional_group}`, field: 'functional_group' });
    if (filters.rule_scope) active.push({ label: `Loại: ${filters.rule_scope}`, field: 'rule_scope' });
    if (filters.allowed_status) active.push({ label: `Trạng thái: ${filters.allowed_status}`, field: 'allowed_status' });
    if (filters.log_field) active.push({ label: `Trường log: ${filters.log_field}`, field: 'log_field' });
    if (filters.auto_check) active.push({ label: `Auto check: ${filters.auto_check}`, field: 'auto_check' });
    return active;
  }, [filters]);

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
        <Box>
          <Typography variant="h4" component="h1">
            Tra cứu Bộ luật Tuân thủ
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Tìm kiếm quy tắc, yêu cầu log và căn cứ pháp lý để đối chiếu với SIEM
          </Typography>
        </Box>
        <Box sx={{ flexGrow: 1 }} />
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={() => loadRules()}
          sx={{ mr: 1 }}
        >
          Làm mới
        </Button>
        <Button
          variant="outlined"
          color="secondary"
          startIcon={<UploadFileIcon />}
          onClick={() => {
            setImportDialogOpen(true);
            setImportFile(null);
            setImportResult(null);
            setImportProgress(0);
            setError(null);
          }}
          sx={{ mr: 1 }}
        >
          Import Văn bản
        </Button>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setAddDialogOpen(true);
            setSuccessMessage('');
            setError(null);
          }}
        >
          Thêm quy tắc
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMessage('')}>
          {successMessage}
        </Alert>
      )}

      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              label="Từ khóa (mã / tên / giải thích)"
              value={filters.keyword}
              onChange={handleFilterChange('keyword')}
              fullWidth
              size="small"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Nguồn luật</InputLabel>
              <Select
                label="Nguồn luật"
                value={filters.law_source}
                onChange={handleFilterChange('law_source')}
              >
                <MenuItem value="">
                  <em>Tất cả</em>
                </MenuItem>
                {meta.law_sources.map((source) => (
                  <MenuItem key={source} value={source}>
                    {source}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Nhóm chức năng</InputLabel>
              <Select
                label="Nhóm chức năng"
                value={filters.functional_group}
                onChange={handleFilterChange('functional_group')}
              >
                <MenuItem value="">
                  <em>Tất cả</em>
                </MenuItem>
                {meta.functional_groups.map((group) => (
                  <MenuItem key={group} value={group}>
                    {group.replace(/[\u25A0-\u25FF\u2580-\u259F\u2B1B\u2B1C]/g, '').trim()}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Loại quy tắc</InputLabel>
              <Select
                label="Loại quy tắc"
                value={filters.rule_scope || ''}
                onChange={handleFilterChange('rule_scope')}
              >
                <MenuItem value="">
                  <em>Tất cả</em>
                </MenuItem>
                <MenuItem value="SYSTEM">System (Kỹ thuật)</MenuItem>
                <MenuItem value="USER">User (Pháp lý)</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Trạng thái</InputLabel>
              <Select
                label="Trạng thái"
                value={filters.allowed_status}
                onChange={handleFilterChange('allowed_status')}
              >
                <MenuItem value="">
                  <em>Tất cả</em>
                </MenuItem>
                {(meta.statuses.length ? meta.statuses : statusOptions.map((s) => s.value)).map((status) => (
                  <MenuItem key={status} value={status}>
                    {status}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              label="Trường log cần tìm"
              value={filters.log_field}
              onChange={handleFilterChange('log_field')}
              fullWidth
              size="small"
            />
          </Grid>
          <Grid item xs={12}>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {filterChips.map((chip) => (
                <Chip
                  key={chip.field}
                  label={chip.label}
                  onDelete={() =>
                    setFilters((prev) => ({
                      ...prev,
                      [chip.field]: '',
                    }))
                  }
                />
              ))}
              {filterChips.length === 0 && (
                <Typography variant="caption" color="text.secondary">
                  Chưa áp dụng bộ lọc nào.
                </Typography>
              )}
              <Button onClick={handleClearFilters} size="small">
                Xóa tất cả bộ lọc
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      <Paper>
        <TableContainer>
          <Table size="medium">
            <TableHead>
              <TableRow>
                <TableCell>Nguồn luật</TableCell>
                <TableCell>Mã / Tên quy tắc</TableCell>
                <TableCell>Trạng thái</TableCell>
                <TableCell>Nhóm chức năng</TableCell>
                <TableCell>Trường log cần ghi</TableCell>
                <TableCell>Căn cứ pháp lý</TableCell>
                <TableCell sx={{ minWidth: 200 }}>Mức phạt pháp lý</TableCell>
                <TableCell>Giải thích</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <CircularProgress size={32} />
                  </TableCell>
                </TableRow>
              ) : rules.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    Không có dữ liệu
                  </TableCell>
                </TableRow>
              ) : (
                rules.map((rule) => (
                  <TableRow key={rule.id} hover>
                    <TableCell>
                      <Typography variant="subtitle2">{rule.law_source}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="subtitle2">{rule.rule_code}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {rule.rule_name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={rule.rule_scope === 'SYSTEM' ? 'SYSTEM' : 'USER'}
                        color={rule.rule_scope === 'SYSTEM' ? 'primary' : 'default'}
                        size="small"
                        sx={{ mr: 1 }}
                      />
                      <Chip
                        label={rule.allowed_status || 'N/A'}
                        color={
                          rule.allowed_status === 'required'
                            ? 'error'
                            : rule.allowed_status === 'allowed'
                              ? 'success'
                              : 'warning'
                        }
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{rule.functional_group || '-'}</Typography>
                    </TableCell>
                    <TableCell>{renderChipList(rule.log_fields)}</TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {rule.legal_refs || rule.legal_basis || '-'}
                      </Typography>
                      {rule.law_url && (
                        <Box sx={{ mt: 0.5 }}>
                          <a
                            href={rule.law_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ fontSize: '11px', color: '#1976d2' }}
                          >
                            Xem văn bản gốc
                          </a>
                        </Box>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="caption"
                        sx={{
                          color: rule.penalty_level ? 'error.main' : 'text.secondary',
                          fontWeight: rule.penalty_level ? 500 : 400
                        }}
                      >
                        {rule.penalty_level || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{rule.explanation || '-'}</Typography>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={(event, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(event) => {
            setRowsPerPage(parseInt(event.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[10, 20, 50]}
          labelRowsPerPage="Số dòng mỗi trang:"
        />
      </Paper>

      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Stack direction="row" spacing={1} alignItems="center">
            <GavelIcon />
            Thêm quy tắc tuân thủ mới
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                label="Nguồn luật"
                value={newRule.law_source}
                onChange={handleAddRuleChange('law_source')}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Mã quy tắc"
                value={newRule.rule_code}
                onChange={handleAddRuleChange('rule_code')}
                fullWidth
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Tên quy tắc"
                value={newRule.rule_name}
                onChange={handleAddRuleChange('rule_name')}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Trạng thái</InputLabel>
                <Select
                  label="Trạng thái"
                  value={newRule.allowed_status}
                  onChange={handleAddRuleChange('allowed_status')}
                >
                  {statusOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Nhóm chức năng"
                value={newRule.functional_group}
                onChange={handleAddRuleChange('functional_group')}
                fullWidth
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Căn cứ pháp lý"
                value={newRule.legal_refs}
                onChange={handleAddRuleChange('legal_refs')}
                fullWidth
                multiline
                minRows={2}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Giải thích / ghi chú"
                value={newRule.explanation}
                onChange={handleAddRuleChange('explanation')}
                fullWidth
                multiline
                minRows={2}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)} disabled={savingRule}>
            Hủy
          </Button>
          <Button
            onClick={handleAddRuleSubmit}
            variant="contained"
            disabled={savingRule}
          >
            {savingRule ? 'Đang lưu...' : 'Lưu quy tắc'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Import Document Dialog */}
      <Dialog open={importDialogOpen} onClose={() => !importing && setImportDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Import Văn bản Luật (AI Tự động)</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Upload file PDF hoặc DOCX chứa văn bản luật. Hệ thống sẽ tự động sử dụng AI (OpenAI GPT-4 + Google Gemini)
              để trích xuất các quy tắc tuân thủ.
            </Typography>

            <input
              accept=".pdf,.docx,.doc"
              style={{ display: 'none' }}
              id="import-file-input"
              type="file"
              onChange={(e) => setImportFile(e.target.files[0])}
              disabled={importing}
            />
            <label htmlFor="import-file-input">
              <Button
                variant="outlined"
                component="span"
                fullWidth
                startIcon={<UploadFileIcon />}
                disabled={importing}
                sx={{ mb: 2 }}
              >
                {importFile ? importFile.name : 'Chọn file (PDF/DOCX)'}
              </Button>
            </label>

            {importing && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Đang xử lý... {importProgress > 0 && `${importProgress}%`}
                </Typography>
                {importProgress > 0 && (
                  <Box sx={{ width: '100%', height: 8, bgcolor: 'grey.200', borderRadius: 1, overflow: 'hidden' }}>
                    <Box
                      sx={{
                        width: `${importProgress}%`,
                        height: '100%',
                        bgcolor: 'primary.main',
                        transition: 'width 0.3s',
                      }}
                    />
                  </Box>
                )}
                <CircularProgress size={24} sx={{ mt: 1 }} />
              </Box>
            )}

            {importResult && (
              <Box sx={{ mt: 2 }}>
                <Alert severity={importResult.success ? 'success' : 'warning'} sx={{ mb: 2 }}>
                  <Typography variant="body2" fontWeight="bold">
                    {importResult.message}
                  </Typography>
                  <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                    Độ tin cậy: {(importResult.confidence * 100).toFixed(1)}%
                  </Typography>
                  {importResult.needs_review && (
                    <Typography variant="caption" display="block" color="warning.main" sx={{ mt: 0.5 }}>
                      Có quy tắc cần xem xét lại
                    </Typography>
                  )}
                </Alert>
                {importResult.invalid_rules && importResult.invalid_rules.length > 0 && (
                  <Alert severity="info" sx={{ mt: 1 }}>
                    <Typography variant="caption">
                      {importResult.invalid_rules.length} quy tắc không hợp lệ đã được bỏ qua.
                    </Typography>
                  </Alert>
                )}
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setImportDialogOpen(false);
            setImportFile(null);
            setImportResult(null);
          }} disabled={importing}>
            Đóng
          </Button>
          <Button
            onClick={handleImportFile}
            variant="contained"
            disabled={!importFile || importing}
            startIcon={importing ? <CircularProgress size={16} /> : <UploadFileIcon />}
          >
            {importing ? 'Đang xử lý...' : 'Import và Xử lý AI'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LawRuleCatalog;

