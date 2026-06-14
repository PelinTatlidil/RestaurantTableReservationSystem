const chai = require('chai');
const sinon = require('sinon');

const UserFactory = require('../factories/userFactory');
const User = require('../models/User');

const { expect } = chai;

describe('UserFactory', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('creates a customer user when no role is provided', async () => {
    sinon.stub(User, 'create').resolves({
      id: 'user-id-1',
      name: 'Jane',
      email: 'jane@example.com',
      phone: '0400123456',
      role: 'customer',
    });

    const user = await UserFactory.createUser({
      name: 'Jane',
      email: 'jane@example.com',
      phone: '0400123456',
      password: 'secret123',
    });

    expect(user).to.deep.equal({
      id: 'user-id-1',
      name: 'Jane',
      email: 'jane@example.com',
      phone: '0400123456',
      role: 'customer',
    });
  });

  it('creates an admin user when role admin is specified', async () => {
    sinon.stub(User, 'create').resolves({
      id: 'admin-id-1',
      name: 'Admin',
      email: 'admin@example.com',
      phone: '0400654321',
      role: 'admin',
    });

    const user = await UserFactory.createAdmin({
      name: 'Admin',
      email: 'admin@example.com',
      phone: '0400654321',
      password: 'secret456',
    });

    expect(user.role).to.equal('admin');
    expect(user.email).to.equal('admin@example.com');
  });

  it('throws when an invalid role is provided', async () => {
    try {
      await UserFactory.createUser({
        name: 'Evil',
        email: 'evil@example.com',
        phone: '0400123000',
        password: 'secret789',
        role: 'superuser',
      });
      throw new Error('Expected error to be thrown');
    } catch (error) {
      expect(error.message).to.equal('Invalid user role: superuser');
    }
  });
});
