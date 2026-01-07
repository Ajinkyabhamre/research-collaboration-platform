/**
 * User Provisioning Helper
 *
 * Handles robust user provisioning from Clerk to MongoDB with:
 * - Atomic upsert operations (no race conditions)
 * - Stable Clerk ID mapping
 * - Comprehensive error handling and logging
 * - Graceful handling of missing user data
 */

/**
 * Ensures a Clerk user is provisioned in MongoDB
 *
 * @param {Object} params
 * @param {Object} params.clerkUser - Clerk user object from Clerk SDK
 * @param {Object} params.dbUsersCollection - MongoDB users collection
 * @returns {Promise<Object>} The provisioned user document from MongoDB
 * @throws {Error} If provisioning fails
 */
export async function ensureUserProvisioned({ clerkUser, dbUsersCollection }) {
  const clerkId = clerkUser.id;
  const email = clerkUser.emailAddresses?.[0]?.emailAddress || clerkUser.email;
  const firstName = clerkUser.firstName || "Unknown";
  const lastName = clerkUser.lastName || "User";
  const role = clerkUser.publicMetadata?.role || "STUDENT";
  const department = clerkUser.publicMetadata?.department || "COMPUTER_SCIENCE";

  console.log("[PROVISION] Starting user provisioning:", {
    clerkId,
    email,
    firstName,
    lastName,
  });

  // Validate required fields
  if (!clerkId) {
    const error = new Error("Clerk user ID is required for provisioning");
    console.error("[PROVISION] ERROR: Missing clerkId", { clerkUser });
    throw error;
  }

  if (!email) {
    const error = new Error(`No email found for Clerk user ${clerkId}`);
    console.error("[PROVISION] ERROR: Missing email", { clerkId });
    throw error;
  }

  try {
    const now = new Date();

    // Atomic upsert: find by clerkId, create if not exists, update if exists
    const result = await dbUsersCollection.updateOne(
      { clerkId }, // Match on stable Clerk ID
      {
        $setOnInsert: {
          // Only set these fields on initial insert
          createdAt: now,
          role, // Set default role only on first insert (don't overwrite user preferences)
          department, // Set default department only on first insert
          bio: null,
          headline: null,
          location: null,
          city: null,
          profileLinks: {
            github: null,
            linkedin: null,
            website: null,
          },
          profilePhoto: null,
          coverPhoto: null,
          featuredProjectId: null,
          skills: [],
          education: [],
          experience: [],
        },
        $set: {
          // Always update these fields (in case they changed in Clerk)
          email,
          firstName,
          lastName,
          updatedAt: now,
          isClerkUser: true, // Mark as real Clerk user (no conflict - only in $set)
        },
      },
      { upsert: true }
    );

    console.log("[PROVISION] Upsert result:", {
      clerkId,
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
      upsertedCount: result.upsertedCount,
      upsertedId: result.upsertedId?.toString(),
      wasCreated: result.upsertedCount > 0,
      wasUpdated: result.matchedCount > 0,
    });

    // Fetch the user document
    const user = await dbUsersCollection.findOne({ clerkId });

    if (!user) {
      const error = new Error(
        `User provisioning failed: unable to fetch user after upsert for clerkId: ${clerkId}`
      );
      console.error("[PROVISION] ERROR: User not found after upsert", {
        clerkId,
        upsertResult: result,
      });
      throw error;
    }

    console.log("[PROVISION] Successfully provisioned user:", {
      _id: user._id.toString(),
      clerkId: user.clerkId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    });

    // PHASE 4: Defensive check - warn if multiple users share this email
    // (should not happen for real Clerk users after merge, but check anyway)
    const duplicateCount = await dbUsersCollection.countDocuments({
      email: user.email,
      isArchived: { $ne: true },
    });

    if (duplicateCount > 1) {
      console.warn("[PROVISION] ⚠️  WARNING: Multiple active users share email:", {
        email: user.email,
        count: duplicateCount,
        message: "This should not happen for real Clerk users. Check for duplicate emails in database.",
      });

      // Log all users with this email for debugging
      const allUsersWithEmail = await dbUsersCollection
        .find({ email: user.email, isArchived: { $ne: true } })
        .project({ _id: 1, clerkId: 1, email: 1 })
        .toArray();
      console.warn("[PROVISION] Users with email:", allUsersWithEmail);
    }

    return user;
  } catch (error) {
    console.error("[PROVISION] ERROR: User provisioning failed", {
      clerkId,
      email,
      error: {
        message: error.message,
        name: error.name,
        stack: error.stack,
      },
    });
    throw error;
  }
}
