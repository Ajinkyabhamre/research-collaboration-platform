/**
 * PHASE 0 - Identity Audit Script
 *
 * Purpose: Fingerprint current state of user identity in MongoDB
 * - Print DB connection details
 * - Find duplicate users by email
 * - Find duplicate users by clerkId (should be none due to unique index)
 * - Specifically audit abhamre50@gmail.com
 */

import { users as usersCollection } from "../config/mongoCollections.js";
import { dbConnection, closeConnection } from "../config/mongoConnection.js";
import dotenv from "dotenv";

dotenv.config();

async function identityAudit() {
  console.log("\n" + "=".repeat(80));
  console.log("🔍 PHASE 0 - IDENTITY AUDIT");
  console.log("=".repeat(80) + "\n");

  try {
    // Connect to database
    const db = await dbConnection();
    const users = await usersCollection();

    // STEP 1: Print database connection info (redact credentials)
    console.log("📡 DATABASE CONNECTION INFO:");
    const redactedUrl = process.env.mongoServerUrl
      ? process.env.mongoServerUrl.replace(/\/\/([^:]+):([^@]+)@/, "//$1:****@")
      : "NOT_SET";

    const dbName = db.databaseName || process.env.mongoDbname || "unknown";
    const collectionName = users.collectionName || users.s?.namespace?.collection || "users";
    const clusterHost = redactedUrl.match(/@([^/]+)/)?.[1] || "unknown";

    console.log(`   Cluster Host: ${clusterHost}`);
    console.log(`   Database:     ${dbName}`);
    console.log(`   Collection:   ${collectionName}`);
    console.log();

    // STEP 2: Audit specific user - abhamre50@gmail.com
    console.log("👤 AUDITING USER: abhamre50@gmail.com");
    console.log("-".repeat(80));

    const targetEmail = "abhamre50@gmail.com";
    const targetUsers = await users.find({ email: targetEmail }).toArray();

    if (targetUsers.length === 0) {
      console.log("   ⚠️  No users found with this email");
    } else {
      console.log(`   Found ${targetUsers.length} user(s) with email: ${targetEmail}\n`);

      targetUsers.forEach((user, index) => {
        const isArchived = user.isArchived === true;
        const archivedLabel = isArchived ? " [ARCHIVED]" : "";
        console.log(`   [${index + 1}] User Document:${archivedLabel}`);
        console.log(`       _id:          ${user._id}`);
        console.log(`       clerkId:      ${user.clerkId}`);
        console.log(`       email:        ${user.email}`);
        console.log(`       firstName:    ${user.firstName}`);
        console.log(`       lastName:     ${user.lastName}`);
        console.log(`       createdAt:    ${user.createdAt || "N/A"}`);
        console.log(`       updatedAt:    ${user.updatedAt || "N/A"}`);
        if (isArchived) {
          console.log(`       isArchived:   ${user.isArchived}`);
          console.log(`       archivedAt:   ${user.archivedAt || "N/A"}`);
          console.log(`       mergedInto:   ${user.mergedInto || "N/A"}`);
        }
        console.log(`       headline:     ${user.headline || "null"}`);
        console.log(`       bio:          ${user.bio ? `"${user.bio.substring(0, 50)}..."` : "null"}`);
        console.log(`       profilePhoto: ${user.profilePhoto || "null"}`);
        console.log(`       coverPhoto:   ${user.coverPhoto || "null"}`);
        console.log(`       skills:       ${user.skills ? `[${user.skills.length} items]` : "null/empty"}`);
        console.log(`       education:    ${user.education ? `[${user.education.length} items]` : "null/empty"}`);
        console.log(`       experience:   ${user.experience ? `[${user.experience.length} items]` : "null/empty"}`);
        console.log();
      });

      // Detect duplicates (excluding archived users)
      const activeUsers = targetUsers.filter(u => !u.isArchived);
      if (targetUsers.length > 1) {
        if (activeUsers.length > 1) {
          console.log(`   ⚠️  DUPLICATE DETECTED: ${activeUsers.length} ACTIVE users share email ${targetEmail}`);
          console.log(`       Active ClerkIds: ${activeUsers.map(u => u.clerkId).join(", ")}`);
        } else {
          console.log(`   ✅ Duplicate resolved: ${targetUsers.length - activeUsers.length} archived, ${activeUsers.length} active`);
        }
        console.log();
      }
    }

    // STEP 3: Find ALL duplicate emails in database
    console.log("\n📊 SCANNING FOR ALL DUPLICATE EMAILS:");
    console.log("-".repeat(80));

    const duplicatesByEmail = await users.aggregate([
      {
        $group: {
          _id: "$email",
          count: { $sum: 1 },
          clerkIds: { $push: "$clerkId" },
          userIds: { $push: "$_id" },
        },
      },
      {
        $match: {
          count: { $gt: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
      {
        $limit: 20,
      },
    ]).toArray();

    if (duplicatesByEmail.length === 0) {
      console.log("   ✅ No duplicate emails found!");
    } else {
      console.log(`   ⚠️  Found ${duplicatesByEmail.length} email(s) with duplicates:\n`);

      duplicatesByEmail.forEach((dup, index) => {
        console.log(`   [${index + 1}] Email: ${dup._id}`);
        console.log(`       Count:     ${dup.count}`);
        console.log(`       ClerkIds:  ${dup.clerkIds.join(", ")}`);
        console.log(`       UserIds:   ${dup.userIds.map(id => id.toString()).join(", ")}`);
        console.log();
      });
    }

    // STEP 4: Find duplicate clerkIds (should be none due to unique index)
    console.log("\n📊 SCANNING FOR DUPLICATE CLERK IDs:");
    console.log("-".repeat(80));

    const duplicatesByClerkId = await users.aggregate([
      {
        $group: {
          _id: "$clerkId",
          count: { $sum: 1 },
          emails: { $push: "$email" },
          userIds: { $push: "$_id" },
        },
      },
      {
        $match: {
          count: { $gt: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]).toArray();

    if (duplicatesByClerkId.length === 0) {
      console.log("   ✅ No duplicate clerkIds found (as expected)");
    } else {
      console.log(`   ⚠️  UNEXPECTED: Found ${duplicatesByClerkId.length} clerkId(s) with duplicates:\n`);

      duplicatesByClerkId.forEach((dup, index) => {
        console.log(`   [${index + 1}] ClerkId: ${dup._id}`);
        console.log(`       Count:   ${dup.count}`);
        console.log(`       Emails:  ${dup.emails.join(", ")}`);
        console.log(`       UserIds: ${dup.userIds.map(id => id.toString()).join(", ")}`);
        console.log();
      });
    }

    // STEP 5: Count seed users vs real Clerk users
    console.log("\n📊 USER TYPE BREAKDOWN:");
    console.log("-".repeat(80));

    const totalUsers = await users.countDocuments({});
    const seedUsers = await users.countDocuments({ clerkId: /^seed_clerk_/ });
    const realClerkUsers = await users.countDocuments({ clerkId: /^user_/ });
    const otherUsers = totalUsers - seedUsers - realClerkUsers;

    console.log(`   Total users:        ${totalUsers}`);
    console.log(`   Seed users:         ${seedUsers} (clerkId starts with "seed_clerk_")`);
    console.log(`   Real Clerk users:   ${realClerkUsers} (clerkId starts with "user_")`);
    console.log(`   Other users:        ${otherUsers}`);
    console.log();

    // STEP 6: Summary
    console.log("\n" + "=".repeat(80));
    console.log("📋 AUDIT SUMMARY:");
    console.log("=".repeat(80));
    console.log(`✓ Database:              ${dbName} @ ${clusterHost}`);
    console.log(`✓ Collection:            ${collectionName}`);
    console.log(`✓ Total users:           ${totalUsers}`);
    console.log(`✓ Duplicate emails:      ${duplicatesByEmail.length}`);
    console.log(`✓ Duplicate clerkIds:    ${duplicatesByClerkId.length}`);
    console.log(`✓ Target email status:   ${targetUsers.length === 0 ? "NOT FOUND" : targetUsers.length === 1 ? "OK (single user)" : `DUPLICATE (${targetUsers.length} users)`}`);
    console.log("=".repeat(80) + "\n");

  } catch (error) {
    console.error("\n❌ AUDIT FAILED:", error);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await closeConnection();
  }
}

// Run the audit
identityAudit();
