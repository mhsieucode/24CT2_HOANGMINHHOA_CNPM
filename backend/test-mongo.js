require("dotenv").config();

const mongoose = require("mongoose");

async function testMongo() {
  try {
    console.log("Đang thử kết nối MongoDB Atlas...");

    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 15000,
    });

    console.log("KẾT NỐI MONGODB THÀNH CÔNG!");

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.log("KẾT NỐI THẤT BẠI!");
    console.log(error.message);
    process.exit(1);
  }
}

testMongo();
