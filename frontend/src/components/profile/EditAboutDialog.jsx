import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/Dialog';
import { Textarea } from '../ui/Input';
import { Button } from '../ui/Button';

export const EditAboutDialog = ({
  isOpen,
  onOpenChange,
  initialBio,
  onSave,
  updating,
}) => {
  const [bio, setBio] = useState(initialBio || '');

  // Update local state when initialBio changes or dialog opens
  useEffect(() => {
    if (isOpen) {
      setBio(initialBio || '');
    }
  }, [isOpen, initialBio]);

  const handleSave = () => {
    onSave(bio);
  };

  const handleCancel = () => {
    setBio(initialBio || '');
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit About</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              About
            </label>
            <Textarea
              rows={8}
              placeholder="Tell us about yourself, your research interests, goals, and what you're looking for in collaborations..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              Share your background, interests, and what makes you passionate about research.
            </p>
          </div>
        </div>

        <DialogFooter>
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
            disabled={updating}
            loading={updating}
          >
            {updating ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
