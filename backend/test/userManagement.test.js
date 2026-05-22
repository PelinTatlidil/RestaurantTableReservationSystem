const chai = require('chai');
const chaiHttp = require('chai-http');
const jwt = require('jsonwebtoken');
const sinon = require('sinon');

const app = require('../server');
const User = require('../models/User');

const { expect } = chai;
chai.use(chaiHttp);

const createToken = (id, role) => jwt.sign({ id, role }, process.env.JWT_SECRET);

const createFindChain = (users, onSort = () => {}) => {
  const chain = {
    select: sinon.stub().returnsThis(),
    sort: sinon.stub().callsFake((sort) => {
      onSort(sort);
      return chain;
    }),
    skip: sinon.stub().returnsThis(),
    limit: sinon.stub().returnsThis(),
    lean: sinon.stub().resolves(users),
  };

  return chain;
};

describe('Admin user management API', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret';
  });

  afterEach(() => {
    sinon.restore();
  });

  it('allows admins to retrieve paginated users from MongoDB', async () => {
    let receivedSort;
    const admin = { _id: 'admin-id', id: 'admin-id', role: 'admin' };
    const users = [
      {
        _id: '507f1f77bcf86cd799439011',
        name: 'Pelin Tatlidil',
        email: 'pelin@example.com',
        phone: '0400123456',
        role: 'customer',
      },
    ];

    sinon.stub(User, 'findById').returns({
      select: sinon.stub().resolves(admin),
    });
    const findStub = sinon.stub(User, 'find').returns(createFindChain(users, (sort) => {
      receivedSort = sort;
    }));
    const countStub = sinon.stub(User, 'countDocuments').resolves(1);

    const res = await chai
      .request(app)
      .get('/api/users/admin')
      .set('Authorization', `Bearer ${createToken('admin-id', 'admin')}`)
      .query({ page: 1, limit: 10, search: 'pelin', sortBy: 'email', sortOrder: 'desc' });

    expect(res).to.have.status(200);
    expect(res.body.users).to.deep.equal(users);
    expect(res.body).to.include({
      total: 1,
      page: 1,
      pages: 1,
      limit: 10,
      sortBy: 'email',
      sortOrder: 'desc',
    });
    expect(findStub.firstCall.args[0].$or).to.have.length(4);
    expect(countStub.firstCall.args[0].$or).to.have.length(4);
    expect(receivedSort).to.deep.equal({ email: -1, _id: 1 });
  });

  it('allows admins to retrieve user details without passwords', async () => {
    const admin = { _id: 'admin-id', id: 'admin-id', role: 'admin' };
    const userDetails = {
      _id: '507f1f77bcf86cd799439011',
      name: 'Customer A',
      email: 'customer@example.com',
      phone: '0400123456',
      role: 'customer',
      university: 'QUT',
      address: 'Brisbane',
    };

    const findByIdStub = sinon.stub(User, 'findById');
    findByIdStub.onFirstCall().returns({
      select: sinon.stub().resolves(admin),
    });
    findByIdStub.onSecondCall().returns({
      select: sinon.stub().returns({
        lean: sinon.stub().resolves(userDetails),
      }),
    });

    const res = await chai
      .request(app)
      .get('/api/users/admin/507f1f77bcf86cd799439011')
      .set('Authorization', `Bearer ${createToken('admin-id', 'admin')}`);

    expect(res).to.have.status(200);
    expect(res.body).to.deep.equal(userDetails);
    expect(res.body.password).to.equal(undefined);
  });

  it('allows admins to update user information', async () => {
    const admin = { _id: '507f1f77bcf86cd799439010', id: '507f1f77bcf86cd799439010', role: 'admin' };
    const userToUpdate = {
      _id: '507f1f77bcf86cd799439011',
      name: 'Customer A',
      email: 'customer@example.com',
      phone: '0400123456',
      role: 'customer',
      university: '',
      address: '',
      save: sinon.stub(),
    };
    userToUpdate.save.resolves(userToUpdate);

    const findByIdStub = sinon.stub(User, 'findById');
    findByIdStub.onFirstCall().returns({
      select: sinon.stub().resolves(admin),
    });
    findByIdStub.onSecondCall().resolves(userToUpdate);
    sinon.stub(User, 'findOne').resolves(null);

    const res = await chai
      .request(app)
      .put('/api/users/admin/507f1f77bcf86cd799439011')
      .set('Authorization', `Bearer ${createToken(admin.id, 'admin')}`)
      .send({
        name: 'Updated Customer',
        email: 'Updated@Example.com',
        phone: '0400999888',
        role: 'admin',
        university: 'QUT',
        address: 'Brisbane',
      });

    expect(res).to.have.status(200);
    expect(userToUpdate.name).to.equal('Updated Customer');
    expect(userToUpdate.email).to.equal('updated@example.com');
    expect(userToUpdate.phone).to.equal('0400999888');
    expect(userToUpdate.role).to.equal('admin');
    expect(userToUpdate.university).to.equal('QUT');
    expect(userToUpdate.address).to.equal('Brisbane');
    expect(userToUpdate.save.calledOnce).to.equal(true);
    expect(res.body).to.include({
      name: 'Updated Customer',
      email: 'updated@example.com',
      phone: '0400999888',
      role: 'admin',
      message: 'User updated successfully',
    });
    expect(res.body.password).to.equal(undefined);
  });

  it('rejects user updates with duplicate emails', async () => {
    const admin = { _id: '507f1f77bcf86cd799439010', id: '507f1f77bcf86cd799439010', role: 'admin' };
    const userToUpdate = {
      _id: '507f1f77bcf86cd799439011',
      name: 'Customer A',
      email: 'customer@example.com',
      phone: '0400123456',
      role: 'customer',
    };

    const findByIdStub = sinon.stub(User, 'findById');
    findByIdStub.onFirstCall().returns({
      select: sinon.stub().resolves(admin),
    });
    findByIdStub.onSecondCall().resolves(userToUpdate);
    sinon.stub(User, 'findOne').resolves({ _id: '507f1f77bcf86cd799439012' });

    const res = await chai
      .request(app)
      .put('/api/users/admin/507f1f77bcf86cd799439011')
      .set('Authorization', `Bearer ${createToken(admin.id, 'admin')}`)
      .send({
        name: 'Customer A',
        email: 'other@example.com',
        phone: '0400123456',
        role: 'customer',
      });

    expect(res).to.have.status(400);
    expect(res.body.message).to.equal('Email is already registered');
  });

  it('allows admins to delete another user account', async () => {
    const admin = { _id: '507f1f77bcf86cd799439010', id: '507f1f77bcf86cd799439010', role: 'admin' };
    const userToDelete = {
      _id: '507f1f77bcf86cd799439011',
      deleteOne: sinon.stub().resolves(),
    };

    const findByIdStub = sinon.stub(User, 'findById');
    findByIdStub.onFirstCall().returns({
      select: sinon.stub().resolves(admin),
    });
    findByIdStub.onSecondCall().resolves(userToDelete);

    const res = await chai
      .request(app)
      .delete('/api/users/admin/507f1f77bcf86cd799439011')
      .set('Authorization', `Bearer ${createToken(admin.id, 'admin')}`);

    expect(res).to.have.status(200);
    expect(userToDelete.deleteOne.calledOnce).to.equal(true);
    expect(res.body.message).to.equal('User deleted successfully');
  });

  it('prevents admins from deleting their own account', async () => {
    const adminId = '507f1f77bcf86cd799439010';
    sinon.stub(User, 'findById').returns({
      select: sinon.stub().resolves({ _id: adminId, id: adminId, role: 'admin' }),
    });

    const res = await chai
      .request(app)
      .delete(`/api/users/admin/${adminId}`)
      .set('Authorization', `Bearer ${createToken(adminId, 'admin')}`);

    expect(res).to.have.status(400);
    expect(res.body.message).to.equal('Admins cannot delete their own account');
  });

  it('rejects customer access to user management', async () => {
    sinon.stub(User, 'findById').returns({
      select: sinon.stub().resolves({ _id: 'customer-id', role: 'customer' }),
    });

    const res = await chai
      .request(app)
      .get('/api/users/admin')
      .set('Authorization', `Bearer ${createToken('customer-id', 'customer')}`);

    expect(res).to.have.status(403);
    expect(res.body.message).to.equal('Admin access required');
  });
});
