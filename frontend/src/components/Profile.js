import React, { useState, useEffect } from 'react';
import { 
  Container, Typography, TextField, Button, Box, Radio, RadioGroup, 
  FormControlLabel, FormControl, FormLabel 
} from '@mui/material';
import api from '../api/api'; // Cập nhật import
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { setCredentials } from '../store/authSlice';

const Profile = () => {
  const [studentId, setStudentId] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('Nam');
  const [birthDate, setBirthDate] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const { token } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await api.get('/auth/profile');
        setStudentId(res.data.data.studentId);
        setName(res.data.data.name || '');
        setEmail(res.data.data.email || '');
        setPhone(res.data.data.phone || '');
        setGender(res.data.data.gender || 'Nam');
        setBirthDate(res.data.data.birthDate ? new Date(res.data.data.birthDate).toISOString().split('T')[0] : '');
      } catch (err) {
        setError(err.response?.data?.message || 'Lỗi khi lấy thông tin tài khoản');
      } finally {
        setLoading(false);
      }
    };
    if (token) {
      fetchProfile();
    } else {
      setError('Vui lòng đăng nhập để xem thông tin tài khoản');
      setLoading(false);
    }
  }, [token]);

  const handleUpdate = async () => {
    setError('');
    setSuccess('');
    try {
      const updateData = { name, email, phone, gender, birthDate };
      const res = await api.put('/auth/update', updateData);
      setSuccess(res.data.message);
      dispatch(setCredentials({
        accessToken: token,
        refreshToken: null,
        user: { studentId, name: res.data.user.name },
      }));
    } catch (err) {
      setError(err.response?.data?.message || 'Cập nhật thất bại');
    }
  };

  if (loading) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Typography variant="h4" gutterBottom>Đang tải...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 8, mb: 4 }}>
      <Typography variant="h4" gutterBottom>Hồ Sơ Của Tôi</Typography>
      <Typography variant="body1" color="textSecondary" gutterBottom>
        Quản lý thông tin hồ sơ để bảo mật tài khoản
      </Typography>
      {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}
      {!error && (
        <Box>
          <TextField
            label="Mã số sinh viên"
            fullWidth
            margin="normal"
            value={studentId}
            disabled
          />
          <TextField
            label="Tên"
            fullWidth
            margin="normal"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <TextField
            label="Email"
            fullWidth
            margin="normal"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            label="Số điện thoại"
            fullWidth
            margin="normal"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <FormControl component="fieldset" sx={{ mt: 2 }}>
            <FormLabel component="legend">Giới tính</FormLabel>
            <RadioGroup
              row
              value={gender}
              onChange={(e) => setGender(e.target.value)}
            >
              <FormControlLabel value="Nam" control={<Radio />} label="Nam" />
              <FormControlLabel value="Nữ" control={<Radio />} label="Nữ" />
              <FormControlLabel value="Khác" control={<Radio />} label="Khác" />
            </RadioGroup>
          </FormControl>
          <TextField
            label="Ngày sinh"
            type="date"
            fullWidth
            margin="normal"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Box>
      )}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
        <Button
          variant="contained"
          onClick={handleUpdate}
          sx={{ mt: 2, ml: 2 }}
        >
          Lưu
        </Button>
        <Button
          variant="outlined"
          onClick={() => navigate('/search')}
          sx={{ mt: 2, ml: 2 }}
        >
          Quay lại
        </Button>
      </Box>
      {success && <Typography color="success.main" sx={{ mt: 2 }}>{success}</Typography>}
    </Container>
  );
};

export default Profile;