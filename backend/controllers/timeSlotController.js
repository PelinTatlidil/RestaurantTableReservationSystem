const TimeSlot = require('../models/TimeSlot');

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

const toMinutes = (time) => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
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

  return '';
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
    const timeSlots = await TimeSlot.find().sort({ startTime: 1 });
    return res.status(200).json(timeSlots);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getAvailableTimeSlots = async (req, res) => {
  try {
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
  getAvailableTimeSlots,
  getTimeSlots,
  updateTimeSlot,
  validateTimeSlotPayload,
};
