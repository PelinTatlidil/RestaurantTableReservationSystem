class CustomerNotificationObserver {
  async update({ reservation, notificationMessage }) {
    reservation.customerNotification = {
      message: notificationMessage,
      updatedAt: new Date(),
    };
  }
}

module.exports = CustomerNotificationObserver;