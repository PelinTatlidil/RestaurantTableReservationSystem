const { expect } = require('chai');
const sinon = require('sinon');
const User = require('../models/User');
const { checkEmail, registerUser } = require('../controllers/authController');

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

describe('Customer registration', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret';
  });

  afterEach(() => {
    sinon.restore();
  });

  it('rejects missing required fields', async () => {
    const req = { body: { name: 'Pelin', email: 'pelin@example.com', password: 'secret123' } };
    const res = createResponse();

    await registerUser(req, res);

    expect(res.statusCode).to.equal(400);
    expect(res.body.message).to.equal('Name, email, phone number, and password are required');
  });

  it('prevents duplicate email registration', async () => {
    sinon.stub(User, 'findOne').resolves({ email: 'pelin@example.com' });
    const req = {
      body: {
        name: 'Pelin',
        email: 'Pelin@Example.com',
        phone: '0400123456',
        password: 'secret123',
      },
    };
    const res = createResponse();

    await registerUser(req, res);

    expect(User.findOne.calledWith({ email: 'pelin@example.com' })).to.equal(true);
    expect(res.statusCode).to.equal(400);
    expect(res.body.message).to.equal('Email is already registered');
  });

  it('creates a customer account and returns a success message', async () => {
    sinon.stub(User, 'findOne').resolves(null);
    sinon.stub(User, 'create').resolves({
      id: 'customer-id',
      name: 'Pelin Tatlidil',
      email: 'pelin@example.com',
      phone: '0400123456',
      role: 'customer',
    });
    const req = {
      body: {
        name: ' Pelin Tatlidil ',
        email: 'Pelin@Example.com',
        phone: ' 0400123456 ',
        password: 'secret123',
      },
    };
    const res = createResponse();

    await registerUser(req, res);

    expect(User.create.calledWith({
      name: 'Pelin Tatlidil',
      email: 'pelin@example.com',
      phone: '0400123456',
      password: 'secret123',
      role: 'customer',
    })).to.equal(true);
    expect(res.statusCode).to.equal(201);
    expect(res.body).to.include({
      id: 'customer-id',
      name: 'Pelin Tatlidil',
      email: 'pelin@example.com',
      phone: '0400123456',
      role: 'customer',
      message: 'Registration successful',
    });
    expect(res.body.token).to.be.a('string');
  });

  it('reports that an email address already exists', async () => {
    sinon.stub(User, 'exists').resolves({ _id: 'existing-user' });
    const req = { query: { email: ' Pelin@Example.com ' } };
    const res = createResponse();

    await checkEmail(req, res);

    expect(User.exists.calledWith({ email: 'pelin@example.com' })).to.equal(true);
    expect(res.statusCode).to.equal(200);
    expect(res.body).to.deep.equal({
      exists: true,
      message: 'Email address already exists',
    });
  });

  it('reports that an email address is available', async () => {
    sinon.stub(User, 'exists').resolves(null);
    const req = { query: { email: 'new@example.com' } };
    const res = createResponse();

    await checkEmail(req, res);

    expect(res.statusCode).to.equal(200);
    expect(res.body).to.deep.equal({
      exists: false,
      message: 'Email address is available',
    });
  });
});
