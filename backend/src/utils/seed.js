require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Group = require('../models/Group');
const Payment = require('../models/Payment');

const seed = async () => {
  await connectDB();
  console.log('🌱 Seeding database...');

  // Clean existing data
  await User.deleteMany({});
  await Group.deleteMany({});
  await Payment.deleteMany({});

  // Create admin user
  const admin = await User.create({
    name: 'Chidi Okafor',
    email: 'chidi@ajomanager.com',
    phone: '+2348012345678',
    password: 'password123',
    role: 'admin',
  });

  console.log(`✅ Admin created: ${admin.email}`);

  // Create a sample group
  const group = await Group.create({
    name: 'Lagos Friends Ajo 2024',
    adminId: admin._id,
    description: 'Monthly savings circle for close friends',
    contributionAmount: 50000,
    currency: 'NGN',
    frequency: 'monthly',
    totalMembers: 6,
    startDate: new Date('2024-01-01'),
    status: 'active',
    turnOrderLocked: true,
    currentCycle: 3,
    members: [
      { name: 'Chidi Okafor',    phone: '+2348012345678', email: 'chidi@example.com',   turnOrder: 1, hasPaid: true,  hasCollected: true  },
      { name: 'Ngozi Adeyemi',   phone: '+2348023456789', email: 'ngozi@example.com',   turnOrder: 2, hasPaid: true,  hasCollected: true  },
      { name: 'Emeka Nwachukwu', phone: '+2348034567890', email: 'emeka@example.com',   turnOrder: 3, hasPaid: false, hasCollected: false },
      { name: 'Bisi Fashola',    phone: '+2348045678901', email: 'bisi@example.com',    turnOrder: 4, hasPaid: true,  hasCollected: false },
      { name: 'Kemi Adesanya',   phone: '+2348056789012', email: 'kemi@example.com',    turnOrder: 5, hasPaid: false, hasCollected: false },
      {
        name: 'Tunde Bakare',
        phone: '+2348067890123',
        email: 'tunde@example.com',
        turnOrder: 6,
        hasPaid: false,
        hasCollected: false,
        joinedMidCycle: true,
        joinedAtCycle: 2,
        adjustmentOwed: 50000, // missed 1 cycle
        adjustmentPaid: false,
      },
    ],
  });

  // Add group to admin's groups
  await User.findByIdAndUpdate(admin._id, { $push: { groups: group._id } });

  console.log(`✅ Group created: ${group.name}`);
  console.log(`   Members: ${group.members.length}`);
  console.log(`   Current cycle: ${group.currentCycle}`);
  console.log(`   Pot total: ₦${group.potTotal.toLocaleString()}`);

  // Seed some payments
  const member1 = group.members[0];
  const member2 = group.members[1];

  await Payment.insertMany([
    { groupId: group._id, memberId: member1._id, memberName: member1.name, cycle: 1, amount: 50000, type: 'contribution', method: 'bank_transfer', recordedBy: admin._id },
    { groupId: group._id, memberId: member2._id, memberName: member2.name, cycle: 1, amount: 50000, type: 'contribution', method: 'cash', recordedBy: admin._id },
    { groupId: group._id, memberId: member1._id, memberName: member1.name, cycle: 2, amount: 50000, type: 'contribution', method: 'bank_transfer', recordedBy: admin._id },
    { groupId: group._id, memberId: member2._id, memberName: member2.name, cycle: 2, amount: 50000, type: 'contribution', method: 'cash', recordedBy: admin._id },
  ]);

  console.log(`✅ Payments seeded`);
  console.log('\n📋 Login credentials:');
  console.log('   Email:    chidi@ajomanager.com');
  console.log('   Password: password123\n');

  process.exit(0);
};

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
