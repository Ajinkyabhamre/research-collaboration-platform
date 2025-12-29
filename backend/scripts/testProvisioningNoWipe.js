/**
 * PHASE 3 - Test Provisioning Doesn't Wipe Profile Fields
 *
 * Purpose: Verify that ensureUserProvisioned does NOT overwrite profile fields
 *
 * Test:
 * 1. Find a real Clerk user with profile data (e.g., user_3761UMiE188BkFQSd69aVRiuX7F)
 * 2. Manually set a test value for headline
 * 3. Call ensureUserProvisioned (simulating a login)
 * 4. Verify that headline still has the test value (not wiped to null)
 */

import { users as usersCollection } from "../config/mongoCollections.js";
import { dbConnection, closeConnection } from "../config/mongoConnection.js";
import { ensureUserProvisioned } from "../helpers/userProvisioning.js";
import dotenv from "dotenv";

dotenv.config();

async function testProvisioningNoWipe() {
  console.log("\n" + "=".repeat(80));
  console.log("🧪 PHASE 3 - TEST PROVISIONING NO-WIPE");
  console.log("=".repeat(80) + "\n");

  try {
    // Connect to database
    await dbConnection();
    const users = await usersCollection();

    // STEP 1: Find a real Clerk user (not seed, not archived)
    console.log("📊 Finding a real Clerk user for testing...");
    const testUser = await users.findOne({
      clerkId: /^user_/,
      isArchived: { $ne: true },
    });

    if (!testUser) {
      console.log("❌ No real Clerk user found for testing");
      return;
    }

    console.log(`   Found user: ${testUser.clerkId} (${testUser.email})`);
    console.log(`   _id: ${testUser._id}`);
    console.log();

    // STEP 2: Set a test headline
    const TEST_HEADLINE = "SHOULD_STAY_AFTER_PROVISIONING";
    const TEST_BIO = "This bio should also remain unchanged";

    console.log("📝 Setting test values for headline and bio...");
    await users.updateOne(
      { _id: testUser._id },
      {
        $set: {
          headline: TEST_HEADLINE,
          bio: TEST_BIO,
        },
      }
    );
    console.log(`   ✓ Set headline to: "${TEST_HEADLINE}"`);
    console.log(`   ✓ Set bio to: "${TEST_BIO}"`);
    console.log();

    // STEP 3: Verify values were set
    const userBeforeProvisioning = await users.findOne({ _id: testUser._id });
    console.log("📸 BEFORE PROVISIONING:");
    console.log(`   headline: ${userBeforeProvisioning.headline}`);
    console.log(`   bio:      ${userBeforeProvisioning.bio}`);
    console.log();

    // STEP 4: Simulate Clerk user object and call ensureUserProvisioned
    console.log("🔄 Simulating provisioning (as if user just logged in)...");

    const mockClerkUser = {
      id: testUser.clerkId,
      emailAddresses: [{ emailAddress: testUser.email }],
      firstName: testUser.firstName || "Test",
      lastName: testUser.lastName || "User",
      publicMetadata: {
        role: testUser.role || "STUDENT",
        department: testUser.department || "COMPUTER_SCIENCE",
      },
    };

    console.log(`   Mock Clerk user: ${mockClerkUser.id}`);
    console.log(`   Email: ${mockClerkUser.emailAddresses[0].emailAddress}`);
    console.log();

    const provisionedUser = await ensureUserProvisioned({
      clerkUser: mockClerkUser,
      dbUsersCollection: users,
    });

    console.log("✓ Provisioning completed");
    console.log();

    // STEP 5: Verify values are still there
    const userAfterProvisioning = await users.findOne({ _id: testUser._id });
    console.log("📸 AFTER PROVISIONING:");
    console.log(`   headline: ${userAfterProvisioning.headline}`);
    console.log(`   bio:      ${userAfterProvisioning.bio}`);
    console.log();

    // STEP 6: Compare and report
    console.log("=".repeat(80));
    console.log("📋 TEST RESULTS:");
    console.log("=".repeat(80));

    const headlinePreserved = userAfterProvisioning.headline === TEST_HEADLINE;
    const bioPreserved = userAfterProvisioning.bio === TEST_BIO;

    if (headlinePreserved && bioPreserved) {
      console.log("✅ PASS: Profile fields preserved after provisioning");
      console.log(`   ✓ headline remained: "${TEST_HEADLINE}"`);
      console.log(`   ✓ bio remained:      "${TEST_BIO}"`);
    } else {
      console.log("❌ FAIL: Profile fields were wiped!");
      if (!headlinePreserved) {
        console.log(`   ✗ headline changed from "${TEST_HEADLINE}" to "${userAfterProvisioning.headline}"`);
      }
      if (!bioPreserved) {
        console.log(`   ✗ bio changed from "${TEST_BIO}" to "${userAfterProvisioning.bio}"`);
      }
    }

    console.log("=".repeat(80));
    console.log();

    // STEP 7: Verify updatedAt changed (identity fields should be updated)
    const updatedAtChanged =
      userAfterProvisioning.updatedAt &&
      userBeforeProvisioning.updatedAt &&
      new Date(userAfterProvisioning.updatedAt) > new Date(userBeforeProvisioning.updatedAt);

    console.log("📊 Additional checks:");
    if (updatedAtChanged) {
      console.log("   ✓ updatedAt was refreshed (identity fields updated)");
    } else {
      console.log("   ⚠️  updatedAt was not refreshed");
    }
    console.log();

    // STEP 8: Cleanup - restore original values if they existed
    console.log("🧹 Cleaning up test data...");
    await users.updateOne(
      { _id: testUser._id },
      {
        $set: {
          headline: testUser.headline || null,
          bio: testUser.bio || null,
        },
      }
    );
    console.log("   ✓ Restored original values");
    console.log();

    if (headlinePreserved && bioPreserved) {
      console.log("🎉 PHASE 3 VERIFICATION: SUCCESS");
      console.log("   ensureUserProvisioned correctly preserves profile fields");
    } else {
      console.log("⚠️  PHASE 3 VERIFICATION: FAILED");
      console.log("   ensureUserProvisioned is wiping profile fields!");
    }
    console.log();
  } catch (error) {
    console.error("\n❌ TEST FAILED:", error);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await closeConnection();
  }
}

// Run the test
testProvisioningNoWipe();
