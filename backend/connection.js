import mongoose from "mongoose";

function connect(url) {
  return new Promise((resolve, reject) => {
    mongoose.connect(url);

    const db = mongoose.connection;

    db.on("error", (err) => {
      console.error("❌ MongoDB connection error:", err);
      reject(err); // important!
    });

    db.once("open", () => {
      console.log("✅ Connected to MongoDB");
      resolve();
    });
  });
}

export default connect;
