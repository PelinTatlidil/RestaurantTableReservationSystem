const { expect } = require('chai');
const sinon = require('sinon');
const TimeSlot = require('../models/TimeSlot');
const {
  createTimeSlot,
  deleteTimeSlot,
  getAvailableTimeSlots,
  getTimeSlots,
  updateTimeSlot,
} = require('../controllers/timeSlotController');

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

describe('Time slot management', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('lists all time slots sorted by start time', async () => {
    const sort = sinon.stub().resolves([{ startTime: '17:00' }, { startTime: '18:00' }]);
    sinon.stub(TimeSlot, 'find').returns({ sort });
    const res = createResponse();

    await getTimeSlots({}, res);

    expect(TimeSlot.find.calledOnce).to.equal(true);
    expect(sort.calledWith({ startTime: 1 })).to.equal(true);
    expect(res.statusCode).to.equal(200);
    expect(res.body).to.deep.equal([{ startTime: '17:00' }, { startTime: '18:00' }]);
  });

  it('lists only available time slots for customers', async () => {
    const sort = sinon.stub().resolves([{ startTime: '17:00', isAvailable: true }]);
    sinon.stub(TimeSlot, 'find').returns({ sort });
    const res = createResponse();

    await getAvailableTimeSlots({}, res);

    expect(TimeSlot.find.calledWith({ isAvailable: true })).to.equal(true);
    expect(res.statusCode).to.equal(200);
    expect(res.body).to.deep.equal([{ startTime: '17:00', isAvailable: true }]);
  });

  it('rejects invalid time ranges', async () => {
    const req = { body: { startTime: '19:00', endTime: '18:00', isAvailable: true } };
    const res = createResponse();

    await createTimeSlot(req, res);

    expect(res.statusCode).to.equal(400);
    expect(res.body.message).to.equal('End time must be after start time');
  });

  it('rejects conflicting time slots', async () => {
    sinon.stub(TimeSlot, 'find').resolves([{ startTime: '18:00', endTime: '19:00' }]);
    const req = { body: { startTime: '18:30', endTime: '19:30', isAvailable: true } };
    const res = createResponse();

    await createTimeSlot(req, res);

    expect(res.statusCode).to.equal(400);
    expect(res.body.message).to.equal('Time slot conflicts with an existing slot');
  });

  it('creates a new time slot', async () => {
    sinon.stub(TimeSlot, 'find').resolves([]);
    sinon.stub(TimeSlot, 'create').resolves({
      _id: 'slot-id',
      startTime: '17:00',
      endTime: '18:00',
      isAvailable: true,
    });
    const req = { body: { startTime: '17:00', endTime: '18:00', isAvailable: true } };
    const res = createResponse();

    await createTimeSlot(req, res);

    expect(TimeSlot.create.calledWith({
      startTime: '17:00',
      endTime: '18:00',
      isAvailable: true,
    })).to.equal(true);
    expect(res.statusCode).to.equal(201);
    expect(res.body.startTime).to.equal('17:00');
  });

  it('updates a time slot', async () => {
    const timeSlot = {
      _id: 'slot-id',
      startTime: '17:00',
      endTime: '18:00',
      isAvailable: true,
      save: sinon.stub(),
    };
    timeSlot.save.resolves(timeSlot);
    sinon.stub(TimeSlot, 'findById').resolves(timeSlot);
    sinon.stub(TimeSlot, 'find').resolves([]);
    const req = {
      params: { id: 'slot-id' },
      body: { startTime: '18:00', endTime: '19:00', isAvailable: false },
    };
    const res = createResponse();

    await updateTimeSlot(req, res);

    expect(timeSlot.startTime).to.equal('18:00');
    expect(timeSlot.endTime).to.equal('19:00');
    expect(timeSlot.isAvailable).to.equal(false);
    expect(timeSlot.save.calledOnce).to.equal(true);
    expect(res.statusCode).to.equal(200);
  });

  it('deletes a time slot', async () => {
    const timeSlot = { deleteOne: sinon.stub().resolves() };
    sinon.stub(TimeSlot, 'findById').resolves(timeSlot);
    const req = { params: { id: 'slot-id' } };
    const res = createResponse();

    await deleteTimeSlot(req, res);

    expect(timeSlot.deleteOne.calledOnce).to.equal(true);
    expect(res.statusCode).to.equal(200);
    expect(res.body.message).to.equal('Time slot deleted successfully');
  });
});
