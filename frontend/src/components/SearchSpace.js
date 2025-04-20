import React, { useState, useEffect, useMemo } from 'react';
import {
  Container, Typography, Box, Button, AppBar, Toolbar, IconButton,
  Select, MenuItem, FormControl, InputLabel, Grid, Card, CardContent, CardActions,
  Snackbar, Alert, CircularProgress, Tabs, Tab, Pagination, Dialog, DialogTitle,
  DialogContent, DialogActions, Table, TableBody, TableHead, TableRow,
  TableCell, List, ListItem, ListItemText, Rating as MuiRating
} from '@mui/material';
import { styled } from '@mui/system';
import { QRCodeCanvas } from 'qrcode.react';
import api from '../api/api';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { clearCredentials } from '../store/authSlice';
import io from 'socket.io-client';
import LogoutIcon from '@mui/icons-material/Logout';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';

const socket = io('http://localhost:5000');

const BannerBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  backgroundColor: '#f5f5f5',
  padding: '20px',
  borderRadius: '8px',
  marginBottom: '20px',
}));

const BannerImage = styled('img')({
  width: '100%',
  maxWidth: '1200px',
  height: '400px',
  borderRadius: '8px',
  objectFit: 'cover',
});

const FooterBox = styled(Box)(({ theme }) => ({
  backgroundColor: '#455A64',
  color: '#FFFFFF',
  padding: '20px',
  width: '100%', // Chiều rộng 100% viewport
  maxWidth: 'none', // Bỏ giới hạn chiều rộng
  marginTop: '40px',
}));

