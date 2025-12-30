// createProjectIndexes.js
// Purpose: Create MongoDB indexes for Projects collection to optimize projectsFeed query performance
// Usage: cd backend && node tasks/createProjectIndexes.js
//    OR: npm run create-project-indexes (from project root)

import { dbConnection, closeConnection } from '../config/mongoConnection.js';

const createProjectIndexes = async () => {
  console.log('🔧 Creating Projects collection indexes...\n');

  try {
    const db = await dbConnection();

    // ============================================================================
    // PROJECTS COLLECTION INDEXES
    // ============================================================================

    console.log('📋 Creating indexes for projects collection...');

    // Index 1: CRITICAL - Cursor pagination index (matches sort order)
    // Used by: projectsFeed query with cursor-based pagination
    // Sort order: { createdDate: -1, _id: -1 }
    await db.collection('projects').createIndex(
      { createdDate: -1, _id: -1 },
      {
        name: 'idx_cursor_pagination',
        background: true
      }
    );
    console.log('  ✅ idx_cursor_pagination - Optimizes cursor pagination with compound sort');

    // Index 2: Department filter + cursor pagination
    // Used by: projectsFeed query with department filter
    await db.collection('projects').createIndex(
      { department: 1, createdDate: -1, _id: -1 },
      {
        name: 'idx_dept_pagination',
        background: true
      }
    );
    console.log('  ✅ idx_dept_pagination - Optimizes department filtering with pagination');

    // Index 3: Text search on title
    // Used by: projectsFeed query with searchTerm filter
    await db.collection('projects').createIndex(
      { title: 'text' },
      {
        name: 'idx_title_search',
        default_language: 'english',
        background: true
      }
    );
    console.log('  ✅ idx_title_search - Optimizes full-text search on project titles');

    // Index 4: Professor array lookup
    // Used by: projectsFeed query with professorId filter ("My Projects" tab)
    await db.collection('projects').createIndex(
      { professors: 1 },
      {
        name: 'idx_professors',
        background: true
      }
    );
    console.log('  ✅ idx_professors - Optimizes professor array lookups');

    // Index 5: Student array lookup
    // Used by: projectsFeed query with studentId filter (future "My Projects" tab)
    await db.collection('projects').createIndex(
      { students: 1 },
      {
        name: 'idx_students',
        background: true
      }
    );
    console.log('  ✅ idx_students - Optimizes student array lookups');

    // Index 6: Professor + cursor pagination (for "My Projects" tab)
    // Used by: projectsFeed query filtering by professor with pagination
    await db.collection('projects').createIndex(
      { professors: 1, createdDate: -1, _id: -1 },
      {
        name: 'idx_my_projects_prof',
        background: true
      }
    );
    console.log('  ✅ idx_my_projects_prof - Optimizes professor projects with pagination');

    // Index 7: Student + cursor pagination (for "My Projects" tab)
    // Used by: projectsFeed query filtering by student with pagination
    await db.collection('projects').createIndex(
      { students: 1, createdDate: -1, _id: -1 },
      {
        name: 'idx_my_projects_student',
        background: true
      }
    );
    console.log('  ✅ idx_my_projects_student - Optimizes student projects with pagination');

    // ============================================================================
    // VERIFICATION
    // ============================================================================

    console.log('\n🔍 Verifying indexes...\n');

    const projectIndexes = await db.collection('projects').indexes();
    console.log('Projects indexes:');
    projectIndexes.forEach(idx => {
      console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}`);
    });

    console.log('\n✅ All Projects indexes created successfully!');
    console.log('\n📊 Performance Impact:');
    console.log('  • projectsFeed (no filters): Uses idx_cursor_pagination');
    console.log('  • projectsFeed (department): Uses idx_dept_pagination');
    console.log('  • projectsFeed (search): Uses idx_title_search');
    console.log('  • projectsFeed (my projects - prof): Uses idx_my_projects_prof');
    console.log('  • projectsFeed (my projects - student): Uses idx_my_projects_student');
    console.log('  • Query performance: O(n) → O(log n) with index scans');
    console.log('  • Cursor pagination: Stable and efficient with compound index');

  } catch (error) {
    console.error('❌ Error creating indexes:', error);
    throw error;
  } finally {
    await closeConnection();
  }
};

// Execute if run directly
createProjectIndexes()
  .then(() => {
    console.log('\n🎉 Index creation completed successfully');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n💥 Index creation failed:', err);
    process.exit(1);
  });
