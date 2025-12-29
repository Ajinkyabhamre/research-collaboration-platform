/**
 * PHASE 2 - Merge Seed Users Into Real Clerk Users
 *
 * Purpose: One-time migration to merge profile data from seed users into real Clerk users
 *
 * Process:
 * 1. Find all emails that have both:
 *    - One doc with clerkId starting "seed_clerk_"
 *    - One doc with clerkId starting "user_"
 * 2. For each duplicate email:
 *    - Merge profile fields from seed -> real Clerk user
 *    - Archive the seed user doc (mark as merged, don't delete)
 * 3. Output detailed before/after snapshots
 */

import { users as usersCollection } from "../config/mongoCollections.js";
import { dbConnection, closeConnection } from "../config/mongoConnection.js";
import dotenv from "dotenv";

dotenv.config();

// Fields to merge from seed user to real Clerk user
const PROFILE_FIELDS = [
  "bio",
  "headline",
  "city",
  "location",
  "profilePhoto",
  "coverPhoto",
  "skills",
  "education",
  "experience",
  "featuredProjectId",
  "profileLinks",
];

/**
 * Merge a single field, preferring non-null/non-empty value from target (real user),
 * falling back to source (seed user)
 */
function mergeField(targetValue, sourceValue, fieldName) {
  // For arrays, prefer non-empty arrays
  if (Array.isArray(targetValue) || Array.isArray(sourceValue)) {
    const targetArray = Array.isArray(targetValue) ? targetValue : [];
    const sourceArray = Array.isArray(sourceValue) ? sourceValue : [];
    return targetArray.length > 0 ? targetArray : sourceArray;
  }

  // For objects (like profileLinks), merge recursively
  if (
    typeof targetValue === "object" &&
    targetValue !== null &&
    typeof sourceValue === "object" &&
    sourceValue !== null &&
    !Array.isArray(targetValue) &&
    !Array.isArray(sourceValue)
  ) {
    const merged = { ...sourceValue };
    for (const key in targetValue) {
      if (targetValue[key] !== null && targetValue[key] !== undefined && targetValue[key] !== "") {
        merged[key] = targetValue[key];
      }
    }
    return merged;
  }

  // For primitives, prefer non-null/non-empty target value
  if (targetValue !== null && targetValue !== undefined && targetValue !== "") {
    return targetValue;
  }

  return sourceValue;
}

/**
 * Merge profile data from seed user into real Clerk user
 */
function mergeProfileData(realUser, seedUser) {
  const merged = { ...realUser };

  // Preserve earliest createdAt
  if (seedUser.createdAt && (!merged.createdAt || new Date(seedUser.createdAt) < new Date(merged.createdAt))) {
    merged.createdAt = seedUser.createdAt;
  }

  // Merge each profile field
  for (const field of PROFILE_FIELDS) {
    merged[field] = mergeField(realUser[field], seedUser[field], field);
  }

  // Set updatedAt to now
  merged.updatedAt = new Date();

  return merged;
}

/**
 * Redact long URLs for cleaner output
 */
function redactUrl(url) {
  if (!url || typeof url !== "string") return url;
  if (url.length > 60) {
    return url.substring(0, 57) + "...";
  }
  return url;
}

/**
 * Print user snapshot (for before/after comparison)
 */
function printUserSnapshot(user, label) {
  console.log(`   ${label}:`);
  console.log(`       _id:          ${user._id}`);
  console.log(`       clerkId:      ${user.clerkId}`);
  console.log(`       email:        ${user.email}`);
  console.log(`       createdAt:    ${user.createdAt || "N/A"}`);
  console.log(`       updatedAt:    ${user.updatedAt || "N/A"}`);
  console.log(`       headline:     ${user.headline || "null"}`);
  console.log(`       bio:          ${user.bio ? `"${user.bio.substring(0, 40)}..."` : "null"}`);
  console.log(`       profilePhoto: ${redactUrl(user.profilePhoto) || "null"}`);
  console.log(`       coverPhoto:   ${redactUrl(user.coverPhoto) || "null"}`);
  console.log(`       skills:       ${user.skills ? `[${user.skills.length} items]` : "[]"}`);
  console.log(`       education:    ${user.education ? `[${user.education.length} items]` : "[]"}`);
  console.log(`       experience:   ${user.experience ? `[${user.experience.length} items]` : "[]"}`);
}

