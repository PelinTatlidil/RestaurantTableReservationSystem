const Table = require('../models/Table');
const BaseController = require('./BaseController');

const normalizeTablePayload = (body) => ({
  tableNumber: Number(body.tableNumber),
  capacity: Number(body.capacity),
  location: body.location ? body.location.trim() : '',
  isAvailable:
    typeof body.isAvailable === 'boolean'
      ? body.isAvailable
      : body.isAvailable !== 'false',
});

const validateTablePayload = ({ tableNumber, capacity, location }) => {
  if (!Number.isInteger(tableNumber) || tableNumber < 1) {
    return 'Table number must be a positive whole number';
  }

  if (!Number.isInteger(capacity) || capacity < 1) {
    return 'Table capacity must be a positive whole number';
  }

  if (!location) {
    return 'Table location is required';
  }

  return '';
};

const getTables = async (req, res) => {
  try {
    const tables = await Table.find().sort({ tableNumber: 1 });
    return res.status(200).json(tables);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const createTable = async (req, res) => {
  const payload = normalizeTablePayload(req.body);
  const validationMessage = validateTablePayload(payload);

  if (validationMessage) {
    return res.status(400).json({ message: validationMessage });
  }

  try {
    const tableExists = await Table.findOne({ tableNumber: payload.tableNumber });

    if (tableExists) {
      return res.status(400).json({ message: 'Table number already exists' });
    }

    const table = await Table.create(payload);
    return res.status(201).json(table);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const updateTable = async (req, res) => {
  const payload = normalizeTablePayload(req.body);
  const validationMessage = validateTablePayload(payload);

  if (validationMessage) {
    return res.status(400).json({ message: validationMessage });
  }

  try {
    const table = await Table.findById(req.params.id);

    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }

    const duplicateTable = await Table.findOne({
      tableNumber: payload.tableNumber,
      _id: { $ne: table._id },
    });

    if (duplicateTable) {
      return res.status(400).json({ message: 'Table number already exists' });
    }

    table.tableNumber = payload.tableNumber;
    table.capacity = payload.capacity;
    table.location = payload.location;
    table.isAvailable = payload.isAvailable;

    const updatedTable = await table.save();
    return res.status(200).json(updatedTable);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const deleteTable = async (req, res) => {
  try {
    const table = await Table.findById(req.params.id);

    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }

    await table.deleteOne();
    return res.status(200).json({ message: 'Table deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const toggleTableAvailability = async (req, res) => {
  try {
    const table = await Table.findById(req.params.id);

    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }

    table.isAvailable = !table.isAvailable;
    const updatedTable = await table.save();
    return res.status(200).json(updatedTable);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

class TableController extends BaseController {
  async getTables(req, res) {
    try {
      const tables = await Table.find().sort({ tableNumber: 1 });
      return this.sendSuccess(res, tables);
    } catch (error) {
      return this.handleServerError(res, error);
    }
  }
}

const tableController = new TableController();

Object.assign(tableController, {
  getTables: tableController.getTables.bind(tableController),
  createTable,
  deleteTable,
  toggleTableAvailability,
  updateTable,
  validateTablePayload,
});

module.exports = tableController;
