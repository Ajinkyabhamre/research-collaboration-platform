import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/Dialog';
import { Input, Textarea } from '../ui/Input';
import { Button } from '../ui/Button';

export const EditEducationDialog = ({
  isOpen,
  onOpenChange,
  education,
  onSave,
  onDelete,
  updating,
}) => {
  const [formData, setFormData] = useState({
    institution: '',
    degree: '',
    field: '',
    startDate: '',
    endDate: '',
    location: '',
    description: '',
  });

  const isEditing = !!education;

  useEffect(() => {
    if (isOpen) {
      if (education) {
        setFormData({
          institution: education.institution || '',
          degree: education.degree || '',
          field: education.field || '',
          startDate: education.startDate || '',
          endDate: education.endDate || '',
          location: education.location || '',
          description: education.description || '',
        });
      } else {
        setFormData({
          institution: '',
          degree: '',
          field: '',
          startDate: '',
          endDate: '',
          location: '',
          description: '',
        });
      }
    }
  }, [isOpen, education]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (!formData.institution.trim()) {
      return;
    }
    onSave(formData);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this education entry?')) {
      onDelete();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Education' : 'Add Education'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Institution */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Institution <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              placeholder="e.g., Stevens Institute of Technology"
              value={formData.institution}
              onChange={(e) => handleChange('institution', e.target.value)}
              required
            />
          </div>

          {/* Degree */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Degree
            </label>
            <Input
              type="text"
              placeholder="e.g., Bachelor of Science"
              value={formData.degree}
              onChange={(e) => handleChange('degree', e.target.value)}
            />
          </div>

          {/* Field of Study */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Field of Study
            </label>
            <Input
              type="text"
              placeholder="e.g., Computer Science"
              value={formData.field}
              onChange={(e) => handleChange('field', e.target.value)}
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

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <Input
              type="text"
              placeholder="e.g., Hoboken, NJ"
              value={formData.location}
              onChange={(e) => handleChange('location', e.target.value)}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <Textarea
              rows={4}
              placeholder="Describe your coursework, achievements, or activities..."
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
                disabled={updating || !formData.institution.trim()}
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
