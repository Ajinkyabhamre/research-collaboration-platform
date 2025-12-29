import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/Dialog';
import { Input, Textarea } from '../ui/Input';
import { Button } from '../ui/Button';

export const EditExperienceDialog = ({
  isOpen,
  onOpenChange,
  experience,
  onSave,
  onDelete,
  updating,
}) => {
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    location: '',
    startDate: '',
    endDate: '',
    description: '',
  });

  const isEditing = !!experience;

  useEffect(() => {
    if (isOpen) {
      if (experience) {
        setFormData({
          title: experience.title || '',
          company: experience.company || '',
          location: experience.location || '',
          startDate: experience.startDate || '',
          endDate: experience.endDate || '',
          description: experience.description || '',
        });
      } else {
        setFormData({
          title: '',
          company: '',
          location: '',
          startDate: '',
          endDate: '',
          description: '',
        });
      }
    }
  }, [isOpen, experience]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (!formData.title.trim()) {
      return;
    }
    onSave(formData);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this experience entry?')) {
      onDelete();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Experience' : 'Add Experience'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              placeholder="e.g., Software Engineer Intern"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              required
            />
          </div>

          {/* Company */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company / Organization
            </label>
            <Input
              type="text"
              placeholder="e.g., Tech Company Inc."
              value={formData.company}
              onChange={(e) => handleChange('company', e.target.value)}
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <Input
              type="text"
              placeholder="e.g., New York, NY"
              value={formData.location}
              onChange={(e) => handleChange('location', e.target.value)}
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <Input
                type="month"
                value={formData.startDate}
                onChange={(e) => handleChange('startDate', e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">Format: YYYY-MM</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <Input
                type="month"
                value={formData.endDate}
                onChange={(e) => handleChange('endDate', e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">Leave blank if current</p>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <Textarea
              rows={5}
              placeholder="Describe your responsibilities, achievements, and technologies used..."
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <div className="flex items-center justify-between w-full">
            {isEditing && (
              <Button
                variant="danger"
                type="button"
                onClick={handleDelete}
                disabled={updating}
              >
                Delete
              </Button>
            )}
            <div className="flex gap-2 ml-auto">
              <Button
                variant="ghost"
                type="button"
                onClick={handleCancel}
                disabled={updating}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                type="button"
                onClick={handleSave}
                disabled={updating || !formData.title.trim()}
                loading={updating}
              >
                {updating ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
