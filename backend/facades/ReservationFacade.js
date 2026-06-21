const Reservation = require('../models/Reservation');
const ReservationSubject = require('../observers/ReservationSubject');
const CustomerNotificationObserver = require('../observers/CustomerNotificationObserver');
const ReservationAuditObserver = require('../observers/ReservationAuditObserver');

const createReservationSubject = () => {
  const reservationSubject = new ReservationSubject();
  reservationSubject.addObserver(new CustomerNotificationObserver());
  reservationSubject.addObserver(new ReservationAuditObserver());
  return reservationSubject;
};

class ReservationFacade {
  constructor({
    reservationModel = Reservation,
    reservationSubject = createReservationSubject(),
  } = {}) {
    this.reservationModel = reservationModel;
    this.reservationSubject = reservationSubject;
  }

  populateReservationById(reservationId) {
    return this.reservationModel
      .findById(reservationId)
      .populate('customer', 'name email phone')
      .populate('timeSlot', 'startTime endTime')
      .populate('table', 'tableNumber capacity location isAvailable');
  }

  async updateReservationStatus({ reservationId, newStatus, changedBy, normalizeStatus }) {
    const reservation = await this.reservationModel.findById(reservationId);

    if (!reservation) {
      return { notFound: true };
    }

    const previousStatus = normalizeStatus(reservation.status);
    const notificationMessage = `Your reservation status has been updated to ${newStatus}.`;

    reservation.status = newStatus;

    await this.reservationSubject.notifyObservers({
      reservation,
      previousStatus,
      newStatus,
      changedBy,
      notificationMessage,
    });

    await reservation.save();

    return {
      reservation: await this.populateReservationById(reservation._id),
    };
  }
}

module.exports = ReservationFacade;