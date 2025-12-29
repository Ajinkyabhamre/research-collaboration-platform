import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/Dialog';
import { Input, Textarea } from '../ui/Input';
import { Button } from '../ui/Button';

export const EditProfileDialog = ({
  isOpen,
  onOpenChange,
  userName,
  formData,
  onFormChange,
  onSave,
  onCancel,
  updating,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Name (Read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <Input
              type="text"
              value={userName}
              disabled
              className="bg-gray-50 cursor-not-allowed"
            />
          </div>

          {/* Headline */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Headline
            </label>
            <Input
              type="text"
              placeholder="e.g., Computer Science Student"
              value={formData.headline}
              onChange={(e) => onFormChange('headline', e.target.value)}
            />
          </div>

          {/* City */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              City
            </label>
            <Input
              type="text"
              placeholder="e.g., Hoboken"
              value={formData.city}
              onChange={(e) => onFormChange('city', e.target.value)}
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <Input
              type="text"
              placeholder="e.g., Hoboken, NJ"
              value={formData.location}
              onChange={(e) => onFormChange('location', e.target.value)}
            />
          </div>

          {/* GitHub URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              GitHub URL
            </label>
            <Input
              type="url"
              placeholder="https://github.com/username"
              value={formData.github}
              onChange={(e) => onFormChange('github', e.target.value)}
            />
          </div>

          {/* LinkedIn URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              LinkedIn URL
            </label>
            <Input
              type="url"
              placeholder="https://linkedin.com/in/username"
              value={formData.linkedin}
              onChange={(e) => onFormChange('linkedin', e.target.value)}
            />
          </div>

          {/* Website URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Website URL
            </label>
            <Input
              type="url"
              placeholder="https://yourwebsite.com"
              value={formData.website}
              onChange={(e) => onFormChange('website', e.target.value)}
            />
          </div>
        </div>

        <p className="text-xs text-gray-500 px-1">
          Note: To edit your About section, use the Edit button in the About card below.
        </p>

        <DialogFooter>
          <Button
            variant="ghost"
            type="button"
            onClick={onCancel}
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
