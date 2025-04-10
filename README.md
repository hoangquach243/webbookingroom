# webbookingroom# Hệ thống Quản lý và Đặt chỗ Không gian Học tập Thông minh (S3-MRS)

Hệ thống giúp sinh viên dễ dàng tìm kiếm, đặt chỗ và sử dụng các không gian học tập tại trường Đại học Bách Khoa - ĐHQG TP.HCM.

## Tính năng chính

- **Quản lý không gian học tập**: CRUD cho không gian học tập, quản lý trạng thái phòng
- **Đặt chỗ và quản lý lịch sử đặt chỗ**: Sinh viên có thể đặt chỗ, xem lịch sử đặt chỗ
- **Check-in/Check-out**: Quản lý quy trình check-in và check-out vào không gian học tập
- **Tìm kiếm và lọc**: Tìm kiếm không gian học tập theo nhiều tiêu chí
- **Tích hợp IoT**: Điều khiển thiết bị thông minh trong phòng học
- **Thống kê và báo cáo**: Cung cấp thống kê về việc sử dụng không gian học tập

## Cài đặt và chạy

### Yêu cầu

- Node.js v14 trở lên
- MongoDB

### Các bước cài đặt

1. Clone repository:
```bash
git clone https://github.com/hoangquach243/webbookingroom#
cd cd webbookingroom
```

2. Cài đặt các dependencies:
```bash
npm install

6. Chạy ứng dụng:
```bash
# Chạy ở chế độ development
npm run dev

# Chạy ở chế độ production
npm start
```

## API Endpoints

### Không gian học tập

- `GET /api/study-spaces` - Lấy tất cả không gian học tập
- `GET /api/study-spaces/:id` - Lấy không gian học tập theo ID
- `POST /api/study-spaces` - Tạo không gian học tập mới (admin)
- `PUT /api/study-spaces/:id` - Cập nhật không gian học tập (admin)
- `DELETE /api/study-spaces/:id` - Xóa không gian học tập (admin)
- `PATCH /api/study-spaces/:id/status` - Cập nhật trạng thái không gian học tập

### Đặt chỗ

- `GET /api/reservations` - Lấy tất cả đặt chỗ của người dùng hiện tại
- `GET /api/reservations/:id` - Lấy đặt chỗ theo ID
- `POST /api/reservations` - Tạo đặt chỗ mới
- `PUT /api/reservations/:id` - Cập nhật đặt chỗ
- `DELETE /api/reservations/:id` - Hủy đặt chỗ
- `PATCH /api/reservations/:id/check-in` - Check-in đặt chỗ
- `PATCH /api/reservations/:id/check-out` - Check-out đặt chỗ
- `GET /api/reservations/all` - Lấy tất cả đặt chỗ (admin)

### Tìm kiếm và lọc

- `GET /api/search` - Tìm kiếm và lọc không gian học tập
- `GET /api/search/available` - Lấy không gian học tập có sẵn trong khoảng thời gian cụ thể
- `GET /api/search/quick` - Tìm kiếm nhanh theo từ khóa
- `GET /api/search/stats` - Lấy thống kê về không gian học tập (admin)

### Trạng thái phòng và IoT

- `GET /api/rooms/:id/status` - Lấy thông tin trạng thái phòng
- `PUT /api/rooms/:id/status` - Cập nhật trạng thái phòng từ IoT
- `POST /api/rooms/:id/iot/control` - Điều khiển thiết bị IoT trong phòng
- `GET /api/rooms/iot/health` - Kiểm tra tình trạng toàn bộ hệ thống IoT (admin)

## Cấu trúc dự án

```
BTLCNPM/
├── webbookingroom/
│   ├── client/
│   ├── server/
│   │   ├── controllers/
│   │   │   ├── reservationController.js
│   │   │   ├── roomStatusController.js
│   │   │   ├── searchController.js
│   │   │   └── studySpaceController.js
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js
│   │   │   └── errorMiddleware.js
│   │   ├── models/
│   │   │   ├── reservation.js
│   │   │   └── studySpace.js
│   │   ├── routes/
│   │   │   └── index.js
│   │   └── package-lock.json
│   └── README.md              # Cấu hình server
```

## Công nghệ sử dụng

- **Backend**: Node.js, Express.js
- **Database**: MongoDB, Mongoose
- **Authentication**: JWT
- **Khác**: Cors, Morgan
