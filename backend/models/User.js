const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  studentId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  password: { type: String, required: true },
  email: { type: String, default: '' },
  phone: { type: String, default: '' },
  gender: { type: String, enum: ['Nam', 'Nữ', 'Khác'], default: 'Nam' },
  birthDate: { type: Date, default: null },
});

module.exports = mongoose.model('User', UserSchema);