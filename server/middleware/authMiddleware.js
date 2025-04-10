const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');

// Protect routes
const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Kiểm tra header Authorization
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Lấy token từ header
      token = req.headers.authorization.split(' ')[1];

      // Xác thực token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Trong thực tế, cần truy vấn thông tin người dùng từ CSDL
      // Ở đây, chúng ta mô phỏng thông tin người dùng từ token đã giải mã
      req.user = {
        studentId: decoded.id,
        name: decoded.name,
        email: decoded.email,
        role: decoded.role || 'student'
      };

      next();
    } catch (error) {
      console.error(error);
      res.status(401);
      throw new Error('Không được phép truy cập, token không hợp lệ');
    }
  }

  if (!token) {
    res.status(401);
    throw new Error('Không được phép truy cập, không có token');
  }
});

// Admin middleware
const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403);
    throw new Error('Không được phép truy cập, yêu cầu quyền admin');
  }
};

// Technical staff middleware
const technicalStaff = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'technical')) {
    next();
  } else {
    res.status(403);
    throw new Error('Không được phép truy cập, yêu cầu quyền kỹ thuật');
  }
};

// IoT device middleware
const iotDevice = (req, res, next) => {
  const apiKey = req.headers['x-iot-api-key'];
  
  if (!apiKey) {
    res.status(401);
    throw new Error('Không được phép truy cập, thiếu API key');
  }
  
  // Trong thực tế, cần kiểm tra API key với CSDL
  // Ở đây, chúng ta sử dụng biến môi trường để đơn giản hóa
  if (apiKey !== process.env.IOT_API_KEY) {
    res.status(401);
    throw new Error('Không được phép truy cập, API key không hợp lệ');
  }
  
  next();
};

module.exports = { protect, admin, technicalStaff, iotDevice };