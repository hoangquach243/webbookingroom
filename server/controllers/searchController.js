const StudySpace = require('../models/studySpace');
const Reservation = require('../models/reservation');
const asyncHandler = require('express-async-handler');

// @desc    Tìm kiếm và lọc không gian học tập
// @route   GET /api/search
// @access  Public
const searchStudySpaces = asyncHandler(async (req, res) => {
  // Lấy các tham số tìm kiếm từ query params
  const {
    building,
    floor,
    type,
    capacity,
    facilities,
    status,
    startTime,
    endTime,
    page = 1,
    limit = 10
  } = req.query;

  // Xây dựng điều kiện tìm kiếm
  const queryConditions = {};

  // Lọc theo tòa nhà
  if (building) {
    queryConditions['location.building'] = { $regex: building, $options: 'i' };
  }

  // Lọc theo tầng
  if (floor) {
    queryConditions['location.floor'] = parseInt(floor);
  }

  // Lọc theo loại không gian
  if (type) {
    queryConditions.type = type;
  }

  // Lọc theo sức chứa
  if (capacity) {
    queryConditions.capacity = { $gte: parseInt(capacity) };
  }

  // Lọc theo tiện ích
  if (facilities) {
    const facilitiesArray = facilities.split(',');
    queryConditions.facilities = { $all: facilitiesArray };
  }

  // Lọc theo trạng thái
  if (status) {
    queryConditions.status = status;
  } else {
    // Mặc định chỉ hiển thị các không gian trống hoặc có sẵn
    queryConditions.status = { $in: ['empty', 'reserved'] };
  }

  // Tính pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);

  try {
    // Tìm kiếm không gian học tập theo các điều kiện
    let studySpaces = await StudySpace.find(queryConditions)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ 'location.building': 1, 'location.floor': 1, 'location.roomNumber': 1 });

// @desc    Lấy không gian học tập có sẵn trong khoảng thời gian cụ thể
// @route   GET /api/search/available
// @access  Public
const getAvailableStudySpaces = asyncHandler(async (req, res) => {
  const {
    startTime,
    endTime,
    type,
    capacity,
    building,
    page = 1,
    limit = 10
  } = req.query;

  // Kiểm tra tham số bắt buộc
  if (!startTime || !endTime) {
    res.status(400);
    throw new Error('Vui lòng cung cấp thời gian bắt đầu và kết thúc');
  }

  const start = new Date(startTime);
  const end = new Date(endTime);

  // Kiểm tra thời gian hợp lệ
  if (start >= end) {
    res.status(400);
    throw new Error('Thời gian bắt đầu phải trước thời gian kết thúc');
  }

  // Xây dựng điều kiện tìm kiếm
  const queryConditions = {
    status: { $ne: 'maintenance' } // Loại trừ các không gian đang bảo trì
  };

  // Lọc theo loại không gian
  if (type) {
    queryConditions.type = type;
  }

  // Lọc theo sức chứa
  if (capacity) {
    queryConditions.capacity = { $gte: parseInt(capacity) };
  }

  // Lọc theo tòa nhà
  if (building) {
    queryConditions['location.building'] = { $regex: building, $options: 'i' };
  }

  try {
    // Lấy danh sách các không gian thỏa mãn điều kiện cơ bản
    const studySpaces = await StudySpace.find(queryConditions);
    
    // Lấy danh sách các đặt chỗ trong khoảng thời gian này
    const overlappingReservations = await Reservation.find({
      status: { $in: ['confirmed', 'checked_in'] },
      $or: [
        { startTime: { $lt: end }, endTime: { $gt: start } }
      ]
    });
    
    // Tạo map để đếm số lượng đặt chỗ cho mỗi không gian
    const reservationsCountMap = {};
    overlappingReservations.forEach(reservation => {
      const spaceId = reservation.studySpace.toString();
      reservationsCountMap[spaceId] = (reservationsCountMap[spaceId] || 0) + 1;
    });
    
    // Lọc ra các không gian không có đặt chỗ trong khoảng thời gian này
    const availableSpaces = studySpaces.filter(space => {
      return !reservationsCountMap[space._id.toString()];
    });
    
    // Áp dụng pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const paginatedSpaces = availableSpaces.slice(skip, skip + parseInt(limit));
    
    res.status(200).json({
      success: true,
      count: paginatedSpaces.length,
      total: availableSpaces.length,
      totalPages: Math.ceil(availableSpaces.length / parseInt(limit)),
      currentPage: parseInt(page),
      data: paginatedSpaces
    });
  } catch (error) {
    res.status(500);
    throw new Error(`Lỗi khi tìm kiếm không gian học tập có sẵn: ${error.message}`);
  }
});

// @desc    Tìm kiếm nhanh theo từ khóa
// @route   GET /api/search/quick
// @access  Public
const quickSearch = asyncHandler(async (req, res) => {
  const { keyword } = req.query;

  if (!keyword) {
    res.status(400);
    throw new Error('Vui lòng cung cấp từ khóa tìm kiếm');
  }

  try {
    // Tìm kiếm theo tên không gian học tập, tòa nhà, số phòng
    const studySpaces = await StudySpace.find({
      $or: [
        { name: { $regex: keyword, $options: 'i' } },
        { 'location.building': { $regex: keyword, $options: 'i' } },
        { 'location.roomNumber': { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } }
      ]
    }).limit(10);

    res.status(200).json({
      success: true,
      count: studySpaces.length,
      data: studySpaces
    });
  } catch (error) {
    res.status(500);
    throw new Error(`Lỗi khi tìm kiếm nhanh: ${error.message}`);
  }
});

// @desc    Lấy thống kê về không gian học tập
// @route   GET /api/search/stats
// @access  Private/Admin
const getStudySpaceStats = asyncHandler(async (req, res) => {
  try {
    // Đếm số lượng không gian theo trạng thái
    const statusStats = await StudySpace.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Đếm số lượng không gian theo loại
    const typeStats = await StudySpace.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Đếm số lượng không gian theo tòa nhà
    const buildingStats = await StudySpace.aggregate([
      {
        $group: {
          _id: '$location.building',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Tính tỷ lệ sử dụng hiện tại
    const totalSpaces = await StudySpace.countDocuments();
    const inUseSpaces = await StudySpace.countDocuments({ status: 'in_use' });
    const utilizationRate = totalSpaces > 0 ? (inUseSpaces / totalSpaces) * 100 : 0;

    res.status(200).json({
      success: true,
      data: {
        totalSpaces,
        utilizationRate: utilizationRate.toFixed(2),
        statusStats,
        typeStats,
        buildingStats
      }
    });
  } catch (error) {
    res.status(500);
    throw new Error(`Lỗi khi lấy thống kê không gian học tập: ${error.message}`);
  }
});

module.exports = {
  searchStudySpaces,
  getAvailableStudySpaces,
  quickSearch,
  getStudySpaceStats
};

    // Nếu có thời gian bắt đầu và kết thúc, cần lọc thêm các không gian không có đặt chỗ trong khoảng thời gian đó
    if (startTime && endTime) {
      const start = new Date(startTime);
      const end = new Date(endTime);

      // Lấy tất cả các đặt chỗ trong khoảng thời gian này
      const overlappingReservations = await Reservation.find({
        status: { $in: ['confirmed', 'checked_in'] },
        $or: [
          { startTime: { $lt: end }, endTime: { $gt: start } }
        ]
      });

      // Lấy danh sách các ID không gian đã có đặt chỗ
      const reservedSpaceIds = overlappingReservations.map(r => r.studySpace.toString());
      
      // Lọc ra các không gian không có trong danh sách đã đặt
      studySpaces = studySpaces.filter(space => 
        !reservedSpaceIds.includes(space._id.toString()) || space.status === 'empty'
      );
    }

    // Đếm tổng số không gian thỏa mãn điều kiện (không tính pagination)
    const total = await StudySpace.countDocuments(queryConditions);
    
    // Trả về kết quả
    res.status(200).json({
      success: true,
      count: studySpaces.length,
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      data: studySpaces
    });
  } catch (error) {
    res.status(500);
    throw new Error(`Lỗi khi tìm kiếm không gian học tập: ${error.message}`);
  }
});