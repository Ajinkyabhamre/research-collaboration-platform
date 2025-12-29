import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Users, Edit2 } from 'lucide-react';
import { fadeUp } from '../../lib/motion';
import { EditAboutDialog } from './EditAboutDialog';
import { toast } from '../../lib/toast';
import queries from '../../queries';

export const AboutSection = ({ userBio, isOwnProfile = false }) => {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // STRATEGY A: Rely on Apollo normalization, no refetchQueries needed
  const [updateMyProfile, { loading: updating }] = useMutation(queries.UPDATE_MY_PROFILE, {
    onCompleted: () => {
      toast.success('About section updated successfully!');
      setIsEditDialogOpen(false);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update about section');
    },
  });

  const handleSave = async (bio) => {
    try {
      await updateMyProfile({
        variables: {
          input: { bio: bio || null }
        }
      });
    } catch (err) {
      console.error('Update about error:', err);
    }
  };

  return (
    <>
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.1 }}
      >
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-stevensMaroon" />
                About
              </CardTitle>
              {isOwnProfile && (
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={() => setIsEditDialogOpen(true)}
                  className="flex items-center gap-1"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 whitespace-pre-line">
              {userBio || (isOwnProfile ? 'Click Edit to add information about yourself.' : 'No bio added yet.')}
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {isOwnProfile && (
        <EditAboutDialog
          isOpen={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          initialBio={userBio}
          onSave={handleSave}
          updating={updating}
        />
      )}
    </>
  );
};
