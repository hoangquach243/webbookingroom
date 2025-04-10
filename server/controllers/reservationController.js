const Reservation = require('../models/reservation');
const StudySpace = require('../models/studySpace');
const asyncHandler = require('express-async-handler');

// @desc    Tạo đặt chỗ mới
// @route   POST /api/reservations
// @access  Private
const createReservation = asyncHandler(async (req, res) => {
  const {
    studySpaceId,
    startTime,
    endTime,
    numberOfParticipants,
    purpose,
    notes
  } = req.body;

  // Kiểm tra nếu không gian học tập tồn tại
  const studySpace = await StudySpace.findById(studySpaceId);
  if (!studySpace) {
    res.status(404);
    throw new Error('Không tìm thấy không gian học tập');
  }

  // Kiểm tra nếu số người vượt quá sức chứa của không gian
  if (numberOfParticipants > studySpace.capacity) {
    res.status(400);
    throw new Error(`Số người vượt quá sức chứa tối đa (${studySpace.capacity})`);
  }

  // Lấy thông tin sinh viên từ xác thực (giả định)
  const student = {
    id: req.user.studentId,
    name: req.user.name,
    email: req.user.email
  };

  // Tạo đặt chỗ mới
  const reservation = await Reservation.create({
    studySpace: studySpaceId,
    student,
    startTime,
    endTime,
    numberOfParticipants,
    purpose,
    notes
  });

  if (reservation) {
    // Cập nhật trạng thái của không gian học tập
    studySpace.status = 'reserved';
    await studySpace.save();

    res.status(201).json({
      success: true,
      data: reservation
    });
  } else {
    res.status(400);
    throw new Error('Dữ liệu đặt chỗ không hợp lệ');
  }
});

// @desc    Lấy tất cả các đặt chỗ của người dùng hiện tại
// @route   GET /api/reservations
// @access  Private
const getMyReservations = asyncHandler(async (req, res) => {
  const reservations = await Reservation.find({ 'student.id': req.user.studentId })
    .populate('studySpace')
    .sort({ startTime: 1 });
  
  res.status(200).json({
    success: true,
    count: reservations.length,
    data: reservations
  });
});

// @desc    Lấy đặt chỗ theo ID
// @route   GET /api/reservations/:id
// @access  Private
const getReservationById = asyncHandler(async (req, res) => {
  const reservation = await Reservation.findById(req.params.id).populate('studySpace');
  
  // Kiểm tra nếu đặt chỗ tồn tại
  if (!reservation) {
    res.status(404);
    throw new Error('Không tìm thấy đặt chỗ');
  }

  // Kiểm tra quyền sở hữu (chỉ cho phép người dùng xem đặt chỗ của chính họ hoặc admin)
  if (reservation.student.id !== req.user.studentId && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Không có quyền truy cập');
  }
  
  res.status(200).json({
    success: true,
    data: reservation
  });
});

// @desc    Cập nhật đặt chỗ
// @route   PUT /api/reservations/:id
// @access  Private
const updateReservation = asyncHandler(async (req, res) => {
  const {
    startTime,
    endTime,
    numberOfParticipants,
    purpose,
    notes
  } = req.body;

  const reservation = await Reservation.findById(req.params.id);

  // Kiểm tra nếu đặt chỗ tồn tại
  if (!reservation) {
    res.status(404);
    throw new Error('Không tìm thấy đặt chỗ');
  }

  // Kiểm tra quyền sở hữu
  if (reservation.student.id !== req.user.studentId && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Không có quyền truy cập');
  }

  // Kiểm tra nếu đặt chỗ đã check-in
  if (reservation.status === 'checked_in') {
    res.status(400);
    throw new Error('Không thể cập nhật đặt chỗ đã check-in');
  }

  // Lấy thông tin không gian học tập
  const studySpace = await StudySpace.findById(reservation.studySpace);

  // Kiểm tra nếu số người vượt quá sức chứa
  if (numberOfParticipants && numberOfParticipants > studySpace.capacity) {
    res.status(400);
    throw new Error(`Số người vượt quá sức chứa tối đa (${studySpace.capacity})`);
  }

  // Cập nhật đặt chỗ
  reservation.startTime = startTime || reservation.startTime;
  reservation.endTime = endTime || reservation.endTime;
  reservation.numberOfParticipants = numberOfParticipants || reservation.numberOfParticipants;
  reservation.purpose = purpose || reservation.purpose;
  reservation.notes = notes || reservation.notes;
  reservation.updatedAt = Date.now();

  const updatedReservation = await reservation.save();
  
  res.status(200).json({
    success: true,
    data: updatedReservation
  });
});

