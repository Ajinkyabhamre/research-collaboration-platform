import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Star, Github as GitHub, ExternalLink, Youtube } from 'lucide-react';
import { fadeUp } from '../../lib/motion';

export const FeaturedProjectCard = ({ user, projects, readOnly = false }) => {
  // Determine which project to feature
  const featuredProject = useMemo(() => {
    if (!projects || projects.length === 0) return null;

    // Use featuredProjectId if set
    if (user?.featuredProjectId) {
      const found = projects.find(p => p._id === user.featuredProjectId);
      if (found) return found;
    }

    // Fallback to first project
    return projects[0];
  }, [user, projects]);

  if (!featuredProject) {
    return null;
  }

  // Tech stack display logic: max 6 badges, +N if more
  const techStack = featuredProject.techStack || [];
  const visibleTech = techStack.slice(0, 6);
  const extraTechCount = techStack.length - visibleTech.length;

  // Generate a short pitch from description (first 150 chars)
  const pitch = featuredProject.description
    ? featuredProject.description.length > 150
      ? `${featuredProject.description.substring(0, 150)}...`
      : featuredProject.description
    : null;

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      transition={{ delay: 0.2 }}
    >
      <Card className="mb-6 border-stevensMaroon/30 bg-gradient-to-br from-white to-gray-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5 text-stevensMaroon fill-current" />
            Featured Project
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Project Title + Link */}
          <Link to={`/projects/${featuredProject._id}`}>
            <h3 className="text-xl font-bold text-gray-900 hover:text-stevensMaroon transition-colors mb-2">
              {featuredProject.title}
            </h3>
          </Link>

          {/* Project Pitch/Description */}
          {pitch && (
            <p className="text-gray-700 mb-3 leading-relaxed">
              {pitch}
            </p>
          )}

          {/* Tech Stack Badges */}
          {techStack.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
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

          {/* Action Buttons - only show if URLs exist */}
          <div className="flex flex-wrap gap-2">
            {featuredProject.githubUrl && (
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  window.open(featuredProject.githubUrl, '_blank', 'noopener,noreferrer');
                }}
              >
                <GitHub className="w-4 h-4 mr-2" />
                GitHub
              </Button>
            )}
            {featuredProject.liveUrl && (
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  window.open(featuredProject.liveUrl, '_blank', 'noopener,noreferrer');
                }}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Live Demo
              </Button>
            )}
            {featuredProject.demoVideoUrl && (
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  window.open(featuredProject.demoVideoUrl, '_blank', 'noopener,noreferrer');
                }}
              >
                <Youtube className="w-4 h-4 mr-2" />
                Demo Video
              </Button>
            )}
            <Link to={`/projects/${featuredProject._id}`}>
              <Button
                variant="primary"
                size="sm"
                type="button"
              >
                View Details
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
