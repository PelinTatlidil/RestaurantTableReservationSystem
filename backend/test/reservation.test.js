const { expect } = require('chai');
const sinon = require('sinon');
const Reservation = require('../models/Reservation');
const ReservationStatusAudit = require('../models/ReservationStatusAudit');
const Table = require('../models/Table');
const TimeSlot = require('../models/TimeSlot');
const User = require('../models/User');
const {
  createAdminReservation,
  deleteAdminReservation,
  getAdminReservations,
  getCustomerReservations,
  updateAdminReservation,
  updateReservationStatus,
  recoverAdminReservation,
} = require('../controllers/reservationController');

const createResponse = () => {
  const res = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };

  return res;
};

describe('Admin reservation management', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('retrieves all reservations with customer and time slot details', async () => {
    const reservations = [
      {
        _id: 'reservation-id',
        customer: { name: 'Pelin Tatlidil', email: 'pelin@example.com' },
        date: new Date('2026-05-31'),
        timeSlot: { startTime: '18:00', endTime: '19:00' },
        table: { tableNumber: 3, capacity: 4, location: 'Window' },
        guests: 4,
        status: 'Confirmed',
      },
    ];
    const sort = sinon.stub().resolves(reservations);
    const thirdPopulate = sinon.stub().returns({ sort });
    const secondPopulate = sinon.stub().returns({ populate: thirdPopulate });
    const firstPopulate = sinon.stub().returns({ populate: secondPopulate });
    sinon.stub(Reservation, 'find').returns({ populate: firstPopulate });
    const res = createResponse();

    await getAdminReservations({}, res);

    expect(Reservation.find.calledOnce).to.equal(true);
    expect(firstPopulate.calledWith('customer', 'name email phone')).to.equal(true);
    expect(secondPopulate.calledWith('timeSlot', 'startTime endTime')).to.equal(true);
    expect(thirdPopulate.calledWith('table', 'tableNumber capacity location isAvailable')).to.equal(true);
    expect(sort.calledWith({ date: 1, createdAt: -1 })).to.equal(true);
    expect(res.statusCode).to.equal(200);
    expect(res.body).to.deep.equal(reservations);
  });

  it('creates a reservation for an existing customer with a valid table and time slot', async () => {
    const customer = { _id: 'customer-id', email: 'customer@example.com', role: 'customer' };
    const timeSlot = { _id: '507f1f77bcf86cd799439011', startTime: '18:00', endTime: '19:00', isAvailable: true };
    const table = { _id: '507f1f77bcf86cd799439012', tableNumber: 2, capacity: 4, location: 'Indoor', isAvailable: true };
    const createdReservation = { _id: 'reservation-id' };
    const populatedReservation = {
      _id: 'reservation-id',
      customer,
      timeSlot,
      table,
      guests: 3,
      status: 'Confirmed',
    };
    const finalPopulate = sinon.stub().resolves(populatedReservation);
    const secondPopulate = sinon.stub().returns({ populate: finalPopulate });
    const firstPopulate = sinon.stub().returns({ populate: secondPopulate });

    sinon.stub(User, 'findOne').resolves(customer);
    sinon.stub(TimeSlot, 'findById').resolves(timeSlot);
    sinon.stub(Table, 'findById').resolves(table);
    sinon.stub(Reservation, 'findOne').resolves(null);
    sinon.stub(Reservation, 'create').resolves(createdReservation);
    sinon.stub(Reservation, 'findById').returns({ populate: firstPopulate });

    const req = {
      body: {
        customerName: 'Customer A',
        customerEmail: 'customer@example.com',
        customerPhone: '0400123456',
        date: '2026-05-31',
        timeSlot: '507f1f77bcf86cd799439011',
        table: '507f1f77bcf86cd799439012',
        guests: 3,
        status: 'Confirmed',
      },
    };
    const res = createResponse();

    await createAdminReservation(req, res);

    expect(User.findOne.calledWith({ email: 'customer@example.com', role: 'customer' })).to.equal(true);
    expect(Reservation.create.calledOnce).to.equal(true);
    expect(res.statusCode).to.equal(201);
    expect(res.body).to.deep.equal(populatedReservation);
  });

  it('creates a reservation for an unregistered customer using entered contact details', async () => {
    const timeSlot = { _id: '507f1f77bcf86cd799439011', startTime: '18:00', endTime: '19:00', isAvailable: true };
    const table = { _id: '507f1f77bcf86cd799439012', tableNumber: 2, capacity: 4, location: 'Indoor', isAvailable: true };
    const createdReservation = { _id: 'reservation-id' };
    const populatedReservation = {
      _id: 'reservation-id',
      customerName: 'Walk In Customer',
      customerEmail: 'walkin@example.com',
      customerPhone: '0400111222',
      timeSlot,
      table,
      guests: 2,
      status: 'Pending',
    };
    const finalPopulate = sinon.stub().resolves(populatedReservation);
    const secondPopulate = sinon.stub().returns({ populate: finalPopulate });
    const firstPopulate = sinon.stub().returns({ populate: secondPopulate });

    sinon.stub(User, 'findOne').resolves(null);
    sinon.stub(TimeSlot, 'findById').resolves(timeSlot);
    sinon.stub(Table, 'findById').resolves(table);
    sinon.stub(Reservation, 'findOne').resolves(null);
    sinon.stub(Reservation, 'create').resolves(createdReservation);
    sinon.stub(Reservation, 'findById').returns({ populate: firstPopulate });

    const req = {
      body: {
        customerName: 'Walk In Customer',
        customerEmail: 'walkin@example.com',
        customerPhone: '0400111222',
        date: '2026-05-31',
        timeSlot: '507f1f77bcf86cd799439011',
        table: '507f1f77bcf86cd799439012',
        guests: 2,
      },
    };
    const res = createResponse();

    await createAdminReservation(req, res);

    expect(Reservation.create.firstCall.args[0].customer).to.equal(undefined);
    expect(Reservation.create.firstCall.args[0].customerName).to.equal('Walk In Customer');
    expect(res.statusCode).to.equal(201);
    expect(res.body).to.deep.equal(populatedReservation);
  });

  it('rejects reservations that exceed table capacity', async () => {
    sinon.stub(User, 'findOne').resolves({ _id: 'customer-id', role: 'customer' });
    sinon.stub(TimeSlot, 'findById').resolves({ _id: '507f1f77bcf86cd799439011', isAvailable: true });
    sinon.stub(Table, 'findById').resolves({
      _id: '507f1f77bcf86cd799439012',
      capacity: 2,
      isAvailable: true,
    });

    const req = {
      body: {
        customerEmail: 'customer@example.com',
        customerName: 'Customer A',
        customerPhone: '0400123456',
        date: '2026-05-31',
        timeSlot: '507f1f77bcf86cd799439011',
        table: '507f1f77bcf86cd799439012',
        guests: 4,
      },
    };
    const res = createResponse();

    await createAdminReservation(req, res);

    expect(res.statusCode).to.equal(400);
    expect(res.body.message).to.equal('Guest count exceeds selected table capacity');
  });

  it('rejects reservations when the selected time slot is unavailable', async () => {
    sinon.stub(User, 'findOne').resolves({ _id: 'customer-id', role: 'customer' });
    sinon.stub(TimeSlot, 'findById').resolves({ _id: '507f1f77bcf86cd799439011', isAvailable: false });
    sinon.stub(Table, 'findById').resolves({ _id: '507f1f77bcf86cd799439012', capacity: 4, isAvailable: true });

    const req = {
      body: {
        customerEmail: 'customer@example.com',
        customerName: 'Customer A',
        customerPhone: '0400123456',
        date: '2026-05-31',
        timeSlot: '507f1f77bcf86cd799439011',
        table: '507f1f77bcf86cd799439012',
        guests: 2,
      },
    };
    const res = createResponse();

    await createAdminReservation(req, res);

    expect(res.statusCode).to.equal(400);
    expect(res.body.message).to.equal('Selected time slot is not available');
  });

  it('updates an existing reservation with valid details', async () => {
    const reservationId = '507f1f77bcf86cd799439013';
    const reservation = {
      _id: reservationId,
      save: sinon.stub().resolves({ _id: reservationId }),
    };
    const customer = { _id: 'customer-id', email: 'customer@example.com', role: 'customer' };
    const timeSlot = { _id: '507f1f77bcf86cd799439011', isAvailable: true };
    const table = { _id: '507f1f77bcf86cd799439012', capacity: 6, isAvailable: true };
    const populatedReservation = {
      _id: reservationId,
      customer,
      timeSlot,
      table,
      guests: 5,
      status: 'Confirmed',
    };
    const finalPopulate = sinon.stub().resolves(populatedReservation);
    const secondPopulate = sinon.stub().returns({ populate: finalPopulate });
    const firstPopulate = sinon.stub().returns({ populate: secondPopulate });
    const findById = sinon.stub(Reservation, 'findById');
    findById.onFirstCall().resolves(reservation);
    findById.onSecondCall().returns({ populate: firstPopulate });

    sinon.stub(User, 'findOne').resolves(customer);
    sinon.stub(TimeSlot, 'findById').resolves(timeSlot);
    sinon.stub(Table, 'findById').resolves(table);
    sinon.stub(Reservation, 'findOne').resolves(null);

    const req = {
      params: { id: reservationId },
      body: {
        customerName: 'Customer A',
        customerEmail: 'customer@example.com',
        customerPhone: '0400123456',
        date: '2026-05-31',
        timeSlot: '507f1f77bcf86cd799439011',
        table: '507f1f77bcf86cd799439012',
        guests: 5,
        status: 'Confirmed',
      },
    };
    const res = createResponse();

    await updateAdminReservation(req, res);

    expect(Reservation.findOne.firstCall.args[0]._id).to.deep.equal({ $ne: reservationId });
    expect(reservation.guests).to.equal(5);
    expect(reservation.save.calledOnce).to.equal(true);
    expect(res.statusCode).to.equal(200);
    expect(res.body).to.deep.equal(populatedReservation);
  });

  it('moves a soft deleted reservation back to active when it is updated', async () => {
    const reservationId = '507f1f77bcf86cd799439013';
    const reservation = {
      _id: reservationId,
      isDeleted: true,
      save: sinon.stub().resolves({ _id: reservationId }),
    };
    const customer = { _id: 'customer-id', email: 'customer@example.com', role: 'customer' };
    const timeSlot = { _id: '507f1f77bcf86cd799439011', isAvailable: true };
    const table = { _id: '507f1f77bcf86cd799439012', capacity: 6, isAvailable: true };
    const populatedReservation = {
      _id: reservationId,
      customer,
      timeSlot,
      table,
      guests: 4,
      status: 'Confirmed',
      isDeleted: false,
    };
    const finalPopulate = sinon.stub().resolves(populatedReservation);
    const secondPopulate = sinon.stub().returns({ populate: finalPopulate });
    const firstPopulate = sinon.stub().returns({ populate: secondPopulate });
    const findById = sinon.stub(Reservation, 'findById');
    findById.onFirstCall().resolves(reservation);
    findById.onSecondCall().returns({ populate: firstPopulate });

    sinon.stub(User, 'findOne').resolves(customer);
    sinon.stub(TimeSlot, 'findById').resolves(timeSlot);
    sinon.stub(Table, 'findById').resolves(table);
    sinon.stub(Reservation, 'findOne').resolves(null);

    const req = {
      params: { id: reservationId },
      user: { _id: '507f1f77bcf86cd799439014' },
      body: {
        customerName: 'Customer A',
        customerEmail: 'customer@example.com',
        customerPhone: '0400123456',
        date: '2026-05-31',
        timeSlot: '507f1f77bcf86cd799439011',
        table: '507f1f77bcf86cd799439012',
        guests: 4,
        status: 'Confirmed',
      },
    };
    const res = createResponse();

    await updateAdminReservation(req, res);

    expect(reservation.isDeleted).to.equal(false);
    expect(reservation.recoveredBy).to.equal(req.user._id);
    expect(reservation.save.calledOnce).to.equal(true);
    expect(res.statusCode).to.equal(200);
    expect(res.body).to.deep.equal(populatedReservation);
  });

  it('soft deletes an existing reservation', async () => {
    const reservation = {
      _id: '507f1f77bcf86cd799439013',
      save: sinon.stub().resolves({ _id: '507f1f77bcf86cd799439013' }),
    };
    const populatedReservation = { _id: reservation._id, isDeleted: true };
    const finalPopulate = sinon.stub().resolves(populatedReservation);
    const secondPopulate = sinon.stub().returns({ populate: finalPopulate });
    const firstPopulate = sinon.stub().returns({ populate: secondPopulate });
    const findById = sinon.stub(Reservation, 'findById');
    findById.onFirstCall().resolves(reservation);
    findById.onSecondCall().returns({ populate: firstPopulate });

    const req = {
      params: { id: '507f1f77bcf86cd799439013' },
      user: { _id: '507f1f77bcf86cd799439014' },
    };
    const res = createResponse();

    await deleteAdminReservation(req, res);

    expect(reservation.isDeleted).to.equal(true);
    expect(reservation.deletedBy).to.equal(req.user._id);
    expect(reservation.save.calledOnce).to.equal(true);
    expect(res.statusCode).to.equal(200);
    expect(res.body.message).to.equal('Reservation deleted successfully');
    expect(res.body.reservation).to.deep.equal(populatedReservation);
  });

  it('recovers a soft deleted reservation', async () => {
    const reservation = {
      _id: '507f1f77bcf86cd799439013',
      isDeleted: true,
      save: sinon.stub().resolves({ _id: '507f1f77bcf86cd799439013' }),
    };
    const populatedReservation = { _id: reservation._id, isDeleted: false };
    const finalPopulate = sinon.stub().resolves(populatedReservation);
    const secondPopulate = sinon.stub().returns({ populate: finalPopulate });
    const firstPopulate = sinon.stub().returns({ populate: secondPopulate });
    const findById = sinon.stub(Reservation, 'findById');
    findById.onFirstCall().resolves(reservation);
    findById.onSecondCall().returns({ populate: firstPopulate });

    const req = {
      params: { id: '507f1f77bcf86cd799439013' },
      user: { _id: '507f1f77bcf86cd799439014' },
    };
    const res = createResponse();

    await recoverAdminReservation(req, res);

    expect(reservation.isDeleted).to.equal(false);
    expect(reservation.recoveredBy).to.equal(req.user._id);
    expect(reservation.save.calledOnce).to.equal(true);
    expect(res.statusCode).to.equal(200);
    expect(res.body.message).to.equal('Reservation recovered successfully');
    expect(res.body.reservation).to.deep.equal(populatedReservation);
  });

  ['Confirmed', 'Cancelled', 'Completed', 'No-show'].forEach((status) => {
    it(`updates reservation status to ${status} and creates an audit log`, async () => {
      const reservation = {
        _id: '507f1f77bcf86cd799439013',
        status: 'Pending',
        save: sinon.stub().resolves(),
      };
      const populatedReservation = {
        _id: reservation._id,
        status,
      };
      const finalPopulate = sinon.stub().resolves(populatedReservation);
      const secondPopulate = sinon.stub().returns({ populate: finalPopulate });
      const firstPopulate = sinon.stub().returns({ populate: secondPopulate });
      const findById = sinon.stub(Reservation, 'findById');
      findById.onFirstCall().resolves(reservation);
      findById.onSecondCall().returns({ populate: firstPopulate });
      sinon.stub(ReservationStatusAudit, 'create').resolves({});

      const req = {
        params: { id: reservation._id },
        body: { status },
        user: { _id: '507f1f77bcf86cd799439014' },
      };
      const res = createResponse();

      await updateReservationStatus(req, res);

      expect(reservation.status).to.equal(status);
      expect(reservation.customerNotification.message).to.equal(
        `Your reservation status has been updated to ${status}.`
      );
      expect(ReservationStatusAudit.create.calledOnce).to.equal(true);
      expect(ReservationStatusAudit.create.firstCall.args[0].newStatus).to.equal(status);
      expect(res.statusCode).to.equal(200);
      expect(res.body).to.deep.equal(populatedReservation);
    });
  });

  it('retrieves customer reservations by user id or email', async () => {
    const reservations = [{ _id: 'reservation-id', status: 'Completed' }];
    const sort = sinon.stub().resolves(reservations);
    const secondPopulate = sinon.stub().returns({ sort });
    const firstPopulate = sinon.stub().returns({ populate: secondPopulate });
    sinon.stub(Reservation, 'find').returns({ populate: firstPopulate });
    const req = {
      user: {
        _id: '507f1f77bcf86cd799439014',
        email: 'customer@example.com',
      },
    };
    const res = createResponse();

    await getCustomerReservations(req, res);

    expect(Reservation.find.calledWith({
      $or: [{ customer: req.user._id }, { customerEmail: req.user.email }],
    })).to.equal(true);
    expect(res.statusCode).to.equal(200);
    expect(res.body).to.deep.equal(reservations);
  });
});
