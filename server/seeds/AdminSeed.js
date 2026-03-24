const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("../models/User");

dotenv.config();

const seedAdmin = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ Connected to MongoDB");

  const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;

  if (!ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error("❌ Missing ADMIN_NAME, ADMIN_EMAIL, or ADMIN_PASSWORD in .env");
    process.exit(1);
  }

  const existing = await User.findOne({ email: ADMIN_EMAIL });
  if (existing) {
    console.log(`⚠️  Admin already exists: ${ADMIN_EMAIL}`);
    process.exit(0);
  }

  const admin = await User.create({
    name: ADMIN_NAME,
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    role: "admin",
  });

  console.log(`✅ Admin created!`);
  console.log(`   Name  : ${admin.name}`);
  console.log(`   Email : ${admin.email}`);
  console.log(`   Role  : ${admin.role}`);

  await mongoose.disconnect();
  console.log("🔌 Disconnected from MongoDB");
};

seedAdmin().catch((err) => {
  console.error("❌ Seed failed:", err.message);
  process.exit(1);
});