// @desc    Hủy đặt chỗ
// @route   DELETE /api/reservations/:id
// @access  Private
const cancelReservation = asyncHandler(async (req, res) => {
  const reservation = await Reservation.findById(req.params.id);

  // Kiểm tra nếu đặt chỗ tồn tại
  if (!reservation) {
    res.status(404);
    throw new Error('Không tìm thấy đặt chỗ');
  }

  // Kiểm tra quyền sở hữu
  if (reservation.student.id !== req.user.studentId && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Không có quyền truy cập');
  }

  // Kiểm tra nếu đặt chỗ đã check-in
  if (reservation.status === 'checked_in') {
    res.status(400);
    throw new Error('Không thể hủy đặt chỗ đã check-in');
  }

  // Cập nhật trạng thái đặt chỗ
  reservation.status = 'cancelled';
  await reservation.save();

  // Cập nhật trạng thái không gian học tập (nếu cần)
  const studySpace = await StudySpace.findById(reservation.studySpace);
  if (studySpace && studySpace.status === 'reserved') {
    // Kiểm tra xem còn đặt chỗ nào khác đang active cho không gian này không
    const activeReservations = await Reservation.find({
      studySpace: studySpace._id,
      status: { $in: ['confirmed', 'checked_in'] },
      startTime: { $lte: new Date() },
      endTime: { $gte: new Date() }
    });

    if (activeReservations.length === 0) {
      studySpace.status = 'empty';
      await studySpace.save();
    }
  }
  
  res.status(200).json({
    success: true,
    message: 'Đã hủy đặt chỗ'
  });
});

// @desc    Check-in đặt chỗ
// @route   PATCH /api/reservations/:id/check-in
// @access  Private
const checkInReservation = asyncHandler(async (req, res) => {
  const reservation = await Reservation.findById(req.params.id);

  // Kiểm tra nếu đặt chỗ tồn tại
  if (!reservation) {
    res.status(404);
    throw new Error('Không tìm thấy đặt chỗ');
  }

  // Kiểm tra quyền sở hữu
  if (reservation.student.id !== req.user.studentId && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Không có quyền truy cập');
  }

  // Kiểm tra nếu đặt chỗ đã check-in trước đó
  if (reservation.status === 'checked_in') {
    res.status(400);
    throw new Error('Đặt chỗ đã được check-in');
  }

  // Kiểm tra thời gian
  const now = new Date();
  const startTime = new Date(reservation.startTime);
  const endTime = new Date(reservation.endTime);

  // Kiểm tra xem đã đến thời gian check-in chưa
  const checkInWindow = new Date(startTime);
  checkInWindow.setMinutes(checkInWindow.getMinutes() - 15); // Cho phép check-in sớm 15 phút

  if (now < checkInWindow) {
    res.status(400);
    throw new Error('Chưa đến thời gian check-in');
  }

  if (now > endTime) {
    res.status(400);
    throw new Error('Đã qua thời gian đặt chỗ');
  }

  // Tiến hành check-in
  reservation.status = 'checked_in';
  reservation.checkInTime = now;
  await reservation.save();

  // Cập nhật trạng thái không gian học tập
  const studySpace = await StudySpace.findById(reservation.studySpace);
  if (studySpace) {
    studySpace.status = 'in_use';
    await studySpace.save();
  }
  
  res.status(200).json({
    success: true,
    message: 'Check-in thành công',
    data: reservation
  });
});

// @desc    Check-out đặt chỗ
// @route   PATCH /api/reservations/:id/check-out
// @access  Private
const checkOutReservation = asyncHandler(async (req, res) => {
  const reservation = await Reservation.findById(req.params.id);

  // Kiểm tra nếu đặt chỗ tồn tại
  if (!reservation) {
    res.status(404);
    throw new Error('Không tìm thấy đặt chỗ');
  }

  // Kiểm tra quyền sở hữu
  if (reservation.student.id !== req.user.studentId && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Không có quyền truy cập');
  }

  // Kiểm tra nếu đặt chỗ đã check-in
  if (reservation.status !== 'checked_in') {
    res.status(400);
    throw new Error('Đặt chỗ chưa được check-in');
  }

  // Tiến hành check-out
  reservation.status = 'checked_out';
  reservation.checkOutTime = new Date();
  await reservation.save();

  // Cập nhật trạng thái không gian học tập
  const studySpace = await StudySpace.findById(reservation.studySpace);
  if (studySpace) {
    // Kiểm tra xem còn đặt chỗ nào khác đang active cho không gian này không
    const activeReservations = await Reservation.find({
      studySpace: studySpace._id,
      status: 'checked_in',
      _id: { $ne: reservation._id }
    });

    if (activeReservations.length === 0) {
      studySpace.status = 'empty';
      await studySpace.save();
    }
  }
  
  res.status(200).json({
    success: true,
    message: 'Check-out thành công',
    data: reservation
  });
});

// @desc    Lấy tất cả các đặt chỗ (dành cho admin)
// @route   GET /api/reservations/all
// @access  Private/Admin
const getAllReservations = asyncHandler(async (req, res) => {
  const reservations = await Reservation.find({})
    .populate('studySpace')
    .sort({ startTime: 1 });
  
  res.status(200).json({
    success: true,
    count: reservations.length,
    data: reservations
  });
});

module.exports = {
  createReservation,
  getMyReservations,
  getReservationById,
  updateReservation,
  cancelReservation,
  checkInReservation,
  checkOutReservation,
  getAllReservations
};