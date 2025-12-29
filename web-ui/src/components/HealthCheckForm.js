import React, { useState, useEffect } from 'react';
import {
    Box, Grid, Typography, TextField, Checkbox,
    FormControlLabel, Radio, RadioGroup, Button,
    Paper, Table, TableBody, TableCell, TableHead, TableRow,
    Divider, Avatar
} from '@mui/material';

const HealthCheckForm = ({ mode = 'view', initialData = {}, onChange }) => {
    // Modes: 'nurse' (Edit Part I/II), 'doctor' (Edit Part III/V), 'view' (Read Only), 'print'

    const [formData, setFormData] = useState({
        // Administrative
        form_type: 'over_18', // or 'under_18'
        full_name: '',
        gender: 'male',
        age: '',
        passport_id: '',
        issue_date: '',
        issue_place: '',
        address: '',
        reason: 'Khám sức khỏe đi học/đi làm',
        guardian: '', // for <18

        // Part I: History
        history_family: {
            has_disease: false,
            details: ''
        },
        history_personal: {
            has_disease: false,
            details: ''
        },
        history_other: {
            current_medication: '',
            pregnancy: '' // female only
        },

        // Part II: Vitals (Physical)
        vitals: {
            height: '',
            weight: '',
            bmi: '',
            pulse: '',
            blood_pressure: '',
            physical_class: '1' // 1-5
        },

        // Part III: Clinical Exam
        clinical: {
            internal: { result: 'Bình thường', class: '1' },
            surgery: { result: 'Bình thường', class: '1' },
            obgyn: { result: 'Bình thường', class: '1' }, // female
            eye: {
                right_eye_glass: '', left_eye_glass: '',
                right_eye_no_glass: '10/10', left_eye_no_glass: '10/10',
                disease: '', class: '1'
            },
            ent: {
                left_hearing_speak: '5m', left_hearing_whisper: '0.5m',
                right_hearing_speak: '5m', right_hearing_whisper: '0.5m',
                disease: '', class: '1'
            },
            dental: {
                upper_jaw: '', lower_jaw: '',
                disease: '', class: '1'
            },
            derm: { disease: '', class: '1' },
            neuro: { result: 'Bình thường', class: '1' },
            psych: { result: 'Bình thường', class: '1' }
        },

        // Part IV: Labs
        labs: {
            blood_count: { rbc: '', wbc: '', plt: '' },
            blood_chem: { glucose: '', ure: '', creat: '', got: '', gpt: '' },
            urine: { sugar: '', protein: '' },
            xray: 'Chưa thực hiện',
            other: ''
        },

        // Part V: Conclusion
        conclusion: {
            health_class: '1', // 1-5
            diseases: '',
            fit_for_work: true,
            suggestion: ''
        }
    });

    useEffect(() => {
        if (initialData) {
            setFormData(prev => ({ ...prev, ...initialData }));
        }
    }, [initialData]);

    // Permission Logic
    const canEditAdmin = mode === 'nurse';
    const canEditHistory = mode === 'nurse';
    const canEditVitals = mode === 'nurse';
    const canEditClinical = mode === 'doctor';
    const canEditLabs = mode === 'doctor'; // Usually Lab tech, but Doctor can override
    const canEditConclusion = mode === 'doctor';

    const handleChange = (section, field, value, subfield = null) => {
        if (mode === 'view' || mode === 'print') return;

        const newData = { ...formData };
        if (section === 'root') {
            newData[field] = value;
        } else if (subfield) {
            newData[section][field][subfield] = value;
        } else {
            newData[section][field] = value;
        }
        setFormData(newData);
        if (onChange) onChange(newData);
    };

    const renderTextField = (section, field, label, width = '100%', subfield = null, editable = true) => (
        <TextField
            label={label}
            value={subfield ? formData[section][field][subfield] : (section === 'root' ? formData[field] : formData[section][field])}
            onChange={(e) => handleChange(section, field, e.target.value, subfield)}
            disabled={!editable}
            fullWidth
            variant="standard"
            size="small"
            style={{ width }}
            InputLabelProps={{ shrink: true }}
        />
    );

    return (
        <Paper style={{ padding: 20, maxWidth: '210mm', margin: 'auto', backgroundColor: '#fff' }}>
            {/* HEADER */}
            <Box textAlign="center" mb={2}>
                <Typography variant="subtitle1" style={{ textTransform: 'uppercase', fontWeight: 'bold' }}>
                    Cộng hòa xã hội chủ nghĩa Việt Nam
                </Typography>
                <Typography variant="subtitle2" style={{ textTransform: 'uppercase', textDecoration: 'underline' }}>
                    Độc lập - Tự do - Hạnh phúc
                </Typography>
                <Box mt={2}>
                    <Typography variant="h5" style={{ fontWeight: 'bold', textTransform: 'uppercase' }}>
                        GIẤY KHÁM SỨC KHỎE
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                        (Dành cho người {formData.form_type === 'under_18' ? 'dưới' : 'trên'} 18 tuổi)
                    </Typography>
                </Box>
            </Box>

            {/* ADMIN INFO */}
            <Grid container spacing={2}>
                <Grid item xs={3}>
                    <Box border="1px solid #ccc" height={150} display="flex" alignItems="center" justifyContent="center">
                        Ảnh 4x6
                    </Box>
                </Grid>
                <Grid item xs={9}>
                    <Grid container spacing={1}>
                        <Grid item xs={12}>{renderTextField('root', 'full_name', 'Họ và tên (chữ in hoa)', '100%', null, canEditAdmin)}</Grid>
                        <Grid item xs={6}>
                            <Typography display="inline" mr={2}>Giới tính:</Typography>
                            <RadioGroup row value={formData.gender} onChange={(e) => handleChange('root', 'gender', e.target.value)} style={{ display: 'inline-flex' }}>
                                <FormControlLabel value="male" control={<Radio disabled={!canEditAdmin} size="small" />} label="Nam" />
                                <FormControlLabel value="female" control={<Radio disabled={!canEditAdmin} size="small" />} label="Nữ" />
                            </RadioGroup>
                        </Grid>
                        <Grid item xs={6}>{renderTextField('root', 'age', 'Tuổi', '100%', null, canEditAdmin)}</Grid>
                        <Grid item xs={12}>{renderTextField('root', 'passport_id', 'CMND/CCCD/Hộ chiếu', '100%', null, canEditAdmin)}</Grid>
                        <Grid item xs={12}>{renderTextField('root', 'address', 'Chỗ ở hiện tại', '100%', null, canEditAdmin)}</Grid>
                        <Grid item xs={12}>{renderTextField('root', 'reason', 'Lý do khám', '100%', null, canEditAdmin)}</Grid>
                        {formData.form_type === 'under_18' && (
                            <Grid item xs={12}>{renderTextField('root', 'guardian', 'Họ tên bố/mẹ/người giám hộ', '100%', null, canEditAdmin)}</Grid>
                        )}
                    </Grid>
                </Grid>
            </Grid>

            <Divider style={{ margin: '20px 0' }} />

            {/* PART I: HISTORY */}
            <Typography variant="h6" gutterBottom style={{ backgroundColor: '#eee', padding: 5 }}>
                I. TIỀN SỬ BỆNH
            </Typography>
            <Box mb={2}>
                <Typography variant="subtitle2">1. Tiền sử gia đình:</Typography>
                <Typography variant="caption">Có ai trong gia đình mắc bệnh truyền nhiễm, tim mạch, ĐTĐ, lao, hen, ung thư, động kinh...?</Typography>
                <Box>
                    <FormControlLabel
                        control={<Checkbox checked={!formData.history_family.has_disease} onChange={(e) => handleChange('history_family', 'has_disease', !e.target.checked)} disabled={!canEditHistory} />}
                        label="Không"
                    />
                    <FormControlLabel
                        control={<Checkbox checked={formData.history_family.has_disease} onChange={(e) => handleChange('history_family', 'has_disease', e.target.checked)} disabled={!canEditHistory} />}
                        label="Có"
                    />
                    {formData.history_family.has_disease && renderTextField('history_family', 'details', 'Tên bệnh', '100%', null, canEditHistory)}
                </Box>
            </Box>
            <Box mb={2}>
                <Typography variant="subtitle2">2. Tiền sử bản thân:</Typography>
                <Box>
                    <FormControlLabel
                        control={<Checkbox checked={!formData.history_personal.has_disease} onChange={(e) => handleChange('history_personal', 'has_disease', !e.target.checked)} disabled={!canEditHistory} />}
                        label="Không"
                    />
                    <FormControlLabel
                        control={<Checkbox checked={formData.history_personal.has_disease} onChange={(e) => handleChange('history_personal', 'has_disease', e.target.checked)} disabled={!canEditHistory} />}
                        label="Có"
                    />
                    {formData.history_personal.has_disease && renderTextField('history_personal', 'details', 'Tên bệnh', '100%', null, canEditHistory)}
                </Box>
            </Box>
            <Box mb={2}>
                <Typography variant="subtitle2">3. Câu hỏi khác:</Typography>
                {renderTextField('history_other', 'current_medication', 'Đang điều trị bệnh gì/Thuốc đang dùng', '100%', null, canEditHistory)}
                {formData.gender === 'female' && renderTextField('history_other', 'pregnancy', 'Tiền sử thai sản (nếu có)', '100%', null, canEditHistory)}
            </Box>

            {/* PART II: VITALS */}
            <Typography variant="h6" gutterBottom style={{ backgroundColor: '#eee', padding: 5 }}>
                II. KHÁM THỂ LỰC
            </Typography>
            <Grid container spacing={2}>
                <Grid item xs={3}>{renderTextField('vitals', 'height', 'Chiều cao (cm)', '100%', null, canEditVitals)}</Grid>
                <Grid item xs={3}>{renderTextField('vitals', 'weight', 'Cân nặng (kg)', '100%', null, canEditVitals)}</Grid>
                <Grid item xs={3}>{renderTextField('vitals', 'bmi', 'BMI', '100%', null, canEditVitals)}</Grid>
                <Grid item xs={3}>{renderTextField('vitals', 'pulse', 'Mạch (lần/phút)', '100%', null, canEditVitals)}</Grid>
                <Grid item xs={3}>{renderTextField('vitals', 'blood_pressure', 'Huyết áp (mmHg)', '100%', null, canEditVitals)}</Grid>
                <Grid item xs={3}>{renderTextField('vitals', 'physical_class', 'Phân loại thể lực (1-5)', '100%', null, canEditVitals)}</Grid>
            </Grid>

            {/* PART III: CLINICAL */}
            <Typography variant="h6" gutterBottom style={{ backgroundColor: '#eee', padding: 5, marginTop: 20 }}>
                III. KHÁM LÂM SÀNG
            </Typography>
            <Table size="small" style={{ border: '1px solid #ccc' }}>
                <TableHead>
                    <TableRow>
                        <TableCell width="30%">**Nội dung khám**</TableCell>
                        <TableCell>**Kết quả**</TableCell>
                        <TableCell width="15%">**Phân loại**</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {/* Internal */}
                    <TableRow>
                        <TableCell>1. Nội khoa (Tuần hoàn, Hô hấp, Tiêu hóa...)</TableCell>
                        <TableCell>{renderTextField('clinical', 'internal', 'Kết quả', '100%', 'result', canEditClinical)}</TableCell>
                        <TableCell>{renderTextField('clinical', 'internal', 'PL', '100%', 'class', canEditClinical)}</TableCell>
                    </TableRow>
                    {/* Surgery */}
                    <TableRow>
                        <TableCell>2. Ngoại khoa</TableCell>
                        <TableCell>{renderTextField('clinical', 'surgery', 'Kết quả', '100%', 'result', canEditClinical)}</TableCell>
                        <TableCell>{renderTextField('clinical', 'surgery', 'PL', '100%', 'class', canEditClinical)}</TableCell>
                    </TableRow>
                    {/* ObGyn (Female) */}
                    {formData.gender === 'female' && (
                        <TableRow>
                            <TableCell>3. Sản phụ khoa</TableCell>
                            <TableCell>{renderTextField('clinical', 'obgyn', 'Kết quả', '100%', 'result', canEditClinical)}</TableCell>
                            <TableCell>{renderTextField('clinical', 'obgyn', 'PL', '100%', 'class', canEditClinical)}</TableCell>
                        </TableRow>
                    )}
                    {/* Eye */}
                    <TableRow>
                        <TableCell>
                            4. Mắt<br />
                            - Thị lực không kính: P: {renderTextField('clinical', 'eye', 'P', '30px', 'right_eye_no_glass', canEditClinical)} - T: {renderTextField('clinical', 'eye', 'T', '30px', 'left_eye_no_glass', canEditClinical)}<br />
                            - Thị lực có kính: P: {renderTextField('clinical', 'eye', 'P', '30px', 'right_eye_glass', canEditClinical)} - T: {renderTextField('clinical', 'eye', 'T', '30px', 'left_eye_glass', canEditClinical)}
                        </TableCell>
                        <TableCell>{renderTextField('clinical', 'eye', 'Bệnh về mắt', '100%', 'disease', canEditClinical)}</TableCell>
                        <TableCell>{renderTextField('clinical', 'eye', 'PL', '100%', 'class', canEditClinical)}</TableCell>
                    </TableRow>
                    {/* ENT */}
                    <TableRow>
                        <TableCell>
                            5. Tai - Mũi - Họng<br />
                            - Thính lực nói thường: T: {renderTextField('clinical', 'ent', 'm', '30px', 'left_hearing_speak', canEditClinical)} - P: {renderTextField('clinical', 'ent', 'm', '30px', 'right_hearing_speak', canEditClinical)}
                        </TableCell>
                        <TableCell>{renderTextField('clinical', 'ent', 'Bệnh TMH', '100%', 'disease', canEditClinical)}</TableCell>
                        <TableCell>{renderTextField('clinical', 'ent', 'PL', '100%', 'class', canEditClinical)}</TableCell>
                    </TableRow>
                    {/* Dental */}
                    <TableRow>
                        <TableCell>6. Răng - Hàm - Mặt</TableCell>
                        <TableCell>{renderTextField('clinical', 'dental', 'Bệnh RHM', '100%', 'disease', canEditClinical)}</TableCell>
                        <TableCell>{renderTextField('clinical', 'dental', 'PL', '100%', 'class', canEditClinical)}</TableCell>
                    </TableRow>
                    {/* Derm */}
                    <TableRow>
                        <TableCell>7. Da liễu</TableCell>
                        <TableCell>{renderTextField('clinical', 'derm', 'Bệnh da liễu', '100%', 'disease', canEditClinical)}</TableCell>
                        <TableCell>{renderTextField('clinical', 'derm', 'PL', '100%', 'class', canEditClinical)}</TableCell>
                    </TableRow>
                </TableBody>
            </Table>

            {/* PART IV: LABS */}
            <Typography variant="h6" gutterBottom style={{ backgroundColor: '#eee', padding: 5, marginTop: 20 }}>
                IV. KHÁM CẬN LÂM SÀNG
            </Typography>
            <Grid container spacing={2}>
                <Grid item xs={12}>
                    <Typography variant="subtitle2">1. Xét nghiệm máu:</Typography>
                    <Box display="flex" gap={2}>
                        {renderTextField('labs', 'blood_count', 'HC', '80px', 'rbc', canEditLabs)}
                        {renderTextField('labs', 'blood_count', 'BC', '80px', 'wbc', canEditLabs)}
                        {renderTextField('labs', 'blood_count', 'TC', '80px', 'plt', canEditLabs)}
                        {renderTextField('labs', 'blood_chem', 'Đường máu', '100px', 'glucose', canEditLabs)}
                        {renderTextField('labs', 'blood_chem', 'Ure', '80px', 'ure', canEditLabs)}
                        {renderTextField('labs', 'blood_chem', 'Creatinin', '80px', 'creat', canEditLabs)}
                    </Box>
                </Grid>
                <Grid item xs={12}>
                    <Typography variant="subtitle2">2. Xét nghiệm nước tiểu:</Typography>
                    <Box display="flex" gap={2}>
                        {renderTextField('labs', 'urine', 'Đường', '100px', 'sugar', canEditLabs)}
                        {renderTextField('labs', 'urine', 'Protein', '100px', 'protein', canEditLabs)}
                    </Box>
                </Grid>
                <Grid item xs={12}>
                    <Typography variant="subtitle2">3. Chẩn đoán hình ảnh:</Typography>
                    {renderTextField('labs', 'xray', 'X-quang / Khác', '100%', null, canEditLabs)}
                </Grid>
            </Grid>

            {/* PART V: CONCLUSION */}
            <Typography variant="h6" gutterBottom style={{ backgroundColor: '#eee', padding: 5, marginTop: 20 }}>
                V. KẾT LUẬN
            </Typography>
            <Grid container spacing={2}>
                <Grid item xs={12}>
                    <Typography display="inline" mr={2}>Phân loại sức khỏe (1-5):</Typography>
                    <RadioGroup row value={formData.conclusion.health_class} onChange={(e) => handleChange('conclusion', 'health_class', e.target.value)} style={{ display: 'inline-flex' }}>
                        {['1', '2', '3', '4', '5'].map(v => (
                            <FormControlLabel key={v} value={v} control={<Radio disabled={!canEditConclusion} size="small" />} label={`Loại ${v}`} />
                        ))}
                    </RadioGroup>
                </Grid>
                <Grid item xs={12}>
                    {renderTextField('conclusion', 'diseases', 'Các bệnh tật (nếu có)', '100%', null, canEditConclusion)}
                </Grid>
                {formData.form_type === 'over_18' && (
                    <Grid item xs={12}>
                        <FormControlLabel
                            control={<Checkbox checked={formData.conclusion.fit_for_work} onChange={(e) => handleChange('conclusion', 'fit_for_work', e.target.checked)} disabled={!canEditConclusion} />}
                            label="Đủ sức khỏe để học tập / công tác"
                        />
                    </Grid>
                )}
            </Grid>

            <Box mt={4} display="flex" justifyContent="flex-end">
                <Box textAlign="center">
                    <Typography>........., ngày ..... tháng ..... năm .......</Typography>
                    <Typography style={{ fontWeight: 'bold' }}>NGƯỜI KẾT LUẬN</Typography>
                    <Typography variant="caption">(Ký, ghi rõ họ tên và đóng dấu)</Typography>
                    <Box height={80}></Box>
                    <Typography>{formData.conclusion.doctor_name || '................................'}</Typography>
                </Box>
            </Box>

        </Paper>
    );
};

export default HealthCheckForm;
