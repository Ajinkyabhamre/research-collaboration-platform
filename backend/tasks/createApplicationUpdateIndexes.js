/**
 * Create MongoDB indexes for Applications and Updates collections
 *
 * Run: node backend/tasks/createApplicationUpdateIndexes.js
 */

import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

const MONGODB_URI = process.env.mongoServerUrl;
const DB_NAME = 'research-collaboration-platform';

async function createIndexes() {
  const client = new MongoClient(MONGODB_URI);

  try {
    console.log('🔌 Connecting to MongoDB...');
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db(DB_NAME);

    // ========== APPLICATIONS COLLECTION ==========
    console.log('\n📊 Creating indexes for "applications" collection...');
    const appsCollection = db.collection('applications');

    // Index 1: ProjectRequests page - applications by project, sorted by date
    await appsCollection.createIndex(
      { projectId: 1, applicationDate: -1 },
      { name: 'idx_project_app_date' }
    );
    console.log('  ✅ idx_project_app_date');

    // Index 2: Applied tab filtering - by applicant and status
    await appsCollection.createIndex(
      { applicantId: 1, status: 1 },
      { name: 'idx_applicant_status' }
    );
    console.log('  ✅ idx_applicant_status');

    // Index 3: appliedProjectsFeed cursor pagination
    await appsCollection.createIndex(
      { applicantId: 1, applicationDate: -1, _id: -1 },
      { name: 'idx_applied_cursor' }
    );
    console.log('  ✅ idx_applied_cursor');

    // Index 4: Prevent duplicate applications (UNIQUE)
    await appsCollection.createIndex(
      { applicantId: 1, projectId: 1 },
      { unique: true, name: 'idx_applicant_project_unique' }
    );
    console.log('  ✅ idx_applicant_project_unique (UNIQUE)');

    // ========== UPDATES COLLECTION ==========
    console.log('\n📊 Creating indexes for "updates" collection...');
    const updatesCollection = db.collection('updates');

    // Index 5: ProjectDetails updates list - by project, sorted by date
    await updatesCollection.createIndex(
      { projectId: 1, postedDate: -1 },
      { name: 'idx_project_posted_date' }
    );
    console.log('  ✅ idx_project_posted_date');

    // Index 6: User timeline (future feature)
    await updatesCollection.createIndex(
      { posterUserId: 1, postedDate: -1 },
      { name: 'idx_poster_date' }
    );
    console.log('  ✅ idx_poster_date');

    // Verify all indexes
    console.log('\n📋 Verifying indexes...');
    const appIndexes = await appsCollection.indexes();
    const updateIndexes = await updatesCollection.indexes();

    console.log('\n✓ Applications collection indexes:');
    appIndexes.forEach(idx => {
      console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}`);
    });

    console.log('\n✓ Updates collection indexes:');
    updateIndexes.forEach(idx => {
      console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}`);
    });

    console.log('\n✅ All indexes created successfully!');

  } catch (error) {
    console.error('❌ Error creating indexes:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

createIndexes().catch(console.error);
