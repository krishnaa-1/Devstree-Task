const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema({
    availabilityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Availability', required: true },
    date: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    status: { type: String, enum: ['Available', 'Booked'], default: 'Available' },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
}, { timestamps: true });

module.exports = mongoose.model('Slot', slotSchema);
