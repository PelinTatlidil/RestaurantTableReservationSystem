const { expect } = require('chai');
const sinon = require('sinon');

const ReservationSubject = require('../observers/ReservationSubject');
const CustomerNotificationObserver = require('../observers/CustomerNotificationObserver');
const ReservationStatusAudit = require('../models/ReservationStatusAudit');
const ReservationAuditObserver = require('../observers/ReservationAuditObserver');

describe('Reservation Observer Pattern', () => {
  it('notifies registered observers', async () => {
    const subject = new ReservationSubject();

    const observer = {
      update: sinon.stub().resolves(),
    };

    const context = {
      reservation: {},
      previousStatus: 'Pending',
      newStatus: 'Confirmed',
      changedBy: 'user123',
      notificationMessage: 'Your reservation status has been updated to Confirmed.',
    };

    subject.addObserver(observer);
    await subject.notifyObservers(context);

    expect(observer.update.calledOnceWithExactly(context)).to.equal(true);
  });

  it('updates the customer notification', async () => {
    const observer = new CustomerNotificationObserver();
    const reservation = {};

    await observer.update({
      reservation,
      notificationMessage: 'Your reservation status has been updated to Confirmed.',
    });

    expect(reservation.customerNotification.message).to.equal(
      'Your reservation status has been updated to Confirmed.'
    );
    expect(reservation.customerNotification.updatedAt).to.be.instanceOf(Date);
  });

  it('creates a reservation status audit record', async () => {
    const createStub = sinon.stub(ReservationStatusAudit, 'create').resolves();

    const observer = new ReservationAuditObserver();

    const context = {
        reservation: { _id: 'reservation123' },
        previousStatus: 'Pending',
        newStatus: 'Confirmed',
        changedBy: 'admin123',
        notificationMessage: 'Your reservation status has been updated to Confirmed.',
    };

    await observer.update(context);

    expect(createStub.calledOnceWithExactly({
        reservation: 'reservation123',
        changedBy: 'admin123',
        previousStatus: 'Pending',
        newStatus: 'Confirmed',
        notificationMessage: 'Your reservation status has been updated to Confirmed.',
    })).to.equal(true);

    createStub.restore();
  });
});