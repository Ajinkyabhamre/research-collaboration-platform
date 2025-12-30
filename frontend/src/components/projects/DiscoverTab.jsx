import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { FeedFilters } from './FeedFilters';
import { ProjectFeed } from './ProjectFeed';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { Plus } from 'lucide-react';

export const DiscoverTab = () => {
  const { user } = useCurrentUser();
  const isProfessorOrAdmin = user?.role === 'PROFESSOR' || user?.role === 'ADMIN';

  const [filters, setFilters] = useState({
    searchTerm: '',
    departments: [],
    createdAfter: null,
    createdBefore: null,
  });

  // Check if any filters are active
  const hasActiveFilters =
    filters.searchTerm ||
    (filters.departments && filters.departments.length > 0) ||
    filters.createdAfter ||
    filters.createdBefore;

  const clearFilters = () => {
    setFilters({
      searchTerm: '',
      departments: [],
      createdAfter: null,
      createdBefore: null,
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Main Content */}
      <div className="lg:col-span-9">
        <FeedFilters
          filters={filters}
          onFilterChange={setFilters}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={clearFilters}
        />

        <ProjectFeed filters={filters} />
      </div>

      {/* Right Sidebar */}
      <div className="lg:col-span-3">
        <div className="sticky top-20 space-y-4">
          {isProfessorOrAdmin && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Create Project</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Have a new research opportunity? Post it here.
                </p>
                <Link to="/project/add">
                  <Button className="w-full" size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Create New Project
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">About Projects</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                Explore cutting-edge research opportunities across all engineering departments at Stevens.
              </p>
              <p>
                Apply to projects that match your interests and collaborate with faculty and fellow students.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
