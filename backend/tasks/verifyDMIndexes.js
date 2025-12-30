// verifyDMIndexes.js
// Purpose: Verify MongoDB indexes are being used correctly for DM queries
// Usage: cd backend && node tasks/verifyDMIndexes.js

import { dbConnection, closeConnection } from '../config/mongoConnection.js';
import { ObjectId } from 'mongodb';

const verifyIndexes = async () => {
  console.log('🔍 Verifying Direct Messaging index usage...\n');

  try {
    const db = await dbConnection();
    const conversations = db.collection('conversations');
    const directMessages = db.collection('directMessages');

    // ============================================================================
    // TEST 1: Conversations query with user filter
    // ============================================================================

    console.log('📋 Test 1: conversations query (participantObjects.userId filter)');

    // Create a sample userId for testing (use actual ID if available)
    const sampleUserId = '507f1f77bcf86cd799439011';

    const conversationsExplain = await conversations
      .find({ 'participantObjects.userId': sampleUserId })
      .sort({ updatedAt: -1 })
      .limit(20)
      .explain('executionStats');

    const convStage = conversationsExplain.executionStats.executionStages;

    // Look for IXSCAN in nested stages
    const findIndexScan = (stage) => {
      if (stage.stage === 'IXSCAN') return stage.indexName;
      if (stage.inputStage) return findIndexScan(stage.inputStage);
      return null;
    };

    const indexUsed = findIndexScan(convStage);
    console.log(`  Query stage: ${convStage.stage}`);
    console.log(`  Index used: ${indexUsed || 'NONE (collection scan!)'}`);
    console.log(`  Documents examined: ${conversationsExplain.executionStats.totalDocsExamined}`);
    console.log(`  Documents returned: ${conversationsExplain.executionStats.nReturned}`);

    if (indexUsed) {
      console.log(`  ✅ Index "${indexUsed}" is being used!`);
    } else {
      console.log('  ⚠️  No index used - falling back to collection scan');
    }

    // ============================================================================
    // TEST 2: Get or create conversation (participants lookup)
    // ============================================================================

    console.log('\n📋 Test 2: getOrCreateConversation (participants lookup)');

    const participants = ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'].sort();

    const participantsExplain = await conversations
      .find({ participants })
      .explain('executionStats');

    const partStage = participantsExplain.executionStats.executionStages;
    const partIndexUsed = findIndexScan(partStage);
    console.log(`  Query stage: ${partStage.stage}`);
    console.log(`  Index used: ${partIndexUsed || 'NONE (collection scan!)'}`);
    console.log(`  Documents examined: ${participantsExplain.executionStats.totalDocsExamined}`);
    console.log(`  Documents returned: ${participantsExplain.executionStats.nReturned}`);

    if (partIndexUsed) {
      console.log(`  ✅ Index "${partIndexUsed}" is being used!`);
    } else {
      console.log('  ⚠️  No index used - falling back to collection scan');
    }

    // ============================================================================
    // TEST 3: Conversation messages (conversationId + createdAt sort)
    // ============================================================================

    console.log('\n📋 Test 3: conversationMessages query (conversationId filter)');

    const sampleConvId = '507f1f77bcf86cd799439013';

    const messagesExplain = await directMessages
      .find({ conversationId: sampleConvId })
      .sort({ createdAt: -1 })
      .limit(30)
      .explain('executionStats');

    const msgStage = messagesExplain.executionStats.executionStages;
    const msgIndexUsed = findIndexScan(msgStage);
    console.log(`  Query stage: ${msgStage.stage}`);
    console.log(`  Index used: ${msgIndexUsed || 'NONE (collection scan!)'}`);
    console.log(`  Documents examined: ${messagesExplain.executionStats.totalDocsExamined}`);
    console.log(`  Documents returned: ${messagesExplain.executionStats.nReturned}`);

    if (msgIndexUsed) {
      console.log(`  ✅ Index "${msgIndexUsed}" is being used!`);
    } else {
      console.log('  ⚠️  No index used - falling back to collection scan');
    }

    // ============================================================================
    // TEST 4: Mark as read (unread messages lookup)
    // ============================================================================

    console.log('\n📋 Test 4: markConversationAsRead (readBy filter)');

    const sampleCurrentUserId = '507f1f77bcf86cd799439011';

    const unreadExplain = await directMessages
      .find({
        conversationId: sampleConvId,
        readBy: { $ne: sampleCurrentUserId }
      })
      .explain('executionStats');

    const unreadStage = unreadExplain.executionStats.executionStages;
    const unreadIndexUsed = findIndexScan(unreadStage);
    console.log(`  Query stage: ${unreadStage.stage}`);
    console.log(`  Index used: ${unreadIndexUsed || 'NONE (collection scan!)'}`);
    console.log(`  Documents examined: ${unreadExplain.executionStats.totalDocsExamined}`);
    console.log(`  Documents returned: ${unreadExplain.executionStats.nReturned}`);

    if (unreadIndexUsed) {
      console.log(`  ✅ Index "${unreadIndexUsed}" is being used!`);
    } else {
      console.log('  ⚠️  No index used - falling back to collection scan');
    }

    // ============================================================================
    // SUMMARY
    // ============================================================================

    console.log('\n📊 Summary:');
    console.log('  All queries have been analyzed with explain().');
    console.log('  Check above for "Index used" to confirm indexes are working.');
    console.log('\n  Note: If collections are empty, indexes will still be used');
    console.log('  but you may see 0 documents examined/returned.');

    console.log('\n✅ Verification complete!');

  } catch (error) {
    console.error('❌ Error verifying indexes:', error);
    throw error;
  } finally {
    await closeConnection();
  }
};

// Execute if run directly
verifyIndexes()
  .then(() => {
    console.log('\n🎉 Verification completed successfully');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n💥 Verification failed:', err);
    process.exit(1);
  });
