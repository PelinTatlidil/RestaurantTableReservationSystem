const mongoose = require('mongoose');
const Reservation = require('../models/Reservation');
const ReservationStatusAudit = require('../models/ReservationStatusAudit');
const Table = require('../models/Table');
const TimeSlot = require('../models/TimeSlot');
const User = require('../models/User');

const reservationStatuses = ['Pending', 'Confirmed', 'Cancelled', 'Completed', 'No-show'];

const normalizeStatus = (status) => (status === 'Canceled' ? 'Cancelled' : status);

const normalizeReservationPayload = (body) => ({
  customerName: body.customerName ? body.customerName.trim() : '',
  customerEmail: body.customerEmail ? body.customerEmail.trim().toLowerCase() : '',
  customerPhone: body.customerPhone ? body.customerPhone.trim() : '',
  date: body.date ? body.date.trim() : '',
  timeSlot: body.timeSlot || '',
  table: body.table || '',
  guests: Number(body.guests),
  status: normalizeStatus(body.status || 'Pending'),
  tablePreference: body.tablePreference ? body.tablePreference.trim() : '',
  requests: body.requests ? body.requests.trim() : '',
});

const validateReservationPayload = ({
  customerName,
  customerEmail,
  customerPhone,
  date,
  timeSlot,
  table,
  guests,
  status,
}) => {
  if (!customerName) {
    return 'Customer name is required';
  }

  if (!customerEmail) {
    return 'Customer email is required';
  }

  if (!customerPhone) {
    return 'Customer phone is required';
  }

  if (!date) {
    return 'Reservation date is required';
  }

  if (!timeSlot) {
    return 'Time slot is required';
  }

  if (!mongoose.Types.ObjectId.isValid(timeSlot)) {
    return 'Selected time slot is invalid';
  }

  if (!table) {
    return 'Table is required';
  }

  if (!mongoose.Types.ObjectId.isValid(table)) {
    return 'Selected table is invalid';
  }

  if (!Number.isInteger(guests) || guests < 1) {
    return 'Guests must be a positive whole number';
  }

  if (!reservationStatuses.includes(status)) {
    return 'Reservation status is invalid';
  }

  return '';
};

const reservationErrorMessage = (error) => {
  if (error.name === 'ValidationError') {
    return Object.values(error.errors)
      .map((fieldError) => fieldError.message)
      .join(', ');
  }

  if (error.name === 'CastError') {
    return `Invalid ${error.path || 'reservation'} value`;
  }

  return error.message || 'Failed to save reservation';
};

