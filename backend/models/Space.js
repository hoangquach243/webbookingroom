const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SpaceSchema = new Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['Phòng tự học', 'Phòng học nhóm'], required: true },
  building: { type: String, required: true },
  floor: { type: Number, required: true },
  bookedTimeSlot: { type: String, default: null },
  status: { type: String, enum: ['empty', 'booked', 'in-use'], default: 'empty' },
  bookedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  bookedAt: { type: Date, default: null },
  checkInDeadline: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Space', SpaceSchema);