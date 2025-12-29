import React from 'react';
import { useQuery } from '@apollo/client';
import { PageContainer } from '../components/layout/PageContainer';
import { LeftSidebar } from '../components/home/LeftSidebar';
import { FeedComposer } from '../components/home/FeedComposer';
import { FeedPostCard } from '../components/home/FeedPostCard';
import { RightSidebar } from '../components/home/RightSidebar';
import { SkeletonCard } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { InlineAlert } from '../components/ui/Alert';
import { Button } from '../components/ui/Button';
import { FileText, AlertCircle } from 'lucide-react';
import queries from '../queries';
import { HomeFeedV2 } from '../components/homeV2/HomeFeedV2';

// Feature flag for LinkedIn-style feed V2
const FEATURE_HOME_FEED_V2 = true;

export const Home = () => {
  // If V2 enabled, render new LinkedIn-style feed (early return is safe - no hooks after)
  if (FEATURE_HOME_FEED_V2) {
    return <HomeFeedV2 />;
  }

  // Legacy feed (unreachable when V2 is enabled)
  return <HomeLegacy />;
};

// Legacy Phase 2B feed component (separated to avoid hooks rule violation)
const HomeLegacy = () => {
  const { data, loading, error, refetch } = useQuery(queries.GET_UPDATES, {
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
  });

  const updates = data?.updates || [];

  // Sort updates by postedDate DESC (newest first)
  const sortedUpdates = [...updates].sort((a, b) => {
    return new Date(b.postedDate) - new Date(a.postedDate);
  });

  return (
    <PageContainer className="py-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Sidebar */}
        <div className="lg:col-span-3">
          <div className="sticky top-20">
            <LeftSidebar />
          </div>
        </div>

        {/* Main Feed */}
        <div className="lg:col-span-6 space-y-4">
          <FeedComposer onPostSuccess={refetch} />

          {/* Loading State */}
          {loading && (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          )}

          {/* Error State */}
          {error && (
            <InlineAlert
              variant="error"
              title="Error loading updates"
            >
              <p className="mb-3">{error.message || 'Please try again later.'}</p>
              <Button size="sm" variant="outline" onClick={() => refetch()}>
                Try Again
              </Button>
            </InlineAlert>
          )}

          {/* Empty State */}
          {!loading && !error && sortedUpdates.length === 0 && (
            <EmptyState
              icon={FileText}
              title="No updates yet"
              description="Be the first to share a research update with your community!"
            />
          )}

          {/* Feed Posts */}
          {!loading && !error && sortedUpdates.length > 0 && (
            <>
              {sortedUpdates.map((update) => (
                <FeedPostCard
                  key={update._id}
                  update={update}
                  onCommentAdded={refetch}
                />
              ))}
            </>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="lg:col-span-3 hidden lg:block">
          <div className="sticky top-20">
            <RightSidebar />
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

