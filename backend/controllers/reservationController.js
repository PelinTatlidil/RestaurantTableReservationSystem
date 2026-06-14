const mongoose = require('mongoose');
const Reservation = require('../models/Reservation');
const ReservationSubject = require('../observers/ReservationSubject');
const CustomerNotificationObserver = require('../observers/CustomerNotificationObserver');
const ReservationAuditObserver = require('../observers/ReservationAuditObserver');
const Table = require('../models/Table');
const TimeSlot = require('../models/TimeSlot');
const User = require('../models/User');
const BaseController = require('./BaseController');
const {
  LargestCapacityStrategy,
  SmallestCapacityStrategy,
} = require('./TableSelectionStrategy');

const reservationSubject = new ReservationSubject();

reservationSubject.addObserver(new CustomerNotificationObserver());
reservationSubject.addObserver(new ReservationAuditObserver());

const reservationStatuses = ['Pending', 'Confirmed', 'Cancelled', 'Completed', 'No-show'];
const activeBookingStatuses = ['Pending', 'Confirmed'];

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
    const reservations = await Reservation.find({ isDeleted: { $ne: true } })
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
      customer: req.user._id,
      isDeleted: { $ne: true },
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

const normalizeCustomerReservationPayload = (body) => ({
  date: body.date ? body.date.trim() : '',
  timeSlot: body.timeSlot || body.timeSlotId || '',
  guests: Number(body.guests),
  tablePreference: body.tablePreference ? body.tablePreference.trim() : '',
  requests: body.requests ? body.requests.trim() : '',
});

const validateCustomerReservationPayload = ({ date, timeSlot, guests }) => {
  if (!date) {
    return 'Reservation date is required';
  }

  if (!timeSlot) {
    return 'Time slot is required';
  }

  if (!mongoose.Types.ObjectId.isValid(timeSlot)) {
    return 'Selected time slot is invalid';
  }

  if (!Number.isInteger(guests) || guests < 1) {
    return 'Guests must be a positive whole number';
  }

  return '';
};

const checkReservationAvailability = async ({ date, timeSlot, guests, excludeReservationId = null }) => {
  const candidateTables = await Table.find({
    isAvailable: true,
    capacity: { $gte: guests },
  }).sort({ capacity: 1, tableNumber: 1 });

  if (!candidateTables.length) {
    return {
      available: false,
      message: 'No tables have enough capacity for this guest count',
      table: null,
    };
  }

  const bookedReservationQuery = {
    date,
    timeSlot,
    table: { $in: candidateTables.map((table) => table._id) },
    status: { $in: activeBookingStatuses },
    isDeleted: { $ne: true },
  };

  if (excludeReservationId) {
    bookedReservationQuery._id = { $ne: excludeReservationId };
  }

  const bookedReservations = await Reservation.find(bookedReservationQuery).select('table status');

  const bookedTableIds = new Set(
    bookedReservations.map((reservation) => String(reservation.table))
  );

  // Polymorphism example:
  // both strategy classes implement the same `select()` method,
  // so the controller can swap behavior without changing the API.
  const selectionStrategy =
    process.env.TABLE_SELECTION_STRATEGY === 'largest'
      ? new LargestCapacityStrategy()
      : new SmallestCapacityStrategy();

  const table = selectionStrategy.select(candidateTables, bookedTableIds);

  if (!table) {
    return {
      available: false,
      message: 'No tables are available for this date, time, and guest count',
      table: null,
    };
  }

  return {
    available: true,
    message: 'A table is available for this reservation',
    table,
  };
};

const findSuitableAvailableTable = async ({ date, timeSlot, guests, excludeReservationId = null }) => {
  const availability = await checkReservationAvailability({
    date,
    timeSlot,
    guests,
    excludeReservationId,
  });

  return availability.table;
};

const checkCustomerReservationAvailability = async (req, res) => {
  const payload = normalizeCustomerReservationPayload(req.query);
  const validationMessage = validateCustomerReservationPayload(payload);

  if (validationMessage) {
    return res.status(400).json({ available: false, message: validationMessage });
  }

  try {
    const timeSlot = await TimeSlot.findById(payload.timeSlot);

    if (!timeSlot) {
      return res.status(404).json({ available: false, message: 'Time slot not found' });
    }

    if (!timeSlot.isAvailable) {
      return res.status(200).json({
        available: false,
        message: 'Selected time slot is not available',
      });
    }

    const reservationDate = new Date(`${payload.date}T00:00:00.000Z`);

    if (Number.isNaN(reservationDate.getTime())) {
      return res.status(400).json({ available: false, message: 'Reservation date is invalid' });
    }

    const availability = await checkReservationAvailability({
      date: reservationDate,
      timeSlot: payload.timeSlot,
      guests: payload.guests,
    });

    return res.status(200).json({
      available: availability.available,
      message: availability.message,
      table: availability.table
        ? {
            _id: availability.table._id,
            tableNumber: availability.table.tableNumber,
            capacity: availability.table.capacity,
            location: availability.table.location,
          }
        : null,
    });
  } catch (error) {
    return res.status(500).json({ available: false, message: reservationErrorMessage(error) });
  }
};

