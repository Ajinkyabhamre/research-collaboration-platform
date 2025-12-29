import React from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Users, Calendar, Github as GitHub, ExternalLink, Youtube, Star, Edit as EditIcon } from 'lucide-react';

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

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
  });
};

export const ProjectCard = ({ project, user, onSetFeatured, onOpenEdit, showBorder = false, readOnly = false }) => {
  const isFeatured = user?.featuredProjectId === project._id;

  // Tech stack display logic: max 6 badges, +N if more
  const techStack = project.techStack || [];
  const visibleTech = techStack.slice(0, 6);
  const extraTechCount = techStack.length - visibleTech.length;

  return (
    <Link key={project._id} to={`/projects/${project._id}`}>
      <div
        className={`group cursor-pointer hover:bg-muted rounded-lg p-4 -mx-4 transition-colors ${
          showBorder ? 'border-t border-borderLight pt-4 mt-4' : ''
        }`}
      >
        {/* Title + External Links Row */}
        <div className="flex items-start justify-between gap-4 mb-2">
          <h4 className="font-semibold text-gray-900 group-hover:text-stevensMaroon transition-colors flex-1">
            {project.title}
          </h4>
          <div className="flex items-center gap-1">
            {/* GitHub - only show if URL exists */}
            {project.githubUrl && (
              <Button
                variant="ghost"
                size="sm"
                type="button"
                className="h-8 w-8 p-0"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  window.open(project.githubUrl, '_blank');
                }}
                title="View on GitHub"
              >
                <GitHub className="w-4 h-4" />
              </Button>
            )}
            {/* Live Demo - only show if URL exists */}
            {project.liveUrl && (
              <Button
                variant="ghost"
                size="sm"
                type="button"
                className="h-8 w-8 p-0"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  window.open(project.liveUrl, '_blank');
                }}
                title="Live Demo"
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
            )}
            {/* Demo Video - only show if URL exists */}
            {project.demoVideoUrl && (
              <Button
                variant="ghost"
                size="sm"
                type="button"
                className="h-8 w-8 p-0"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  window.open(project.demoVideoUrl, '_blank');
                }}
                title="Demo Video"
              >
                <Youtube className="w-4 h-4" />
              </Button>
            )}
            {/* Edit Project Portfolio - only show if not read-only */}
            {!readOnly && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  className="h-8 w-8 p-0"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onOpenEdit(project);
                  }}
                  title="Edit portfolio details"
                >
                  <EditIcon className="w-4 h-4" />
                </Button>
                {/* Set as Featured Button */}
                <Button
                  variant={isFeatured ? "primary" : "outline"}
                  size="sm"
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onSetFeatured(project._id);
                  }}
                  title={isFeatured ? "Featured project" : "Set as featured"}
                  className="text-xs px-2 py-1 h-8"
                >
                  <Star className={`w-3 h-3 mr-1 ${isFeatured ? 'fill-current' : ''}`} />
                  {isFeatured ? 'Featured' : 'Feature'}
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Tech Stack Badges */}
        {techStack.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {visibleTech.map((tech, idx) => (
              <Badge key={idx} variant="default" className="text-xs">
                {tech}
              </Badge>
            ))}
            {extraTechCount > 0 && (
              <Badge variant="default" className="text-xs">
                +{extraTechCount}
              </Badge>
            )}
          </div>
        )}

        {/* Department Badge (always show) */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          <Badge variant="default" className="text-xs">
            {formatDepartment(project.department)}
          </Badge>
        </div>

        {/* Professor + Date Info Row */}
        <div className="flex items-center gap-3 text-sm text-gray-600">
          {project.professors && project.professors.length > 0 && (
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>{project.professors[0].firstName} {project.professors[0].lastName}</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span>{formatDate(project.createdDate)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
};
