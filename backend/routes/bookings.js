const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const authMiddleware = require('../middleware/auth');
const Joi = require('joi');

const historySchema = Joi.object({
  page: Joi.number().min(1).default(1),
  limit: Joi.number().min(1).max(100).default(10),
});

router.get('/history', authMiddleware, async (req, res) => {
  try {
    const { error, value } = historySchema.validate(req.query);
    if (error) return res.status(400).json({ success: false, message: error.details[0].message });

    const { page, limit } = value;
    const skip = (page - 1) * limit;

    const bookings = await Booking.find({ userId: req.user.id })
      .populate('spaceId', 'name type location')
      .sort({ bookedAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Booking.countDocuments({ userId: req.user.id });

    res.json({
      success: true,
      data: bookings,
      total,
      totalPages: Math.ceil(total / limit),
      page,
      limit,
    });
  } catch (err) {
    console.error(`Error fetching booking history for user ${req.user?.id}:`, err);
    res.status(500).json({ success: false, message: 'Lỗi server, vui lòng thử lại sau' });
  }
});

module.exports = router;