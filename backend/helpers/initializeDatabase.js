/**
 * Database Initialization Helper
 *
 * Sets up required indexes for the application, including:
 * - Unique index on users.clerkId (all users)
 * - Partial unique index on users.email (real Clerk users only)
 * - Non-unique index on users.email (for lookup performance)
 *
 * PHASE 1 CHANGE: Added partial unique index on email to prevent duplicate
 * emails for real Clerk users (clerkId starts with "user_"), while still
 * allowing seed data users to exist with duplicate emails.
 */

import { users as usersCollection } from "../config/mongoCollections.js";
import { dbConnection } from "../config/mongoConnection.js";

export async function initializeDatabase() {
  console.log("[DB_INIT] Initializing database indexes...");

  try {
    await dbConnection();
    const users = await usersCollection();

    // Create unique index on clerkId (all users must have unique clerkId)
    console.log("[DB_INIT] Creating unique index on users.clerkId...");
    try {
      await users.createIndex({ clerkId: 1 }, { unique: true, name: "clerkId_unique" });
      console.log("[DB_INIT] ✓ Created unique index on users.clerkId");
    } catch (err) {
      if (err.code === 85 || err.code === 86 || err.message.includes("already exists")) {
        console.log("[DB_INIT] ✓ Index users.clerkId already exists");
      } else {
        throw err;
      }
    }

    // Create partial unique index on email for real Clerk users only
    // This prevents duplicate emails among real users while allowing seed data
    console.log("[DB_INIT] Creating partial unique index on users.email (real Clerk users only)...");
    try {
      await users.createIndex(
        { email: 1 },
        {
          unique: true,
          name: "email_unique_real_users",
          partialFilterExpression: {
            clerkId: /^user_/,
          },
        }
      );
      console.log("[DB_INIT] ✓ Created partial unique index on users.email (real Clerk users)");
    } catch (err) {
      if (err.code === 85 || err.code === 86 || err.message.includes("already exists")) {
        console.log("[DB_INIT] ✓ Partial index users.email (real users) already exists");
      } else {
        throw err;
      }
    }

    // Create non-unique index on email for lookup performance (all users)
    console.log("[DB_INIT] Creating non-unique index on users.email (all users)...");
    try {
      await users.createIndex({ email: 1 }, { name: "email_lookup" });
      console.log("[DB_INIT] ✓ Created non-unique index on users.email");
    } catch (err) {
      if (err.code === 85 || err.code === 86 || err.message.includes("already exists")) {
        console.log("[DB_INIT] ✓ Index users.email (lookup) already exists");
      } else {
        throw err;
      }
    }

    console.log("[DB_INIT] Database initialization complete!");
    console.log("[DB_INIT] PHASE 1: Indexes now prevent duplicate emails for real Clerk users");
  } catch (error) {
    console.error("[DB_INIT] ERROR creating indexes:", {
      message: error.message,
      code: error.code,
    });
    // Don't throw - let the app start even if index creation fails
    // (might fail if data already violates constraints)
  }
}
