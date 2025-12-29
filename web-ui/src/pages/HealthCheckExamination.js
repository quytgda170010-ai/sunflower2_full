import React, { useState, useEffect } from 'react';
import {
    Container,
    Typography,
    Box,
    Card,
    CardContent,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    Alert,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Grid,
    Tabs,
    Tab,
    FormControlLabel,
    Checkbox,
    Divider,
} from '@mui/material';
import {
    Refresh as RefreshIcon,
    Edit as EditIcon,
    Save as SaveIcon,
    LocalHospital as HospitalIcon,
    CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

// Mapping roles to specialties and sections
const SPECIALTY_MAPPING = {
    'doctor_general': { specialty: 'general', label: 'General / Internal', sections: ['general_exam', 'internal_exam', 'conclusion'] },
    'doctor_pediatrics': { specialty: 'pediatrics', label: 'Pediatrics', sections: ['pediatrics_exam'] },
    'doctor_surgery': { specialty: 'surgery', label: 'Surgery', sections: ['surgery_exam'] },
    'doctor_obgyn': { specialty: 'obgyn', label: 'Obstetrics & Gynecology', sections: ['obgyn_exam'] },
    'doctor_ent': { specialty: 'ent', label: 'ENT', sections: ['ent_exam'] },
    'doctor_ophthalmology': { specialty: 'ophthalmology', label: 'Ophthalmology', sections: ['ophthalmology_exam'] },
    'doctor_dentomaxillofacial': { specialty: 'dentomaxillofacial', label: 'Dental', sections: ['dental_exam'] },
    'doctor_dermatology': { specialty: 'dermatology', label: 'Dermatology', sections: ['dermatology_exam'] },
    'doctor_nutrition': { specialty: 'nutrition', label: 'Nutrition', sections: ['nutrition_exam'] },
};

// Section Definitions for Tabs
const SECTIONS = [
    { id: 'general_exam', label: 'Physical / Vital' },
    { id: 'internal_exam', label: 'Internal Med' },
    { id: 'surgery_exam', label: 'Surgery' },
    { id: 'obgyn_exam', label: 'OB/GYN' },
    { id: 'pediatrics_exam', label: 'Pediatrics' },
    { id: 'ent_exam', label: 'ENT' },
    { id: 'ophthalmology_exam', label: 'Eye' },
    { id: 'dental_exam', label: 'Dental' },
    { id: 'dermatology_exam', label: 'Dermatology' },
    { id: 'nutrition_exam', label: 'Nutrition' },
    { id: 'conclusion', label: 'Conclusion' },
];

function HealthCheckExamination() {
    const { roles, user } = useAuth();

    // Identify current user's specialty
    const [userSpecialty, setUserSpecialty] = useState('');
    const [allowedSections, setAllowedSections] = useState([]);

    useEffect(() => {
        // Determine specialty from roles
        let specialty = '';
        let allowed = [];

        // Check specific doctor roles first
        for (const [role, config] of Object.entries(SPECIALTY_MAPPING)) {
            if (roles.includes(role)) {
                specialty = config.specialty;
                allowed = [...allowed, ...config.sections];
            }
        }

        // Fallback or generic 'doctor'
        if (!specialty && roles.includes('doctor')) {
            // Default to general if just 'doctor'
            specialty = 'general';
            allowed = SPECIALTY_MAPPING['doctor_general'].sections;
        }

        setUserSpecialty(specialty);
        setAllowedSections(allowed);
    }, [roles]);

    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Dialog State
    const [openDialog, setOpenDialog] = useState(false);
    const [currentAppointment, setCurrentAppointment] = useState(null);
    const [currentForm, setCurrentForm] = useState(null); // The HealthCheckForm object
    const [activeTab, setActiveTab] = useState(0);
    const [saving, setSaving] = useState(false);

    // Form Data State (Monolithic object for simplicity in this view)
    const [formData, setFormData] = useState({});

    const fetchQueue = async (showLoading = true) => {
        try {
            if (showLoading) setLoading(true);
            setError('');
            // Using the updated endpoint that returns both waiting_doctor_first_review and final_review
            const response = await api.get('/admin/queues/internal-med/doctor');
            if (response.data && Array.isArray(response.data.appointments)) {
                setPatients(response.data.appointments);
            } else {
                setPatients([]);
            }
        } catch (err) {
            console.error('Error fetching queue:', err);
            setError('Unable to load patient list');
        } finally {
            if (showLoading) setLoading(false);
        }
    };

    useEffect(() => {
        fetchQueue(true);
        const interval = setInterval(() => fetchQueue(false), 30000);
        return () => clearInterval(interval);
    }, []);

    const handleExamine = async (appointment) => {
        try {
            setError('');
            setCurrentAppointment(appointment);
            setFormData({});

            // 1. Try to create/get the Health Check Form
            // We use the create endpoint which should handle "get existing" based on appointment_id or patient logic
            // OR we search for it. For now, assuming we trigger creation/retrieval via the create API or a lookup.
            // Since 'create' might be restricted to receptionist/general, we might need a distinct GET.
            // Let's try to "Create" lightly, or assume one exists if status > screening.

            const payload = {
                patient_id: appointment.patient_id,
                appointment_id: appointment.id,
                template_type: 'adult', // Defaulting to adult for now, logic can be refined
                created_by: user.preferred_username || 'unknown',
            };

            // We will try to create. If it exists, backend might return error or existing. 
            // Actually, standard flow: Receptionist creates it. 
            // If we are here, it MIGHT exist. 
            // Let's try to Find it first.

            // Temporary: We don't have a direct 'get_by_appointment' in the plan implementation.
            // We will attempt to create, expecting the backend to optionally return existing or we handle duplicates.
            // In the `main.py` implementation you saw `create_health_check_form`.

            let formResponse;
            try {
                formResponse = await api.get(`/api/health-check/appointment/${appointment.id}`);
            } catch (e) {
                // If generic get fails, try create (if we are allowed)
                formResponse = await api.post('/api/health-check/create', payload);
            }

            if (formResponse.data) {
                const form = formResponse.data;
                setCurrentForm(form);

                // Flatten section data into formData for the UI
                let mergedData = {};
                if (form.data && form.data.sections) {
                    Object.keys(form.data.sections).forEach(key => {
                        mergedData[key] = form.data.sections[key];
                    });
                }
                setFormData(mergedData);
            }

            setOpenDialog(true);
        } catch (err) {
            console.error("Error opening exam:", err);
            setError("Could not load Health Check Form. It might not have been created by Reception yet.");
            // Fallback: Allows creating if not exists?
            // For now show error.
        }
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setCurrentAppointment(null);
        setCurrentForm(null);
        setFormData({});
    };

    const handleFieldChange = (section, field, value) => {
        setFormData(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [field]: value
            }
        }));
    };

    // Helper to render text field
    const renderField = (sectionName, fieldName, label, multiline = false) => {
        const sectionData = formData[sectionName] || {};
        const value = sectionData[fieldName] || '';
        const isAllowed = allowedSections.includes(sectionName) || allowedSections.includes('all'); // 'all' for admin/super doctor

        return (
            <TextField
                fullWidth
                label={label}
                value={value}
                onChange={(e) => handleFieldChange(sectionName, fieldName, e.target.value)}
                disabled={!isAllowed}
                multiline={multiline}
                rows={multiline ? 3 : 1}
                sx={{ mb: 2 }}
                variant="outlined"
                size="small"
            />
        );
    };

    const handleSaveSection = async (sectionName) => {
        if (!currentForm || !currentForm.id) return;

        try {
            setSaving(true);
            const sectionData = formData[sectionName] || {};

            await api.put(`/api/health-check/${currentForm.id}/section/${sectionName}`, sectionData);

            setSuccess(`Section ${sectionName} saved successfully.`);
            setTimeout(() => setSuccess(''), 3000);

            // Refresh form data
            // const res = await api.get(`/api/health-check/${currentForm.id}`);
            // setCurrentForm(res.data);
        } catch (err) {
            console.error(`Error saving ${sectionName}:`, err);
            setError(`Failed to save section: ${err.message}`);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h4" component="h1">
                    Specialist Examination (Hồ Sơ KSK)
                </Typography>
                <Box>
                    <Chip label={`Your Specialty: ${userSpecialty || 'None'}`} color="primary" sx={{ mr: 2 }} />
                    <Button variant="outlined" startIcon={<RefreshIcon />} onClick={() => fetchQueue(true)}>
                        Refresh Queue
                    </Button>
                </Box>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

            <Card>
                <CardContent>
                    <TableContainer component={Paper} variant="outlined">
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>No.</TableCell>
                                    <TableCell>Patient Name</TableCell>
                                    <TableCell>DOB / Gender</TableCell>
                                    <TableCell>Reason</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell>Action</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {patients.length === 0 ? (
                                    <TableRow><TableCell colSpan={6} align="center">No patients waiting</TableCell></TableRow>
                                ) : (
                                    patients.map((pt, index) => (
                                        <TableRow key={pt.id} hover>
                                            <TableCell>{index + 1}</TableCell>
                                            <TableCell><strong>{pt.patient_name}</strong><br />{pt.patient_code}</TableCell>
                                            <TableCell>{pt.date_of_birth} / {pt.gender}</TableCell>
                                            <TableCell>{pt.reason_text}</TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={pt.status}
                                                    color={pt.status === 'waiting_doctor_first_review' ? 'warning' : 'info'}
                                                    size="small"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="contained"
                                                    size="small"
                                                    startIcon={<EditIcon />}
                                                    onClick={() => handleExamine(pt)}
                                                >
                                                    Examine
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </CardContent>
            </Card>

            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="lg" fullWidth>
                <DialogTitle>
                    Health Check Examination - {currentAppointment?.patient_name}
                </DialogTitle>
                <DialogContent dividers>
                    <Tabs
                        value={activeTab}
                        onChange={(e, v) => setActiveTab(v)}
                        variant="scrollable"
                        scrollButtons="auto"
                        sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
                    >
                        {SECTIONS.map((sec) => (
                            <Tab
                                key={sec.id}
                                label={sec.label}
                                disabled={!allowedSections.includes(sec.id) && !allowedSections.includes('all')}
                                style={{ opacity: (!allowedSections.includes(sec.id) && !allowedSections.includes('all')) ? 0.5 : 1 }}
                            />
                        ))}
                    </Tabs>

                    <Box sx={{ mt: 2, p: 1 }}>
                        {activeTab === 0 && (
                            <Grid container spacing={2}>
                                <Grid item xs={12}><Typography variant="h6">General Physical Examination</Typography></Grid>
                                <Grid item xs={6}>{renderField('general_exam', 'height', 'Height (cm)')}</Grid>
                                <Grid item xs={6}>{renderField('general_exam', 'weight', 'Weight (kg)')}</Grid>
                                <Grid item xs={6}>{renderField('general_exam', 'bmi', 'BMI')}</Grid>
                                <Grid item xs={6}>{renderField('general_exam', 'pulse', 'Pulse (bpm)')}</Grid>
                                <Grid item xs={6}>{renderField('general_exam', 'blood_pressure', 'Blood Pressure (mmHg)')}</Grid>
                                <Grid item xs={12}>{renderField('general_exam', 'physical_classification', 'Physical Classification')}</Grid>
                                <Grid item xs={12}>
                                    <Button variant="contained" startIcon={<SaveIcon />} onClick={() => handleSaveSection('general_exam')}>
                                        Save General Exam
                                    </Button>
                                </Grid>
                            </Grid>
                        )}

                        {activeTab === 1 && (
                            <Grid container spacing={2}>
                                <Grid item xs={12}><Typography variant="h6">Internal Medicine</Typography></Grid>
                                <Grid item xs={12}>{renderField('internal_exam', 'circulatory', 'Circulatory System', true)}</Grid>
                                <Grid item xs={12}>{renderField('internal_exam', 'respiratory', 'Respiratory System', true)}</Grid>
                                <Grid item xs={12}>{renderField('internal_exam', 'digestive', 'Digestive System', true)}</Grid>
                                <Grid item xs={12}>{renderField('internal_exam', 'kidney_urology', 'Kidney & Urology', true)}</Grid>
                                <Grid item xs={12}>{renderField('internal_exam', 'musculoskeletal', 'Musculoskeletal', true)}</Grid>
                                <Grid item xs={12}>
                                    <Button variant="contained" startIcon={<SaveIcon />} onClick={() => handleSaveSection('internal_exam')}>
                                        Save Internal Exam
                                    </Button>
                                </Grid>
                            </Grid>
                        )}

                        {/* Surgery */}
                        {activeTab === 2 && (
                            <Grid container spacing={2}>
                                <Grid item xs={12}><Typography variant="h6">Surgery</Typography></Grid>
                                <Grid item xs={12}>{renderField('surgery_exam', 'findings', 'Surgical Findings', true)}</Grid>
                                <Grid item xs={12}>{renderField('surgery_exam', 'classification', 'Classification')}</Grid>
                                <Grid item xs={12}>
                                    <Button variant="contained" startIcon={<SaveIcon />} onClick={() => handleSaveSection('surgery_exam')}>
                                        Save Surgery Exam
                                    </Button>
                                </Grid>
                            </Grid>
                        )}

                        {/* Obstetrics & Gynecology (Female only usually, but generic here) */}
                        {activeTab === 3 && (
                            <Grid container spacing={2}>
                                <Grid item xs={12}><Typography variant="h6">Obstetrics & Gynecology</Typography></Grid>
                                <Grid item xs={12}>{renderField('obgyn_exam', 'findings', 'Findings', true)}</Grid>
                                <Grid item xs={12}>{renderField('obgyn_exam', 'classification', 'Classification')}</Grid>
                                <Grid item xs={12}>
                                    <Button variant="contained" startIcon={<SaveIcon />} onClick={() => handleSaveSection('obgyn_exam')}>
                                        Save OB/GYN Exam
                                    </Button>
                                </Grid>
                            </Grid>
                        )}

                        {/* Pediatrics */}
                        {activeTab === 4 && (
                            <Grid container spacing={2}>
                                <Grid item xs={12}><Typography variant="h6">Pediatrics</Typography></Grid>
                                <Grid item xs={12}>{renderField('pediatrics_exam', 'findings', 'Findings', true)}</Grid>
                                <Grid item xs={12}>{renderField('pediatrics_exam', 'classification', 'Classification')}</Grid>
                                <Grid item xs={12}>
                                    <Button variant="contained" startIcon={<SaveIcon />} onClick={() => handleSaveSection('pediatrics_exam')}>
                                        Save Pediatrics Exam
                                    </Button>
                                </Grid>
                            </Grid>
                        )}

                        {/* ENT */}
                        {activeTab === 5 && (
                            <Grid container spacing={2}>
                                <Grid item xs={12}><Typography variant="h6">Ear - Nose - Throat</Typography></Grid>
                                <Grid item xs={12}>{renderField('ent_exam', 'left_ear', 'Left Ear')}</Grid>
                                <Grid item xs={12}>{renderField('ent_exam', 'right_ear', 'Right Ear')}</Grid>
                                <Grid item xs={12}>{renderField('ent_exam', 'upper_respiratory', 'Upper Respiratory')}</Grid>
                                <Grid item xs={12}>{renderField('ent_exam', 'classification', 'Classification')}</Grid>
                                <Grid item xs={12}>
                                    <Button variant="contained" startIcon={<SaveIcon />} onClick={() => handleSaveSection('ent_exam')}>
                                        Save ENT Exam
                                    </Button>
                                </Grid>
                            </Grid>
                        )}

                        {/* Ophthalmology */}
                        {activeTab === 6 && (
                            <Grid container spacing={2}>
                                <Grid item xs={12}><Typography variant="h6">Ophthalmology</Typography></Grid>
                                <Grid item xs={6}>{renderField('ophthalmology_exam', 'left_eye_glass', 'Left Eye (with glass)')}</Grid>
                                <Grid item xs={6}>{renderField('ophthalmology_exam', 'right_eye_glass', 'Right Eye (with glass)')}</Grid>
                                <Grid item xs={12}>{renderField('ophthalmology_exam', 'findings', 'Other Diseases', true)}</Grid>
                                <Grid item xs={12}>{renderField('ophthalmology_exam', 'classification', 'Classification')}</Grid>
                                <Grid item xs={12}>
                                    <Button variant="contained" startIcon={<SaveIcon />} onClick={() => handleSaveSection('ophthalmology_exam')}>
                                        Save Eye Exam
                                    </Button>
                                </Grid>
                            </Grid>
                        )}
                        {/* Dental */}
                        {activeTab === 7 && (
                            <Grid container spacing={2}>
                                <Grid item xs={12}><Typography variant="h6">Dental & Maxillofacial</Typography></Grid>
                                <Grid item xs={12}>{renderField('dental_exam', 'upper_jaw', 'Upper Jaw')}</Grid>
                                <Grid item xs={12}>{renderField('dental_exam', 'lower_jaw', 'Lower Jaw')}</Grid>
                                <Grid item xs={12}>{renderField('dental_exam', 'classification', 'Classification')}</Grid>
                                <Grid item xs={12}>
                                    <Button variant="contained" startIcon={<SaveIcon />} onClick={() => handleSaveSection('dental_exam')}>
                                        Save Dental Exam
                                    </Button>
                                </Grid>
                            </Grid>
                        )}

                        {/* Dermatology */}
                        {activeTab === 8 && (
                            <Grid container spacing={2}>
                                <Grid item xs={12}><Typography variant="h6">Dermatology</Typography></Grid>
                                <Grid item xs={12}>{renderField('dermatology_exam', 'findings', 'Findings', true)}</Grid>
                                <Grid item xs={12}>{renderField('dermatology_exam', 'classification', 'Classification')}</Grid>
                                <Grid item xs={12}>
                                    <Button variant="contained" startIcon={<SaveIcon />} onClick={() => handleSaveSection('dermatology_exam')}>
                                        Save Dermatology Exam
                                    </Button>
                                </Grid>
                            </Grid>
                        )}
                        {/* Nutrition */}
                        {activeTab === 9 && (
                            <Grid container spacing={2}>
                                <Grid item xs={12}><Typography variant="h6">Nutrition</Typography></Grid>
                                <Grid item xs={12}>{renderField('nutrition_exam', 'findings', 'Findings', true)}</Grid>
                                <Grid item xs={12}>{renderField('nutrition_exam', 'classification', 'Classification')}</Grid>
                                <Grid item xs={12}>
                                    <Button variant="contained" startIcon={<SaveIcon />} onClick={() => handleSaveSection('nutrition_exam')}>
                                        Save Nutrition Exam
                                    </Button>
                                </Grid>
                            </Grid>
                        )}

                        {/* Conclusion */}
                        {activeTab === 10 && (
                            <Grid container spacing={2}>
                                <Grid item xs={12}><Typography variant="h6">Conclusion</Typography></Grid>
                                <Grid item xs={12}>{renderField('conclusion', 'health_classification', 'Overall Health Classification')}</Grid>
                                <Grid item xs={12}>{renderField('conclusion', 'diseases', 'Diseases / Conditions', true)}</Grid>
                                <Grid item xs={12}>{renderField('conclusion', 'notes', 'Doctor Notes', true)}</Grid>
                                <Grid item xs={12}>
                                    <Button variant="contained" startIcon={<SaveIcon />} onClick={() => handleSaveSection('conclusion')}>
                                        Save Conclusion
                                    </Button>
                                </Grid>
                            </Grid>
                        )}

                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Close</Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}

export default HealthCheckExamination;
