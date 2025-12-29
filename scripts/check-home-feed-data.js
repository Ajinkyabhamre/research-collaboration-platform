/**
 * Script to verify Home Feed V2 data in MongoDB
 * Run with: node scripts/check-home-feed-data.js
 */

import { posts, postLikes, postComments } from '../backend/config/mongoCollections.js';

async function checkHomeFeedData() {
  console.log('\n=== Checking Home Feed V2 Data in MongoDB ===\n');

  try {
    const postsCollection = await posts();
    const likesCollection = await postLikes();
    const commentsCollection = await postComments();

    // Count documents
    const postCount = await postsCollection.countDocuments();
    const likeCount = await likesCollection.countDocuments();
    const commentCount = await commentsCollection.countDocuments();

    console.log('📊 Collection Statistics:');
    console.log(`   Posts:    ${postCount}`);
    console.log(`   Likes:    ${likeCount}`);
    console.log(`   Comments: ${commentCount}`);
    console.log('');

    // Show recent posts
    if (postCount > 0) {
      console.log('📝 Recent Posts (last 5):');
      const recentPosts = await postsCollection
        .find({})
        .sort({ createdAt: -1 })
        .limit(5)
        .toArray();

      recentPosts.forEach((post, idx) => {
        console.log(`\n${idx + 1}. Post ID: ${post._id}`);
        console.log(`   Author: ${post.authorId}`);
        console.log(`   Text: ${post.text.substring(0, 100)}${post.text.length > 100 ? '...' : ''}`);
        console.log(`   Media: ${post.media?.length || 0} items`);
        console.log(`   Likes: ${post.likeCount}`);
        console.log(`   Comments: ${post.commentCount}`);
        console.log(`   Created: ${new Date(post.createdAt).toLocaleString()}`);
      });
    } else {
      console.log('⚠️  No posts found in database');
    }

    // Show likes
    if (likeCount > 0) {
      console.log('\n\n❤️  Recent Likes (last 5):');
      const recentLikes = await likesCollection
        .find({})
        .sort({ createdAt: -1 })
        .limit(5)
        .toArray();

      recentLikes.forEach((like, idx) => {
        console.log(`${idx + 1}. User ${like.userId} liked Post ${like.postId}`);
      });
    }

    // Show comments
    if (commentCount > 0) {
      console.log('\n\n💬 Recent Comments (last 5):');
      const recentComments = await commentsCollection
        .find({})
        .sort({ createdAt: -1 })
        .limit(5)
        .toArray();

      recentComments.forEach((comment, idx) => {
        console.log(`\n${idx + 1}. Comment ID: ${comment._id}`);
        console.log(`   Post: ${comment.postId}`);
        console.log(`   Author: ${comment.commenterId}`);
        console.log(`   Text: ${comment.text.substring(0, 80)}${comment.text.length > 80 ? '...' : ''}`);
        console.log(`   Created: ${new Date(comment.createdAt).toLocaleString()}`);
      });
    }

    console.log('\n\n✅ Data check complete!\n');
  } catch (error) {
    console.error('❌ Error checking data:', error);
  } finally {
    process.exit(0);
  }
}

checkHomeFeedData();
