import React, { useState, useEffect } from 'react';
  import { Container, List, ListItem, ListItemText, Typography, Button, Box, Pagination } from '@mui/material';
  import api from '../api/api'; // Corrected import path
  import { useNavigate } from 'react-router-dom';
  import { useSelector } from 'react-redux';

  const History = () => {
    const [bookings, setBookings] = useState([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const itemsPerPage = 10;
    const { token } = useSelector((state) => state.auth);
    const navigate = useNavigate();

    useEffect(() => {
      const fetchHistory = async () => {
        try {
          const res = await api.get('/bookings/history', {
            params: { page, limit: itemsPerPage },
          });
          setBookings(res.data.data);
          setTotalPages(res.data.totalPages || 1);
        } catch (err) {
          console.error(err);
        }
      };
      if (token) fetchHistory();
    }, [token, page]);

    const handlePageChange = (event, value) => {
      setPage(value);
    };

    return (
      <Container sx={{ mt: 8 }}>
        <Typography variant="h4" gutterBottom>Lịch sử sử dụng</Typography>
        <Box sx={{ mb: 2 }}>
          <Button variant="outlined" onClick={() => navigate('/search')}>
            Quay lại tìm kiếm
          </Button>
        </Box>
        <List>
          {bookings.map((booking) => (
            <ListItem key={booking._id}>
              <ListItemText
                primary={`${booking.spaceId.name} - ${booking.spaceId.type} - ${booking.spaceId.location}`}
                secondary={`Đặt lúc: ${new Date(booking.bookedAt).toLocaleString()} | Check-in: ${booking.checkInAt ? new Date(booking.checkInAt).toLocaleString() : 'Chưa'} | Check-out: ${booking.checkOutAt ? new Date(booking.checkOutAt).toLocaleString() : 'Chưa'}`}
              />
            </ListItem>
          ))}
        </List>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Pagination count={totalPages} page={page} onChange={handlePageChange} color="primary" />
        </Box>
      </Container>
    );
  };

  export default History;