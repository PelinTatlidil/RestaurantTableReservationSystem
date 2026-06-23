const { expect } = require('chai');
const sinon = require('sinon');

const ReservationFacade = require('../facades/ReservationFacade');

describe('Reservation Facade Pattern', () => {
  it('updates reservation status through a simplified facade method', async () => {
    const reservation = {
      _id: 'reservation123',
      status: 'Pending',
      save: sinon.stub().resolves(),
    };

    const populatedReservation = {
      _id: 'reservation123',
      status: 'Confirmed',
    };

    const finalPopulate = sinon.stub().resolves(populatedReservation);
    const secondPopulate = sinon.stub().returns({ populate: finalPopulate });
    const firstPopulate = sinon.stub().returns({ populate: secondPopulate });

    const reservationModel = {
      findById: sinon.stub(),
    };

    reservationModel.findById.onFirstCall().resolves(reservation);
    reservationModel.findById.onSecondCall().returns({ populate: firstPopulate });

    const reservationSubject = {
      notifyObservers: sinon.stub().resolves(),
    };

    const facade = new ReservationFacade({
      reservationModel,
      reservationSubject,
    });

    const result = await facade.updateReservationStatus({
      reservationId: 'reservation123',
      newStatus: 'Confirmed',
      changedBy: 'admin123',
      normalizeStatus: (status) => status,
    });

    expect(reservation.status).to.equal('Confirmed');
    expect(reservation.save.calledOnce).to.equal(true);
    expect(reservationSubject.notifyObservers.calledOnce).to.equal(true);
    expect(result.reservation).to.deep.equal(populatedReservation);
  });

  it('passes reservation status details to observers', async () => {
    const reservation = {
      _id: 'reservation123',
      status: 'Pending',
      save: sinon.stub().resolves(),
    };

    const populatedReservation = {
      _id: 'reservation123',
      status: 'Cancelled',
    };

    const finalPopulate = sinon.stub().resolves(populatedReservation);
    const secondPopulate = sinon.stub().returns({ populate: finalPopulate });
    const firstPopulate = sinon.stub().returns({ populate: secondPopulate });

    const reservationModel = {
      findById: sinon.stub(),
    };

    reservationModel.findById.onFirstCall().resolves(reservation);
    reservationModel.findById.onSecondCall().returns({ populate: firstPopulate });

    const reservationSubject = {
      notifyObservers: sinon.stub().resolves(),
    };

    const facade = new ReservationFacade({
      reservationModel,
      reservationSubject,
    });

    await facade.updateReservationStatus({
      reservationId: 'reservation123',
      newStatus: 'Cancelled',
      changedBy: 'admin123',
      normalizeStatus: (status) => status,
    });

    expect(reservationSubject.notifyObservers.calledOnce).to.equal(true);

    const context = reservationSubject.notifyObservers.firstCall.args[0];

    expect(context.reservation).to.equal(reservation);
    expect(context.previousStatus).to.equal('Pending');
    expect(context.newStatus).to.equal('Cancelled');
    expect(context.changedBy).to.equal('admin123');
    expect(context.notificationMessage).to.equal(
      'Your reservation status has been updated to Cancelled.'
    );
  });

  it('returns notFound when reservation does not exist', async () => {
    const reservationModel = {
      findById: sinon.stub().resolves(null),
    };

    const reservationSubject = {
      notifyObservers: sinon.stub().resolves(),
    };

    const facade = new ReservationFacade({
      reservationModel,
      reservationSubject,
    });

    const result = await facade.updateReservationStatus({
      reservationId: 'missingReservation',
      newStatus: 'Confirmed',
      changedBy: 'admin123',
      normalizeStatus: (status) => status,
    });

    expect(result.notFound).to.equal(true);
    expect(reservationSubject.notifyObservers.called).to.equal(false);
  });
});