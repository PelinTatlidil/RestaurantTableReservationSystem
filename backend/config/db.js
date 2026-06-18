// config/db.js
const dns = require("node:dns");

// Force Node.js to use Cloudflare DNS
dns.setServers(["1.1.1.1", "1.0.0.1"]);

const mongoose = require("mongoose");

class MongoDBConnection {
  static instance;

  constructor() {
    if (MongoDBConnection.instance) {
      return MongoDBConnection.instance;
    }

    this.connection = null;
    MongoDBConnection.instance = this;
  }

  async connect() {
    if (this.connection?.readyState === 1) {
      return this.connection;
    }

    try {
      await mongoose.connect(process.env.MONGO_URI);
      this.connection = mongoose.connection;
      console.log("MongoDB connected successfully");
      return this.connection;
    } catch (error) {
      console.error("MongoDB connection error:", error.message);
      process.exit(1);
    }
  }

  static getInstance() {
    if (!MongoDBConnection.instance) {
      MongoDBConnection.instance = new MongoDBConnection();
    }
    return MongoDBConnection.instance;
  }
}

module.exports = MongoDBConnection;