const createCustomerReservation = async (req, res) => {
  const payload = normalizeCustomerReservationPayload(req.body);
  const validationMessage = validateCustomerReservationPayload(payload);

  if (validationMessage) {
    return res.status(400).json({ message: validationMessage });
  }

  try {
    const timeSlot = await TimeSlot.findById(payload.timeSlot);

    if (!timeSlot) {
      return res.status(404).json({ message: 'Time slot not found' });
    }

    if (!timeSlot.isAvailable) {
      return res.status(400).json({ message: 'Selected time slot is not available' });
    }

    const reservationDate = new Date(`${payload.date}T00:00:00.000Z`);

    if (Number.isNaN(reservationDate.getTime())) {
      return res.status(400).json({ message: 'Reservation date is invalid' });
    }

    const table = await findSuitableAvailableTable({
      date: reservationDate,
      timeSlot: payload.timeSlot,
      guests: payload.guests,
    });

    if (!table) {
      return res.status(400).json({
        message: 'No tables are available for this date, time, and guest count',
      });
    }

    const reservation = await Reservation.create({
      customer: req.user._id,
      customerName: req.user.name,
      customerEmail: req.user.email,
      customerPhone: req.user.phone,
      date: reservationDate,
      timeSlot: payload.timeSlot,
      table: table._id,
      guests: payload.guests,
      status: 'Confirmed',
      tablePreference: payload.tablePreference,
      requests: payload.requests,
    });
    const populatedReservation = await populateReservationById(reservation._id);

    return res.status(201).json({
      message: 'Reservation confirmed successfully',
      reservation: populatedReservation,
    });
  } catch (error) {
    return res.status(500).json({ message: reservationErrorMessage(error) });
  }
};

const updateCustomerReservation = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Reservation ID is invalid' });
  }

  const payload = normalizeCustomerReservationPayload(req.body);
  const validationMessage = validateCustomerReservationPayload(payload);

  if (validationMessage) {
    return res.status(400).json({ message: validationMessage });
  }

  try {
    const reservation = await Reservation.findById(req.params.id);

    if (!reservation || reservation.isDeleted) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    if (String(reservation.customer) !== String(req.user._id)) {
      return res.status(403).json({ message: 'You can only update your own reservations' });
    }

    const timeSlot = await TimeSlot.findById(payload.timeSlot);

    if (!timeSlot) {
      return res.status(404).json({ message: 'Time slot not found' });
    }

    if (!timeSlot.isAvailable) {
      return res.status(400).json({ message: 'Selected time slot is not available' });
    }

    const reservationDate = new Date(`${payload.date}T00:00:00.000Z`);

    if (Number.isNaN(reservationDate.getTime())) {
      return res.status(400).json({ message: 'Reservation date is invalid' });
    }

    const table = await findSuitableAvailableTable({
      date: reservationDate,
      timeSlot: payload.timeSlot,
      guests: payload.guests,
      excludeReservationId: reservation._id,
    });

    if (!table) {
      return res.status(400).json({
        message: 'No tables are available for this date, time, and guest count',
      });
    }

    reservation.date = reservationDate;
    reservation.timeSlot = payload.timeSlot;
    reservation.table = table._id;
    reservation.guests = payload.guests;
    reservation.status = 'Confirmed';
    reservation.tablePreference = payload.tablePreference;
    reservation.requests = payload.requests;
    reservation.customerNotification = {
      message: 'Your reservation has been updated successfully.',
      updatedAt: new Date(),
    };

    const updatedReservation = await reservation.save();
    const populatedReservation = await populateReservationById(updatedReservation._id);

    return res.status(200).json({
      message: 'Reservation updated successfully',
      reservation: populatedReservation,
    });
  } catch (error) {
    return res.status(500).json({ message: reservationErrorMessage(error) });
  }
};

const cancelCustomerReservation = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Reservation ID is invalid' });
  }

  try {
    const reservation = await Reservation.findById(req.params.id);

    if (!reservation || reservation.isDeleted) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    if (String(reservation.customer) !== String(req.user._id)) {
      return res.status(403).json({ message: 'You can only cancel your own reservations' });
    }

    reservation.status = 'Cancelled';
    reservation.customerNotification = {
      message: 'Your reservation has been cancelled.',
      updatedAt: new Date(),
    };

    const cancelledReservation = await reservation.save();
    const populatedReservation = await populateReservationById(cancelledReservation._id);

    return res.status(200).json({
      message: 'Reservation cancelled successfully',
      reservation: populatedReservation,
    });
  } catch (error) {
    return res.status(500).json({ message: reservationErrorMessage(error) });
  }
};

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

    if (!reservation || reservation.isDeleted) {
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

    await reservation.deleteOne();

    return res.status(200).json({
      message: 'Reservation deleted successfully',
      reservationId: req.params.id,
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

    await reservationSubject.notifyObservers({
      reservation,
      previousStatus,
      newStatus,
      changedBy: req.user._id,
      notificationMessage,
    });

    await reservation.save();

    const populatedReservation = await populateReservationById(reservation._id);
    return res.status(200).json(populatedReservation);
  } catch (error) {
    return res.status(500).json({ message: reservationErrorMessage(error) });
  }
};

class ReservationController extends BaseController {
  async getAdminReservations(req, res) {
    try {
      const reservations = await Reservation.find({ isDeleted: { $ne: true } })
        .populate('customer', 'name email phone')
        .populate('timeSlot', 'startTime endTime')
        .populate('table', 'tableNumber capacity location isAvailable')
        .sort({ date: 1, createdAt: -1 });

      return this.sendSuccess(res, reservations);
    } catch (error) {
      return this.handleServerError(res, error);
    }
  }
}

const reservationController = new ReservationController();

Object.assign(reservationController, {
  getAdminReservations: reservationController.getAdminReservations.bind(reservationController),
  cancelCustomerReservation,
  checkCustomerReservationAvailability,
  checkReservationAvailability,
  createAdminReservation,
  createCustomerReservation,
  deleteAdminReservation,
  findSuitableAvailableTable,
  getCustomerReservations,
  updateAdminReservation,
  updateCustomerReservation,
  updateReservationStatus,
  validateCustomerReservationPayload,
  validateReservationPayload,
});

module.exports = reservationController;
