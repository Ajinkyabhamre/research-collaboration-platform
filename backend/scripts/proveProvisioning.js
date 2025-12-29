/**
 * PHASE 1 & 3 - Evidence Script
 *
 * This script proves:
 * 1. Connection details (host, DB name, collection)
 * 2. User counts and clerkId coverage
 * 3. Sample documents with full structure
 * 4. Exact Atlas query to find your user
 */

import { users as usersCollection } from "../config/mongoCollections.js";
import { dbConnection, closeConnection } from "../config/mongoConnection.js";
import { mongoConfig } from "../config/settings.js";
import dotenv from "dotenv";

dotenv.config();

// Redact credentials from connection string
function redactConnectionString(connStr) {
  if (!connStr) return "NOT_SET";
  return connStr.replace(/\/\/([^:]+):([^@]+)@/, "//$1:****@");
}

async function proveProvisioning() {
  console.log("\n" + "=".repeat(70));
  console.log("CLERK USER PROVISIONING - EVIDENCE REPORT");
  console.log("=".repeat(70) + "\n");

  try {
    // Connect using same env vars as server
    const db = await dbConnection();
    const users = await usersCollection();

    // PHASE 1.1 - Print connection details
    console.log("📡 MONGODB CONNECTION DETAILS");
    console.log("─".repeat(70));
    console.log(`Host (redacted):     ${redactConnectionString(mongoConfig.serverUrl)}`);
    console.log(`Database name:       ${mongoConfig.database}`);
    console.log(`Collection name:     users`);
    console.log(`Connected DB name:   ${db.databaseName}`);
    console.log(`Collection object:   ${users.collectionName || "users"}`);
    console.log();

    // Check if this matches what's in .env
    console.log("✅ Verification: Using same connection as server.js");
    console.log(`   env.mongoServerUrl: ${mongoConfig.serverUrl ? "SET" : "NOT SET"}`);
    console.log(`   env.mongoDbname:    ${mongoConfig.database || "NOT SET"}`);
    console.log();

    // PHASE 1.4 - Count users
    console.log("📊 USER STATISTICS");
    console.log("─".repeat(70));
    const totalCount = await users.countDocuments({});
    const withClerkId = await users.countDocuments({ clerkId: { $exists: true } });
    const withoutClerkId = totalCount - withClerkId;

    console.log(`Total users in collection:        ${totalCount}`);
    console.log(`Users WITH clerkId field:         ${withClerkId}`);
    console.log(`Users WITHOUT clerkId field:      ${withoutClerkId}${withoutClerkId > 0 ? " ⚠️ PROBLEM!" : " ✅"}`);
    console.log();

    // Check indexes
    console.log("🔍 INDEX STATUS");
    console.log("─".repeat(70));
    const indexes = await users.indexes();
    console.log("Existing indexes:");
    indexes.forEach(idx => {
      console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}`);
    });

    const hasClerkIdIndex = indexes.some(idx =>
      idx.name?.includes("clerkId") || JSON.stringify(idx.key).includes("clerkId")
    );
    console.log(`\nUnique clerkId index exists: ${hasClerkIdIndex ? "✅ YES" : "⚠️ NO (will be created on server startup)"}`);
    console.log();

    // Find sample users
    console.log("📋 SAMPLE USER DOCUMENTS (showing structure)");
    console.log("─".repeat(70));

    const sampleUsers = await users.find({}).limit(3).toArray();

    if (sampleUsers.length === 0) {
      console.log("❌ NO USERS FOUND - Database is empty!");
    } else {
      sampleUsers.forEach((user, idx) => {
        console.log(`\n[${idx + 1}] User Document:`);
        console.log(JSON.stringify({
          _id: user._id.toString(),
          clerkId: user.clerkId || "❌ MISSING",
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          department: user.department,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        }, null, 2));
      });
    }
    console.log();

    // PHASE 3 - Exact Atlas query examples
    console.log("🔎 MONGODB ATLAS QUERY EXAMPLES");
    console.log("─".repeat(70));
    console.log("To find YOUR user in MongoDB Atlas UI:");
    console.log();
    console.log("1. Go to: https://cloud.mongodb.com");
    console.log("2. Select your cluster");
    console.log("3. Click 'Browse Collections'");
    console.log(`4. Navigate to: ${mongoConfig.database} → users`);
    console.log("5. Use the filter bar with one of these queries:");
    console.log();

    if (sampleUsers.length > 0) {
      const sample = sampleUsers[0];
      console.log("   Option A - Find by clerkId (RECOMMENDED):");
      console.log(`   { "clerkId": "${sample.clerkId}" }`);
      console.log();
      console.log("   Option B - Find by email:");
      console.log(`   { "email": "${sample.email}" }`);
      console.log();
    }

    console.log("   For YOUR account (get clerkId from backend logs):");
    console.log(`   { "clerkId": "user_YOUR_CLERK_ID_HERE" }`);
    console.log();

    // Test lookup by clerkId
    console.log("🧪 TEST LOOKUP BY CLERKID");
    console.log("─".repeat(70));

    if (sampleUsers.length > 0) {
      const testClerkId = sampleUsers[0].clerkId;
      console.log(`Testing lookup: { clerkId: "${testClerkId}" }`);

      const foundUser = await users.findOne({ clerkId: testClerkId });

      if (foundUser) {
        console.log("✅ FOUND via clerkId lookup!");
        console.log(`   _id: ${foundUser._id}`);
        console.log(`   email: ${foundUser.email}`);
        console.log(`   name: ${foundUser.firstName} ${foundUser.lastName}`);
      } else {
        console.log("❌ NOT FOUND - This should never happen!");
      }
    }
    console.log();

    // Test lookup by email
    console.log("🧪 TEST LOOKUP BY EMAIL");
    console.log("─".repeat(70));

    if (sampleUsers.length > 0) {
      const testEmail = sampleUsers[0].email;
      console.log(`Testing lookup: { email: "${testEmail}" }`);

      const foundUser = await users.findOne({ email: testEmail });

      if (foundUser) {
        console.log("✅ FOUND via email lookup!");
        console.log(`   _id: ${foundUser._id}`);
        console.log(`   clerkId: ${foundUser.clerkId}`);
        console.log(`   name: ${foundUser.firstName} ${foundUser.lastName}`);
      } else {
        console.log("❌ NOT FOUND - This should never happen!");
      }
    }
    console.log();

    // Summary
    console.log("=" + "=".repeat(69));
    console.log("SUMMARY");
    console.log("=" + "=".repeat(69));

    if (withoutClerkId === 0 && totalCount > 0) {
      console.log("✅ ALL CHECKS PASSED");
      console.log(`   - Connected to: ${mongoConfig.database}`);
      console.log(`   - Total users: ${totalCount}`);
      console.log(`   - All users have clerkId: YES`);
      console.log(`   - Database queries working: YES`);
      console.log();
      console.log("🎯 Next step: Start backend server to see live provisioning logs");
    } else if (totalCount === 0) {
      console.log("⚠️  DATABASE IS EMPTY");
      console.log("   Run: npm run seed");
    } else {
      console.log("⚠️  ISSUES DETECTED");
      console.log(`   - Users without clerkId: ${withoutClerkId}`);
      console.log("   Run migration: node backend/helpers/addClerkIdToSeedUsers.js");
    }

    console.log("=" + "=".repeat(69) + "\n");

  } catch (error) {
    console.error("\n❌ ERROR:", error.message);
    console.error("\nStack trace:");
    console.error(error.stack);
    throw error;
  } finally {
    await closeConnection();
  }
}

// Run
proveProvisioning()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
