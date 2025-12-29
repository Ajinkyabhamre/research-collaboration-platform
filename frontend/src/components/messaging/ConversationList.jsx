import React, { useState } from 'react';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { Skeleton } from '../ui/Skeleton';
import { EmptyState } from '../ui/EmptyState';
import { Search, MessageSquare } from 'lucide-react';
import { cn } from '../../lib/utils';

const formatDepartment = (dept) => {
  if (!dept) return '';
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
  return deptMap[dept] || dept.replace(/_/g, ' ');
};

export const ConversationList = ({ projects, activeProjectId, onSelectProject, loading }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProjects = projects.filter((project) =>
    project.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="h-full flex flex-col">
        <div className="p-4 border-b border-borderLight">
          <Skeleton className="h-6 w-32 mb-3" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="flex-1 p-4 space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-start gap-3">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-borderLight">
        <h2 className="text-lg font-semibold mb-3">Conversations</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {filteredProjects.length === 0 ? (
          <div className="h-full flex items-center justify-center p-4">
            <EmptyState
              icon={MessageSquare}
              title={searchQuery ? 'No projects found' : 'No project channels'}
              description={
                searchQuery
                  ? 'Try a different search term'
                  : 'Join or create a project to start messaging'
              }
            />
          </div>
        ) : (
          filteredProjects.map((project) => (
            <button
              key={project._id}
              onClick={() => onSelectProject(project)}
              className={cn(
                'w-full p-4 flex items-start gap-3 hover:bg-muted transition-colors',
                'border-b border-borderLight text-left',
                activeProjectId === project._id && 'bg-muted'
              )}
            >
              <div className="flex-shrink-0 w-12 h-12 bg-gradient-maroon rounded-lg flex items-center justify-center text-white font-semibold">
                {project.title.substring(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h4 className="font-semibold text-sm truncate">{project.title}</h4>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="text-xs">
                    {formatDepartment(project.department)}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Project Channel</p>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
};
