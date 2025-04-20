import React, { useState } from 'react';
import { 
  Container, Typography, TextField, Button, Box, Radio, RadioGroup, 
  FormControlLabel, FormControl, FormLabel 
} from '@mui/material';
import api from '../api/api'; 
import { useNavigate } from 'react-router-dom';

const Register = () => {
  const [studentId, setStudentId] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('Nam');
  const [birthDate, setBirthDate] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleRegister = async () => {
    setError('');
    setSuccess('');
    try {
      const registerData = { studentId, name, password, email, phone, gender, birthDate };
      const res = await api.post('/auth/register', registerData);
      setSuccess(res.data.message);
      setTimeout(() => navigate('/'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Đăng ký thất bại');
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 8, mb: 4 }}>
      <Typography variant="h4" gutterBottom>Đăng Ký Tài Khoản</Typography>
      <Typography variant="body1" color="textSecondary" gutterBottom>
        Vui lòng nhập đầy đủ thông tin để đăng ký tài khoản
      </Typography>
      {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}
      {success && <Typography color="success.main" sx={{ mb: 2 }}>{success}</Typography>}
      <Box>
        <TextField
          label="Mã số sinh viên"
          fullWidth
          margin="normal"
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
        />
        <TextField
          label="Tên"
          fullWidth
          margin="normal"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <TextField
          label="Mật khẩu"
          type="password"
          fullWidth
          margin="normal"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
        <Button
          variant="contained"
          onClick={handleRegister}
          sx={{ mt: 2, ml: 2 }}
        >
          Đăng Ký
        </Button>
        <Button
          variant="outlined"
          onClick={() => navigate('/')}
          sx={{ borderColor: '#0000FF', color: '#0000FF' }}
        >
          Quay lại
        </Button>
      </Box>
    </Container>
  );
};

export default Register;