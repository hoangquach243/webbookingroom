const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
  studySpace: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StudySpace',
    required: true
  },
  student: {
    id: {
      type: String,
      required: true,
      trim: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      trim: true
    }
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled', 'no_show'],
    default: 'confirmed'
  },
  numberOfParticipants: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  purpose: {
    type: String,
    enum: ['individual_study', 'group_study', 'project_work', 'mentoring', 'other'],
    default: 'individual_study'
  },
  notes: {
    type: String,
    trim: true
  },
  checkInTime: {
    type: Date
  },
  checkOutTime: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { 
  timestamps: true 
});

// Thêm index để tối ưu tìm kiếm
reservationSchema.index({ studySpace: 1, startTime: 1, endTime: 1 });
reservationSchema.index({ 'student.id': 1 });
reservationSchema.index({ status: 1 });
reservationSchema.index({ startTime: 1, endTime: 1 });

// Middleware để kiểm tra xem không gian có sẵn để đặt không
reservationSchema.pre('save', async function(next) {
  if (this.isNew) {
    // Kiểm tra xem có đặt chỗ nào khác cho không gian này trong cùng khoảng thời gian không
    const overlappingReservation = await this.constructor.findOne({
      studySpace: this.studySpace,
      status: { $in: ['confirmed', 'checked_in'] },
      $or: [
        { 
          startTime: { $lt: this.endTime }, 
          endTime: { $gt: this.startTime } 
        }
      ]
    });

    if (overlappingReservation) {
      const error = new Error('Không gian học tập đã được đặt trong khoảng thời gian này.');
      return next(error);
    }
  }
  next();
});

const Reservation = mongoose.model('Reservation', reservationSchema);

module.exports = Reservation;