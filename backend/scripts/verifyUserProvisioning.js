/**
 * User Provisioning Verification Script
 *
 * Usage:
 *   node backend/scripts/verifyUserProvisioning.js
 *   node backend/scripts/verifyUserProvisioning.js <clerkId>
 *   node backend/scripts/verifyUserProvisioning.js --email <email>
 *
 * This script verifies that users are properly provisioned in MongoDB Atlas
 * with the correct clerkId field and can be found via multiple lookup methods.
 */

import { users as usersCollection } from "../config/mongoCollections.js";
import { dbConnection, closeConnection } from "../config/mongoConnection.js";
import dotenv from "dotenv";

dotenv.config();

async function verifyUserProvisioning(searchParam = null, searchType = "all") {
  console.log("\n=== USER PROVISIONING VERIFICATION ===\n");

  try {
    const db = await dbConnection();
    const users = await usersCollection();

    // Log connection info
    const dbName = db.databaseName;
    const collectionName = users.collectionName || users.s?.namespace?.collection || "unknown";
    console.log("📊 Database Info:");
    console.log(`   Database: ${dbName}`);
    console.log(`   Collection: ${collectionName}`);
    console.log();

    // Check indexes
    console.log("🔍 Checking Indexes:");
    const indexes = await users.indexes();
    const hasClerkIdIndex = indexes.some((idx) =>
      idx.name.includes("clerkId") || JSON.stringify(idx.key).includes("clerkId")
    );
    const hasEmailIndex = indexes.some((idx) =>
      idx.name.includes("email") || JSON.stringify(idx.key).includes("email")
    );

    console.log(`   ✓ clerkId index: ${hasClerkIdIndex ? "EXISTS" : "MISSING ⚠️"}`);
    console.log(`   ✓ email index: ${hasEmailIndex ? "EXISTS" : "MISSING ⚠️"}`);
    console.log();

    // Verify specific user if provided
    if (searchParam) {
      console.log(`🔎 Searching for user: ${searchParam} (${searchType})`);
      let user;

      if (searchType === "clerkId") {
        user = await users.findOne({ clerkId: searchParam });
      } else if (searchType === "email") {
        user = await users.findOne({ email: searchParam });
      }

      if (user) {
        console.log("\n✅ User Found!");
        console.log("   Document:");
        console.log(`      _id: ${user._id}`);
        console.log(`      clerkId: ${user.clerkId || "MISSING ⚠️"}`);
        console.log(`      email: ${user.email}`);
        console.log(`      firstName: ${user.firstName}`);
        console.log(`      lastName: ${user.lastName}`);
        console.log(`      role: ${user.role}`);
        console.log(`      department: ${user.department}`);
        console.log(`      createdAt: ${user.createdAt || "N/A"}`);
        console.log(`      updatedAt: ${user.updatedAt || "N/A"}`);
      } else {
        console.log("\n❌ User NOT Found!");
        console.log(`   No user with ${searchType}: ${searchParam}`);
      }
      console.log();
    }

    // Overall stats
    console.log("📈 Collection Statistics:");
    const totalUsers = await users.countDocuments({});
    const usersWithClerkId = await users.countDocuments({ clerkId: { $exists: true } });
    const usersWithoutClerkId = totalUsers - usersWithClerkId;

    console.log(`   Total users: ${totalUsers}`);
    console.log(`   Users with clerkId: ${usersWithClerkId}`);
    console.log(`   Users without clerkId: ${usersWithoutClerkId}${usersWithoutClerkId > 0 ? " ⚠️" : ""}`);

    if (usersWithoutClerkId > 0) {
      console.log("\n⚠️  WARNING: Some users are missing clerkId!");
      console.log("   Run migration script: node backend/helpers/addClerkIdToSeedUsers.js");
    }

    // Sample users
    console.log("\n📋 Sample Users (first 5):");
    const sampleUsers = await users.find({}).limit(5).toArray();

    if (sampleUsers.length === 0) {
      console.log("   No users found in database");
    } else {
      sampleUsers.forEach((user, idx) => {
        console.log(`   ${idx + 1}. ${user.email}`);
        console.log(`      _id: ${user._id}`);
        console.log(`      clerkId: ${user.clerkId || "MISSING ⚠️"}`);
        console.log(`      name: ${user.firstName} ${user.lastName}`);
      });
    }

    console.log("\n✅ Verification Complete!\n");
  } catch (error) {
    console.error("\n❌ Verification Failed!");
    console.error("Error:", error.message);
    console.error("Stack:", error.stack);
    throw error;
  } finally {
    await closeConnection();
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
let searchParam = null;
let searchType = "all";

if (args.length > 0) {
  if (args[0] === "--email" && args[1]) {
    searchParam = args[1];
    searchType = "email";
  } else if (args[0] === "--help" || args[0] === "-h") {
    console.log("\nUsage:");
    console.log("  node backend/scripts/verifyUserProvisioning.js              # Show all stats");
    console.log("  node backend/scripts/verifyUserProvisioning.js <clerkId>    # Find by clerkId");
    console.log("  node backend/scripts/verifyUserProvisioning.js --email <email> # Find by email");
    console.log();
    process.exit(0);
  } else {
    searchParam = args[0];
    searchType = "clerkId";
  }
}

// Run verification
verifyUserProvisioning(searchParam, searchType)
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
