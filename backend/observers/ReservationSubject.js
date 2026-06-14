class ReservationSubject {
  constructor() {
    this.observers = [];
  }

  addObserver(observer) {
    this.observers.push(observer);
  }

  async notifyObservers(context) {
    for (const observer of this.observers) {
      await observer.update(context);
    }
  }
}

module.exports = ReservationSubject;