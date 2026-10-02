const mongoose = require("mongoose");
require("dotenv").config();

console.log("Đang kiểm tra MongoDB...");
console.log("MONGO_URI đã được đọc:", !!process.env.MONGO_URI);

mongoose
  .connect(process.env.MONGO_URI, {
    family: 4,
    tls: true,
    serverSelectionTimeoutMS: 15000,
  })
  .then(() => {
    console.log("=================================");
    console.log("MONGODB KẾT NỐI THÀNH CÔNG!");
    console.log("=================================");
    process.exit(0);
  })
  .catch((error) => {
    console.log("=================================");
    console.log("KẾT NỐI MONGODB THẤT BẠI");
    console.log("=================================");
    console.log(error.message);
    process.exit(1);
  });
