const mongoose = require('mongoose');

const studySpaceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  location: {
    building: {
      type: String,
      required: true,
      trim: true
    },
    floor: {
      type: Number,
      required: true
    },
    roomNumber: {
      type: String,
      required: true,
      trim: true
    }
  },
  capacity: {
    type: Number,
    required: true,
    min: 1
  },
  type: {
    type: String,
    required: true,
    enum: ['individual', 'group', 'mentoring'],
    default: 'individual'
  },
  facilities: [{
    type: String,
    enum: ['lighting', 'power_outlet', 'projector', 'whiteboard', 'interactive_screen', 'online_meeting_device', 'air_conditioner'],
  }],
  status: {
    type: String,
    enum: ['empty', 'reserved', 'in_use', 'maintenance'],
    default: 'empty'
  },
  qrCode: {
    type: String,
    unique: true
  },
  description: {
    type: String,
    trim: true
  },
  availability: {
    openTime: {
      type: String,
      default: '07:00' // Format: HH:MM
    },
    closeTime: {
      type: String,
      default: '22:00' // Format: HH:MM
    },
    availableDays: {
      type: [String],
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      default: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    }
  },
  iotDevices: {
    lights: {
      type: Boolean,
      default: true
    },
    airConditioner: {
      type: Boolean,
      default: true
    },
    doorLock: {
      type: Boolean,
      default: true
    },
    stateSensor: {
      type: Boolean,
      default: true
    },
    camera: {
      type: Boolean,
      default: false
    }
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
studySpaceSchema.index({ 'location.building': 1, 'location.floor': 1 });
studySpaceSchema.index({ type: 1 });
studySpaceSchema.index({ status: 1 });
studySpaceSchema.index({ capacity: 1 });

const StudySpace = mongoose.model('StudySpace', studySpaceSchema);

module.exports = StudySpace;