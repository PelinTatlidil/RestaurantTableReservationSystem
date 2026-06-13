const { expect } = require('chai');
const sinon = require('sinon');
const chai = require('chai');
const chaiHttp = require('chai-http');

const app = require('../server');
const RestaurantInfo = require('../models/RestaurantInfo');
const { defaultRestaurantInfo } = require('../controllers/restaurantInfoController');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

chai.use(chaiHttp);

const createToken = (id, role) => jwt.sign({ id, role }, process.env.JWT_SECRET);

describe('Restaurant information API', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret';
  });

  afterEach(() => {
    sinon.restore();
  });

  it('returns restaurant information from MongoDB', async () => {
    sinon.stub(RestaurantInfo, 'findOne').returns({
      lean: sinon.stub().resolves({
        name: 'Digi Meat Restaurant',
        address: {
          street: '123 Food Street',
          city: 'Brisbane',
          state: 'QLD',
          postcode: '4000',
        },
        contact: {
          phone: '0400 123 456',
          email: 'info@restaurant.com',
        },
        openingHours: ['Mon to Fri 11:00 AM to 10:00 PM'],
        bookingPolicy: 'Bookings are recommended.',
      }),
    });

    const res = await chai.request(app).get('/api/restaurant-info');

    expect(res).to.have.status(200);
    expect(res.body).to.include({
      name: 'Digi Meat Restaurant',
      bookingPolicy: 'Bookings are recommended.',
    });
    expect(res.body.contact.phone).to.equal('0400 123 456');
    expect(res.body.openingHours).to.deep.equal(['Mon to Fri 11:00 AM to 10:00 PM']);
  });

  it('returns default restaurant information when no MongoDB record exists', async () => {
    sinon.stub(RestaurantInfo, 'findOne').returns({
      lean: sinon.stub().resolves(null),
    });

    const res = await chai.request(app).get('/api/restaurant-info');

    expect(res).to.have.status(200);
    expect(res.body).to.deep.equal(defaultRestaurantInfo);
  });

  it('allows admins to update restaurant information in MongoDB', async () => {
    const restaurantInfo = {
      name: '',
      address: {},
      contact: {},
      openingHours: [],
      bookingPolicy: '',
      save: sinon.stub(),
    };
    restaurantInfo.save.resolves({
      ...restaurantInfo,
      toObject: () => ({
        name: restaurantInfo.name,
        address: restaurantInfo.address,
        contact: restaurantInfo.contact,
        openingHours: restaurantInfo.openingHours,
        bookingPolicy: restaurantInfo.bookingPolicy,
      }),
    });

    sinon.stub(User, 'findById').returns({
      select: sinon.stub().resolves({ _id: 'admin-id', role: 'admin' }),
    });
    sinon.stub(RestaurantInfo, 'findOne').resolves(restaurantInfo);

    const res = await chai
      .request(app)
      .put('/api/restaurant-info')
      .set('Authorization', `Bearer ${createToken('admin-id', 'admin')}`)
      .send({
        name: 'Updated Restaurant',
        address: {
          street: '456 New Street',
          city: 'Brisbane',
          state: 'QLD',
          postcode: '4001',
        },
        contact: {
          phone: '0400 999 888',
          email: 'Bookings@Example.com',
        },
        openingHours: ['Mon to Fri 10:00 AM to 9:00 PM', 'Sat 11:00 AM to 10:00 PM'],
        bookingPolicy: 'Bookings can be changed up to two hours before arrival.',
      });

    expect(res).to.have.status(200);
    expect(restaurantInfo.name).to.equal('Updated Restaurant');
    expect(restaurantInfo.contact.email).to.equal('bookings@example.com');
    expect(restaurantInfo.openingHours).to.deep.equal([
      'Mon to Fri 10:00 AM to 9:00 PM',
      'Sat 11:00 AM to 10:00 PM',
    ]);
    expect(restaurantInfo.save.calledOnce).to.equal(true);
    expect(res.body).to.include({
      name: 'Updated Restaurant',
      message: 'Restaurant information updated successfully',
    });
  });

  it('rejects invalid restaurant information updates', async () => {
    sinon.stub(User, 'findById').returns({
      select: sinon.stub().resolves({ _id: 'admin-id', role: 'admin' }),
    });

    const res = await chai
      .request(app)
      .put('/api/restaurant-info')
      .set('Authorization', `Bearer ${createToken('admin-id', 'admin')}`)
      .send({
        name: '',
        address: {},
        contact: {},
        openingHours: [],
        bookingPolicy: '',
      });

    expect(res).to.have.status(400);
    expect(res.body.message).to.equal('Restaurant name is required');
  });

  it('rejects customer access to restaurant information updates', async () => {
    sinon.stub(User, 'findById').returns({
      select: sinon.stub().resolves({ _id: 'customer-id', role: 'customer' }),
    });

    const res = await chai
      .request(app)
      .put('/api/restaurant-info')
      .set('Authorization', `Bearer ${createToken('customer-id', 'customer')}`)
      .send(defaultRestaurantInfo);

    expect(res).to.have.status(403);
    expect(res.body.message).to.equal('Admin access required');
  });
});
