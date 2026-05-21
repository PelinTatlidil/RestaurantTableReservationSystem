const { expect } = require('chai');
const sinon = require('sinon');
const chai = require('chai');
const chaiHttp = require('chai-http');

const app = require('../server');
const RestaurantInfo = require('../models/RestaurantInfo');
const { defaultRestaurantInfo } = require('../controllers/restaurantInfoController');

chai.use(chaiHttp);

describe('Restaurant information API', () => {
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
});
