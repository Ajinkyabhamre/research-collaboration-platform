/**
 * Migration Helper: Add clerkId to seed users
 *
 * This script adds a clerkId field to all existing users in the database
 * that don't have one. For seed users, we generate a stable seed-based ID.
 * For real Clerk users, they'll get their actual Clerk ID on next login.
 */

import { users as usersCollection } from "../config/mongoCollections.js";
import { dbConnection, closeConnection } from "../config/mongoConnection.js";
import dotenv from "dotenv";

dotenv.config();

async function addClerkIdToSeedUsers() {
  console.log("[MIGRATION] Starting clerkId migration for seed users...");

  try {
    await dbConnection();
    const users = await usersCollection();

    // Find all users without a clerkId
    const usersWithoutClerkId = await users.find({ clerkId: { $exists: false } }).toArray();

    console.log(`[MIGRATION] Found ${usersWithoutClerkId.length} users without clerkId`);

    if (usersWithoutClerkId.length === 0) {
      console.log("[MIGRATION] No users need migration");
      return;
    }

    let updated = 0;
    for (const user of usersWithoutClerkId) {
      // Generate a stable seed-based clerkId from email
      const seedClerkId = `seed_clerk_${user.email.split("@")[0]}`;

      const result = await users.updateOne(
        { _id: user._id },
        { $set: { clerkId: seedClerkId } }
      );

      if (result.modifiedCount > 0) {
        updated++;
        console.log(`[MIGRATION] Added clerkId to user: ${user.email} -> ${seedClerkId}`);
      }
    }

    console.log(`[MIGRATION] Migration complete! Updated ${updated} users`);
  } catch (error) {
    console.error("[MIGRATION] ERROR:", error);
    throw error;
  } finally {
    await closeConnection();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  addClerkIdToSeedUsers()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { addClerkIdToSeedUsers };
