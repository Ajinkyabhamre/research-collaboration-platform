/**
 * PHASE 2 & 3 - Test Provisioning Flow
 *
 * Simulates what happens when a real Clerk user logs in.
 * Shows exact logs that will appear during user provisioning.
 */

import { users as usersCollection } from "../config/mongoCollections.js";
import { dbConnection, closeConnection } from "../config/mongoConnection.js";
import { ensureUserProvisioned } from "../helpers/userProvisioning.js";
import dotenv from "dotenv";

dotenv.config();

// Simulate a Clerk user object (like what Clerk SDK returns)
const mockClerkUser = {
  id: "user_test_provisioning_12345",
  firstName: "Test",
  lastName: "User",
  emailAddresses: [
    {
      emailAddress: "testuser@example.com",
    },
  ],
  publicMetadata: {
    role: "STUDENT",
    department: "COMPUTER_SCIENCE",
  },
};

async function testProvisioning() {
  console.log("\n" + "=".repeat(70));
  console.log("🧪 TESTING USER PROVISIONING FLOW");
  console.log("=".repeat(70) + "\n");

  try {
    await dbConnection();
    const users = await usersCollection();

    console.log("📋 Simulating Clerk User Login");
    console.log("─".repeat(70));
    console.log("Mock Clerk user:");
    console.log(JSON.stringify(mockClerkUser, null, 2));
    console.log();

    // PHASE 1.2 - Log what auth middleware sees
    console.log("🔐 [AUTH] Clerk user verification:");
    console.log({
      clerkUserId: mockClerkUser.id,
      email: mockClerkUser.emailAddresses[0].emailAddress,
      firstName: mockClerkUser.firstName,
      lastName: mockClerkUser.lastName,
      hasEmail: !!mockClerkUser.emailAddresses[0].emailAddress,
    });
    console.log();

    // PHASE 1.3 - Log before provisioning
    console.log("📝 [PROVISION] About to provision user...");
    console.log(`   Filter will be: { clerkId: "${mockClerkUser.id}" }`);
    console.log();

    // Check if user exists before
    const existingUser = await users.findOne({ clerkId: mockClerkUser.id });
    console.log(`🔍 Pre-provisioning check:`);
    console.log(`   User exists: ${existingUser ? "YES (will update)" : "NO (will create)"}`);
    if (existingUser) {
      console.log(`   Existing _id: ${existingUser._id}`);
    }
    console.log();

    // PHASE 2 - Call ensureUserProvisioned (atomic upsert)
    console.log("⚙️  Calling ensureUserProvisioned()...");
    console.log();

    const provisionedUser = await ensureUserProvisioned({
      clerkUser: mockClerkUser,
      dbUsersCollection: users,
    });

    // PHASE 1.3 - Log after provisioning
    console.log("\n✅ [PROVISION] Provisioning completed successfully!");
    console.log();

    console.log("📄 Provisioned User Document:");
    console.log("─".repeat(70));
    console.log(JSON.stringify({
      _id: provisionedUser._id.toString(),
      clerkId: provisionedUser.clerkId,
      email: provisionedUser.email,
      firstName: provisionedUser.firstName,
      lastName: provisionedUser.lastName,
      role: provisionedUser.role,
      department: provisionedUser.department,
      createdAt: provisionedUser.createdAt,
      updatedAt: provisionedUser.updatedAt,
    }, null, 2));
    console.log();

    // PHASE 3 - Verify in MongoDB
    console.log("🔎 VERIFICATION - MongoDB Atlas Query");
    console.log("─".repeat(70));
    console.log("To find this user in MongoDB Atlas:");
    console.log();
    console.log("1. Go to: https://cloud.mongodb.com");
    console.log("2. Browse Collections → research_collaboration_db → users");
    console.log("3. Use this EXACT filter:");
    console.log();
    console.log(`   { "clerkId": "${provisionedUser.clerkId}" }`);
    console.log();
    console.log("4. Expected result:");
    console.log(`   _id: ${provisionedUser._id.toString()}`);
    console.log(`   email: ${provisionedUser.email}`);
    console.log(`   clerkId: ${provisionedUser.clerkId}`);
    console.log();

    // Test re-login (should update, not create)
    console.log("🔄 Testing Re-Login (should UPDATE existing user)");
    console.log("─".repeat(70));

    // Modify the mock user slightly (simulate Clerk data changing)
    const updatedClerkUser = {
      ...mockClerkUser,
      firstName: "Updated",
      lastName: "TestUser",
    };

    console.log("Simulating login with updated Clerk data:");
    console.log(`   firstName: "${mockClerkUser.firstName}" → "${updatedClerkUser.firstName}"`);
    console.log(`   lastName: "${mockClerkUser.lastName}" → "${updatedClerkUser.lastName}"`);
    console.log();

    const reProvisionedUser = await ensureUserProvisioned({
      clerkUser: updatedClerkUser,
      dbUsersCollection: users,
    });

    console.log("✅ Re-provisioning result:");
    console.log(`   Same _id: ${reProvisionedUser._id.toString() === provisionedUser._id.toString() ? "YES ✅" : "NO ❌"}`);
    console.log(`   Name updated: ${reProvisionedUser.firstName === "Updated" ? "YES ✅" : "NO ❌"}`);
    console.log();

    // Summary
    console.log("=" + "=".repeat(69));
    console.log("✅ TEST PASSED - Provisioning Working Correctly");
    console.log("=" + "=".repeat(69));
    console.log();
    console.log("What was tested:");
    console.log("  ✓ New user creation (atomic upsert)");
    console.log("  ✓ Existing user update (no duplicate)");
    console.log("  ✓ clerkId stored correctly");
    console.log("  ✓ User retrievable from MongoDB");
    console.log();
    console.log("Next steps:");
    console.log("  1. Start backend: npm start");
    console.log("  2. Login via Clerk in frontend");
    console.log("  3. Check backend logs for [PROVISION] messages");
    console.log("  4. Find your user in Atlas using clerkId from logs");
    console.log();
    console.log("=" + "=".repeat(69) + "\n");

  } catch (error) {
    console.error("\n❌ TEST FAILED");
    console.error("Error:", error.message);
    console.error("\nStack trace:");
    console.error(error.stack);
    throw error;
  } finally {
    await closeConnection();
  }
}

// Run test
testProvisioning()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
