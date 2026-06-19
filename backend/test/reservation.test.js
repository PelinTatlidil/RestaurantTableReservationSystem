const { expect } = require('chai');
const sinon = require('sinon');
const Reservation = require('../models/Reservation');
const ReservationStatusAudit = require('../models/ReservationStatusAudit');
const Table = require('../models/Table');
const TimeSlot = require('../models/TimeSlot');
const User = require('../models/User');
const {
  checkCustomerReservationAvailability,
  cancelCustomerReservation,
  createAdminReservation,
  createCustomerReservation,
  deleteAdminReservation,
  getAdminReservations,
  getCustomerReservations,
  updateAdminReservation,
  updateCustomerReservation,
  updateReservationStatus,
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
    expect(Reservation.find.calledWith({ isDeleted: { $ne: true } })).to.equal(true);
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

  it('rejects updates to a deleted reservation', async () => {
    const reservationId = '507f1f77bcf86cd799439013';
    const reservation = {
      _id: reservationId,
      isDeleted: true,
    };
    sinon.stub(Reservation, 'findById').resolves(reservation);

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

    expect(res.statusCode).to.equal(404);
    expect(res.body.message).to.equal('Reservation not found');
  });

  it('permanently deletes an existing reservation', async () => {
    const reservation = {
      _id: '507f1f77bcf86cd799439013',
      deleteOne: sinon.stub().resolves(),
    };
    sinon.stub(Reservation, 'findById').resolves(reservation);

    const req = {
      params: { id: '507f1f77bcf86cd799439013' },
      user: { _id: '507f1f77bcf86cd799439014' },
    };
    const res = createResponse();

    await deleteAdminReservation(req, res);

    expect(reservation.deleteOne.calledOnce).to.equal(true);
    expect(res.statusCode).to.equal(200);
    expect(res.body.message).to.equal('Reservation deleted successfully');
    expect(res.body.reservationId).to.equal(req.params.id);
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

  it('retrieves only reservations linked to the logged-in customer id', async () => {
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
      customer: req.user._id,
      isDeleted: { $ne: true },
    })).to.equal(true);
    expect(res.statusCode).to.equal(200);
    expect(res.body).to.have.lengthOf(1);
    expect(res.body[0]).to.deep.include({
      _id: 'reservation-id',
      status: 'Completed',
    });
  });
});

