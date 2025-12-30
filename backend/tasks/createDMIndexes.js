// createDMIndexes.js
// Purpose: Create MongoDB indexes for Direct Messaging collections to optimize query performance
// Usage: cd backend && node tasks/createDMIndexes.js
//    OR: npm run create-dm-indexes (from project root)

import { dbConnection, closeConnection } from '../config/mongoConnection.js';

const createDMIndexes = async () => {
  console.log('🔧 Creating Direct Messaging indexes...\n');

  try {
    const db = await dbConnection();

    // ============================================================================
    // CONVERSATIONS COLLECTION INDEXES
    // ============================================================================

    console.log('📋 Creating indexes for conversations collection...');

    // Index 1: participants lookup (for finding existing conversations)
    // Used by: getOrCreateConversation, sendDirectMessage
    await db.collection('conversations').createIndex(
      { participants: 1 },
      {
        name: 'participants_lookup',
        background: true
      }
    );
    console.log('  ✅ participants_lookup - Optimizes conversation lookup by participant pair');

    // Index 2: user conversations sorted by update time
    // Used by: conversations query (pagination + filtering)
    await db.collection('conversations').createIndex(
      { 'participantObjects.userId': 1, updatedAt: -1 },
      {
        name: 'user_conversations_sorted',
        background: true
      }
    );
    console.log('  ✅ user_conversations_sorted - Optimizes conversations query for specific user');

    // Index 3: updatedAt for cursor-based pagination
    // Used by: conversations query (when cursor is provided)
    await db.collection('conversations').createIndex(
      { updatedAt: -1 },
      {
        name: 'conversations_updated_desc',
        background: true
      }
    );
    console.log('  ✅ conversations_updated_desc - Optimizes cursor-based pagination');

    // ============================================================================
    // DIRECT MESSAGES COLLECTION INDEXES
    // ============================================================================

    console.log('\n📋 Creating indexes for directMessages collection...');

    // Index 4: conversation messages sorted by creation time
    // Used by: conversationMessages query
    await db.collection('directMessages').createIndex(
      { conversationId: 1, createdAt: -1 },
      {
        name: 'conversation_messages_sorted',
        background: true
      }
    );
    console.log('  ✅ conversation_messages_sorted - Optimizes message fetch for specific conversation');

    // Index 5: unread messages lookup
    // Used by: markConversationAsRead mutation (finding messages not read by user)
    await db.collection('directMessages').createIndex(
      { conversationId: 1, readBy: 1 },
      {
        name: 'conversation_unread_messages',
        background: true
      }
    );
    console.log('  ✅ conversation_unread_messages - Optimizes unread message queries');

    // ============================================================================
    // VERIFICATION
    // ============================================================================

    console.log('\n🔍 Verifying indexes...\n');

    const conversationIndexes = await db.collection('conversations').indexes();
    console.log('Conversations indexes:');
    conversationIndexes.forEach(idx => {
      console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}`);
    });

    const messageIndexes = await db.collection('directMessages').indexes();
    console.log('\nDirectMessages indexes:');
    messageIndexes.forEach(idx => {
      console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}`);
    });

    console.log('\n✅ All Direct Messaging indexes created successfully!');
    console.log('\n📊 Performance Impact:');
    console.log('  • conversations query: O(n) → O(log n) with index scan');
    console.log('  • conversationMessages query: O(n) → O(log n) with index scan');
    console.log('  • getOrCreateConversation: O(n) → O(log n) for participant lookup');
    console.log('  • markConversationAsRead: O(n*m) → O(log n) for unread message updates');

  } catch (error) {
    console.error('❌ Error creating indexes:', error);
    throw error;
  } finally {
    await closeConnection();
  }
};

// Execute if run directly
createDMIndexes()
  .then(() => {
    console.log('\n🎉 Index creation completed successfully');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n💥 Index creation failed:', err);
    process.exit(1);
  });
