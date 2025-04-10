const express = require('express');
const router = express.Router();

// Import controllers
const studySpaceController = require('../controllers/studySpaceController');
const reservationController = require('../controllers/reservationController');
const searchController = require('../controllers/searchController');
const roomStatusController = require('../controllers/roomStatusController');

// Import middleware
const { protect, admin } = require('../middleware/authMiddleware');

// Study Space Routes
router.route('/study-spaces')
  .get(studySpaceController.getStudySpaces)
  .post(protect, admin, studySpaceController.createStudySpace);

router.route('/study-spaces/:id')
  .get(studySpaceController.getStudySpaceById)
  .put(protect, admin, studySpaceController.updateStudySpace)
  .delete(protect, admin, studySpaceController.deleteStudySpace);

router.route('/study-spaces/:id/status')
  .patch(protect, studySpaceController.updateStudySpaceStatus);

// Reservation Routes
router.route('/reservations')
  .get(protect, reservationController.getMyReservations)
  .post(protect, reservationController.createReservation);

router.route('/reservations/all')
  .get(protect, admin, reservationController.getAllReservations);

router.route('/reservations/:id')
  .get(protect, reservationController.getReservationById)
  .put(protect, reservationController.updateReservation)
  .delete(protect, reservationController.cancelReservation);

router.route('/reservations/:id/check-in')
  .patch(protect, reservationController.checkInReservation);

router.route('/reservations/:id/check-out')
  .patch(protect, reservationController.checkOutReservation);

// Search Routes
router.route('/search')
  .get(searchController.searchStudySpaces);

router.route('/search/available')
  .get(searchController.getAvailableStudySpaces);

router.route('/search/quick')
  .get(searchController.quickSearch);

router.route('/search/stats')
  .get(protect, admin, searchController.getStudySpaceStats);

// Room Status and IoT Routes
router.route('/rooms/:id/status')
  .get(roomStatusController.getRoomStatus)
  .put(roomStatusController.updateRoomStatusFromIoT);

router.route('/rooms/:id/iot/control')
  .post(protect, roomStatusController.controlRoomIoT);

router.route('/rooms/iot/health')
  .get(protect, admin, roomStatusController.checkIoTHealth);

module.exports = router;