async function mergeSeedUsers() {
  console.log("\n" + "=".repeat(80));
  console.log("🔄 PHASE 2 - MERGE SEED USERS INTO REAL CLERK USERS");
  console.log("=".repeat(80) + "\n");

  try {
    // Connect to database
    await dbConnection();
    const users = await usersCollection();

    // STEP 1: Find all duplicate emails (same email, different clerkIds)
    console.log("📊 Finding duplicate emails...");
    const duplicates = await users
      .aggregate([
        {
          $group: {
            _id: "$email",
            count: { $sum: 1 },
            users: { $push: "$$ROOT" },
          },
        },
        {
          $match: {
            count: { $gt: 1 },
          },
        },
      ])
      .toArray();

    console.log(`   Found ${duplicates.length} email(s) with duplicates\n`);

    if (duplicates.length === 0) {
      console.log("✅ No duplicates to merge. Migration complete!\n");
      return;
    }

    let mergedCount = 0;
    let skippedCount = 0;

    // STEP 2: Process each duplicate email
    for (const dup of duplicates) {
      const email = dup._id;
      const userDocs = dup.users;

      console.log("-".repeat(80));
      console.log(`📧 Processing email: ${email}`);
      console.log(`   Found ${userDocs.length} user documents`);

      // Find seed user and real Clerk user
      const seedUser = userDocs.find((u) => u.clerkId && u.clerkId.startsWith("seed_clerk_"));
      const realUser = userDocs.find((u) => u.clerkId && u.clerkId.startsWith("user_"));

      // Only merge if we have both a seed user and a real Clerk user
      if (!seedUser || !realUser) {
        console.log(`   ⚠️  SKIPPED: No clear seed/real pair found`);
        console.log(`       ClerkIds: ${userDocs.map((u) => u.clerkId).join(", ")}`);
        skippedCount++;
        continue;
      }

      console.log(`   Seed user:  ${seedUser.clerkId} (${seedUser._id})`);
      console.log(`   Real user:  ${realUser.clerkId} (${realUser._id})`);
      console.log();

      // Print BEFORE state
      console.log("   📸 BEFORE:");
      printUserSnapshot(seedUser, "Seed User");
      console.log();
      printUserSnapshot(realUser, "Real User (before merge)");
      console.log();

      // Merge profile data
      const mergedData = mergeProfileData(realUser, seedUser);

      // Print AFTER state
      console.log("   📸 AFTER MERGE:");
      printUserSnapshot(mergedData, "Real User (after merge)");
      console.log();

      // Update the real Clerk user with merged data
      console.log("   💾 Updating real Clerk user...");
      const updateResult = await users.updateOne(
        { _id: realUser._id },
        {
          $set: {
            bio: mergedData.bio,
            headline: mergedData.headline,
            city: mergedData.city,
            location: mergedData.location,
            profilePhoto: mergedData.profilePhoto,
            coverPhoto: mergedData.coverPhoto,
            skills: mergedData.skills,
            education: mergedData.education,
            experience: mergedData.experience,
            featuredProjectId: mergedData.featuredProjectId,
            profileLinks: mergedData.profileLinks,
            createdAt: mergedData.createdAt,
            updatedAt: mergedData.updatedAt,
          },
        }
      );

      console.log(`   ✓ Updated real user (matched: ${updateResult.matchedCount}, modified: ${updateResult.modifiedCount})`);

      // Archive the seed user (don't delete for safety)
      console.log("   🗄️  Archiving seed user...");
      const archiveResult = await users.updateOne(
        { _id: seedUser._id },
        {
          $set: {
            mergedInto: realUser._id,
            mergedIntoClerkId: realUser.clerkId,
            archivedAt: new Date(),
            isArchived: true,
          },
        }
      );

      console.log(`   ✓ Archived seed user (matched: ${archiveResult.matchedCount}, modified: ${archiveResult.modifiedCount})`);
      console.log(`   ✅ Successfully merged ${email}`);
      console.log();

      mergedCount++;
    }

    // STEP 3: Summary
    console.log("=".repeat(80));
    console.log("📋 MIGRATION SUMMARY:");
    console.log("=".repeat(80));
    console.log(`✓ Total duplicate emails found: ${duplicates.length}`);
    console.log(`✓ Successfully merged:          ${mergedCount}`);
    console.log(`✓ Skipped (no clear pair):      ${skippedCount}`);
    console.log("=".repeat(80) + "\n");

    if (mergedCount > 0) {
      console.log("🎉 Migration complete! Profile data has been merged from seed users into real Clerk users.");
      console.log("   Seed users have been archived (not deleted) for safety.");
      console.log();
      console.log("📝 Next steps:");
      console.log("   1. Run identityAudit.js again to verify duplicates are resolved");
      console.log("   2. Test login and verify profile data is visible");
      console.log("   3. If all looks good, you can manually delete archived seed users from MongoDB");
      console.log();
    }
  } catch (error) {
    console.error("\n❌ MIGRATION FAILED:", error);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await closeConnection();
  }
}

// Run the migration
mergeSeedUsers();
