const chai = require('chai');
const chaiHttp = require('chai-http');
const sinon = require('sinon');

const app = require('../server');
const User = require('../models/User');
const bcrypt = require('bcrypt');

const { expect } = chai;
chai.use(chaiHttp);

describe('Auth API', () => {
  afterEach(() => {
    sinon.restore();
  });

  describe('POST /api/auth/register', () => {
    it('registers a customer with valid data', async () => {
      sinon.stub(User, 'findOne').resolves(null);
      sinon.stub(User, 'create').resolves({
        id: 'user-id-1',
        name: 'Jane',
        email: 'jane@example.com',
        role: 'customer',
      });

      const res = await chai
        .request(app)
        .post('/api/auth/register')
        .send({ name: 'Jane', email: 'Jane@Example.com', password: 'secret123' });

      expect(res).to.have.status(201);
      expect(res.body).to.include({
        id: 'user-id-1',
        name: 'Jane',
        email: 'jane@example.com',
        role: 'customer',
      });
      expect(res.body.token).to.be.a('string');
    });

    it('rejects duplicate email', async () => {
      sinon.stub(User, 'findOne').resolves({ id: 'existing-user' });

      const res = await chai
        .request(app)
        .post('/api/auth/register')
        .send({ name: 'Jane', email: 'jane@example.com', password: 'secret123' });

      expect(res).to.have.status(400);
      expect(res.body.message).to.equal('User already exists with this email');
    });

    it('rejects short password', async () => {
      const res = await chai
        .request(app)
        .post('/api/auth/register')
        .send({ name: 'Jane', email: 'jane@example.com', password: '123' });

      expect(res).to.have.status(400);
      expect(res.body.message).to.equal('Password must be at least 6 characters long');
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

      expect(res).to.have.status(200);
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

      expect(res).to.have.status(200);
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

      expect(res).to.have.status(401);
      expect(res.body.message).to.equal('Invalid email or password');
    });
  });
});
