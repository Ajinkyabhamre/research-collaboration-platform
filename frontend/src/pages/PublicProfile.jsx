import React, { useState } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { useQuery, useLazyQuery } from '@apollo/client';
import { PageContainer } from '../components/layout/PageContainer';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { InlineAlert } from '../components/ui/Alert';
import { ProfileHero } from '../components/profile/ProfileHero';
import { FeaturedProjectCard } from '../components/profile/FeaturedProjectCard';
import { AboutSection } from '../components/profile/AboutSection';
import { SkillsSection } from '../components/profile/SkillsSection';
import { EducationSection } from '../components/profile/EducationSection';
import { ExperienceSection } from '../components/profile/ExperienceSection';
import { ProjectsSection } from '../components/profile/ProjectsSection';
import { AchievementsSection } from '../components/profile/AchievementsSection';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { toast } from '../lib/toast';
import { MessageSquare } from 'lucide-react';
import queries from '../queries';

const formatDepartment = (dept) => {
  if (!dept) return 'Department';
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
  return deptMap[dept] || dept.replace(/_/g, ' ');
};

const formatRole = (role) => {
  const roleMap = {
    STUDENT: 'Student',
    PROFESSOR: 'Professor',
    ADMIN: 'Administrator',
  };
  return roleMap[role] || role;
};

const computeCollaborations = (projects, currentUserId) => {
  if (!projects || projects.length === 0) return 0;

  const uniqueCollaborators = new Set();

  projects.forEach((project) => {
    if (project.professors) {
      project.professors.forEach((prof) => {
        if (prof._id !== currentUserId) {
          uniqueCollaborators.add(prof._id);
        }
      });
    }

    if (project.students) {
      project.students.forEach((student) => {
        if (student._id !== currentUserId) {
          uniqueCollaborators.add(student._id);
        }
      });
    }
  });

  return uniqueCollaborators.size;
};

const getTopFocus = (role, department) => {
  const roleMap = {
    STUDENT: 'Building research projects',
    PROFESSOR: 'Leading research initiatives',
    ADMIN: 'Supporting research programs',
  };

  const action = roleMap[role] || 'Working on research';
  return `${action} in ${department}`;
};

