const { expect } = require('chai');
const sinon = require('sinon');
const Reservation = require('../models/Reservation');
const Table = require('../models/Table');
const TimeSlot = require('../models/TimeSlot');
const User = require('../models/User');
const {
  cancelCustomerReservation,
  createAdminReservation,
  deleteAdminReservation,
  getAdminReservations,
  getCustomerReservations,
  updateAdminReservation,
} = require('../controllers/reservationController');

const customerId = '507f1f77bcf86cd799439015';
const reservationId = '507f1f77bcf86cd799439013';
const tableId = '507f1f77bcf86cd799439012';
const timeSlotId = '507f1f77bcf86cd799439011';

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

const stubPopulateReservation = (populatedReservation) => {
  const finalPopulate = sinon.stub().resolves(populatedReservation);
  const secondPopulate = sinon.stub().returns({ populate: finalPopulate });
  const firstPopulate = sinon.stub().returns({ populate: secondPopulate });

  return { firstPopulate, secondPopulate, finalPopulate };
};

describe('Reservation controller unit tests', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('views all reservations for admins', async () => {
    const reservations = [{ _id: reservationId, status: 'Confirmed' }];
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

  it('views reservations for the logged-in customer only', async () => {
    const reservations = [{ _id: reservationId, customer: customerId }];
    const sort = sinon.stub().resolves(reservations);
    const secondPopulate = sinon.stub().returns({ sort });
    const firstPopulate = sinon.stub().returns({ populate: secondPopulate });
    sinon.stub(Reservation, 'find').returns({ populate: firstPopulate });
    const req = { user: { _id: customerId } };
    const res = createResponse();

    await getCustomerReservations(req, res);

    expect(Reservation.find.calledWith({
      customer: customerId,
      isDeleted: { $ne: true },
    })).to.equal(true);
    expect(res.statusCode).to.equal(200);
    expect(res.body).to.deep.equal(reservations);
  });

  it('creates a reservation for an admin request', async () => {
    const customer = {
      _id: customerId,
      name: 'Customer A',
      email: 'customer@example.com',
      phone: '0400123456',
      role: 'customer',
    };
    const timeSlot = { _id: timeSlotId, startTime: '18:00', endTime: '20:00', isAvailable: true };
    const table = { _id: tableId, tableNumber: 2, capacity: 4, isAvailable: true };
    const createdReservation = { _id: reservationId };
    const populatedReservation = {
      _id: reservationId,
      customer,
      timeSlot,
      table,
      status: 'Confirmed',
    };
    const { firstPopulate } = stubPopulateReservation(populatedReservation);

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
        timeSlot: timeSlotId,
        table: tableId,
        guests: 4,
        status: 'Confirmed',
      },
    };
    const res = createResponse();

    await createAdminReservation(req, res);

    expect(Reservation.create.calledOnce).to.equal(true);
    expect(Reservation.create.firstCall.args[0]).to.include({
      customer: customerId,
      customerName: 'Customer A',
      customerEmail: 'customer@example.com',
      customerPhone: '0400123456',
      timeSlot: timeSlotId,
      table: tableId,
      guests: 4,
      status: 'Confirmed',
    });
    expect(res.statusCode).to.equal(201);
    expect(res.body).to.deep.equal(populatedReservation);
  });

  it('updates an existing admin reservation', async () => {
    const reservation = {
      _id: reservationId,
      isDeleted: false,
      save: sinon.stub().resolves({ _id: reservationId }),
    };
    const customer = {
      _id: customerId,
      name: 'Customer A',
      email: 'customer@example.com',
      phone: '0400123456',
      role: 'customer',
    };
    const timeSlot = { _id: timeSlotId, startTime: '18:00', endTime: '20:00', isAvailable: true };
    const table = { _id: tableId, tableNumber: 2, capacity: 4, isAvailable: true };
    const populatedReservation = { _id: reservationId, customer, timeSlot, table, status: 'Confirmed' };
    const { firstPopulate } = stubPopulateReservation(populatedReservation);
    const findById = sinon.stub(Reservation, 'findById');
    findById.onFirstCall().resolves(reservation);
    findById.onSecondCall().returns({ populate: firstPopulate });

    sinon.stub(User, 'findOne').resolves(customer);
    sinon.stub(TimeSlot, 'findById').resolves(timeSlot);
    sinon.stub(Table, 'findById').resolves(table);
    sinon.stub(Reservation, 'findOne').resolves(null);

    const req = {
      params: { id: reservationId },
      user: { _id: '507f1f77bcf86cd799439016' },
      body: {
        customerName: 'Customer A',
        customerEmail: 'customer@example.com',
        customerPhone: '0400123456',
        date: '2026-05-31',
        timeSlot: timeSlotId,
        table: tableId,
        guests: 4,
        status: 'Confirmed',
      },
    };
    const res = createResponse();

    await updateAdminReservation(req, res);

    expect(reservation.customer).to.equal(customerId);
    expect(reservation.timeSlot).to.equal(timeSlotId);
    expect(reservation.table).to.equal(tableId);
    expect(reservation.guests).to.equal(4);
    expect(reservation.status).to.equal('Confirmed');
    expect(reservation.save.calledOnce).to.equal(true);
    expect(res.statusCode).to.equal(200);
    expect(res.body).to.deep.equal(populatedReservation);
  });

  it('cancels a customer reservation owned by the logged-in customer', async () => {
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
    };
    const { firstPopulate } = stubPopulateReservation(populatedReservation);
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
    expect(res.body.reservation).to.deep.equal(populatedReservation);
  });

  it('permanently deletes an admin reservation', async () => {
    const reservation = {
      _id: reservationId,
      deleteOne: sinon.stub().resolves(),
    };
    sinon.stub(Reservation, 'findById').resolves(reservation);
    const req = {
      params: { id: reservationId },
      user: { _id: '507f1f77bcf86cd799439016' },
    };
    const res = createResponse();

    await deleteAdminReservation(req, res);

    expect(reservation.deleteOne.calledOnce).to.equal(true);
    expect(res.statusCode).to.equal(200);
    expect(res.body.message).to.equal('Reservation deleted successfully');
    expect(res.body.reservationId).to.equal(reservationId);
  });
});
