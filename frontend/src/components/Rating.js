import React, { useState } from 'react';
import { Container, Typography, TextField, Button, Rating as MuiRating, Box } from '@mui/material';
import api from '../api/api'; // Cập nhật import
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

const Rating = () => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const { token } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const location = useLocation();
  const spaceId = new URLSearchParams(location.search).get('spaceId');

  const handleSubmit = async () => {
    try {
      await api.post('/ratings', { spaceId, rating, comment });
      alert('Đánh giá thành công!');
      navigate('/search');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Đánh giá thất bại');
    }
  };

  return (
    <Container sx={{ mt: 8 }}>
      <Typography variant="h4" gutterBottom>Đánh giá không gian</Typography>
      <Box sx={{ mb: 2 }}>
        <MuiRating
          value={rating}
          onChange={(event, newValue) => setRating(newValue)}
          precision={1}
        />
      </Box>
      <TextField
        label="Nhận xét"
        multiline
        rows={4}
        fullWidth
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        sx={{ mb: 2 }}
      />
      <Button variant="contained" onClick={handleSubmit}>Gửi đánh giá</Button>
    </Container>
  );
};

export default Rating;