export const PublicProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useCurrentUser();

  // Fetch user data using GET_USER_BY_ID
  // STRATEGY A: Use cache-and-network for instant cached data + fresh fetch
  const { data, loading, error } = useQuery(queries.GET_USER_BY_ID, {
    variables: { id: userId },
    skip: !userId,
    fetchPolicy: 'cache-and-network',
  });

  // Lazy query to get or create conversation
  const [getOrCreateConversation, { loading: creatingConversation }] = useLazyQuery(
    queries.GET_OR_CREATE_CONVERSATION,
    {
      fetchPolicy: 'network-only',
      onCompleted: (data) => {
        if (data?.getOrCreateConversation) {
          navigate('/messaging?tab=direct', {
            state: { conversationId: data.getOrCreateConversation._id }
          });
        }
      },
      onError: (error) => {
        toast.error('Failed to start conversation', {
          description: error.message
        });
      }
    }
  );

  const user = data?.getUserById;
  const projects = user?.projects || [];

  const userName = user ? `${user.firstName} ${user.lastName}` : 'User';
  const userEmail = user?.email || 'email@stevens.edu';
  const userRole = user?.role || 'STUDENT';
  const userDepartment = formatDepartment(user?.department);
  const userBio = user?.bio || 'No bio available';

  const roleColors = {
    STUDENT: 'default',
    PROFESSOR: 'primary',
    ADMIN: 'danger',
  };

  // Helper to open external links safely
  const openExternal = (url, linkName) => {
    if (!url || url.trim() === '') {
      toast.info(`This user hasn't added their ${linkName} yet`);
      return;
    }
    const trimmedUrl = url.trim();
    if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
      toast.error('Invalid URL format');
      return;
    }
    window.open(trimmedUrl, '_blank', 'noopener,noreferrer');
  };

  // Handler: Copy profile link to clipboard
  const handleCopyProfileLink = async () => {
    const profileUrl = `${window.location.origin}/u/${userId}`;
    try {
      await navigator.clipboard.writeText(profileUrl);
      toast.success('Profile link copied to clipboard!');
    } catch (err) {
      toast.error('Failed to copy link');
      console.error('Copy error:', err);
    }
  };

  // Handler: Send direct message
  const handleSendMessage = async () => {
    if (!currentUser) {
      toast.error('You must be logged in to send messages');
      return;
    }

    if (currentUser._id === userId) {
      toast.info('You cannot send messages to yourself');
      return;
    }

    try {
      await getOrCreateConversation({
        variables: { recipientId: userId }
      });
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="max-w-4xl mx-auto">
          {/* Profile Header Skeleton */}
          <Card className="overflow-hidden mb-6">
            <Skeleton className="h-32 w-full rounded-t-lg rounded-b-none" />
            <div className="px-6 pb-6 -mt-16">
              <div className="flex items-end justify-between mb-4">
                <Skeleton className="h-32 w-32 rounded-full" />
                <Skeleton className="h-10 w-24" />
              </div>
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-5 w-64 mb-3" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-32" />
              </div>
            </div>
          </Card>

          {/* About Section Skeleton */}
          <Card className="mb-6">
            <CardHeader>
              <Skeleton className="h-6 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>

          {/* Projects Section Skeleton */}
          <Card className="mb-6">
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full mb-3" />
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    );
  }

  if (error || !user) {
    return (
      <PageContainer>
        <div className="max-w-4xl mx-auto">
          <InlineAlert variant="error" title="User Not Found">
            {error?.message || 'The requested user profile could not be found.'}
          </InlineAlert>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="max-w-4xl mx-auto">
        {/* Profile Header Card - Read Only */}
        <ProfileHero
          user={user}
          userName={userName}
          userEmail={userEmail}
          userRole={userRole}
          userDepartment={userDepartment}
          projectsCount={projects.length}
          uploadingPhoto={false}
          uploadingCover={false}
          fileInputRef={null}
          coverInputRef={null}
          onPhotoUpload={() => {}}
          onCoverUpload={() => {}}
          onOpenEditDialog={() => {}}
          onOpenExternalLink={openExternal}
          onCopyProfileLink={handleCopyProfileLink}
          formatRole={formatRole}
          roleColors={roleColors}
          readOnly={true}
          showEmail={false}
        />

        {/* Send Message Button - Only show if viewing another user's profile */}
        {currentUser && currentUser._id !== userId && (
          <div className="mb-6">
            <Button
              onClick={handleSendMessage}
              disabled={creatingConversation}
              className="w-full sm:w-auto"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              {creatingConversation ? 'Opening conversation...' : 'Send Message'}
            </Button>
          </div>
        )}

        {/* Featured Project */}
        <FeaturedProjectCard
          user={user}
          projects={projects}
          readOnly={true}
        />

        {/* About Section */}
        <AboutSection userBio={userBio} isOwnProfile={false} />

        {/* Skills Section */}
        <SkillsSection
          skills={user?.skills || []}
          isOwnProfile={false}
        />

        {/* Education Section */}
        <EducationSection
          education={user?.education || []}
          isOwnProfile={false}
        />

        {/* Experience Section */}
        <ExperienceSection
          experience={user?.experience || []}
          isOwnProfile={false}
        />

        {/* Projects Section - Read Only */}
        <ProjectsSection
          projects={projects}
          projectsError={null}
          user={user}
          onSetFeatured={() => {}}
          onOpenEdit={() => {}}
          readOnly={true}
        />

        {/* Achievements Section */}
        <AchievementsSection
          user={user}
          projects={projects}
          computeCollaborations={computeCollaborations}
        />

      </div>
    </PageContainer>
  );
};
