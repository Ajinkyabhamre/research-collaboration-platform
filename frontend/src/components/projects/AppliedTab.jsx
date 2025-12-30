import { useState } from 'react';
import { useQuery } from '@apollo/client';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { EmptyState } from '../ui/EmptyState';
import { Skeleton } from '../ui/Skeleton';
import { InlineAlert } from '../ui/Alert';
import { AppliedProjectCard } from './AppliedProjectCard';
import { Button } from '../ui/Button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/Select';
import { FileText, ChevronDown } from 'lucide-react';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import queries from '../../queries';

export const AppliedTab = () => {
  const { user } = useCurrentUser();
  const [statusFilter, setStatusFilter] = useState(null);

  const { data, loading, error, fetchMore } = useQuery(queries.APPLIED_PROJECTS_FEED, {
    variables: {
      input: {
        first: 20,
        statusFilter: statusFilter,
      }
    },
    skip: !user,
    fetchPolicy: 'cache-and-network',
  });

  const handleLoadMore = () => {
    if (!data?.appliedProjectsFeed?.pageInfo?.hasNextPage) return;

    fetchMore({
      variables: {
        input: {
          first: 20,
          after: data.appliedProjectsFeed.pageInfo.endCursor,
          statusFilter: statusFilter,
        }
      },
    });
  };

  if (loading && !data) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i} className="p-6">
            <Skeleton className="h-6 w-3/4 mb-3" />
            <Skeleton className="h-4 w-1/2 mb-4" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-2/3" />
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <InlineAlert variant="error" title="Error loading applications">
        {error.message}
      </InlineAlert>
    );
  }

  const edges = data?.appliedProjectsFeed?.edges || [];
  const hasNextPage = data?.appliedProjectsFeed?.pageInfo?.hasNextPage || false;

  if (edges.length === 0) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-9">
          <EmptyState
            icon={FileText}
            title="No applications yet"
            description={
              statusFilter
                ? `You have no ${statusFilter.toLowerCase()} applications.`
                : "You haven't applied to any projects yet. Browse the Discover tab to find opportunities!"
            }
            action={
              statusFilter ? (
                <Button onClick={() => setStatusFilter(null)}>
                  Clear Filter
                </Button>
              ) : null
            }
          />
        </div>

        <div className="lg:col-span-3">
          <AppliedTabSidebar />
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Main Content */}
      <div className="lg:col-span-9">
        {/* Status Filter */}
        <div className="mb-6">
          <Select value={statusFilter || 'ALL'} onValueChange={(val) => setStatusFilter(val === 'ALL' ? null : val)}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Applications</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
              <SelectItem value="WAITLISTED">Waitlisted</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Count */}
        <p className="text-sm text-muted-foreground mb-4">
          Showing {edges.length} application{edges.length === 1 ? '' : 's'}
        </p>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {edges.map(({ node }) => (
            <AppliedProjectCard key={node._id} project={node} />
          ))}
        </div>

        {/* Load More */}
        {hasNextPage && (
          <div className="mt-8 text-center">
            <Button onClick={handleLoadMore} variant="outline">
              <ChevronDown className="w-4 h-4 mr-2" />
              Load More
            </Button>
          </div>
        )}

        {!hasNextPage && edges.length > 0 && (
          <p className="text-center text-sm text-muted-foreground mt-8">
            You've reached the end of your applications
          </p>
        )}
      </div>

      {/* Right Sidebar */}
      <div className="lg:col-span-3">
        <AppliedTabSidebar />
      </div>
    </div>
  );
};

// Sidebar component
const AppliedTabSidebar = () => {
  return (
    <div className="sticky top-20">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Application Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <span className="font-medium text-yellow-600">Pending:</span>
            <span className="text-muted-foreground ml-2">Submitted and under review</span>
          </div>
          <div>
            <span className="font-medium text-green-600">Approved:</span>
            <span className="text-muted-foreground ml-2">Accepted to project</span>
          </div>
          <div>
            <span className="font-medium text-red-600">Rejected:</span>
            <span className="text-muted-foreground ml-2">Application declined</span>
          </div>
          <div>
            <span className="font-medium text-blue-600">Waitlisted:</span>
            <span className="text-muted-foreground ml-2">On waiting list</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