const SearchSpace = () => {
  const [building, setBuilding] = useState('');
  const [floor, setFloor] = useState('');
  const [type, setType] = useState('');
  const [timeSlot, setTimeSlot] = useState('');
  const [searchSpaces, setSearchSpaces] = useState([]);
  const [bookedSpaces, setBookedSpaces] = useState([]);
  const [buildingOptions, setBuildingOptions] = useState([]);
  const [floorOptions, setFloorOptions] = useState([]);
  const [typeOptions, setTypeOptions] = useState([]);
  const [options, setOptions] = useState({ buildings: [], floors: [], types: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [tab, setTab] = useState('search');
  const [searchPage, setSearchPage] = useState(1);
  const [bookingsPage, setBookingsPage] = useState(1);
  const [totalSearchPages, setTotalSearchPages] = useState(1);
  const [totalBookingsPages, setTotalBookingsPages] = useState(1);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogAction, setDialogAction] = useState(null);
  const [dialogSpaceId, setDialogSpaceId] = useState(null);
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  const [openQRDialog, setOpenQRDialog] = useState(false);
  const [selectedSpace, setSelectedSpace] = useState(null);
  const [qrSpaceId, setQrSpaceId] = useState(null);
  const [schedule, setSchedule] = useState({});
  const [ratings, setRatings] = useState([]);
  const [ratingsTab, setRatingsTab] = useState('details');
  const { token, user, refreshToken } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const itemsPerPage = 8;
  const timeSlots = ['08:00-10:00', '10:00-12:00', '13:00-15:00', '15:00-17:00'];

  const handleCloseSnackbar = () => setSnackbar({ ...snackbar, open: false });

  const handleOpenDialog = (action, spaceId) => {
    setDialogAction(action);
    setDialogSpaceId(spaceId);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setDialogAction(null);
    setDialogSpaceId(null);
  };

  const handleConfirmAction = async () => {
    if (dialogAction === 'cancel') {
      await cancelBooking(dialogSpaceId);
    } else if (dialogAction === 'checkout') {
      await checkOutSpace(dialogSpaceId);
    }
    handleCloseDialog();
  };

  const handleOpenDetails = async (space) => {
    setSelectedSpace(space);
    await fetchSpaceSchedule(space._id);
    await fetchRatings(space._id);
    setOpenDetailsDialog(true);
  };

  const handleCloseDetails = () => {
    setOpenDetailsDialog(false);
    setSelectedSpace(null);
    setSchedule({});
    setRatings([]);
    setRatingsTab('details');
  };

  const handleOpenQRDialog = (spaceId) => {
    setQrSpaceId(spaceId);
    setOpenQRDialog(true);
  };

  const handleCloseQRDialog = () => {
    setOpenQRDialog(false);
    setQrSpaceId(null);
  };

  const cachedOptions = useMemo(() => options, [options]);

  useEffect(() => {
    const fetchOptions = async () => {
      setIsLoading(true);
      try {
        const res = await api.get('/spaces/options');
        const buildings = res.data.data?.buildings || [];
        const floors = res.data.data?.floors || [];
        const types = res.data.data?.types || [];
        setOptions({ buildings, floors, types });
        setBuildingOptions(buildings);
        setFloorOptions(floors);
        setTypeOptions(types);
        if (!buildings.length || !floors.length || !types.length) {
          setSnackbar({
            open: true,
            message: 'Chưa có dữ liệu tòa, lầu hoặc loại phòng',
            severity: 'info',
          });
        }
      } catch (err) {
        setSnackbar({
          open: true,
          message: err.response?.data?.message || 'Không thể lấy danh sách tòa, lầu và loại phòng',
          severity: 'error',
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (token && !cachedOptions.buildings.length && !cachedOptions.floors.length && !cachedOptions.types.length) {
      fetchOptions();
    } else {
      setBuildingOptions(cachedOptions.buildings);
      setFloorOptions(cachedOptions.floors);
      setTypeOptions(cachedOptions.types);
    }

    socket.on('spaceUpdate', (data) => {
      setSearchSpaces((prev) =>
        prev.map((space) =>
          space._id === data.spaceId ? { ...space, status: data.status } : space
        )
      );
      setBookedSpaces((prev) =>
        prev
          .map((space) =>
            space._id === data.spaceId ? { ...space, status: data.status } : space
          )
          .filter((space) => space.status !== 'empty')
      );
    });

    socket.on('notification', (notification) => {
      setSnackbar({ open: true, message: notification.message, severity: 'info' });
    });

    return () => {
      socket.off('spaceUpdate');
      socket.off('notification');
    };
  }, [token, cachedOptions]);

  useEffect(() => {
    if (tab === 'my-bookings' && token) fetchMyBookings();
  }, [tab, token, bookingsPage]);

  const fetchSearchSpaces = async () => {
    if (!building || !floor || !type) {
      setSnackbar({ open: true, message: 'Vui lòng chọn tòa, lầu và loại phòng', severity: 'warning' });
      return;
    }
    setIsLoading(true);
    try {
      const res = await api.get('/spaces/search', {
        params: {
          building,
          floor,
          type,
          timeSlot,
          page: searchPage,
          limit: itemsPerPage,
        },
      });
      setSearchSpaces(res.data.data);
      setTotalSearchPages(res.data.totalPages || 1);
      if (res.data.data.length === 0) {
        setSnackbar({ open: true, message: 'Không tìm thấy phòng phù hợp', severity: 'info' });
      }
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.message || 'Tìm kiếm thất bại',
        severity: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMyBookings = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/spaces/my-bookings', {
        params: { page: bookingsPage, limit: itemsPerPage },
      });
      setBookedSpaces(res.data.data);
      setTotalBookingsPages(res.data.totalPages || 1);
      if (res.data.data.length === 0) {
        setSnackbar({
          open: true,
          message: 'Bạn chưa đăng ký phòng nào',
          severity: 'info',
        });
      }
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.message || 'Không thể lấy danh sách phòng đã đăng ký',
        severity: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSpaceSchedule = async (spaceId) => {
    try {
      const res = await api.get(`/spaces/${spaceId}/schedule`);
      setSchedule(res.data.data.schedule);
    } catch (err) {
      setSnackbar({ open: true, message: 'Không thể lấy lịch trống', severity: 'error' });
    }
  };

  const fetchRatings = async (spaceId) => {
    try {
      const res = await api.get('/ratings', { params: { spaceId } });
      setRatings(res.data.data);
    } catch (err) {
      setSnackbar({ open: true, message: 'Không thể lấy đánh giá', severity: 'error' });
    }
  };

  const bookSpace = async (id) => {
    if (!timeSlot) {
      setSnackbar({ open: true, message: 'Vui lòng chọn khung giờ trước khi đặt', severity: 'warning' });
      return;
    }
    setIsLoading(true);
    try {
      const res = await api.post(`/spaces/book/${id}`, { timeSlot });
      setSnackbar({ open: true, message: res.data.message, severity: 'success' });
      setSearchSpaces((prev) =>
        prev.map((space) => (space._id === id ? { ...space, ...res.data.space } : space))
      );
      await fetchMyBookings();
    } catch (err) {
      const errorMessage =
        err.response?.status === 409
          ? 'Phòng đã được đặt bởi người khác'
          : err.response?.status === 403
          ? 'Bạn không có quyền đặt phòng này'
          : err.response?.status === 404
          ? 'Không gian không tồn tại'
          : err.response?.data?.message || 'Đặt chỗ thất bại';
      setSnackbar({ open: true, message: errorMessage, severity: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const cancelBooking = async (id) => {
    setIsLoading(true);
    try {
      const res = await api.post(`/spaces/cancel/${id}`);
      setSnackbar({ open: true, message: res.data.message, severity: 'success' });
      setSearchSpaces((prev) =>
        prev.map((space) => (space._id === id ? { ...space, ...res.data.space } : space))
      );
      setBookedSpaces((prev) => prev.filter((space) => space._id !== id));
    } catch (err) {
      const errorMessage =
        err.response?.status === 403
          ? 'Bạn không phải là người đã đặt phòng này'
          : err.response?.status === 400
          ? err.response?.data?.message || 'Không thể hủy'
          : err.response?.status === 404
          ? 'Không gian không tồn tại'
          : 'Hủy đặt chỗ thất bại';
      setSnackbar({ open: true, message: errorMessage, severity: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const checkOutSpace = async (id) => {
    setIsLoading(true);
    try {
      const res = await api.post(`/spaces/checkout/${id}`);
      setSnackbar({ open: true, message: res.data.message, severity: 'success' });
      setSearchSpaces((prev) =>
        prev.map((space) => (space._id === id ? { ...space, ...res.data.space } : space))
      );
      setBookedSpaces((prev) => prev.filter((space) => space._id !== id));
    } catch (err) {
      const errorMessage =
        err.response?.status === 403
          ? 'Bạn không phải là người đã đặt phòng này'
          : err.response?.status === 400
          ? err.response?.data?.message || 'Không thể check-out'
          : err.response?.status === 404
          ? 'Không gian không tồn tại'
          : 'Check-out thất bại';
      setSnackbar({ open: true, message: errorMessage, severity: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    console.log('Starting logout process...');
    try {
      console.log('Calling /auth/logout API with refreshToken:', refreshToken);
      const response = await api.post('/auth/logout', { refreshToken });
      console.log('Logout API response:', response.data);
      dispatch(clearCredentials());
      console.log('Credentials cleared, navigating to /login');
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
      dispatch(clearCredentials());
      console.log('Credentials cleared despite error, navigating to /login');
      navigate('/login');
    }
  };

  const handleSearchPageChange = (event, value) => {
    setSearchPage(value);
    fetchSearchSpaces();
  };

  const handleBookingsPageChange = (event, value) => {
    setBookingsPage(value);
    fetchMyBookings();
  };

  return (
    <>
      <AppBar position="static" color="transparent" elevation={0}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>HCMUT</Typography>
          <Button color="inherit" onClick={() => navigate('/search')}>Trang chủ</Button>
          <Button color="inherit" onClick={() => navigate('/notifications')}>Thông báo</Button>
          <IconButton color="inherit" onClick={() => navigate('/profile')}>
            <AccountCircleIcon />
          </IconButton>
          <IconButton color="inherit" onClick={handleLogout}>
            <LogoutIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Đặt BannerBox ngay sau AppBar */}
      <BannerBox sx={{ mt: 4 }}>
        <Typography variant="h4" sx={{ mb: 2, color: '#1976d2', fontWeight: 'bold' }}>
          Trang tìm kiếm phòng học
        </Typography>
        <BannerImage src="/images/study-group.png" alt="Study Group" />
      </BannerBox>

      <Container sx={{ mt: 4, minHeight: '50vh' }}>
        <Tabs value={tab} onChange={(e, newValue) => setTab(newValue)} sx={{ mb: 4 }}>
          <Tab label="Tìm kiếm phòng" value="search" />
          <Tab label="Phòng đã đăng ký" value="my-bookings" />
        </Tabs>

        {tab === 'search' && (
          <>
            <Typography variant="h5" gutterBottom>Tìm phòng học</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 4 }}>
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Tòa</InputLabel>
                <Select value={building} onChange={(e) => setBuilding(e.target.value)} label="Tòa">
                  <MenuItem value=""><em>Chọn tòa</em></MenuItem>
                  {buildingOptions.map((option) => (
                    <MenuItem key={option} value={option}>{option}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Lầu</InputLabel>
                <Select value={floor} onChange={(e) => setFloor(e.target.value)} label="Lầu">
                  <MenuItem value=""><em>Chọn lầu</em></MenuItem>
                  {floorOptions.map((option) => (
                    <MenuItem key={option} value={option}>{option}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Loại phòng</InputLabel>
                <Select value={type} onChange={(e) => setType(e.target.value)} label="Loại phòng">
                  <MenuItem value=""><em>Chọn loại phòng</em></MenuItem>
                  {typeOptions.map((option) => (
                    <MenuItem key={option} value={option}>{option}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Khung giờ</InputLabel>
                <Select value={timeSlot} onChange={(e) => setTimeSlot(e.target.value)} label="Khung giờ">
                  <MenuItem value=""><em>Chọn khung giờ</em></MenuItem>
                  {timeSlots.map((slot) => (
                    <MenuItem key={slot} value={slot}>{slot}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button
                variant="contained"
                onClick={fetchSearchSpaces}
                disabled={isLoading}
                sx={{ backgroundColor: '#1976d2', '&:hover': { backgroundColor: '#1565c0' } }}
              >
                {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Tìm kiếm'}
              </Button>
            </Box>
          </>
        )}

        {tab === 'my-bookings' && (
          <>
            <Typography variant="h5" gutterBottom>Phòng đã đăng ký</Typography>
            <Box sx={{ mb: 4 }}>
              <Button
                variant="contained"
                onClick={fetchMyBookings}
                disabled={isLoading}
                sx={{ backgroundColor: '#1976d2', '&:hover': { backgroundColor: '#1565c0' } }}
              >
                {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Làm mới danh sách'}
              </Button>
            </Box>
          </>
        )}

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress />
          </Box>
        ) : (tab === 'search' ? searchSpaces : bookedSpaces).length > 0 ? (
          <>
            <Grid container spacing={2}>
              {(tab === 'search' ? searchSpaces : bookedSpaces).map((space) => (
                <Grid item xs={12} sm={6} md={3} key={space._id}>
                  <Card sx={{ marginBottom: '10px', border: '1px solid #ddd', borderRadius: '8px' }}>
                    <CardContent>
                      <Typography variant="h6">{space.name}</Typography>
                      <Typography color="textSecondary">Tòa: {space.building}</Typography>
                      <Typography color="textSecondary">Lầu: {space.floor}</Typography>
                      <Typography color="textSecondary">
                        Trạng thái: {space.status === 'empty' ? 'Trống' : space.status === 'booked' ? 'Đã đặt' : 'Đang sử dụng'}
                      </Typography>
                      <Typography color="textSecondary">
                        Thời gian đặt: {space.bookedAt ? new Date(space.bookedAt).toLocaleString() : 'Chưa đặt'}
                      </Typography>
                      {space.status === 'booked' && space.checkInDeadline && (
                        <Typography color="textSecondary">
                          Hạn check-in: {new Date(space.checkInDeadline).toLocaleString()}
                        </Typography>
                      )}
                    </CardContent>
                    <CardActions sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Button
                        variant="outlined"
                        onClick={() => handleOpenDetails(space)}
                        fullWidth
                      >
                        Xem chi tiết
                      </Button>
                      {space.status === 'empty' && (
                        <Button
                          variant="contained"
                          onClick={() => bookSpace(space._id)}
                          disabled={isLoading}
                          fullWidth
                        >
                          Đăng ký
                        </Button>
                      )}
                      {space.status === 'booked' && space.bookedBy && space.bookedBy.studentId && user?.studentId && space.bookedBy.studentId === user.studentId && (
                        <>
                          <Button
                            variant="contained"
                            color="success"
                            onClick={() => handleOpenQRDialog(space._id)}
                            disabled={isLoading}
                            fullWidth
                          >
                            Check-in
                          </Button>
                          <Button
                            variant="contained"
                            color="warning"
                            onClick={() => handleOpenDialog('cancel', space._id)}
                            disabled={isLoading}
                            fullWidth
                          >
                            Hủy đặt chỗ
                          </Button>
                        </>
                      )}
                      {space.status === 'in-use' && space.bookedBy && space.bookedBy.studentId && user?.studentId && space.bookedBy.studentId === user.studentId && (
                        <Button
                          variant="contained"
                          color="error"
                          onClick={() => handleOpenDialog('checkout', space._id)}
                          disabled={isLoading}
                          fullWidth
                        >
                          Check-out
                        </Button>
                      )}
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              {tab === 'search' ? (
                <Pagination
                  count={totalSearchPages}
                  page={searchPage}
                  onChange={handleSearchPageChange}
                  color="primary"
                />
              ) : (
                <Pagination
                  count={totalBookingsPages}
                  page={bookingsPage}
                  onChange={handleBookingsPageChange}
                  color="primary"
                />
              )}
            </Box>
          </>
        ) : (
          <Typography>
            {tab === 'search' ? 'Không tìm thấy phòng phù hợp.' : 'Bạn chưa đăng ký phòng nào.'}
          </Typography>
        )}

        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
        >
          <Alert severity={snackbar.severity} onClose={handleCloseSnackbar}>
            {snackbar.message}
          </Alert>
        </Snackbar>

        <Dialog open={openDialog} onClose={handleCloseDialog}>
          <DialogTitle>Xác nhận hành động</DialogTitle>
          <DialogContent>
            <Typography>
              Bạn có chắc chắn muốn {dialogAction === 'cancel' ? 'hủy đặt phòng' : 'check-out'} này không?
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Hủy</Button>
            <Button onClick={handleConfirmAction} color="primary" variant="contained">
              Xác nhận
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={openDetailsDialog} onClose={handleCloseDetails} maxWidth="sm" fullWidth>
          <DialogTitle>{selectedSpace?.name}</DialogTitle>
          <DialogContent>
            <Tabs value={ratingsTab} onChange={(e, newValue) => setRatingsTab(newValue)} sx={{ mb: 2 }}>
              <Tab label="Chi tiết" value="details" />
              <Tab label="Đánh giá" value="ratings" />
            </Tabs>

            {ratingsTab === 'details' && (
              <>
                <Typography variant="body1" gutterBottom>
                  <strong>Tòa:</strong> {selectedSpace?.building}
                </Typography>
                <Typography variant="body1" gutterBottom>
                  <strong>Lầu:</strong> {selectedSpace?.floor}
                </Typography>
                <Typography variant="body1" gutterBottom>
                  <strong>Loại phòng:</strong> {selectedSpace?.type}
                </Typography>
                <Typography variant="h6" gutterBottom>
                  Lịch trống hôm nay
                </Typography>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Khung giờ</TableCell>
                      <TableCell>Trạng thái</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {timeSlots.map((slot) => (
                      <TableRow key={slot}>
                        <TableCell>{slot}</TableCell>
                        <TableCell>
                          {schedule[slot] === 'empty'
                            ? 'Trống'
                            : schedule[slot] === 'booked'
                            ? 'Đã đặt'
                            : schedule[slot] === 'in-use'
                            ? 'Đang sử dụng'
                            : 'Chưa xác định'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </>
            )}

            {ratingsTab === 'ratings' && (
              <>
                <Typography variant="h6" gutterBottom>Đánh giá</Typography>
                {ratings.length > 0 ? (
                  <List>
                    {ratings.map((rating) => (
                      <ListItem key={rating._id}>
                        <ListItemText
                          primary={
                            <>
                              <Typography variant="body2">{rating.userId.name}</Typography>
                              <MuiRating value={rating.rating} readOnly size="small" />
                            </>
                          }
                          secondary={
                            <>
                              <Typography variant="body2">{rating.comment || 'Không có nhận xét'}</Typography>
                              <Typography variant="caption">
                                {new Date(rating.createdAt).toLocaleString()}
                              </Typography>
                            </>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography>Chưa có đánh giá nào.</Typography>
                )}
              </>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDetails}>Đóng</Button>
            {selectedSpace?.status === 'empty' && (
              <Button
                variant="contained"
                onClick={() => {
                  bookSpace(selectedSpace._id);
                  handleCloseDetails();
                }}
              >
                Đăng ký
              </Button>
            )}
          </DialogActions>
        </Dialog>

        <Dialog open={openQRDialog} onClose={handleCloseQRDialog} maxWidth="sm" fullWidth>
          <DialogTitle>Mã QR để Check-in</DialogTitle>
          <DialogContent>
            <Typography variant="body1" gutterBottom>
              Quét mã QR này để check-in phòng.
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              {qrSpaceId && <QRCodeCanvas value={qrSpaceId} size={200} />}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseQRDialog}>Đóng</Button>
          </DialogActions>
        </Dialog>
      </Container>

      {/* Footer*/}
      <FooterBox>
        <Container maxWidth="lg">
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
            Tổ kỹ thuật P. ĐT / Technician
          </Typography>
          <Typography variant="body2" sx={{ mb: 0.5 }}>
            Email: ddthue@hcmut.edu.vn
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            ĐT (TEL.): (84-8) 38647256 - 5258
          </Typography>
          <Typography variant="body2" sx={{ mb: 0.5 }}>
            Quý Thầy/Cô chưa có tài khoản (hoặc quên mật khẩu) nếu trưởng vui lòng liên hệ Trung tâm Dữ liệu & Công nghệ Thông tin, phòng 109A5 để được hỗ trợ.
          </Typography>
          <Typography variant="body2" sx={{ mb: 0.5 }}>
            (For HCMUT account, please contact to: Data and Information Technology Center)
          </Typography>
          <Typography variant="body2" sx={{ mb: 0.5 }}>
            Email: dl-cntt@hcmut.edu.vn
          </Typography>
          <Typography variant="body2">
            ĐT (TEL.): (84-8) 38647256 - 5200
          </Typography>
        </Container>
      </FooterBox>
    </>
  );
};

export default SearchSpace;