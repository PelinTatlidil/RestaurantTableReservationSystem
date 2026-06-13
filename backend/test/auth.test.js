const chai = require('chai');
const chaiHttp = require('chai-http');
const sinon = require('sinon');

const app = require('../server');
const User = require('../models/User');

const bcrypt = require('bcrypt');

const { expect } = chai;
chai.use(chaiHttp);

const responseDetails = (res) => JSON.stringify(res.body);

describe('Auth API', () => {
  let originalJwtSecret;

  before(() => {
    originalJwtSecret = process.env.JWT_SECRET;
    process.env.JWT_SECRET = originalJwtSecret || 'test-jwt-secret';
  });

  afterEach(() => {
    sinon.restore();
  });

  after(() => {
    if (originalJwtSecret) {
      process.env.JWT_SECRET = originalJwtSecret;
    } else {
      delete process.env.JWT_SECRET;
    }
  });

  describe('POST /api/auth/register', () => {
    it('registers a customer with valid data', async () => {
      sinon.stub(User, 'findOne').resolves(null);
      sinon.stub(User, 'create').resolves({
        id: 'user-id-1',
        name: 'Jane',
        email: 'jane@example.com',
        phone: '0400123456',
        role: 'customer',
      });

      const res = await chai
        .request(app)
        .post('/api/auth/register')
        .send({
          name: 'Jane',
          email: 'Jane@Example.com',
          phone: '0400123456',
          password: 'secret123',
        });

      expect(res.status, responseDetails(res)).to.equal(201);
      expect(res.body).to.include({
        id: 'user-id-1',
        name: 'Jane',
        email: 'jane@example.com',
        phone: '0400123456',
        role: 'customer',
      });
      expect(res.body.token).to.be.a('string');
    });

    it('rejects duplicate email', async () => {
      sinon.stub(User, 'findOne').resolves({ id: 'existing-user' });

      const res = await chai
        .request(app)
        .post('/api/auth/register')
        .send({
          name: 'Jane',
          email: 'jane@example.com',
          phone: '0400123456',
          password: 'secret123',
        });

      expect(res.status, responseDetails(res)).to.equal(400);
      expect(res.body.message).to.equal('Email is already registered');
    });

    it('rejects short password', async () => {
      const res = await chai
        .request(app)
        .post('/api/auth/register')
        .send({
          name: 'Jane',
          email: 'jane@example.com',
          phone: '0400123456',
          password: '123',
        });

      expect(res.status, responseDetails(res)).to.equal(400);
      expect(res.body.message).to.equal('Password must be at least 6 characters long');
    });

    it('checks whether an email is already registered', async () => {
      sinon.stub(User, 'exists').resolves({ _id: 'existing-user' });

      const res = await chai
        .request(app)
        .get('/api/auth/check-email')
        .query({ email: 'Jane@Example.com' });

      expect(res.status, responseDetails(res)).to.equal(200);
      expect(res.body).to.deep.equal({
        exists: true,
        message: 'Email address already exists',
      });
    });
  });

  describe('POST /api/auth/login', () => {
    it('logs in customer with valid credentials', async () => {
      sinon.stub(User, 'findOne').resolves({
        id: 'customer-id',
        name: 'Customer A',
        email: 'customer@example.com',
        role: 'customer',
        password: 'hashed-password',
      });
      sinon.stub(bcrypt, 'compare').resolves(true);

      const res = await chai
        .request(app)
        .post('/api/auth/login')
        .send({ email: 'customer@example.com', password: 'secret123' });

      expect(res.status, responseDetails(res)).to.equal(200);
      expect(res.body.role).to.equal('customer');
      expect(res.body.token).to.be.a('string');
    });

    it('logs in admin with valid credentials', async () => {
      sinon.stub(User, 'findOne').resolves({
        id: 'admin-id',
        name: 'Admin A',
        email: 'admin@example.com',
        role: 'admin',
        password: 'hashed-password',
      });
      sinon.stub(bcrypt, 'compare').resolves(true);

      const res = await chai
        .request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@example.com', password: 'secret123' });

      expect(res.status, responseDetails(res)).to.equal(200);
      expect(res.body.role).to.equal('admin');
      expect(res.body.token).to.be.a('string');
    });

    it('rejects invalid credentials', async () => {
      sinon.stub(User, 'findOne').resolves({
        id: 'user-id',
        password: 'hashed-password',
        role: 'customer',
      });
      sinon.stub(bcrypt, 'compare').resolves(false);

      const res = await chai
        .request(app)
        .post('/api/auth/login')
        .send({ email: 'wrong@example.com', password: 'wrongpass' });

      expect(res.status, responseDetails(res)).to.equal(401);
      expect(res.body.message).to.equal('Invalid email or password');
    });
  });
});
