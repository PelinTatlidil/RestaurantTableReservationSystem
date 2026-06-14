const ReservationStatusAudit = require('../models/ReservationStatusAudit');

class ReservationAuditObserver {
  async update({ reservation, previousStatus, newStatus, changedBy, notificationMessage }) {
    await ReservationStatusAudit.create({
      reservation: reservation._id,
      changedBy,
      previousStatus,
      newStatus,
      notificationMessage,
    });
  }
}

module.exports = ReservationAuditObserver;