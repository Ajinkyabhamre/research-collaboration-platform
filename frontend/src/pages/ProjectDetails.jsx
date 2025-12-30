import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@apollo/client';
import { PageContainer } from '../components/layout/PageContainer';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { InlineAlert } from '../components/ui/Alert';
import { SimpleTabs as Tabs } from '../components/ui/Tabs';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { ArrowLeft, Briefcase, CheckCircle, Users, GraduationCap } from 'lucide-react';
import { toast } from '../lib/toast';
import queries from '../queries';
import { UpdatesList } from '../components/updates/UpdatesList';
import { UpdateComposer } from '../components/updates/UpdateComposer';

const formatDepartment = (dept) => {
  const deptMap = {
    COMPUTER_SCIENCE: 'Computer Science',
    ELECTRICAL_AND_COMPUTER_ENGINEERING: 'Electrical & Computer Engineering',
    MECHANICAL_ENGINEERING: 'Mechanical Engineering',
    CIVIL_ENVIRONMENTAL_AND_OCEAN_ENGINEERING: 'Civil, Environmental & Ocean Engineering',
    CHEMICAL_ENGINEERING_AND_MATERIALS_SCIENCE: 'Chemical Engineering & Materials Science',
    BIOMEDICAL_ENGINEERING: 'Biomedical Engineering',
    SYSTEMS_AND_ENTERPRISES: 'Systems & Enterprises',
    MATHEMATICAL_SCIENCES: 'Mathematical Sciences',
    PHYSICS: 'Physics',
    CHEMISTRY_AND_CHEMICAL_BIOLOGY: 'Chemistry & Chemical Biology',
  };
  return deptMap[dept] || dept;
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const ProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const [activeTab, setActiveTab] = useState(0);

  const { data, loading, error, refetch } = useQuery(queries.GET_PROJECT_BY_ID, {
    variables: { id },
    fetchPolicy: 'network-only',
  });

  const [addApplication, { loading: applying }] = useMutation(queries.ADD_APPLICATION, {
    onCompleted: () => {
      toast.success('Application submitted successfully!');
      refetch();
    },
    onError: (err) => {
      toast.error('Failed to apply: ' + err.message);
    },
    refetchQueries: [{ query: queries.GET_PROJECT_BY_ID, variables: { id } }],
  });

  const handleApply = async () => {
    if (!user?._id) {
      toast.error('You must be logged in to apply');
      return;
    }

    try {
      await addApplication({
        variables: {
          applicantId: user._id,
          projectId: id,
        },
      });
    } catch (err) {
      // Error handled by onError callback
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <Skeleton className="h-8 w-32 mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-6">
            <Card className="p-6">
              <Skeleton className="h-10 w-3/4 mb-4" />
              <Skeleton className="h-6 w-1/2 mb-6" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-2/3" />
            </Card>
            <Card className="p-6">
              <Skeleton className="h-6 w-32 mb-4" />
              <Skeleton className="h-20 w-full" />
            </Card>
          </div>
          <div className="lg:col-span-4">
            <Card className="p-6">
              <Skeleton className="h-10 w-full mb-4" />
              <Skeleton className="h-20 w-full" />
            </Card>
          </div>
        </div>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <InlineAlert variant="error" title="Error loading project">
          <p className="mb-3">{error.message}</p>
          <Button variant="outline" onClick={() => navigate('/projects')}>
            Back to Projects
          </Button>
        </InlineAlert>
      </PageContainer>
    );
  }

  if (!data?.getProjectById) {
    return (
      <PageContainer>
        <EmptyState
          icon={Briefcase}
          title="Project Not Found"
          description="The project you're looking for doesn't exist."
          action={
            <Button onClick={() => navigate('/projects')}>
              Back to Projects
            </Button>
          }
        />
      </PageContainer>
    );
  }

  const project = data.getProjectById;
  const isProfessorOrAdmin = user?.role === 'PROFESSOR' || user?.role === 'ADMIN';
  const isStudent = user?.role === 'STUDENT';

  // Check if user has already applied
  const hasApplied = project.applications?.some(
    (app) => app.applicant._id === user?._id
  );

  // Check if user is a project member
  const isProjectMember =
    project.professors?.some((prof) => prof._id === user?._id) ||
    project.students?.some((student) => student._id === user?._id);

  const tabs = [
    {
      label: 'Updates',
      content: (
        <div className="space-y-6">
          {isProfessorOrAdmin && isProjectMember && (
            <UpdateComposer projectId={id} />
          )}
          <UpdatesList projectId={id} limit={10} />
        </div>
      ),
    },
    {
      label: 'Professors',
      content: (
        <div className="space-y-3">
          {project.professors && project.professors.length > 0 ? (
            project.professors.map((prof) => (
              <div
                key={prof._id || `${prof.firstName}-${prof.lastName}`}
                className="flex items-center gap-3 p-4 bg-muted rounded-lg"
              >
                <Avatar
                  name={`${prof.firstName} ${prof.lastName}`}
                  size="md"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900">
                    {prof.firstName} {prof.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">
                    {prof.email}
                  </p>
                  <Badge variant="default" className="mt-1">
                    {formatDepartment(prof.department)}
                  </Badge>
                </div>
              </div>
            ))
          ) : (
            <EmptyState
              icon={Users}
              title="No professors assigned"
              description="This project doesn't have any professors yet."
            />
          )}
        </div>
      ),
    },
    {
      label: 'Students',
      content: (
        <div className="space-y-3">
          {project.students && project.students.length > 0 ? (
            project.students.map((student) => (
              <div
                key={student._id || `${student.firstName}-${student.lastName}`}
                className="flex items-center gap-3 p-4 bg-muted rounded-lg"
              >
                <Avatar
                  name={`${student.firstName} ${student.lastName}`}
                  size="md"
                  className="bg-stevensGray-400"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900">
                    {student.firstName} {student.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">
                    {student.email}
                  </p>
                  <Badge variant="default" className="mt-1">
                    {formatDepartment(student.department)}
                  </Badge>
                </div>
              </div>
            ))
          ) : (
            <EmptyState
              icon={GraduationCap}
              title="No students yet"
              description="This project doesn't have any students yet."
            />
          )}
        </div>
      ),
    },
  ];

  return (
    <PageContainer>
      <div className="mb-6">
        <Link
          to="/projects"
          className="inline-flex items-center gap-2 text-sm font-medium text-stevensMaroon hover:text-stevensMaroon-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Projects
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="p-6">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-3">{project.title}</h1>
                <div className="flex items-center flex-wrap gap-3 text-sm">
                  <Badge variant="default">{formatDepartment(project.department)}</Badge>
                  <span className="text-muted-foreground">Created {formatDate(project.createdDate)}</span>
                </div>
              </div>
              <Badge variant="success">Active</Badge>
            </div>

            <div className="border-t border-borderLight pt-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Project Description</h2>
              {project.description ? (
                <div
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: project.description }}
                />
              ) : (
                <p className="text-muted-foreground">No description available</p>
              )}
            </div>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Project Information</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs
                tabs={tabs}
                defaultTab={activeTab}
                onChange={setActiveTab}
              />
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="lg:col-span-4">
          <div className="sticky top-20 space-y-4">
            {/* Actions Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {isStudent && (
                  <>
                    {hasApplied ? (
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-blue-900 font-medium">
                          Application submitted
                        </p>
                      </div>
                    ) : (
                      <Button
                        className="w-full"
                        onClick={handleApply}
                        loading={applying}
                        disabled={applying}
                      >
                        Apply to Project
                      </Button>
                    )}
                  </>
                )}

                {isProfessorOrAdmin && (
                  <Link to={`/projects/${id}/requests`}>
                    <Button className="w-full">Manage Requests</Button>
                  </Link>
                )}
              </CardContent>
            </Card>

            {/* Stats Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Project Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-3xl font-bold text-stevensMaroon">
                    {project.numOfApplications || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Applications</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-stevensMaroon">
                    {project.students?.length || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Current Students</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-stevensMaroon">
                    {project.professors?.length || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Professors</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};
