import React, { useState, useRef } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { useAuth } from '@clerk/clerk-react';
import { PageContainer } from '../components/layout/PageContainer';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Skeleton } from '../components/ui/Skeleton';
import { ProfileHero } from '../components/profile/ProfileHero';
import { ProfileCompleteness } from '../components/profile/ProfileCompleteness';
import { FeaturedProjectCard } from '../components/profile/FeaturedProjectCard';
import { AboutSection } from '../components/profile/AboutSection';
import { SkillsSection } from '../components/profile/SkillsSection';
import { EducationSection } from '../components/profile/EducationSection';
import { ExperienceSection } from '../components/profile/ExperienceSection';
import { ProjectsSection } from '../components/profile/ProjectsSection';
import { AchievementsSection } from '../components/profile/AchievementsSection';
import { EditProfileDialog } from '../components/profile/EditProfileDialog';
import { EditProjectPortfolioDialog } from '../components/profile/EditProjectPortfolioDialog';
import { ImageEditorDialog } from '../components/homeV2/ImageEditorDialog';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { toast } from '../lib/toast';
import { uploadMedia } from '../lib/upload';
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

  // Count unique collaborators across all projects
  const uniqueCollaborators = new Set();

  projects.forEach((project) => {
    // Add all professors
    if (project.professors) {
      project.professors.forEach((prof) => {
        if (prof._id !== currentUserId) {
          uniqueCollaborators.add(prof._id);
        }
      });
    }

    // Add all students
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

export const Profile = () => {
  const { user, loading: userLoading, refetch: refetchUser } = useCurrentUser();
  const { getToken } = useAuth();

  // Edit Profile Dialog State
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    headline: '',
    city: '',
    location: '',
    github: '',
    linkedin: '',
    website: '',
  });

  // Edit Project Portfolio Dialog State
  const [isEditProjectOpen, setIsEditProjectOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [projectFormData, setProjectFormData] = useState({
    githubUrl: '',
    liveUrl: '',
    demoVideoUrl: '',
    techStack: '',
  });

  // Photo upload state
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [selectedPhotoFile, setSelectedPhotoFile] = useState(null);
  const [isPhotoEditorOpen, setIsPhotoEditorOpen] = useState(false);
  const fileInputRef = useRef(null);

  // Cover photo upload state
  const [uploadingCover, setUploadingCover] = useState(false);
  const [selectedCoverFile, setSelectedCoverFile] = useState(null);
  const [isCoverEditorOpen, setIsCoverEditorOpen] = useState(false);
  const coverInputRef = useRef(null);

  // Helper to open external links safely
  const openExternal = (url, linkName) => {
    if (!url || url.trim() === '') {
      toast.info(`Add your ${linkName} in Edit Profile`);
      return;
    }
    const trimmedUrl = url.trim();
    if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
      toast.error('Invalid URL format');
      return;
    }
    window.open(trimmedUrl, '_blank', 'noopener,noreferrer');
  };

  // Update My Profile Mutation
  // STRATEGY A: Rely on Apollo normalization, no refetchQueries needed
  const [updateMyProfile, { loading: updating }] = useMutation(queries.UPDATE_MY_PROFILE, {
    onCompleted: () => {
      toast.success('Profile updated successfully!');
      setIsEditDialogOpen(false);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update profile');
    },
  });

  // Update Project Portfolio Mutation
  const [updateProjectPortfolio, { loading: updatingProject }] = useMutation(queries.UPDATE_PROJECT_PORTFOLIO, {
    refetchQueries: [
      { query: queries.GET_PROJECTS_BY_USER_ID, variables: { id: user?._id } }
    ],
    onCompleted: () => {
      toast.success('Project portfolio updated successfully!');
      setIsEditProjectOpen(false);
      setEditingProject(null);
      setProjectFormData({
        githubUrl: '',
        liveUrl: '',
        demoVideoUrl: '',
        techStack: '',
      });
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update project portfolio');
    },
  });

  // Fetch user's projects
  const { data: projectsData, loading: projectsLoading, error: projectsError } = useQuery(
    queries.GET_PROJECTS_BY_USER_ID,
    {
      variables: { id: user?._id },
      skip: !user?._id,
      fetchPolicy: 'network-only',
    }
  );

  const projects = projectsData?.getProjectsByUserId || [];
  const loading = userLoading || projectsLoading;

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

  // Handler: Open Edit Dialog and prefill form
  const handleOpenEditDialog = () => {
    setFormData({
      headline: user?.headline || '',
      city: user?.city || '',
      location: user?.location || '',
      github: user?.profileLinks?.github || '',
      linkedin: user?.profileLinks?.linkedin || '',
      website: user?.profileLinks?.website || '',
    });
    setIsEditDialogOpen(true);
  };

  // Handler: Close dialog and reset form
  const handleCancelEdit = () => {
    setIsEditDialogOpen(false);
    setFormData({
      headline: '',
      city: '',
      location: '',
      github: '',
      linkedin: '',
      website: '',
    });
  };

  // Handler: Copy profile link to clipboard
  const handleCopyProfileLink = async () => {
    const profileUrl = `${window.location.origin}/u/${user?._id}`;
    try {
      await navigator.clipboard.writeText(profileUrl);
      toast.success('Profile link copied to clipboard!');
    } catch (err) {
      toast.error('Failed to copy link');
      console.error('Copy error:', err);
    }
  };

  // Handler: Form field change
  const handleFormChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Handler: Save profile
  const handleSaveProfile = async () => {
    // Client-side URL validation
    const validateURL = (url) => {
      if (!url || url.trim() === '') return true; // Empty is ok
      return url.trim().startsWith('http://') || url.trim().startsWith('https://');
    };

    if (!validateURL(formData.github)) {
      toast.error('GitHub URL must start with http:// or https://');
      return;
    }
    if (!validateURL(formData.linkedin)) {
      toast.error('LinkedIn URL must start with http:// or https://');
      return;
    }
    if (!validateURL(formData.website)) {
      toast.error('Website URL must start with http:// or https://');
      return;
    }

    // Build input object
    const input = {
      headline: formData.headline || null,
      city: formData.city || null,
      location: formData.location || null,
      profileLinks: {
        github: formData.github || null,
        linkedin: formData.linkedin || null,
        website: formData.website || null,
      },
    };

    try {
      await updateMyProfile({ variables: { input } });
    } catch (err) {
      // Error handled by onError callback
      console.error('Update profile error:', err);
    }
  };

  // Handle setting featured project
  const handleSetFeaturedProject = async (projectId) => {
    try {
      await updateMyProfile({
        variables: {
          input: { featuredProjectId: projectId }
        }
      });
      toast.success('Featured project updated!');
    } catch (error) {
      console.error('Set featured project error:', error);
      toast.error(error.message || 'Failed to update featured project');
    }
  };

  // Handle photo upload
  // Handler: Photo file selection
  const handlePhotoUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 6MB like backend)
    if (file.size > 6 * 1024 * 1024) {
      toast.error('Image must be less than 6MB');
      return;
    }

    // Store file and open editor
    setSelectedPhotoFile(file);
    setIsPhotoEditorOpen(true);

    // Reset file input for future selections
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handler: Apply edited photo
  const handleApplyPhotoEdit = async (editedFile) => {
    setIsPhotoEditorOpen(false);
    setUploadingPhoto(true);

    try {
      // Get auth token
      const token = await getToken();
      if (!token) {
        toast.error('Authentication required');
        setSelectedPhotoFile(null);
        return;
      }

      // Upload edited file
      const { url } = await uploadMedia(editedFile, token);

      // Update profile with photo URL
      await updateMyProfile({
        variables: {
          input: { profilePhoto: url }
        }
      });

      toast.success('Profile photo updated!');
    } catch (error) {
      console.error('Photo upload error:', error);
      toast.error(error.message || 'Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
      setSelectedPhotoFile(null);
    }
  };

  // Handler: Skip photo editing (use original)
  const handleSkipPhotoEdit = async () => {
    if (!selectedPhotoFile) return;

    setIsPhotoEditorOpen(false);
    setUploadingPhoto(true);

    try {
      // Get auth token
      const token = await getToken();
      if (!token) {
        toast.error('Authentication required');
        setSelectedPhotoFile(null);
        return;
      }

      // Upload original file
      const { url } = await uploadMedia(selectedPhotoFile, token);

      // Update profile with photo URL
      await updateMyProfile({
        variables: {
          input: { profilePhoto: url }
        }
      });

      toast.success('Profile photo updated!');
    } catch (error) {
      console.error('Photo upload error:', error);
      toast.error(error.message || 'Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
      setSelectedPhotoFile(null);
    }
  };

  // Handler: Cancel photo editing
  const handleCancelPhotoEdit = () => {
    setIsPhotoEditorOpen(false);
    setSelectedPhotoFile(null);
  };

  // Handler: Cover photo file selection
  const handleCoverUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 6MB like backend)
    if (file.size > 6 * 1024 * 1024) {
      toast.error('Image must be less than 6MB');
      return;
    }

    // Store file and open editor
    setSelectedCoverFile(file);
    setIsCoverEditorOpen(true);

    // Reset file input for future selections
    if (coverInputRef.current) {
      coverInputRef.current.value = '';
    }
  };

  // Handler: Apply edited cover photo
  const handleApplyCoverEdit = async (editedFile) => {
    setIsCoverEditorOpen(false);
    setUploadingCover(true);

    try {
      // Get auth token
      const token = await getToken();
      if (!token) {
        toast.error('Authentication required');
        setSelectedCoverFile(null);
        return;
      }

      // Upload edited file
      const { url } = await uploadMedia(editedFile, token);

      // Update profile with cover photo URL
      await updateMyProfile({
        variables: {
          input: { coverPhoto: url }
        }
      });

      toast.success('Cover photo updated!');
    } catch (error) {
      console.error('Cover photo upload error:', error);
      toast.error(error.message || 'Failed to upload cover photo');
    } finally {
      setUploadingCover(false);
      setSelectedCoverFile(null);
    }
  };

  // Handler: Skip cover photo editing (use original)
  const handleSkipCoverEdit = async () => {
    if (!selectedCoverFile) return;

    setIsCoverEditorOpen(false);
    setUploadingCover(true);

    try {
      // Get auth token
      const token = await getToken();
      if (!token) {
        toast.error('Authentication required');
        setSelectedCoverFile(null);
        return;
      }

      // Upload original file
      const { url } = await uploadMedia(selectedCoverFile, token);

      // Update profile with cover photo URL
      await updateMyProfile({
        variables: {
          input: { coverPhoto: url }
        }
      });

      toast.success('Cover photo updated!');
    } catch (error) {
      console.error('Cover photo upload error:', error);
      toast.error(error.message || 'Failed to upload cover photo');
    } finally {
      setUploadingCover(false);
      setSelectedCoverFile(null);
    }
  };

  // Handler: Cancel cover photo editing
  const handleCancelCoverEdit = () => {
    setIsCoverEditorOpen(false);
    setSelectedCoverFile(null);
  };

  // Handler: Open Edit Project Portfolio Dialog
  const handleOpenProjectEdit = (project) => {
    setEditingProject(project);
    setProjectFormData({
      githubUrl: project.githubUrl || '',
      liveUrl: project.liveUrl || '',
      demoVideoUrl: project.demoVideoUrl || '',
      techStack: project.techStack ? project.techStack.join(', ') : '',
    });
    setIsEditProjectOpen(true);
  };

  // Handler: Close Edit Project Portfolio Dialog
  const handleCloseProjectEdit = () => {
    setIsEditProjectOpen(false);
    setEditingProject(null);
    setProjectFormData({
      githubUrl: '',
      liveUrl: '',
      demoVideoUrl: '',
      techStack: '',
    });
  };

  // Handler: Project form field change
  const handleProjectFormChange = (field, value) => {
    setProjectFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Handler: Save project portfolio
  const handleSaveProjectPortfolio = async () => {
    if (!editingProject) return;

    // Client-side URL validation
    const validateURL = (url) => {
      if (!url || url.trim() === '') return true; // Empty is ok
      return url.trim().startsWith('http://') || url.trim().startsWith('https://');
    };

    if (!validateURL(projectFormData.githubUrl)) {
      toast.error('GitHub URL must start with http:// or https://');
      return;
    }
    if (!validateURL(projectFormData.liveUrl)) {
      toast.error('Live URL must start with http:// or https://');
      return;
    }
    if (!validateURL(projectFormData.demoVideoUrl)) {
      toast.error('Demo Video URL must start with http:// or https://');
      return;
    }

    // Parse tech stack from comma-separated string to array
    const techStackArray = projectFormData.techStack
      .split(',')
      .map(tech => tech.trim())
      .filter(tech => tech !== '');

    // Build input object
    const input = {
      githubUrl: projectFormData.githubUrl || null,
      liveUrl: projectFormData.liveUrl || null,
      demoVideoUrl: projectFormData.demoVideoUrl || null,
      techStack: techStackArray.length > 0 ? techStackArray : null,
    };

    try {
      await updateProjectPortfolio({
        variables: {
          projectId: editingProject._id,
          input,
        },
      });
    } catch (err) {
      // Error handled by onError callback
      console.error('Update project portfolio error:', err);
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

  return (
    <PageContainer>
      <div className="max-w-4xl mx-auto">
        {/* Profile Header Card */}
        <ProfileHero
          user={user}
          userName={userName}
          userEmail={userEmail}
          userRole={userRole}
          userDepartment={userDepartment}
          projectsCount={projects.length}
          uploadingPhoto={uploadingPhoto}
          uploadingCover={uploadingCover}
          fileInputRef={fileInputRef}
          coverInputRef={coverInputRef}
          onPhotoUpload={handlePhotoUpload}
          onCoverUpload={handleCoverUpload}
          onOpenEditDialog={handleOpenEditDialog}
          onOpenExternalLink={openExternal}
          onCopyProfileLink={handleCopyProfileLink}
          formatRole={formatRole}
          roleColors={roleColors}
          readOnly={false}
          showEmail={true}
        />

        {/* Profile Completeness */}
        <ProfileCompleteness
          user={user}
          projects={projects}
          onOpenEditDialog={handleOpenEditDialog}
        />

        {/* Featured Project */}
        <FeaturedProjectCard
          user={user}
          projects={projects}
          readOnly={false}
        />

        {/* About Section */}
        <AboutSection userBio={userBio} isOwnProfile={true} />

        {/* Skills Section */}
        <SkillsSection
          skills={user?.skills || []}
          isOwnProfile={true}
        />

        {/* Education Section */}
        <EducationSection
          education={user?.education || []}
          isOwnProfile={true}
        />

        {/* Experience Section */}
        <ExperienceSection
          experience={user?.experience || []}
          isOwnProfile={true}
        />

        {/* Projects Section */}
        <ProjectsSection
          projects={projects}
          projectsError={projectsError}
          user={user}
          onSetFeatured={handleSetFeaturedProject}
          onOpenEdit={handleOpenProjectEdit}
          readOnly={false}
        />

        {/* Achievements Section */}
        <AchievementsSection
          user={user}
          projects={projects}
          computeCollaborations={computeCollaborations}
        />

      </div>

      {/* Edit Profile Dialog */}
      <EditProfileDialog
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        userName={userName}
        formData={formData}
        onFormChange={handleFormChange}
        onSave={handleSaveProfile}
        onCancel={handleCancelEdit}
        updating={updating}
      />

      {/* Edit Project Portfolio Dialog */}
      <EditProjectPortfolioDialog
        isOpen={isEditProjectOpen}
        onOpenChange={setIsEditProjectOpen}
        editingProject={editingProject}
        projectFormData={projectFormData}
        onFormChange={handleProjectFormChange}
        onSave={handleSaveProjectPortfolio}
        onClose={handleCloseProjectEdit}
        updating={updatingProject}
      />

      {/* Profile Photo Editor Dialog - 1:1 aspect ratio locked */}
      <ImageEditorDialog
        open={isPhotoEditorOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleCancelPhotoEdit();
          }
        }}
        file={selectedPhotoFile}
        onApply={handleApplyPhotoEdit}
        onSkip={handleSkipPhotoEdit}
        initialAspect={1}
        lockedAspect={true}
      />

      {/* Cover Photo Editor Dialog - 3:1 aspect ratio locked */}
      <ImageEditorDialog
        open={isCoverEditorOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleCancelCoverEdit();
          }
        }}
        file={selectedCoverFile}
        onApply={handleApplyCoverEdit}
        onSkip={handleSkipCoverEdit}
        initialAspect={3}
        lockedAspect={true}
      />
    </PageContainer>
  );
};
