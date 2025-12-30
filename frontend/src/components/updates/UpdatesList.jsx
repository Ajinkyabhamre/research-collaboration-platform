import { useQuery } from '@apollo/client';
import { UpdateCard } from './UpdateCard';
import { EmptyState } from '../ui/EmptyState';
import { Skeleton } from '../ui/Skeleton';
import { InlineAlert } from '../ui/Alert';
import { Megaphone } from 'lucide-react';
import queries from '../../queries';

export const UpdatesList = ({ projectId, limit = 10 }) => {
  const { data, loading, error } = useQuery(queries.GET_UPDATES_BY_PROJECT_ID, {
    variables: { projectId, limit },
    fetchPolicy: 'cache-and-network',
  });

  if (loading && !data) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="p-6 border border-borderLight rounded-lg">
            <div className="flex items-start gap-3 mb-4">
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-5 w-1/3 mb-2" />
                <Skeleton className="h-4 w-1/4" />
              </div>
            </div>
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <InlineAlert variant="error" title="Error loading updates">
        {error.message}
      </InlineAlert>
    );
  }

  const updates = data?.getUpdatesByProjectId || [];

  if (updates.length === 0) {
    return (
      <EmptyState
        icon={Megaphone}
        title="No updates yet"
        description="Project updates will appear here when professors post them."
      />
    );
  }

  return (
    <div className="space-y-4">
      {updates.map(update => (
        <UpdateCard key={update._id} update={update} />
      ))}
    </div>
  );
};
