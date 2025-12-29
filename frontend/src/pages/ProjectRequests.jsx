import { useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@apollo/client';
import { PageContainer, PageHeader } from '../components/layout/PageContainer';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { InlineAlert } from '../components/ui/Alert';
import { SimpleTabs as Tabs } from '../components/ui/Tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/Dialog';
import { ArrowLeft, Users, CheckCircle, XCircle, Clock, FileText } from 'lucide-react';
import { toast } from '../lib/toast';
import queries from '../queries';

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const formatDepartment = (dept) => {
  const deptMap = {
    COMPUTER_SCIENCE: 'CS',
    ELECTRICAL_AND_COMPUTER_ENGINEERING: 'ECE',
    MECHANICAL_ENGINEERING: 'ME',
    CIVIL_ENVIRONMENTAL_AND_OCEAN_ENGINEERING: 'CEO',
    CHEMICAL_ENGINEERING_AND_MATERIALS_SCIENCE: 'CEMS',
    BIOMEDICAL_ENGINEERING: 'BME',
    SYSTEMS_AND_ENTERPRISES: 'S&E',
    MATHEMATICAL_SCIENCES: 'Math',
    PHYSICS: 'Physics',
    CHEMISTRY_AND_CHEMICAL_BIOLOGY: 'Chem',
  };
  return deptMap[dept] || dept;
};

const getStatusVariant = (status) => {
  switch (status) {
    case 'APPROVED':
      return 'success';
    case 'REJECTED':
      return 'danger';
    case 'PENDING':
      return 'warning';
    case 'WITHDRAWN':
      return 'default';
    case 'WAITLISTED':
      return 'info';
    default:
      return 'default';
  }
};

export const ProjectRequests = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  const { data, loading, error, refetch } = useQuery(queries.GET_PROJECT_BY_ID, {
    variables: { id },
    fetchPolicy: 'network-only',
    onError: (err) => {
      toast.error('Failed to load requests: ' + err.message);
    },
  });

  const [changeStatus] = useMutation(queries.CHANGE_APPLICATION_STATUS, {
    onCompleted: () => {
      setUpdatingId(null);
      refetch();
    },
    onError: (err) => {
      setUpdatingId(null);
      toast.error('Failed to update status: ' + err.message);
    },
    refetchQueries: [{ query: queries.GET_PROJECT_BY_ID, variables: { id } }],
  });

  const handleApprove = async (applicationId) => {
    setUpdatingId(applicationId);
    try {
      await changeStatus({
        variables: {
          id: applicationId,
          status: 'APPROVED',
        },
      });
      toast.success('Application approved');
    } catch (err) {
      // Error handled by onError
    }
  };

  const handleReject = async (applicationId) => {
    setUpdatingId(applicationId);
    try {
      await changeStatus({
        variables: {
          id: applicationId,
          status: 'REJECTED',
        },
      });
      toast.success('Application rejected');
    } catch (err) {
      // Error handled by onError
    }
  };

  const applications = data?.getProjectById?.applications || [];
  const project = data?.getProjectById;

  const stats = useMemo(() => {
    return {
      total: applications.length,
      pending: applications.filter((app) => app.status === 'PENDING').length,
      approved: applications.filter((app) => app.status === 'APPROVED').length,
      rejected: applications.filter((app) => app.status === 'REJECTED').length,
    };
  }, [applications]);

  const pendingApplications = applications.filter((app) => app.status === 'PENDING');

  const ApplicationRow = ({ application, showActions = false }) => {
    const isUpdating = updatingId === application._id;

    return (
      <Card className="p-4 hover:shadow-card-hover transition-shadow">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <Avatar
              name={`${application.applicant.firstName} ${application.applicant.lastName}`}
              size="md"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-gray-900 truncate">
                  {application.applicant.firstName} {application.applicant.lastName}
                </h3>
                <Badge variant={getStatusVariant(application.status)}>
                  {application.status}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <Badge variant="default" className="text-xs">
                  {formatDepartment(application.applicant.department)}
                </Badge>
                <span>•</span>
                <span>{formatDate(application.appliedDate || new Date())}</span>
              </div>
              <button
                onClick={() => setSelectedApplicant(application.applicant)}
                className="text-sm text-stevensMaroon hover:text-stevensMaroon-700 font-medium"
              >
                View Profile
              </button>
            </div>
          </div>
          {showActions && application.status === 'PENDING' && (
            <div className="flex gap-2 flex-shrink-0">
              <Button
                size="sm"
                onClick={() => handleApprove(application._id)}
                loading={isUpdating}
                disabled={isUpdating}
              >
                Approve
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={() => handleReject(application._id)}
                loading={isUpdating}
                disabled={isUpdating}
              >
                Reject
              </Button>
            </div>
          )}
        </div>
      </Card>
    );
  };

  if (loading) {
    return (
      <PageContainer>
        <Skeleton className="h-8 w-32 mb-6" />
        <Skeleton className="h-10 w-64 mb-2" />
        <Skeleton className="h-6 w-96 mb-6" />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="p-4">
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-4 w-24" />
            </Card>
          ))}
        </div>

        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="p-6">
              <div className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-5 w-48 mb-2" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <InlineAlert variant="error" title="Error loading requests">
          <p className="mb-3">{error.message}</p>
          <Button variant="outline" onClick={() => navigate(`/projects/${id}`)}>
            Back to Project
          </Button>
        </InlineAlert>
      </PageContainer>
    );
  }

  if (!project) {
    return (
      <PageContainer>
        <EmptyState
          icon={FileText}
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

  const tabs = [
    {
      label: `Pending (${stats.pending})`,
      content: (
        <div className="space-y-4 mt-4">
          {pendingApplications.length > 0 ? (
            pendingApplications.map((app) => (
              <ApplicationRow key={app._id} application={app} showActions />
            ))
          ) : (
            <EmptyState
              icon={Clock}
              title="No pending requests"
              description="All applications have been reviewed."
            />
          )}
        </div>
      ),
    },
    {
      label: `All (${stats.total})`,
      content: (
        <div className="space-y-4 mt-4">
          {applications.length > 0 ? (
            applications.map((app) => (
              <ApplicationRow key={app._id} application={app} />
            ))
          ) : (
            <EmptyState
              icon={Users}
              title="No applications yet"
              description="No students have applied to this project."
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
          to={`/projects/${id}`}
          className="inline-flex items-center gap-2 text-sm font-medium text-stevensMaroon hover:text-stevensMaroon-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Project
        </Link>
      </div>

      <PageHeader
        title="Manage Requests"
        subtitle={project.title}
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Total</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
              <p className="text-sm text-muted-foreground">Pending</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.approved}</p>
              <p className="text-sm text-muted-foreground">Approved</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.rejected}</p>
              <p className="text-sm text-muted-foreground">Rejected</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={tabs}
        defaultTab={activeTab}
        onChange={setActiveTab}
      />

      {/* Applicant Profile Dialog */}
      <Dialog open={!!selectedApplicant} onOpenChange={() => setSelectedApplicant(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedApplicant?.firstName} {selectedApplicant?.lastName}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Avatar
                name={`${selectedApplicant?.firstName} ${selectedApplicant?.lastName}`}
                size="lg"
              />
              <div>
                <p className="font-semibold text-gray-900">
                  {selectedApplicant?.firstName} {selectedApplicant?.lastName}
                </p>
                <p className="text-sm text-muted-foreground">{selectedApplicant?.role}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-sm font-semibold text-gray-700">Email</p>
                <p className="text-gray-900">{selectedApplicant?.email}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700">Department</p>
                <p className="text-gray-900">{selectedApplicant?.department}</p>
              </div>
              {selectedApplicant?.bio && (
                <div>
                  <p className="text-sm font-semibold text-gray-700">Bio</p>
                  <p className="text-gray-900">{selectedApplicant.bio}</p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
};
