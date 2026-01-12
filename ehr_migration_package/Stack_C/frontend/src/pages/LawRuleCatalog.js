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
} from '@mui/material';
import { fetchLawRules } from '../services/api';

const statusOptions = [
  { value: 'allowed', label: 'Allowed' },
  { value: 'required', label: 'Required' },
  { value: 'not_allowed', label: 'Not Allowed' },
];

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
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
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
    </Box>
  );
};

export default LawRuleCatalog;

