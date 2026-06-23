const { expect } = require('chai');

const {
  SmallestCapacityStrategy,
  LargestCapacityStrategy,
} = require('../controllers/TableSelectionStrategy');

describe('Table Selection Strategy Pattern', () => {
  it('SmallestCapacityStrategy selects the first available suitable table', () => {
    const strategy = new SmallestCapacityStrategy();

    const tables = [
      { _id: 'table1', tableNumber: 1, capacity: 2 },
      { _id: 'table2', tableNumber: 2, capacity: 4 },
    ];

    const bookedTableIds = new Set();

    const selectedTable = strategy.select(tables, bookedTableIds);

    expect(selectedTable._id).to.equal('table1');
  });

  it('LargestCapacityStrategy selects the largest available table', () => {
    const strategy = new LargestCapacityStrategy();

    const tables = [
      { _id: 'table1', tableNumber: 1, capacity: 2 },
      { _id: 'table2', tableNumber: 2, capacity: 6 },
      { _id: 'table3', tableNumber: 3, capacity: 4 },
    ];

    const bookedTableIds = new Set();

    const selectedTable = strategy.select(tables, bookedTableIds);

    expect(selectedTable._id).to.equal('table2');
  });

  it('skips tables that are already booked', () => {
    const strategy = new SmallestCapacityStrategy();

    const tables = [
      { _id: 'table1', tableNumber: 1, capacity: 2 },
      { _id: 'table2', tableNumber: 2, capacity: 4 },
    ];

    const bookedTableIds = new Set(['table1']);

    const selectedTable = strategy.select(tables, bookedTableIds);

    expect(selectedTable._id).to.equal('table2');
  });
});