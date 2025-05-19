const Availability = require('../models/availabilityModel');

const Slot = require('../models/slotSchema');

const convertToMinutes = (time) => {
    const [timePart, modifier] = time.split(' ');
    let [hours, minutes] = timePart.split(':').map(Number);
    if (modifier.toUpperCase() === 'PM' && hours !== 12) hours += 12;
    if (modifier.toUpperCase() === 'AM' && hours === 12) hours = 0;
    return hours * 60 + minutes;
};

const convertTo12Hour = (minutes) => {
    const hours24 = Math.floor(minutes / 60);
    const minutesPart = minutes % 60;
    const modifier = hours24 >= 12 ? 'PM' : 'AM';
    const hours12 = hours24 % 12 || 12;
    return `${hours12}:${minutesPart.toString().padStart(2, '0')} ${modifier}`;
};

const addAvailability = async (req, res) => {
    try {
        const { date, startTime, endTime } = req.body;
        const userId = req.user.id;

        // Validate date is not in past
        if (new Date(date).setHours(0, 0, 0, 0) < new Date().setHours(0, 0, 0, 0)) {
            return res.status(400).json({ error: 'Date cannot be in the past.' });
        }

        // Validate startTime < endTime
        const startMinutes = convertToMinutes(startTime);
        const endMinutes = convertToMinutes(endTime);
        if (startMinutes >= endMinutes) {
            return res.status(400).json({ error: 'Start time must be earlier than end time.' });
        }

        // Create Availability document
        const availability = new Availability({ userId, date, startTime, endTime });
        await availability.save();

        // Generate 30-minute slots
        let current = startMinutes;
        const slots = [];

        while (current + 30 <= endMinutes) {
            const slotStart = convertTo12Hour(current);
            const slotEnd = convertTo12Hour(current + 30);
            slots.push({
                availabilityId: availability._id,
                date,
                startTime: slotStart,
                endTime: slotEnd,
                status: 'Available',
                userId : userId
            });
            current += 30;
        }

        await Slot.insertMany(slots);

        return res.status(201).json({
            message: 'Availability and slots created successfully.',
            availability,
            slots
        });
    } catch (error) {
        console.error('Error adding availability:', error.message || error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
const getAvailability = async (req, res) => {
  try {
    const { date } = req.params;

    // Validate date format (basic)
    if (!date || isNaN(new Date(date).getTime())) {
      return res.status(400).json({ error: 'Invalid date parameter.' });
    }


    const slots = await Slot.find({ date: new Date(date), status: 'Available' })
      .populate({
        path: 'availabilityId',
        select: 'userId',
        populate: {
          path: 'userId',
          select: 'username',
        },
      });

    if (!slots.length) {
      return res.status(404).json({ message: 'No available slots found for this date.' });
    }

    // Helper function to convert "9:45 AM" -> minutes since midnight (int)
    const parseTime = (timeStr) => {
      const [time, modifier] = timeStr.split(' ');
      let [hours, minutes] = time.split(':').map(Number);
      if (modifier === 'PM' && hours !== 12) hours += 12;
      if (modifier === 'AM' && hours === 12) hours = 0;
      return hours * 60 + minutes;
    };

    // Sort slots array by startTime ascending
    slots.sort((a, b) => parseTime(a.startTime) - parseTime(b.startTime));

    return res.status(200).json({ date, slots });
  } catch (error) {
    console.error('Error fetching availability:', error.message || error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};


const bookSlot = async (req, res) => {
  try {
    const { date, startTime, userId } = req.body;

    // Validate input
    if (!date || !startTime || !userId) {
      return res.status(400).json({ error: 'Date, startTime, and userId are required.' });
    }

    // Find the slot for the specified user (must be Available)
    const slotToBook = await Slot.findOne({
      date: new Date(date),
      startTime,
      userId,
      status: 'Available'
    });

    if (!slotToBook) {
      return res.status(404).json({ error: 'Slot not available for booking.' });
    }

    // Mark the slot as Booked
    slotToBook.status = 'Booked';
    await slotToBook.save();

    const startMinutes = convertToMinutes(startTime);

    // Calculate adjacent times
    const beforeStartTime = convertTo12Hour(startMinutes - 30);
    const afterStartTime = convertTo12Hour(startMinutes + 30);

    // Mark adjacent slots for the **same user** as Unavailable
    await Slot.updateMany({
      date: new Date(date),
      userId,
      startTime: { $in: [beforeStartTime, afterStartTime] },
      status: 'Available'
    }, { status: 'Unavailable' });

    return res.status(200).json({ message: 'Slot booked successfully.', slot: slotToBook });
  } catch (error) {
    console.error('Error booking slot:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { addAvailability, getAvailability, bookSlot };
