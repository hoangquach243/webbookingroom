const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RevokedTokenSchema = new Schema({
  token: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true }, // Thời gian hết hạn của refreshToken
});

RevokedTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // Tự động xóa token hết hạn

module.exports = mongoose.model('RevokedToken', RevokedTokenSchema);