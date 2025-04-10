const StudySpace = require('../models/studySpace');
const asyncHandler = require('express-async-handler');

// @desc    Tạo không gian học tập mới
// @route   POST /api/study-spaces
// @access  Private/Admin
const createStudySpace = asyncHandler(async (req, res) => {
  const {
    name,
    location,
    capacity,
    type,
    facilities,
    description,
    availability,
    iotDevices
  } = req.body;

  const studySpace = await StudySpace.create({
    name,
    location,
    capacity,
    type,
    facilities,
    description,
    availability,
    iotDevices,
    qrCode: `SPACE-${Date.now()}` // Tạo QR code duy nhất (cần cải thiện trong thực tế)
  });

  if (studySpace) {
    res.status(201).json({
      success: true,
      data: studySpace
    });
  } else {
    res.status(400);
    throw new Error('Dữ liệu không gian học tập không hợp lệ');
  }
});

// @desc    Lấy tất cả không gian học tập
// @route   GET /api/study-spaces
// @access  Public
const getStudySpaces = asyncHandler(async (req, res) => {
  const studySpaces = await StudySpace.find({});
  
  res.status(200).json({
    success: true,
    count: studySpaces.length,
    data: studySpaces
  });
});

// @desc    Lấy không gian học tập theo ID
// @route   GET /api/study-spaces/:id
// @access  Public
const getStudySpaceById = asyncHandler(async (req, res) => {
  const studySpace = await StudySpace.findById(req.params.id);
  
  if (studySpace) {
    res.status(200).json({
      success: true,
      data: studySpace
    });
  } else {
    res.status(404);
    throw new Error('Không tìm thấy không gian học tập');
  }
});

// @desc    Cập nhật không gian học tập
// @route   PUT /api/study-spaces/:id
// @access  Private/Admin
const updateStudySpace = asyncHandler(async (req, res) => {
  const {
    name,
    location,
    capacity,
    type,
    facilities,
    description,
    availability,
    iotDevices,
    status
  } = req.body;

  const studySpace = await StudySpace.findById(req.params.id);

  if (studySpace) {
    studySpace.name = name || studySpace.name;
    studySpace.location = location || studySpace.location;
    studySpace.capacity = capacity || studySpace.capacity;
    studySpace.type = type || studySpace.type;
    studySpace.facilities = facilities || studySpace.facilities;
    studySpace.description = description || studySpace.description;
    studySpace.availability = availability || studySpace.availability;
    studySpace.iotDevices = iotDevices || studySpace.iotDevices;
    studySpace.status = status || studySpace.status;
    studySpace.updatedAt = Date.now();

    const updatedStudySpace = await studySpace.save();
    
    res.status(200).json({
      success: true,
      data: updatedStudySpace
    });
  } else {
    res.status(404);
    throw new Error('Không tìm thấy không gian học tập');
  }
});

// @desc    Xóa không gian học tập
// @route   DELETE /api/study-spaces/:id
// @access  Private/Admin
const deleteStudySpace = asyncHandler(async (req, res) => {
  const studySpace = await StudySpace.findById(req.params.id);

  if (studySpace) {
    await studySpace.remove();
    
    res.status(200).json({
      success: true,
      message: 'Đã xóa không gian học tập'
    });
  } else {
    res.status(404);
    throw new Error('Không tìm thấy không gian học tập');
  }
});

// @desc    Cập nhật trạng thái của không gian học tập
// @route   PATCH /api/study-spaces/:id/status
// @access  Private
const updateStudySpaceStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  if (!status) {
    res.status(400);
    throw new Error('Vui lòng cung cấp trạng thái');
  }

  const studySpace = await StudySpace.findById(req.params.id);

  if (studySpace) {
    studySpace.status = status;
    studySpace.updatedAt = Date.now();

    const updatedStudySpace = await studySpace.save();
    
    res.status(200).json({
      success: true,
      data: updatedStudySpace
    });
  } else {
    res.status(404);
    throw new Error('Không tìm thấy không gian học tập');
  }
});

module.exports = {
  createStudySpace,
  getStudySpaces,
  getStudySpaceById,
  updateStudySpace,
  deleteStudySpace,
  updateStudySpaceStatus
};