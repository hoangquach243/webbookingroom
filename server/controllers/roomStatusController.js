const StudySpace = require('../models/studySpace');
const Reservation = require('../models/reservation');
const asyncHandler = require('express-async-handler');

// @desc    Cập nhật trạng thái phòng từ IoT
// @route   PUT /api/rooms/:id/status
// @access  Private/IoT
const updateRoomStatusFromIoT = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, sensorData } = req.body;

  // Xác thực IoT device (thực tế cần sử dụng cơ chế xác thực an toàn hơn)
  if (!req.headers['x-iot-api-key']) {
    res.status(401);
    throw new Error('Không được phép truy cập');
  }

  try {
    const studySpace = await StudySpace.findById(id);

    if (!studySpace) {
      res.status(404);
      throw new Error('Không tìm thấy không gian học tập');
    }

    // Cập nhật trạng thái
    if (status) {
      studySpace.status = status;
    }

    // Lưu dữ liệu cảm biến (thực tế cần một model riêng cho dữ liệu cảm biến)
    if (sensorData) {
      // Trong ứng dụng thực tế, có thể lưu dữ liệu này vào một collection riêng
      console.log('Sensor data received:', sensorData);
    }

    await studySpace.save();

    res.status(200).json({
      success: true,
      message: 'Đã cập nhật trạng thái phòng',
      data: studySpace
    });
  } catch (error) {
    res.status(500);
    throw new Error(`Lỗi khi cập nhật trạng thái phòng: ${error.message}`);
  }
});

// @desc    Lấy thông tin trạng thái phòng
// @route   GET /api/rooms/:id/status
// @access  Public
const getRoomStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const studySpace = await StudySpace.findById(id);

    if (!studySpace) {
      res.status(404);
      throw new Error('Không tìm thấy không gian học tập');
    }

    // Lấy thông tin đặt chỗ hiện tại (nếu có)
    const currentReservation = await Reservation.findOne({
      studySpace: id,
      status: { $in: ['confirmed', 'checked_in'] },
      startTime: { $lte: new Date() },
      endTime: { $gte: new Date() }
    }).select('-student.email'); // Không trả về email của sinh viên để bảo vệ quyền riêng tư

    res.status(200).json({
      success: true,
      data: {
        roomId: studySpace._id,
        roomName: studySpace.name,
        location: studySpace.location,
        status: studySpace.status,
        isOccupied: studySpace.status === 'in_use',
        currentReservation: currentReservation ? {
          id: currentReservation._id,
          startTime: currentReservation.startTime,
          endTime: currentReservation.endTime,
          studentId: currentReservation.student.id,
          studentName: currentReservation.student.name
        } : null
      }
    });
  } catch (error) {
    res.status(500);
    throw new Error(`Lỗi khi lấy trạng thái phòng: ${error.message}`);
  }
});

// @desc    Kiểm tra tình trạng toàn bộ hệ thống IoT
// @route   GET /api/rooms/iot/health
// @access  Private/Admin
const checkIoTHealth = asyncHandler(async (req, res) => {
  try {
    // Đếm số lượng không gian có từng loại thiết bị IoT
    const iotStats = await StudySpace.aggregate([
      {
        $group: {
          _id: null,
          totalRooms: { $sum: 1 },
          roomsWithLights: { $sum: { $cond: ['$iotDevices.lights', 1, 0] } },
          roomsWithAirConditioner: { $sum: { $cond: ['$iotDevices.airConditioner', 1, 0] } },
          roomsWithDoorLock: { $sum: { $cond: ['$iotDevices.doorLock', 1, 0] } },
          roomsWithStateSensor: { $sum: { $cond: ['$iotDevices.stateSensor', 1, 0] } },
          roomsWithCamera: { $sum: { $cond: ['$iotDevices.camera', 1, 0] } }
        }
      }
    ]);

    // Lấy danh sách phòng có thiết bị IoT bị lỗi (trong thực tế, cần có logic để kiểm tra thiết bị lỗi)
    const roomsWithIssues = await StudySpace.find({
      status: 'maintenance'
    }).select('name location status');

    res.status(200).json({
      success: true,
      data: {
        stats: iotStats[0] || {
          totalRooms: 0,
          roomsWithLights: 0,
          roomsWithAirConditioner: 0,
          roomsWithDoorLock: 0,
          roomsWithStateSensor: 0,
          roomsWithCamera: 0
        },
        roomsWithIssues
      }
    });
  } catch (error) {
    res.status(500);
    throw new Error(`Lỗi khi kiểm tra tình trạng IoT: ${error.message}`);
  }
});

