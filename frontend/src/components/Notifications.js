import React, { useState, useEffect } from 'react';
import { 
  Container, Typography, Box, Button, AppBar, Toolbar, IconButton, 
  List, ListItem, ListItemText 
} from '@mui/material';
import api from '../api/api';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { clearCredentials } from '../store/authSlice';
import io from 'socket.io-client';
import LogoutIcon from '@mui/icons-material/Logout';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';

const socket = io('http://localhost:5000');

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const { token, refreshToken } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await api.get('/notifications');
        setNotifications(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    if (token) fetchNotifications();

    socket.on('notification', (newNotif) => {
      setNotifications((prev) => [newNotif, ...prev]);
    });

    return () => socket.off('notification');
  }, [token]);

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout', { refreshToken });
      dispatch(clearCredentials());
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
      dispatch(clearCredentials());
      navigate('/login');
    }
  };

  return (
    <>
      <AppBar position="static" color="transparent" elevation={0}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            HCMUT
          </Typography>
          <Button color="inherit" onClick={() => navigate('/search')}>
            Trang chủ
          </Button>
          <Button color="inherit" onClick={() => navigate('/notifications')}>
            Thông báo
          </Button>
          <IconButton color="inherit" onClick={() => navigate('/profile')}>
            <AccountCircleIcon />
          </IconButton>
          <IconButton color="inherit" onClick={handleLogout}>
            <LogoutIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container sx={{ mt: 8 }}>
        <Typography variant="h4" gutterBottom>Thông báo</Typography>
        <Box sx={{ mb: 2 }}>
          <Button variant="outlined" onClick={() => navigate('/search')}>
            Quay lại tìm kiếm
          </Button>
        </Box>
        <List>
          {notifications.map((notif) => (
            <ListItem key={notif._id}>
              <ListItemText
                primary={notif.message}
                secondary={new Date(notif.createdAt).toLocaleString()}
              />
            </ListItem>
          ))}
        </List>
      </Container>
    </>
  );
};

export default Notifications;