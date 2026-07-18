/**
 * Reset admin credentials script.
 * Run with: node src/scripts/reset-admin.js
 *
 * Sets the admin to:
 *   Email:    admin@admin.com
 *   Password: admin123
 */

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Admin = require('../models/Admin');

async function resetAdmin() {
  try {
    await connectDB();
    console.log('\n🔑 Resetting admin credentials...\n');

    // Remove all existing admins
    await Admin.deleteMany({});
    console.log('  🧹 Cleared existing admin accounts');

    // Create new admin with simple credentials
    const admin = await Admin.create({
      email: 'admin@admin.com',
      password: 'admin123',
      name: 'Admin',
    });

    console.log('  ✅ Admin account created:');
    console.log('    Email:    admin@admin.com');
    console.log('    Password: admin123');
    console.log(`\n🎉 Done!\n`);

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Failed:', error.message);
    process.exit(1);
  }
}

resetAdmin();
