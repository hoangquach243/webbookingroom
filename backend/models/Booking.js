const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const BookingSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  spaceId: { type: Schema.Types.ObjectId, ref: 'Space', required: true },
  bookedAt: { type: Date, required: true },
  bookedTimeSlot: { type: String, default: null }, // Khung giờ đặt, ví dụ: "08:00-10:00"
  checkInAt: { type: Date, default: null },
  checkOutAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Booking', BookingSchema);