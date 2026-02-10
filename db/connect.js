const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MONGODB IS CONNECTED");
  } catch (error) {
    console.log("mongodb connection error", error);
  }
};

module.exports = connectDB;
