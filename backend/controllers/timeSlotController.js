const TimeSlot = require('../models/TimeSlot');
const RestaurantInfo = require('../models/RestaurantInfo');
const { defaultRestaurantInfo } = require('./restaurantInfoController');

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;
const slotDurationMinutes = 120;

const toMinutes = (time) => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

const formatTime = (totalMinutes) => {
  const minutesInDay = 24 * 60;
  const normalizedMinutes = ((totalMinutes % minutesInDay) + minutesInDay) % minutesInDay;
  const hours = Math.floor(normalizedMinutes / 60);
  const minutes = normalizedMinutes % 60;

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

const toClockMinutes = (hourValue, minuteValue, meridiem) => {
  let hours = Number(hourValue);
  const minutes = Number(minuteValue || 0);

  if (meridiem) {
    const normalizedMeridiem = meridiem.toUpperCase();
    if (normalizedMeridiem === 'PM' && hours !== 12) {
      hours += 12;
    }
    if (normalizedMeridiem === 'AM' && hours === 12) {
      hours = 0;
    }
  }

  return hours * 60 + minutes;
};

const parseOpeningHoursLine = (line) => {
  const timeMatches = [...line.matchAll(/(\d{1,2})(?::([0-5]\d))?\s*(AM|PM)?/gi)];

  if (timeMatches.length < 2) {
    return null;
  }

  const [startMatch, endMatch] = timeMatches.slice(-2);
  const start = toClockMinutes(startMatch[1], startMatch[2], startMatch[3]);
  let end = toClockMinutes(endMatch[1], endMatch[2], endMatch[3]);

  if (end <= start) {
    end += 24 * 60;
  }

  return { start, end };
};

const getOpeningHourRanges = async () => {
  const restaurantInfo = await RestaurantInfo.findOne().lean();
  const openingHours = restaurantInfo?.openingHours?.length
    ? restaurantInfo.openingHours
    : defaultRestaurantInfo.openingHours;

  return openingHours.map(parseOpeningHoursLine).filter(Boolean);
};

const buildOpeningHourTimeSlots = (openingHourRanges) => {
  const slotsByTime = new Map();

  openingHourRanges.forEach((range) => {
    for (
      let start = range.start;
      start + slotDurationMinutes <= range.end;
      start += slotDurationMinutes
    ) {
      const slot = {
        startTime: formatTime(start),
        endTime: formatTime(start + slotDurationMinutes),
        isAvailable: true,
      };
      slotsByTime.set(`${slot.startTime}-${slot.endTime}`, slot);
    }
  });

  return [...slotsByTime.values()].sort((a, b) => a.startTime.localeCompare(b.startTime));
};

const ensureOpeningHourTimeSlots = async () => {
  const openingHourRanges = await getOpeningHourRanges();
  const generatedSlots = buildOpeningHourTimeSlots(openingHourRanges);

  if (!generatedSlots.length) {
    return;
  }

  const existingSlots = await TimeSlot.find();
  const existingSlotKeys = new Set(
    existingSlots.map((slot) => `${slot.startTime}-${slot.endTime}`)
  );
  const missingSlots = generatedSlots.filter(
    (slot) => !existingSlotKeys.has(`${slot.startTime}-${slot.endTime}`)
  );

  if (missingSlots.length) {
    await TimeSlot.insertMany(missingSlots);
  }
};

const normalizeTimeSlotPayload = (body) => ({
  startTime: body.startTime ? body.startTime.trim() : '',
  endTime: body.endTime ? body.endTime.trim() : '',
  isAvailable:
    typeof body.isAvailable === 'boolean'
      ? body.isAvailable
      : body.isAvailable !== 'false',
});

const validateTimeSlotPayload = ({ startTime, endTime }) => {
  if (!timePattern.test(startTime)) {
    return 'Start time must use HH:mm format';
  }

  if (!timePattern.test(endTime)) {
    return 'End time must use HH:mm format';
  }

  if (toMinutes(startTime) >= toMinutes(endTime)) {
    return 'End time must be after start time';
  }

  if (toMinutes(endTime) - toMinutes(startTime) !== slotDurationMinutes) {
    return 'Reservation slots must be exactly 2 hours long';
  }

  return '';
};

const validateTimeSlotWithinOpeningHours = async ({ startTime, endTime }) => {
  const openingHourRanges = await getOpeningHourRanges();

  if (!openingHourRanges.length) {
    return '';
  }

  const start = toMinutes(startTime);
  const end = toMinutes(endTime);
  const isWithinOpeningHours = openingHourRanges.some(
    (range) => start >= range.start && end <= range.end
  );

  return isWithinOpeningHours
    ? ''
    : 'Time slot must be within restaurant opening hours';
};

const hasConflict = async ({ startTime, endTime }, excludeId = null) => {
  const start = toMinutes(startTime);
  const end = toMinutes(endTime);
  const query = excludeId ? { _id: { $ne: excludeId } } : {};
  const slots = await TimeSlot.find(query);

  return slots.some((slot) => {
    const existingStart = toMinutes(slot.startTime);
    const existingEnd = toMinutes(slot.endTime);
    return start < existingEnd && end > existingStart;
  });
};

const getTimeSlots = async (req, res) => {
  try {
    await ensureOpeningHourTimeSlots();
    const timeSlots = await TimeSlot.find().sort({ startTime: 1 });
    return res.status(200).json(timeSlots);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getAvailableTimeSlots = async (req, res) => {
  try {
    await ensureOpeningHourTimeSlots();
    const timeSlots = await TimeSlot.find({ isAvailable: true }).sort({ startTime: 1 });
    return res.status(200).json(timeSlots);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const createTimeSlot = async (req, res) => {
  const payload = normalizeTimeSlotPayload(req.body);
  const validationMessage = validateTimeSlotPayload(payload);

  if (validationMessage) {
    return res.status(400).json({ message: validationMessage });
  }

  try {
    const openingHoursMessage = await validateTimeSlotWithinOpeningHours(payload);
    if (openingHoursMessage) {
      return res.status(400).json({ message: openingHoursMessage });
    }

    if (await hasConflict(payload)) {
      return res.status(400).json({ message: 'Time slot conflicts with an existing slot' });
    }

    const timeSlot = await TimeSlot.create(payload);
    return res.status(201).json(timeSlot);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const updateTimeSlot = async (req, res) => {
  const payload = normalizeTimeSlotPayload(req.body);
  const validationMessage = validateTimeSlotPayload(payload);

  if (validationMessage) {
    return res.status(400).json({ message: validationMessage });
  }

  try {
    const timeSlot = await TimeSlot.findById(req.params.id);

    if (!timeSlot) {
      return res.status(404).json({ message: 'Time slot not found' });
    }

    const openingHoursMessage = await validateTimeSlotWithinOpeningHours(payload);
    if (openingHoursMessage) {
      return res.status(400).json({ message: openingHoursMessage });
    }

    if (await hasConflict(payload, timeSlot._id)) {
      return res.status(400).json({ message: 'Time slot conflicts with an existing slot' });
    }

    timeSlot.startTime = payload.startTime;
    timeSlot.endTime = payload.endTime;
    timeSlot.isAvailable = payload.isAvailable;

    const updatedTimeSlot = await timeSlot.save();
    return res.status(200).json(updatedTimeSlot);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const deleteTimeSlot = async (req, res) => {
  try {
    const timeSlot = await TimeSlot.findById(req.params.id);

    if (!timeSlot) {
      return res.status(404).json({ message: 'Time slot not found' });
    }

    await timeSlot.deleteOne();
    return res.status(200).json({ message: 'Time slot deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createTimeSlot,
  deleteTimeSlot,
  buildOpeningHourTimeSlots,
  ensureOpeningHourTimeSlots,
  formatTime,
  getAvailableTimeSlots,
  getOpeningHourRanges,
  getTimeSlots,
  parseOpeningHoursLine,
  updateTimeSlot,
  validateTimeSlotWithinOpeningHours,
  validateTimeSlotPayload,
};