// @desc    Điều khiển thiết bị IoT trong phòng
// @route   POST /api/rooms/:id/iot/control
// @access  Private
const controlRoomIoT = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { device, action } = req.body;

  // Kiểm tra tham số
  if (!device || !action) {
    res.status(400);
    throw new Error('Vui lòng cung cấp thiết bị và hành động');
  }

  try {
    // Kiểm tra quyền hạn (trong thực tế, cần kiểm tra xem người dùng có quyền điều khiển thiết bị này không)
    const studySpace = await StudySpace.findById(id);

    if (!studySpace) {
      res.status(404);
      throw new Error('Không tìm thấy không gian học tập');
    }

    // Kiểm tra xem người dùng hiện tại có đặt chỗ và check-in vào phòng này không
    const hasActiveReservation = await Reservation.findOne({
      studySpace: id,
      'student.id': req.user.studentId,
      status: 'checked_in',
      startTime: { $lte: new Date() },
      endTime: { $gte: new Date() }
    });

    const isAdmin = req.user.role === 'admin';

    if (!hasActiveReservation && !isAdmin) {
      res.status(403);
      throw new Error('Bạn không có quyền điều khiển thiết bị trong phòng này');
    }

    // Xác định hành động điều khiển thiết bị (trong thực tế, cần tích hợp với API của thiết bị IoT)
    let controlResult = {
      success: true,
      message: `Đã ${action} ${device}`,
      device,
      action
    };

    // Giả lập việc điều khiển thiết bị
    switch (device) {
      case 'lights':
        if (!studySpace.iotDevices.lights) {
          throw new Error('Phòng này không có đèn thông minh');
        }
        // Mô phỏng gửi lệnh bật/tắt đến thiết bị
        console.log(`Sending command to ${action} lights in room ${id}`);
        break;

      case 'airConditioner':
        if (!studySpace.iotDevices.airConditioner) {
          throw new Error('Phòng này không có điều hòa thông minh');
        }
        // Mô phỏng gửi lệnh bật/tắt đến thiết bị
        console.log(`Sending command to ${action} air conditioner in room ${id}`);
        break;

      case 'doorLock':
        if (!studySpace.iotDevices.doorLock) {
          throw new Error('Phòng này không có khóa cửa thông minh');
        }
        
        // Chỉ admin mới có quyền khóa/mở khóa cửa trực tiếp (hoặc người dùng đang check-in/check-out)
        if (action === 'unlock' && !isAdmin && !hasActiveReservation) {
          throw new Error('Bạn không có quyền mở khóa cửa');
        }

        // Mô phỏng gửi lệnh khóa/mở đến thiết bị
        console.log(`Sending command to ${action} door in room ${id}`);
        break;

      default:
        throw new Error('Thiết bị không được hỗ trợ');
    }

    res.status(200).json({
      success: true,
      data: controlResult
    });
  } catch (error) {
    res.status(error.status || 500);
    throw new Error(`Lỗi khi điều khiển thiết bị IoT: ${error.message}`);
  }
});

module.exports = {
  updateRoomStatusFromIoT,
  getRoomStatus,
  checkIoTHealth,
  controlRoomIoT
};