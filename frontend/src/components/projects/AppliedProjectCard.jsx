import { Link } from 'react-router-dom';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Clock } from 'lucide-react';
import { motion } from 'framer-motion';

const formatDepartment = (dept) => {
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

const getStatusBadgeVariant = (status) => {
  const variantMap = {
    PENDING: 'warning',
    APPROVED: 'success',
    REJECTED: 'danger',
    WAITLISTED: 'info',
    WITHDRAWN: 'default',
  };
  return variantMap[status] || 'default';
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const AppliedProjectCard = ({ project }) => {
  const { _id, title, department, application } = project;

  const mainProfessor = project.leadProfessor;
  const professorName = mainProfessor
    ? `${mainProfessor.firstName} ${mainProfessor.lastName}`
    : 'No Professor Assigned';

  const plainDescription = project.descriptionPreview || 'No description available';

  return (
    <motion.div
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className="h-full"
    >
      <Link to={`/projects/${_id}`}>
        <Card hover className="h-full flex flex-col p-6 group">
          <div className="flex-1">
            {/* Title + Status Badge */}
            <div className="flex items-start justify-between gap-3 mb-3">
              <h3 className="font-semibold text-lg text-gray-900 group-hover:text-stevensMaroon transition-colors leading-tight">
                {title}
              </h3>
              <Badge variant={getStatusBadgeVariant(application.status)} className="flex-shrink-0">
                {application.status}
              </Badge>
            </div>

            {/* Professor + Department */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
              <span className="font-medium">{professorName}</span>
              <span>•</span>
              <span>{formatDepartment(department)}</span>
            </div>

            {/* Description */}
            <p className="text-sm text-gray-700 mb-4 line-clamp-3 leading-relaxed">
              {plainDescription}
            </p>

            {/* Application Info */}
            <div className="flex items-center flex-wrap gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>Applied {formatDate(application.applicationDate)}</span>
              </div>
              {application.lastUpdatedDate !== application.applicationDate && (
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>Updated {formatDate(application.lastUpdatedDate)}</span>
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-borderLight">
            <div className="text-sm font-medium text-stevensMaroon group-hover:text-stevensMaroon-700 transition-colors flex items-center gap-1">
              View Project
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </Card>
      </Link>
    </motion.div>
  );
};
