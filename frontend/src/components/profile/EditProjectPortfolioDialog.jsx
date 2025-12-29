import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/Dialog';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

export const EditProjectPortfolioDialog = ({
  isOpen,
  onOpenChange,
  editingProject,
  projectFormData,
  onFormChange,
  onSave,
  onClose,
  updating,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Project Portfolio</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Project Title (Read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Project
            </label>
            <Input
              type="text"
              value={editingProject?.title || ''}
              disabled
              className="bg-gray-50 cursor-not-allowed"
            />
          </div>

          {/* GitHub URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              GitHub Repository URL
            </label>
            <Input
              type="url"
              placeholder="https://github.com/username/repo"
              value={projectFormData.githubUrl}
              onChange={(e) => onFormChange('githubUrl', e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-1">Link to your project's GitHub repository</p>
          </div>

          {/* Live URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Live Demo URL
            </label>
            <Input
              type="url"
              placeholder="https://yourproject.com"
              value={projectFormData.liveUrl}
              onChange={(e) => onFormChange('liveUrl', e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-1">Link to your deployed project</p>
          </div>

          {/* Demo Video URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Demo Video URL
            </label>
            <Input
              type="url"
              placeholder="https://youtube.com/watch?v=..."
              value={projectFormData.demoVideoUrl}
              onChange={(e) => onFormChange('demoVideoUrl', e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-1">Link to a video demo (YouTube, Vimeo, etc.)</p>
          </div>

          {/* Tech Stack */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tech Stack
            </label>
            <Input
              type="text"
              placeholder="React, Node.js, MongoDB, GraphQL"
              value={projectFormData.techStack}
              onChange={(e) => onFormChange('techStack', e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-1">Comma-separated list of technologies used</p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            type="button"
            onClick={onClose}
            disabled={updating}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            type="button"
            onClick={onSave}
            disabled={updating}
            loading={updating}
          >
            {updating ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
