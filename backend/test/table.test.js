const { expect } = require('chai');
const sinon = require('sinon');
const Table = require('../models/Table');
const {
  createTable,
  deleteTable,
  getTables,
  toggleTableAvailability,
  updateTable,
} = require('../controllers/tableController');

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

describe('Table management', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('lists all tables sorted by table number', async () => {
    const sort = sinon.stub().resolves([{ tableNumber: 1 }, { tableNumber: 2 }]);
    sinon.stub(Table, 'find').returns({ sort });
    const req = {};
    const res = createResponse();

    await getTables(req, res);

    expect(Table.find.calledOnce).to.equal(true);
    expect(sort.calledWith({ tableNumber: 1 })).to.equal(true);
    expect(res.statusCode).to.equal(200);
    expect(res.body).to.deep.equal([{ tableNumber: 1 }, { tableNumber: 2 }]);
  });

  it('rejects invalid table capacity', async () => {
    const req = {
      body: {
        tableNumber: 1,
        capacity: 0,
        location: 'Indoor',
        isAvailable: true,
      },
    };
    const res = createResponse();

    await createTable(req, res);

    expect(res.statusCode).to.equal(400);
    expect(res.body.message).to.equal('Table capacity must be a positive whole number');
  });

  it('creates a new table record', async () => {
    sinon.stub(Table, 'findOne').resolves(null);
    sinon.stub(Table, 'create').resolves({
      _id: 'table-id',
      tableNumber: 3,
      capacity: 4,
      location: 'Patio',
      isAvailable: true,
    });
    const req = {
      body: {
        tableNumber: '3',
        capacity: '4',
        location: ' Patio ',
        isAvailable: true,
      },
    };
    const res = createResponse();

    await createTable(req, res);

    expect(Table.create.calledWith({
      tableNumber: 3,
      capacity: 4,
      location: 'Patio',
      isAvailable: true,
    })).to.equal(true);
    expect(res.statusCode).to.equal(201);
    expect(res.body.tableNumber).to.equal(3);
  });

  it('updates table details', async () => {
    const table = {
      _id: 'table-id',
      tableNumber: 1,
      capacity: 2,
      location: 'Indoor',
      isAvailable: true,
      save: sinon.stub(),
    };
    table.save.resolves(table);
    sinon.stub(Table, 'findById').resolves(table);
    sinon.stub(Table, 'findOne').resolves(null);
    const req = {
      params: { id: 'table-id' },
      body: {
        tableNumber: 5,
        capacity: 6,
        location: 'Window',
        isAvailable: false,
      },
    };
    const res = createResponse();

    await updateTable(req, res);

    expect(table.tableNumber).to.equal(5);
    expect(table.capacity).to.equal(6);
    expect(table.location).to.equal('Window');
    expect(table.isAvailable).to.equal(false);
    expect(table.save.calledOnce).to.equal(true);
    expect(res.statusCode).to.equal(200);
  });

  it('deletes a table', async () => {
    const table = { deleteOne: sinon.stub().resolves() };
    sinon.stub(Table, 'findById').resolves(table);
    const req = { params: { id: 'table-id' } };
    const res = createResponse();

    await deleteTable(req, res);

    expect(table.deleteOne.calledOnce).to.equal(true);
    expect(res.statusCode).to.equal(200);
    expect(res.body.message).to.equal('Table deleted successfully');
  });

  it('toggles table availability status', async () => {
    const table = {
      isAvailable: true,
      save: sinon.stub(),
    };
    table.save.resolves(table);
    sinon.stub(Table, 'findById').resolves(table);
    const req = { params: { id: 'table-id' } };
    const res = createResponse();

    await toggleTableAvailability(req, res);

    expect(table.isAvailable).to.equal(false);
    expect(table.save.calledOnce).to.equal(true);
    expect(res.statusCode).to.equal(200);
  });
});
