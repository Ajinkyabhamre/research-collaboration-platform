import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { CheckCircle2, Circle, Target, ChevronDown, ChevronUp } from 'lucide-react';
import { fadeUp } from '../../lib/motion';

const STORAGE_KEY = 'profileCompletenessExpanded';

export const ProfileCompleteness = ({ user, projects, onOpenEditDialog }) => {
  // Initialize from localStorage, default to collapsed (false)
  const [isExpanded, setIsExpanded] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored === 'true';
    } catch {
      return false;
    }
  });

  // Persist to localStorage when state changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(isExpanded));
    } catch (error) {
      console.error('Failed to save ProfileCompleteness state:', error);
    }
  }, [isExpanded]);
  // Calculate completeness
  const completeness = useMemo(() => {
    const checks = {
      hasProfilePhoto: !!user?.profilePhoto,
      hasHeadline: !!user?.headline && user.headline.trim() !== '',
      hasBio: !!user?.bio && user.bio.trim() !== '',
      hasProfileLinks: !!(
        user?.profileLinks?.github ||
        user?.profileLinks?.linkedin ||
        user?.profileLinks?.website
      ),
      hasProjects: projects && projects.length >= 1,
      hasFeaturedProject: !!user?.featuredProjectId,
      hasTechStack: projects && projects.some(p => p.techStack && p.techStack.length >= 3),
    };

    const completed = Object.values(checks).filter(Boolean).length;
    const total = Object.keys(checks).length;
    const percentage = Math.round((completed / total) * 100);

    return { checks, percentage, completed, total };
  }, [user, projects]);

  const checklistItems = [
    {
      key: 'hasProfilePhoto',
      label: 'Upload profile photo',
      action: 'Edit Profile',
      onAction: onOpenEditDialog,
    },
    {
      key: 'hasHeadline',
      label: 'Add headline',
      action: 'Edit Profile',
      onAction: onOpenEditDialog,
    },
    {
      key: 'hasBio',
      label: 'Write bio',
      action: null,
      hint: 'Use the Edit button in the About section',
    },
    {
      key: 'hasProfileLinks',
      label: 'Add social links (GitHub/LinkedIn/Website)',
      action: 'Edit Profile',
      onAction: onOpenEditDialog,
    },
    {
      key: 'hasProjects',
      label: 'Create at least one project',
      action: null,
      hint: 'Navigate to Projects page to create',
    },
    {
      key: 'hasFeaturedProject',
      label: 'Set featured project',
      action: null,
      hint: 'Use the star icon in Projects section',
    },
    {
      key: 'hasTechStack',
      label: 'Add tech stack to a project (3+ technologies)',
      action: null,
      hint: 'Edit project portfolio below',
    },
  ];

  // If profile is 100% complete, don't show this card
  if (completeness.percentage === 100) {
    return null;
  }

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      transition={{ delay: 0.15 }}
    >
      <Card className="mb-6 border-stevensMaroon/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-stevensMaroon" />
            Profile Completeness
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Progress Bar - Always Visible */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                {completeness.completed} of {completeness.total} completed
              </span>
              <span className="text-sm font-semibold text-stevensMaroon">
                {completeness.percentage}%
              </span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-stevensMaroon transition-all duration-300"
                style={{ width: `${completeness.percentage}%` }}
              />
            </div>
          </div>

          {/* Expand/Collapse Button */}
          <div className="mb-3">
            <Button
              variant="ghost"
              size="sm"
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full flex items-center justify-center gap-2 text-gray-700 hover:text-stevensMaroon"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  <span>Hide Details</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  <span>Show Details</span>
                </>
              )}
            </Button>
          </div>

          {/* Collapsible Checklist */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{ overflow: 'hidden' }}
              >
                {/* Checklist */}
                <div className="space-y-2 mb-4">
                  {checklistItems.map((item) => (
                    <div
                      key={item.key}
                      className="flex items-start gap-3 text-sm"
                    >
                      {completeness.checks[item.key] ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      ) : (
                        <Circle className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <p className={`${
                          completeness.checks[item.key]
                            ? 'text-gray-500 line-through'
                            : 'text-gray-700'
                        }`}>
                          {item.label}
                        </p>
                        {!completeness.checks[item.key] && item.hint && (
                          <p className="text-xs text-gray-500 mt-0.5">{item.hint}</p>
                        )}
                      </div>
                      {!completeness.checks[item.key] && item.action && item.onAction && (
                        <Button
                          variant="outline"
                          size="sm"
                          type="button"
                          onClick={item.onAction}
                          className="flex-shrink-0"
                        >
                          {item.action}
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Info Text */}
                <p className="text-xs text-gray-600">
                  Complete your profile to stand out to potential collaborators and increase your visibility.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
};
