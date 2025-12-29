/**
 * Create MongoDB indexes for Direct Messaging collections
 *
 * Run this script once to create optimal indexes for conversations and directMessages collections.
 *
 * Usage:
 *   node backend/scripts/create-dm-indexes.js
 */

import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from backend/.env
dotenv.config({ path: join(__dirname, '../.env') });

const MONGODB_URI = process.env.mongoServerUrl;
const DB_NAME = 'research-collaboration-platform'; // Standard DB name

if (!MONGODB_URI) {
  console.error('❌ mongoServerUrl not found in environment variables');
  console.error('Make sure backend/.env has mongoServerUrl defined');
  process.exit(1);
}

async function createIndexes() {
  const client = new MongoClient(MONGODB_URI);

  try {
    console.log('🔌 Connecting to MongoDB...');
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db(DB_NAME);

    // Create indexes for conversations collection
    console.log('\n📊 Creating indexes for "conversations" collection...');
    const conversationsCollection = db.collection('conversations');

    // Index 1: Unique compound index on participants (for finding conversations)
    await conversationsCollection.createIndex(
      { participants: 1 },
      { unique: true, name: 'participants_unique' }
    );
    console.log('  ✅ Created unique index: participants_unique');

    // Index 2: Compound index on participantObjects.userId and updatedAt (for inbox queries)
    await conversationsCollection.createIndex(
      { 'participantObjects.userId': 1, updatedAt: -1 },
      { name: 'participant_userId_updatedAt' }
    );
    console.log('  ✅ Created index: participant_userId_updatedAt');

    // Create indexes for directMessages collection
    console.log('\n📊 Creating indexes for "directMessages" collection...');
    const messagesCollection = db.collection('directMessages');

    // Index 3: Compound index on conversationId and createdAt (for message thread queries)
    await messagesCollection.createIndex(
      { conversationId: 1, createdAt: -1 },
      { name: 'conversationId_createdAt' }
    );
    console.log('  ✅ Created index: conversationId_createdAt');

    // Index 4: Compound index on conversationId and readBy (for unread count queries)
    await messagesCollection.createIndex(
      { conversationId: 1, readBy: 1 },
      { name: 'conversationId_readBy' }
    );
    console.log('  ✅ Created index: conversationId_readBy');

    // List all indexes to verify
    console.log('\n📋 Verifying indexes...');
    const conversationIndexes = await conversationsCollection.indexes();
    const messageIndexes = await messagesCollection.indexes();

    console.log('\nConversations collection indexes:');
    conversationIndexes.forEach(idx => {
      console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}`);
    });

    console.log('\nDirectMessages collection indexes:');
    messageIndexes.forEach(idx => {
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

// Run the script
createIndexes().catch(console.error);
