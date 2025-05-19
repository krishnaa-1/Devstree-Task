const express = require('express');
const { addAvailability, getAvailability, bookSlot } = require('../controllers/availabilityController');
const protect = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/availability', protect('User'), addAvailability);
router.get('/availability/:date', protect('Admin'), getAvailability);
router.post('/availability/book', protect('Admin'), bookSlot);

module.exports = router;
