/**
 * Database Initialization Helper
 *
 * Sets up required indexes for the application, including:
 * - Unique index on users.clerkId (all users)
 * - Partial unique index on users.email (real Clerk users only)
 * - Non-unique index on users.email (for lookup performance)
 *
 * INDEXING STRATEGY:
 * - Real Clerk users (isClerkUser: true) must have unique emails
 * - Seed/fake users (isClerkUser: false or missing) can share emails
 * - Uses boolean field instead of regex for MongoDB Atlas compatibility
 */

import { users as usersCollection } from "../config/mongoCollections.js";
import { dbConnection } from "../config/mongoConnection.js";

export async function initializeDatabase() {
  console.log("[DB_INIT] Initializing database indexes...");

  try {
    await dbConnection();
    const users = await usersCollection();

    // MIGRATION: Backfill isClerkUser for existing users
    await backfillIsClerkUser(users);

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
            isClerkUser: true,
          },
        }
      );
      console.log("[DB_INIT] ✓ Created partial unique index on users.email (real Clerk users)");
    } catch (err) {
      if (err.code === 85 || err.code === 86 || err.message.includes("already exists")) {
        console.log("[DB_INIT] ✓ Partial index users.email (real users) already exists");
      } else {
        console.error("[DB_INIT] ERROR creating partial unique index:", err.message);
        // Try to drop old index with regex if it exists
        try {
          await users.dropIndex("email_unique_real_users");
          console.log("[DB_INIT] Dropped old index, retrying...");
          await users.createIndex(
            { email: 1 },
            {
              unique: true,
              name: "email_unique_real_users",
              partialFilterExpression: {
                isClerkUser: true,
              },
            }
          );
          console.log("[DB_INIT] ✓ Created partial unique index on users.email (real Clerk users)");
        } catch (retryErr) {
          console.error("[DB_INIT] Failed to recreate index:", retryErr.message);
          throw retryErr;
        }
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
    console.log("[DB_INIT] Indexes now prevent duplicate emails for real Clerk users (isClerkUser: true)");
  } catch (error) {
    console.error("[DB_INIT] ERROR creating indexes:", {
      message: error.message,
      code: error.code,
    });
    // Don't throw - let the app start even if index creation fails
    // (might fail if data already violates constraints)
  }
}

/**
 * Backfills isClerkUser field for existing users
 * - Sets isClerkUser: true for users with clerkId starting with "user_"
 * - Sets isClerkUser: false for seed/fake users (clerkId starting with "seed_")
 * - Idempotent: safe to run multiple times
 */
async function backfillIsClerkUser(users) {
  console.log("[DB_INIT] Backfilling isClerkUser field...");

  try {
    // Count users without isClerkUser field
    const missingCount = await users.countDocuments({
      isClerkUser: { $exists: false },
    });

    if (missingCount === 0) {
      console.log("[DB_INIT] ✓ All users already have isClerkUser field");
      return;
    }

    console.log(`[DB_INIT] Found ${missingCount} users without isClerkUser field`);

    // Update real Clerk users (clerkId starts with "user_")
    const realUsersResult = await users.updateMany(
      {
        clerkId: /^user_/,
        isClerkUser: { $exists: false },
      },
      {
        $set: { isClerkUser: true },
      }
    );

    console.log(
      `[DB_INIT] ✓ Set isClerkUser: true for ${realUsersResult.modifiedCount} real Clerk users`
    );

    // Update seed/fake users (clerkId does NOT start with "user_")
    const fakeUsersResult = await users.updateMany(
      {
        clerkId: { $not: /^user_/ },
        isClerkUser: { $exists: false },
      },
      {
        $set: { isClerkUser: false },
      }
    );

    console.log(
      `[DB_INIT] ✓ Set isClerkUser: false for ${fakeUsersResult.modifiedCount} seed/fake users`
    );

    // Handle edge case: users with no clerkId (shouldn't happen, but be safe)
    const noClerkIdResult = await users.updateMany(
      {
        clerkId: { $exists: false },
        isClerkUser: { $exists: false },
      },
      {
        $set: { isClerkUser: false },
      }
    );

    if (noClerkIdResult.modifiedCount > 0) {
      console.log(
        `[DB_INIT] ⚠️  Set isClerkUser: false for ${noClerkIdResult.modifiedCount} users with no clerkId`
      );
    }

    console.log("[DB_INIT] ✓ Backfill complete");
  } catch (error) {
    console.error("[DB_INIT] ERROR during backfill:", error.message);
    // Don't throw - backfill failure shouldn't prevent app startup
  }
}
