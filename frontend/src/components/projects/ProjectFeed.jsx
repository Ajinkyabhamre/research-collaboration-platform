import { useQuery } from '@apollo/client';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Skeleton } from '../ui/Skeleton';
import { EmptyState } from '../ui/EmptyState';
import { InlineAlert } from '../ui/Alert';
import { ProjectCard } from './ProjectCard';
import { Briefcase, Search, Loader2 } from 'lucide-react';
import { toast } from '../../lib/toast';
import queries from '../../queries';

export const ProjectFeed = ({ filters }) => {
  const { data, loading, error, fetchMore, refetch } = useQuery(queries.PROJECTS_FEED, {
    variables: {
      input: {
        first: 20,
        ...filters,
      },
    },
    fetchPolicy: 'cache-and-network',
    notifyOnNetworkStatusChange: true,
    onError: (err) => {
      toast.error('Failed to load projects: ' + err.message);
    },
  });

  const projects = data?.projectsFeed?.edges || [];
  const pageInfo = data?.projectsFeed?.pageInfo;
  const hasNextPage = pageInfo?.hasNextPage || false;
  const endCursor = pageInfo?.endCursor;

  // Check if filters are active
  const hasActiveFilters =
    filters.searchTerm ||
    (filters.departments && filters.departments.length > 0) ||
    filters.createdAfter ||
    filters.createdBefore;

  const handleLoadMore = async () => {
    if (!hasNextPage || !endCursor) return;

    try {
      await fetchMore({
        variables: {
          input: {
            first: 20,
            after: endCursor,
            ...filters,
          },
        },
        updateQuery: (previousResult, { fetchMoreResult }) => {
          if (!fetchMoreResult) return previousResult;

          return {
            projectsFeed: {
              ...fetchMoreResult.projectsFeed,
              edges: [
                ...previousResult.projectsFeed.edges,
                ...fetchMoreResult.projectsFeed.edges,
              ],
            },
          };
        },
      });
    } catch (err) {
      toast.error('Failed to load more projects: ' + err.message);
    }
  };

  // Loading State (initial load)
  if (loading && !data) {
    return (
      <div className="grid md:grid-cols-2 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="p-6">
            <div className="flex items-start justify-between mb-4">
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-6 w-16" />
            </div>
            <Skeleton className="h-4 w-1/2 mb-3" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4 mb-3" />
            <Skeleton className="h-4 w-full" />
          </Card>
        ))}
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <InlineAlert variant="error" title="Error loading projects">
        <p className="mb-3">{error.message}</p>
        <Button size="sm" variant="outline" onClick={() => refetch()}>
          Try Again
        </Button>
      </InlineAlert>
    );
  }

  // Empty State
  if (projects.length === 0) {
    return (
      <EmptyState
        icon={hasActiveFilters ? Search : Briefcase}
        title={hasActiveFilters ? 'No projects found' : 'No projects yet'}
        description={
          hasActiveFilters
            ? 'Try adjusting your filters to see more results'
            : 'Check back later for new research opportunities'
        }
      />
    );
  }

  // Project Grid
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {projects.length} project{projects.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {projects.map(({ node }) => (
          <ProjectCard key={node._id} project={node} />
        ))}
      </div>

      {/* Load More Button */}
      {hasNextPage && (
        <div className="flex justify-center mt-8">
          <Button
            variant="outline"
            onClick={handleLoadMore}
            disabled={loading}
            className="min-w-[200px]"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              'Load More Projects'
            )}
          </Button>
        </div>
      )}

      {/* End of results message */}
      {!hasNextPage && projects.length > 0 && (
        <div className="text-center text-sm text-muted-foreground mt-6">
          You've reached the end of the list
        </div>
      )}
    </div>
  );
};
