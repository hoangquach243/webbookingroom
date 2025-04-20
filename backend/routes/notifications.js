const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const authMiddleware = require('../middleware/auth');
const Joi = require('joi');

const notificationSchema = Joi.object({
  page: Joi.number().default(1),
  limit: Joi.number().default(10),
});

router.get('/', authMiddleware, async (req, res) => {
  const { error, value } = notificationSchema.validate(req.query);
  if (error) return res.status(400).json({ message: error.details[0].message });

  const { page, limit } = value;
  const skip = (page - 1) * limit;
  const notifications = await Notification.find({ userId: req.user.id })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
  res.json(notifications);
});

module.exports = router;