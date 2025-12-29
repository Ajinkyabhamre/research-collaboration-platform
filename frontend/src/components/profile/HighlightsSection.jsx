import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Award, Briefcase, ExternalLink, Star, Globe, Github as GitHub, Linkedin as LinkedIn } from 'lucide-react';
import { fadeUp } from '../../lib/motion';
import { toast } from '../../lib/toast';

export const HighlightsSection = ({
  user,
  projects,
  userRole,
  userDepartment,
  formatDepartment,
  getTopFocus,
  onOpenExternalLink,
}) => {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      transition={{ delay: 0.3 }}
    >
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-stevensMaroon" />
              Highlights
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              type="button"
              onClick={() => toast.info('Customize highlights in settings (coming soon)')}
            >
              Edit
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Top Focus */}
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-50 rounded-lg flex-shrink-0">
                <Award className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Top Focus</p>
                <p className="text-sm text-gray-900">{getTopFocus(userRole, userDepartment)}</p>
              </div>
            </div>

            {/* Project Spotlight */}
            <div className="flex items-start gap-3 border-t border-borderLight pt-4">
              <div className="p-2 bg-green-50 rounded-lg flex-shrink-0">
                <Briefcase className="w-4 h-4 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Project Spotlight
                  {(() => {
                    const spotlightProject = user?.featuredProjectId
                      ? projects.find(p => p._id === user.featuredProjectId) || projects[0]
                      : projects[0];
                    return spotlightProject && user?.featuredProjectId === spotlightProject._id ? (
                      <Star className="w-3 h-3 inline ml-1 text-yellow-500 fill-current" />
                    ) : null;
                  })()}
                </p>
                {projects.length > 0 ? (() => {
                  const spotlightProject = user?.featuredProjectId
                    ? projects.find(p => p._id === user.featuredProjectId) || projects[0]
                    : projects[0];

                  // Tech stack display logic: max 6 badges, +N if more
                  const techStack = spotlightProject.techStack || [];
                  const visibleTech = techStack.slice(0, 6);
                  const extraTechCount = techStack.length - visibleTech.length;

                  return (
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <p className="text-sm text-gray-900 font-medium mb-2">{spotlightProject.title}</p>

                        {/* Tech Stack Badges */}
                        {techStack.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-1">
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

                        {/* Department Badge */}
                        <Badge variant="default" className="text-xs">
                          {formatDepartment(spotlightProject.department)}
                        </Badge>
                      </div>
                      <Link to={`/projects/${spotlightProject._id}`}>
                        <Button variant="outline" size="sm" type="button">
                          View
                        </Button>
                      </Link>
                    </div>
                  );
                })() : (
                  <p className="text-sm text-gray-600">No projects yet</p>
                )}
              </div>
            </div>

            {/* Quick Links */}
            <div className="flex items-start gap-3 border-t border-borderLight pt-4">
              <div className="p-2 bg-purple-50 rounded-lg flex-shrink-0">
                <ExternalLink className="w-4 h-4 text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Quick Links</p>
                <div className="flex items-center gap-2 flex-wrap">
                  {user?.profileLinks?.github && (
                    <Button
                      variant="outline"
                      size="sm"
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenExternalLink(user.profileLinks.github, 'GitHub profile');
                      }}
                    >
                      <GitHub className="w-4 h-4 mr-1" />
                      GitHub
                    </Button>
                  )}
                  {user?.profileLinks?.linkedin && (
                    <Button
                      variant="outline"
                      size="sm"
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenExternalLink(user.profileLinks.linkedin, 'LinkedIn profile');
                      }}
                    >
                      <LinkedIn className="w-4 h-4 mr-1" />
                      LinkedIn
                    </Button>
                  )}
                  {user?.profileLinks?.website && (
                    <Button
                      variant="outline"
                      size="sm"
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenExternalLink(user.profileLinks.website, 'Website');
                      }}
                    >
                      <Globe className="w-4 h-4 mr-1" />
                      Website
                    </Button>
                  )}
                  {!user?.profileLinks?.github && !user?.profileLinks?.linkedin && !user?.profileLinks?.website && (
                    <p className="text-sm text-gray-500">No links added yet. Add them in Edit Profile!</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
