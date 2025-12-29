import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';
import { InlineAlert } from '../ui/Alert';
import { ProjectCard } from './ProjectCard';
import { Briefcase } from 'lucide-react';
import { fadeUp } from '../../lib/motion';

export const ProjectsSection = ({
  projects,
  projectsError,
  user,
  onSetFeatured,
  onOpenEdit,
  readOnly = false,
}) => {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      transition={{ delay: 0.2 }}
    >
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-stevensMaroon" />
              My Projects
            </CardTitle>
            {projects.length > 0 && (
              <Link to="/projects">
                <Button variant="ghost" size="sm">
                  View All
                </Button>
              </Link>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {projectsError ? (
            <InlineAlert variant="error" title="Failed to load projects">
              {projectsError.message}
            </InlineAlert>
          ) : projects.length > 0 ? (
            <div className="space-y-0">
              {projects.slice(0, 3).map((project, index) => (
                <ProjectCard
                  key={project._id}
                  project={project}
                  user={user}
                  onSetFeatured={onSetFeatured}
                  onOpenEdit={onOpenEdit}
                  showBorder={index > 0}
                  readOnly={readOnly}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Briefcase}
              title="No projects yet"
              description="You haven't joined any projects. Browse available projects to get started."
              action={
                <Link to="/projects">
                  <Button>Browse Projects</Button>
                </Link>
              }
            />
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};
