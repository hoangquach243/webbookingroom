const express = require('express');
const router = express.Router();
const Rating = require('../models/Rating');
const authMiddleware = require('../middleware/auth');
const Joi = require('joi');

const ratingSchema = Joi.object({
  spaceId: Joi.string().required(),
  rating: Joi.number().min(1).max(5).required(),
  comment: Joi.string().allow(''),
});

const ratingsQuerySchema = Joi.object({
  spaceId: Joi.string().required(),
  page: Joi.number().min(1).default(1),
  limit: Joi.number().min(1).max(100).default(10),
});

router.post('/', authMiddleware, async (req, res) => {
  const { error, value } = ratingSchema.validate(req.body);
  if (error) return res.status(400).json({ success: false, message: error.details[0].message });

  const { spaceId, rating, comment } = value;
  const newRating = new Rating({
    userId: req.user.id,
    spaceId,
    rating,
    comment,
  });
  await newRating.save();
  res.json({ success: true, message: 'Đánh giá thành công', rating: newRating });
});

router.get('/', authMiddleware, async (req, res) => {
  try {
    const { error, value } = ratingsQuerySchema.validate(req.query);
    if (error) return res.status(400).json({ success: false, message: error.details[0].message });

    const { spaceId, page, limit } = value;
    const skip = (page - 1) * limit;

    const ratings = await Rating.find({ spaceId })
      .populate('userId', 'studentId name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Rating.countDocuments({ spaceId });

    res.json({
      success: true,
      data: ratings,
      total,
      totalPages: Math.ceil(total / limit),
      page,
      limit,
    });
  } catch (err) {
    console.error(`Error fetching ratings for space ${req.query.spaceId}:`, err);
    res.status(500).json({ success: false, message: 'Lỗi server, vui lòng thử lại sau' });
  }
});

module.exports = router;