describe('Customer reservation creation', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('creates a confirmed customer reservation with the exact size available table', async () => {
    const timeSlot = {
      _id: '507f1f77bcf86cd799439011',
      startTime: '18:00',
      endTime: '19:00',
      isAvailable: true,
    };
    const exactTable = {
      _id: '507f1f77bcf86cd799439012',
      tableNumber: 4,
      capacity: 4,
      location: 'Indoor',
      isAvailable: true,
    };
    const largerTable = {
      _id: '507f1f77bcf86cd799439013',
      tableNumber: 5,
      capacity: 6,
      location: 'Window',
      isAvailable: true,
    };
    const createdReservation = { _id: '507f1f77bcf86cd799439014' };
    const populatedReservation = {
      _id: createdReservation._id,
      timeSlot,
      table: exactTable,
      guests: 4,
      status: 'Confirmed',
    };
    const finalPopulate = sinon.stub().resolves(populatedReservation);
    const secondPopulate = sinon.stub().returns({ populate: finalPopulate });
    const firstPopulate = sinon.stub().returns({ populate: secondPopulate });

    sinon.stub(TimeSlot, 'findById').resolves(timeSlot);
    sinon.stub(Table, 'find').returns({
      sort: sinon.stub().resolves([exactTable, largerTable]),
    });
    sinon.stub(Reservation, 'find').returns({
      select: sinon.stub().resolves([]),
    });
    sinon.stub(Reservation, 'create').resolves(createdReservation);
    sinon.stub(Reservation, 'findById').returns({ populate: firstPopulate });

    const req = {
      user: {
        _id: '507f1f77bcf86cd799439015',
        name: 'Customer A',
        email: 'customer@example.com',
        phone: '0400123456',
        role: 'customer',
      },
      body: {
        date: '2026-05-31',
        timeSlotId: timeSlot._id,
        guests: 4,
        tablePreference: 'Window',
        requests: 'Birthday',
      },
    };
    const res = createResponse();

    await createCustomerReservation(req, res);

    expect(Table.find.firstCall.args[0]).to.deep.equal({
      isAvailable: true,
      capacity: { $gte: 4 },
    });
    expect(Reservation.create.firstCall.args[0]).to.include({
      customerName: 'Customer A',
      customerEmail: 'customer@example.com',
      customerPhone: '0400123456',
      table: exactTable._id,
      guests: 4,
      status: 'Confirmed',
      tablePreference: 'Window',
      requests: 'Birthday',
    });
    expect(res.statusCode).to.equal(201);
    expect(res.body.message).to.equal('Reservation confirmed successfully');
    expect(res.body.reservation).to.deep.include({
      _id: createdReservation._id,
      timeSlot,
      table: exactTable,
      guests: 4,
      status: 'Confirmed',
    });
  });

  it('assigns the next larger table when the exact size table is already booked', async () => {
    const exactTable = {
      _id: '507f1f77bcf86cd799439012',
      tableNumber: 4,
      capacity: 4,
      isAvailable: true,
    };
    const largerTable = {
      _id: '507f1f77bcf86cd799439013',
      tableNumber: 5,
      capacity: 6,
      isAvailable: true,
    };
    const createdReservation = { _id: '507f1f77bcf86cd799439014' };
    const populatedReservation = {
      _id: createdReservation._id,
      table: largerTable,
      guests: 4,
      status: 'Confirmed',
    };
    const finalPopulate = sinon.stub().resolves(populatedReservation);
    const secondPopulate = sinon.stub().returns({ populate: finalPopulate });
    const firstPopulate = sinon.stub().returns({ populate: secondPopulate });

    sinon.stub(TimeSlot, 'findById').resolves({
      _id: '507f1f77bcf86cd799439011',
      isAvailable: true,
    });
    sinon.stub(Table, 'find').returns({
      sort: sinon.stub().resolves([exactTable, largerTable]),
    });
    sinon.stub(Reservation, 'find').returns({
      select: sinon.stub().resolves([{ _id: 'existing-reservation', table: exactTable._id }]),
    });
    sinon.stub(Reservation, 'create').resolves(createdReservation);
    sinon.stub(Reservation, 'findById').returns({ populate: firstPopulate });

    const req = {
      user: {
        _id: '507f1f77bcf86cd799439015',
        name: 'Customer A',
        email: 'customer@example.com',
        phone: '0400123456',
      },
      body: {
        date: '2026-05-31',
        timeSlot: '507f1f77bcf86cd799439011',
        guests: 4,
      },
    };
    const res = createResponse();

    await createCustomerReservation(req, res);

    expect(Reservation.create.firstCall.args[0].table).to.equal(largerTable._id);
    expect(res.statusCode).to.equal(201);
    expect(res.body.reservation.table).to.deep.equal(largerTable);
  });

  it('rejects customer reservations when no suitable table is available', async () => {
    sinon.stub(TimeSlot, 'findById').resolves({
      _id: '507f1f77bcf86cd799439011',
      isAvailable: true,
    });
    sinon.stub(Table, 'find').returns({
      sort: sinon.stub().resolves([]),
    });

    const req = {
      user: {
        _id: '507f1f77bcf86cd799439015',
        name: 'Customer A',
        email: 'customer@example.com',
        phone: '0400123456',
      },
      body: {
        date: '2026-05-31',
        timeSlot: '507f1f77bcf86cd799439011',
        guests: 8,
      },
    };
    const res = createResponse();

    await createCustomerReservation(req, res);

    expect(res.statusCode).to.equal(400);
    expect(res.body.message).to.equal('No tables are available for this date, time, and guest count');
  });

  it('rejects customer reservations for unavailable time slots', async () => {
    sinon.stub(TimeSlot, 'findById').resolves({
      _id: '507f1f77bcf86cd799439011',
      isAvailable: false,
    });

    const req = {
      user: {
        _id: '507f1f77bcf86cd799439015',
        name: 'Customer A',
        email: 'customer@example.com',
        phone: '0400123456',
      },
      body: {
        date: '2026-05-31',
        timeSlot: '507f1f77bcf86cd799439011',
        guests: 2,
      },
    };
    const res = createResponse();

    await createCustomerReservation(req, res);

    expect(res.statusCode).to.equal(400);
    expect(res.body.message).to.equal('Selected time slot is not available');
  });

  it('returns available table details for a valid availability check', async () => {
    const table = {
      _id: '507f1f77bcf86cd799439012',
      tableNumber: 2,
      capacity: 4,
      location: 'Window',
      isAvailable: true,
    };
    sinon.stub(TimeSlot, 'findById').resolves({
      _id: '507f1f77bcf86cd799439011',
      isAvailable: true,
    });
    sinon.stub(Table, 'find').returns({
      sort: sinon.stub().resolves([table]),
    });
    sinon.stub(Reservation, 'find').returns({
      select: sinon.stub().resolves([]),
    });

    const req = {
      query: {
        date: '2026-05-31',
        timeSlotId: '507f1f77bcf86cd799439011',
        guests: '4',
      },
    };
    const res = createResponse();

    await checkCustomerReservationAvailability(req, res);

    expect(res.statusCode).to.equal(200);
    expect(res.body).to.deep.equal({
      available: true,
      message: 'A table is available for this reservation',
      table: {
        _id: table._id,
        tableNumber: 2,
        capacity: 4,
        location: 'Window',
      },
    });
  });

  it('returns unavailable when all suitable tables are already booked and ignores cancelled reservations', async () => {
    const activeBookedTable = {
      _id: '507f1f77bcf86cd799439012',
      tableNumber: 2,
      capacity: 4,
      isAvailable: true,
    };
    sinon.stub(TimeSlot, 'findById').resolves({
      _id: '507f1f77bcf86cd799439011',
      isAvailable: true,
    });
    sinon.stub(Table, 'find').returns({
      sort: sinon.stub().resolves([activeBookedTable]),
    });
    const reservationFind = sinon.stub(Reservation, 'find').returns({
      select: sinon.stub().resolves([
        {
          _id: 'active-reservation',
          table: activeBookedTable._id,
          status: 'Confirmed',
        },
      ]),
    });

    const req = {
      query: {
        date: '2026-05-31',
        timeSlot: '507f1f77bcf86cd799439011',
        guests: '4',
      },
    };
    const res = createResponse();

    await checkCustomerReservationAvailability(req, res);

    expect(res.statusCode).to.equal(200);
    expect(res.body.available).to.equal(false);
    expect(res.body.message).to.equal('No tables are available for this date, time, and guest count');
    expect(reservationFind.firstCall.args[0].status).to.deep.equal({ $in: ['Pending', 'Confirmed'] });
  });

  it('updates a reservation owned by the logged-in customer and assigns a suitable table', async () => {
    const reservationId = '507f1f77bcf86cd799439013';
    const customerId = '507f1f77bcf86cd799439015';
    const table = {
      _id: '507f1f77bcf86cd799439012',
      tableNumber: 2,
      capacity: 4,
      isAvailable: true,
    };
    const reservation = {
      _id: reservationId,
      customer: customerId,
      save: sinon.stub().resolves({ _id: reservationId }),
    };
    const populatedReservation = {
      _id: reservationId,
      table,
      guests: 4,
      status: 'Confirmed',
    };
    const finalPopulate = sinon.stub().resolves(populatedReservation);
    const secondPopulate = sinon.stub().returns({ populate: finalPopulate });
    const firstPopulate = sinon.stub().returns({ populate: secondPopulate });
    const findById = sinon.stub(Reservation, 'findById');
    findById.onFirstCall().resolves(reservation);
    findById.onSecondCall().returns({ populate: firstPopulate });
    sinon.stub(TimeSlot, 'findById').resolves({
      _id: '507f1f77bcf86cd799439011',
      isAvailable: true,
    });
    sinon.stub(Table, 'find').returns({
      sort: sinon.stub().resolves([table]),
    });
    sinon.stub(Reservation, 'find').returns({
      select: sinon.stub().resolves([]),
    });

    const req = {
      params: { id: reservationId },
      user: {
        _id: customerId,
        name: 'Customer A',
        email: 'customer@example.com',
        phone: '0400123456',
      },
      body: {
        date: '2026-06-01',
        timeSlotId: '507f1f77bcf86cd799439011',
        guests: 4,
        tablePreference: 'Window',
        requests: 'Birthday',
      },
    };
    const res = createResponse();

    await updateCustomerReservation(req, res);

    expect(Reservation.find.firstCall.args[0]._id).to.deep.equal({ $ne: reservationId });
    expect(reservation.table).to.equal(table._id);
    expect(reservation.guests).to.equal(4);
    expect(reservation.status).to.equal('Confirmed');
    expect(reservation.tablePreference).to.equal('Window');
    expect(reservation.requests).to.equal('Birthday');
    expect(reservation.save.calledOnce).to.equal(true);
    expect(res.statusCode).to.equal(200);
    expect(res.body.message).to.equal('Reservation updated successfully');
    expect(res.body.reservation).to.deep.include({
      _id: reservationId,
      table,
      guests: 4,
      status: 'Confirmed',
    });
  });

  it('rejects customer reservation updates when no suitable table is available', async () => {
    const reservation = {
      _id: '507f1f77bcf86cd799439013',
      customer: '507f1f77bcf86cd799439015',
      save: sinon.stub(),
    };
    sinon.stub(Reservation, 'findById').resolves(reservation);
    sinon.stub(TimeSlot, 'findById').resolves({
      _id: '507f1f77bcf86cd799439011',
      isAvailable: true,
    });
    sinon.stub(Table, 'find').returns({
      sort: sinon.stub().resolves([]),
    });

    const req = {
      params: { id: reservation._id },
      user: { _id: '507f1f77bcf86cd799439015' },
      body: {
        date: '2026-06-01',
        timeSlotId: '507f1f77bcf86cd799439011',
        guests: 8,
      },
    };
    const res = createResponse();

    await updateCustomerReservation(req, res);

    expect(res.statusCode).to.equal(400);
    expect(res.body.message).to.equal('No tables are available for this date, time, and guest count');
    expect(reservation.save.called).to.equal(false);
  });

  it('prevents customers from updating another user reservation', async () => {
    sinon.stub(Reservation, 'findById').resolves({
      _id: '507f1f77bcf86cd799439013',
      customer: '507f1f77bcf86cd799439016',
    });

    const req = {
      params: { id: '507f1f77bcf86cd799439013' },
      user: { _id: '507f1f77bcf86cd799439015' },
      body: {
        date: '2026-06-01',
        timeSlotId: '507f1f77bcf86cd799439011',
        guests: 2,
      },
    };
    const res = createResponse();

    await updateCustomerReservation(req, res);

    expect(res.statusCode).to.equal(403);
    expect(res.body.message).to.equal('You can only update your own reservations');
  });

  it('cancels a reservation owned by the logged-in customer', async () => {
    const reservationId = '507f1f77bcf86cd799439013';
    const customerId = '507f1f77bcf86cd799439015';
    const reservation = {
      _id: reservationId,
      customer: customerId,
      status: 'Confirmed',
      save: sinon.stub().resolves({ _id: reservationId }),
    };
    const populatedReservation = {
      _id: reservationId,
      customer: customerId,
      status: 'Cancelled',
      customerNotification: {
        message: 'Your reservation has been cancelled.',
      },
    };
    const finalPopulate = sinon.stub().resolves(populatedReservation);
    const secondPopulate = sinon.stub().returns({ populate: finalPopulate });
    const firstPopulate = sinon.stub().returns({ populate: secondPopulate });
    const findById = sinon.stub(Reservation, 'findById');
    findById.onFirstCall().resolves(reservation);
    findById.onSecondCall().returns({ populate: firstPopulate });

    const req = {
      params: { id: reservationId },
      user: { _id: customerId },
    };
    const res = createResponse();

    await cancelCustomerReservation(req, res);

    expect(reservation.status).to.equal('Cancelled');
    expect(reservation.customerNotification.message).to.equal('Your reservation has been cancelled.');
    expect(reservation.save.calledOnce).to.equal(true);
    expect(res.statusCode).to.equal(200);
    expect(res.body.message).to.equal('Reservation cancelled successfully');
    expect(res.body.reservation).to.deep.include({
      _id: reservationId,
      customer: customerId,
      status: 'Cancelled',
      customerNotification: {
        message: 'Your reservation has been cancelled.',
      },
    });
  });

  it('prevents customers from cancelling another user reservation', async () => {
    const reservation = {
      _id: '507f1f77bcf86cd799439013',
      customer: '507f1f77bcf86cd799439016',
      save: sinon.stub(),
    };
    sinon.stub(Reservation, 'findById').resolves(reservation);

    const req = {
      params: { id: reservation._id },
      user: { _id: '507f1f77bcf86cd799439015' },
    };
    const res = createResponse();

    await cancelCustomerReservation(req, res);

    expect(res.statusCode).to.equal(403);
    expect(res.body.message).to.equal('You can only cancel your own reservations');
    expect(reservation.save.called).to.equal(false);
  });
});
