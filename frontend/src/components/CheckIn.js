import React, { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Button, Container, Typography, Box } from '@mui/material';
import api from '../api/api';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const CheckIn = () => {
  const [spaceId, setSpaceId] = useState('');
  const { token } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  useEffect(() => {
    const qrScanner = new Html5QrcodeScanner(
      'qr-reader',
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    );

    qrScanner.render(
      (decodedText) => {
        setSpaceId(decodedText);
        qrScanner.clear();
      },
      (error) => {
        console.warn(`QR scan error: ${error}`);
      }
    );

    return () => {
      qrScanner.clear();
    };
  }, []);

  const handleCheckIn = async () => {
    if (!spaceId) {
      alert('Vui lòng quét mã QR trước khi check-in');
      return;
    }
    try {
      await api.post(`/spaces/checkin/${spaceId}`);
      alert('Check-in thành công!');
      navigate('/notifications');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Check-in thất bại');
    }
  };

  const handleCheckOut = async () => {
    if (!spaceId) {
      alert('Vui lòng quét mã QR trước khi check-out');
      return;
    }
    try {
      await api.post(`/spaces/checkout/${spaceId}`);
      alert('Check-out thành công!');
      navigate(`/rating?spaceId=${spaceId}`);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Check-out thất bại');
    }
  };

  return (
    <Container sx={{ mt: 8 }}>
      <Typography variant="h4" gutterBottom>Check-in/Check-out</Typography>
      <div id="qr-reader" style={{ width: '100%', maxWidth: '400px' }}></div>
      <Typography sx={{ mt: 2 }}>Mã không gian: {spaceId}</Typography>
      <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
        <Button variant="contained" onClick={handleCheckIn}>Check-in</Button>
        <Button variant="contained" color="secondary" onClick={handleCheckOut}>Check-out</Button>
      </Box>
      <Button variant="outlined" onClick={() => navigate('/search')}>
        Quay lại tìm kiếm
      </Button>
    </Container>
  );
};

export default CheckIn;