const getAdminReservations = async (req, res) => {
  try {
    const reservations = await Reservation.find()
      .populate('customer', 'name email phone')
      .populate('timeSlot', 'startTime endTime')
      .populate('table', 'tableNumber capacity location isAvailable')
      .sort({ date: 1, createdAt: -1 });

    return res.status(200).json(reservations);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getCustomerReservations = async (req, res) => {
  try {
    const reservations = await Reservation.find({
      $or: [{ customer: req.user._id }, { customerEmail: req.user.email }],
    })
      .populate('timeSlot', 'startTime endTime')
      .populate('table', 'tableNumber capacity location')
      .sort({ date: -1, createdAt: -1 });

    return res.status(200).json(reservations);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const populateReservationById = (reservationId) =>
  Reservation.findById(reservationId)
    .populate('customer', 'name email phone')
    .populate('timeSlot', 'startTime endTime')
    .populate('table', 'tableNumber capacity location isAvailable');

const validateReservationAvailability = async (payload, excludeReservationId = null) => {
  const [timeSlot, table] = await Promise.all([
    TimeSlot.findById(payload.timeSlot),
    Table.findById(payload.table),
  ]);

  if (!timeSlot) {
    return { message: 'Time slot not found', statusCode: 404 };
  }

  if (!timeSlot.isAvailable) {
    return { message: 'Selected time slot is not available', statusCode: 400 };
  }

  if (!table) {
    return { message: 'Table not found', statusCode: 404 };
  }

  if (!table.isAvailable) {
    return { message: 'Selected table is not available', statusCode: 400 };
  }

  if (table.capacity < payload.guests) {
    return { message: 'Guest count exceeds selected table capacity', statusCode: 400 };
  }

  const reservationDate = new Date(`${payload.date}T00:00:00.000Z`);

  if (Number.isNaN(reservationDate.getTime())) {
    return { message: 'Reservation date is invalid', statusCode: 400 };
  }

  const conflictQuery = {
    date: reservationDate,
    timeSlot: payload.timeSlot,
    table: payload.table,
    status: { $in: ['Pending', 'Confirmed'] },
    isDeleted: { $ne: true },
  };

  if (excludeReservationId) {
    conflictQuery._id = { $ne: excludeReservationId };
  }

  const existingReservation = await Reservation.findOne(conflictQuery);

  if (existingReservation) {
    return { message: 'Selected table is already booked for this time', statusCode: 400 };
  }

  return { customerDate: reservationDate };
};

const reservationFieldsFromPayload = (payload, customer, reservationDate) => ({
  customer: customer?._id,
  customerName: customer?.name || payload.customerName,
  customerEmail: customer?.email || payload.customerEmail,
  customerPhone: customer?.phone || payload.customerPhone,
  date: reservationDate,
  timeSlot: payload.timeSlot,
  table: payload.table,
  guests: payload.guests,
  status: payload.status,
  tablePreference: payload.tablePreference,
  requests: payload.requests,
});

const createAdminReservation = async (req, res) => {
  const payload = normalizeReservationPayload(req.body);
  const validationMessage = validateReservationPayload(payload);

  if (validationMessage) {
    return res.status(400).json({ message: validationMessage });
  }

  try {
    const customer = await User.findOne({ email: payload.customerEmail, role: 'customer' });
    const availability = await validateReservationAvailability(payload);

    if (availability.message) {
      return res.status(availability.statusCode).json({ message: availability.message });
    }

    const reservation = await Reservation.create(
      reservationFieldsFromPayload(payload, customer, availability.customerDate)
    );
    const populatedReservation = await populateReservationById(reservation._id);

    return res.status(201).json(populatedReservation);
  } catch (error) {
    return res.status(500).json({ message: reservationErrorMessage(error) });
  }
};

const updateAdminReservation = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Reservation ID is invalid' });
  }

  const payload = normalizeReservationPayload(req.body);
  const validationMessage = validateReservationPayload(payload);

  if (validationMessage) {
    return res.status(400).json({ message: validationMessage });
  }

  try {
    const reservation = await Reservation.findById(req.params.id);

    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    const customer = await User.findOne({ email: payload.customerEmail, role: 'customer' });
    const availability = await validateReservationAvailability(payload, reservation._id);

    if (availability.message) {
      return res.status(availability.statusCode).json({ message: availability.message });
    }

    Object.assign(
      reservation,
      reservationFieldsFromPayload(payload, customer, availability.customerDate)
    );

    if (reservation.isDeleted) {
      reservation.isDeleted = false;
      reservation.recoveredAt = new Date();
      reservation.recoveredBy = req.user?._id;
    }

    const updatedReservation = await reservation.save();
    const populatedReservation = await populateReservationById(updatedReservation._id);

    return res.status(200).json(populatedReservation);
  } catch (error) {
    return res.status(500).json({ message: reservationErrorMessage(error) });
  }
};

const deleteAdminReservation = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Reservation ID is invalid' });
  }

  try {
    const reservation = await Reservation.findById(req.params.id);

    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    reservation.isDeleted = true;
    reservation.deletedAt = new Date();
    reservation.deletedBy = req.user?._id;
    reservation.recoveredAt = undefined;
    reservation.recoveredBy = undefined;

    const deletedReservation = await reservation.save();
    const populatedReservation = await populateReservationById(deletedReservation._id);

    return res.status(200).json({
      message: 'Reservation deleted successfully',
      reservation: populatedReservation,
    });
  } catch (error) {
    return res.status(500).json({ message: reservationErrorMessage(error) });
  }
};

const recoverAdminReservation = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Reservation ID is invalid' });
  }

  try {
    const reservation = await Reservation.findById(req.params.id);

    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    reservation.isDeleted = false;
    reservation.recoveredAt = new Date();
    reservation.recoveredBy = req.user?._id;

    const recoveredReservation = await reservation.save();
    const populatedReservation = await populateReservationById(recoveredReservation._id);

    return res.status(200).json({
      message: 'Reservation recovered successfully',
      reservation: populatedReservation,
    });
  } catch (error) {
    return res.status(500).json({ message: reservationErrorMessage(error) });
  }
};

const updateReservationStatus = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Reservation ID is invalid' });
  }

  const newStatus = normalizeStatus(req.body.status);

  if (!reservationStatuses.filter((status) => status !== 'Pending').includes(newStatus)) {
    return res.status(400).json({ message: 'Reservation status is invalid' });
  }

  try {
    const reservation = await Reservation.findById(req.params.id);

    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    const previousStatus = normalizeStatus(reservation.status);
    const notificationMessage = `Your reservation status has been updated to ${newStatus}.`;

    reservation.status = newStatus;
    reservation.customerNotification = {
      message: notificationMessage,
      updatedAt: new Date(),
    };

    await reservation.save();
    await ReservationStatusAudit.create({
      reservation: reservation._id,
      changedBy: req.user._id,
      previousStatus,
      newStatus,
      notificationMessage,
    });

    const populatedReservation = await populateReservationById(reservation._id);
    return res.status(200).json(populatedReservation);
  } catch (error) {
    return res.status(500).json({ message: reservationErrorMessage(error) });
  }
};

module.exports = {
  createAdminReservation,
  deleteAdminReservation,
  getAdminReservations,
  getCustomerReservations,
  recoverAdminReservation,
  updateAdminReservation,
  updateReservationStatus,
  validateReservationPayload,
};
