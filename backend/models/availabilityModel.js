const mongoose = require('mongoose');

// Reuse the convertToMinutes utility here for validation inside schema
const convertToMinutes = (time) => {
    const [timePart, modifier] = time.split(' ');
    let [hours, minutes] = timePart.split(':').map(Number);
    if (modifier.toUpperCase() === 'PM' && hours !== 12) hours += 12;
    if (modifier.toUpperCase() === 'AM' && hours === 12) hours = 0;
    return hours * 60 + minutes;
};

const availabilitySchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true },
    startTime: {
        type: String,
        required: true,
        match: /^(0?[1-9]|1[0-2]):([0-5]\d) (AM|PM)$/i
    },
    endTime: {
        type: String,
        required: true,
        match: /^(0?[1-9]|1[0-2]):([0-5]\d) (AM|PM)$/i
    },
    status: { type: String, enum: ['Available', 'Booked', 'Unavailable'], default: 'Available' }
}, { timestamps: true });

// Ensure consistent AM/PM format and validate time range
availabilitySchema.pre('save', function (next) {
    this.startTime = this.startTime.toUpperCase().trim().replace(/\s+/g, ' ');
    this.endTime = this.endTime.toUpperCase().trim().replace(/\s+/g, ' ');

    if (convertToMinutes(this.startTime) >= convertToMinutes(this.endTime)) {
        return next(new Error('Start time must be earlier than end time.'));
    }
    next();
});

module.exports = mongoose.model('Availability', availabilitySchema);
