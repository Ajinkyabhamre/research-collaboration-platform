// checkUsers.js
// Purpose: Check if users exist in MongoDB Atlas for testing user search
// Usage: cd backend && node tasks/checkUsers.js

import { dbConnection, closeConnection } from '../config/mongoConnection.js';

const checkUsers = async () => {
  console.log('🔍 Checking users in MongoDB Atlas...\n');

  try {
    const db = await dbConnection();
    const users = db.collection('users');

    // Count total users
    const totalUsers = await users.countDocuments();
    console.log(`📊 Total users in database: ${totalUsers}\n`);

    if (totalUsers === 0) {
      console.log('❌ No users found!');
      console.log('   Run "npm run seed" to create test users\n');
      return;
    }

    // Get first 10 users
    console.log('👥 First 10 users:\n');
    const userList = await users
      .find({}, {
        projection: {
          firstName: 1,
          lastName: 1,
          email: 1,
          role: 1,
          department: 1,
          clerkId: 1
        }
      })
      .limit(10)
      .toArray();

    userList.forEach((user, index) => {
      console.log(`${index + 1}. ${user.firstName} ${user.lastName}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Clerk ID: ${user.clerkId || 'Not set'}`);
      console.log(`   MongoDB ID: ${user._id}`);
      console.log('');
    });

    // Test search functionality
    console.log('🔍 Testing search functionality...\n');

    // Search for users with "a" in name
    const searchResults = await users
      .find({
        $or: [
          { firstName: { $regex: 'a', $options: 'i' } },
          { lastName: { $regex: 'a', $options: 'i' } }
        ]
      })
      .limit(5)
      .toArray();

    console.log(`Found ${searchResults.length} users with "a" in their name:`);
    searchResults.forEach(user => {
      console.log(`  - ${user.firstName} ${user.lastName}`);
    });

    console.log('\n✅ User check complete!');
    console.log('\n💡 To test user search:');
    console.log('   1. Go to http://localhost:8080/messaging');
    console.log('   2. Click "New Message"');
    console.log('   3. Search for one of the names above');

  } catch (error) {
    console.error('❌ Error checking users:', error.message);
    throw error;
  } finally {
    await closeConnection();
  }
};

// Execute
checkUsers()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n💥 Failed:', err);
    process.exit(1);
  });
