// Middleware để bắt các lỗi không tồn tại route
const notFound = (req, res, next) => {
    const error = new Error(`Không tìm thấy: ${req.originalUrl}`);
    res.status(404);
    next(error);
  };
  
  // Middleware xử lý lỗi chung
  const errorHandler = (err, req, res, next) => {
    // Nếu status code là 200, gán lại là 500
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    
    res.status(statusCode);
    res.json({
      success: false,
      message: err.message,
      stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
  };
  
  module.exports = { notFound, errorHandler };