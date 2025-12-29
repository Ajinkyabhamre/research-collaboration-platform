import { useState, useMemo } from 'react';
import { useQuery } from '@apollo/client';
import { Link } from 'react-router-dom';
import { PageContainer, PageHeader } from '../components/layout/PageContainer';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { InlineAlert } from '../components/ui/Alert';
import { ProjectsFilters } from '../components/projects/ProjectsFilters';
import { ProjectCard } from '../components/projects/ProjectCard';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { Briefcase, Plus, Search } from 'lucide-react';
import { toast } from '../lib/toast';
import queries from '../queries';

export const Projects = () => {
  const { user } = useCurrentUser();
  const isProfessorOrAdmin = user?.role === 'PROFESSOR' || user?.role === 'ADMIN';

  const [filters, setFilters] = useState({
    search: '',
    department: '',
    year: '',
  });

  // Fetch all projects
  const { data, loading, error, refetch } = useQuery(queries.GET_PROJECTS, {
    fetchPolicy: 'cache-and-network',
    onError: (err) => {
      toast.error('Failed to load projects: ' + err.message);
    },
  });

  // Client-side filtering
  const filteredProjects = useMemo(() => {
    if (!data?.projects) return [];

    let filtered = [...data.projects];

    // Search filter (title)
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter((project) =>
        project.title.toLowerCase().includes(searchLower)
      );
    }

    // Department filter
    if (filters.department) {
      filtered = filtered.filter((project) => project.department === filters.department);
    }

    // Year filter
    if (filters.year) {
      const targetYear = parseInt(filters.year);
      filtered = filtered.filter((project) => {
        const projectYear = new Date(project.createdDate).getFullYear();
        return projectYear === targetYear;
      });
    }

    return filtered;
  }, [data, filters]);

  // Check if filters are active
  const hasActiveFilters = filters.search || filters.department || filters.year;

  // Clear all filters
  const clearFilters = () => {
    setFilters({ search: '', department: '', year: '' });
  };

  // Calculate department stats
  const departmentStats = useMemo(() => {
    if (!data?.projects) return [];

    const deptCounts = {};
    data.projects.forEach((project) => {
      deptCounts[project.department] = (deptCounts[project.department] || 0) + 1;
    });

    return Object.entries(deptCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([dept, count]) => ({
        department: dept,
        count,
      }));
  }, [data]);

  const totalStudents = useMemo(() => {
    if (!data?.projects) return 0;
    return data.projects.reduce((sum, project) => sum + (project.students?.length || 0), 0);
  }, [data]);

  const totalApplications = useMemo(() => {
    if (!data?.projects) return 0;
    return data.projects.reduce((sum, project) => sum + (project.numOfApplications || 0), 0);
  }, [data]);

  const formatDepartmentName = (dept) => {
    const deptMap = {
      COMPUTER_SCIENCE: 'Computer Science',
      ELECTRICAL_AND_COMPUTER_ENGINEERING: 'Electrical & Computer Eng.',
      MECHANICAL_ENGINEERING: 'Mechanical Engineering',
      CIVIL_ENVIRONMENTAL_AND_OCEAN_ENGINEERING: 'Civil, Environmental & Ocean Eng.',
      CHEMICAL_ENGINEERING_AND_MATERIALS_SCIENCE: 'Chemical Eng. & Materials Science',
      BIOMEDICAL_ENGINEERING: 'Biomedical Engineering',
      SYSTEMS_AND_ENTERPRISES: 'Systems & Enterprises',
      MATHEMATICAL_SCIENCES: 'Mathematical Sciences',
      PHYSICS: 'Physics',
      CHEMISTRY_AND_CHEMICAL_BIOLOGY: 'Chemistry & Chemical Biology',
    };
    return deptMap[dept] || dept;
  };

  return (
    <PageContainer>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-9">
          <PageHeader
            title="Research Projects"
            subtitle="Discover and apply to cutting-edge research opportunities at Stevens"
          />

          <ProjectsFilters
            filters={filters}
            onFilterChange={setFilters}
            hasActiveFilters={hasActiveFilters}
            onClearFilters={clearFilters}
          />

          {/* Loading State */}
          {loading && (
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
          )}

          {/* Error State */}
          {error && (
            <InlineAlert variant="error" title="Error loading projects">
              <p className="mb-3">{error.message}</p>
              <Button size="sm" variant="outline" onClick={() => refetch()}>
                Try Again
              </Button>
            </InlineAlert>
          )}

          {/* Empty State */}
          {!loading && !error && filteredProjects.length === 0 && (
            <EmptyState
              icon={hasActiveFilters ? Search : Briefcase}
              title={hasActiveFilters ? 'No projects found' : 'No projects yet'}
              description={
                hasActiveFilters
                  ? 'Try adjusting your filters to see more results'
                  : 'Check back later for new research opportunities'
              }
              action={
                hasActiveFilters ? (
                  <Button variant="outline" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                ) : null
              }
            />
          )}

          {/* Project Grid */}
          {!loading && !error && filteredProjects.length > 0 && (
            <>
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {filteredProjects.length} of {data?.projects?.length || 0} projects
                </p>
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                )}
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                {filteredProjects.map((project) => (
                  <ProjectCard key={project._id} project={project} />
                ))}
              </div>
            </>
          )}
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
                <CardTitle className="text-base">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-3xl font-bold text-stevensMaroon">
                    {data?.projects?.length || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Active Projects</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-stevensMaroon">{totalStudents}</p>
                  <p className="text-sm text-muted-foreground">Total Students</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-stevensMaroon">{totalApplications}</p>
                  <p className="text-sm text-muted-foreground">Applications Submitted</p>
                </div>
              </CardContent>
            </Card>

            {departmentStats.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Popular Departments</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {departmentStats.map(({ department, count }) => (
                    <div key={department} className="flex justify-between items-center">
                      <span className="text-sm text-gray-700 truncate">
                        {formatDepartmentName(department)}
                      </span>
                      <span className="font-semibold text-stevensMaroon ml-2">{count}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </PageContainer>
  );
};
