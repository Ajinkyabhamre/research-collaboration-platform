import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Briefcase, MapPin, Calendar, Edit2, Plus } from 'lucide-react';
import { fadeUp } from '../../lib/motion';
import { toast } from '../../lib/toast';
import { EditExperienceDialog } from './EditExperienceDialog';
import queries from '../../queries';

const formatDate = (dateStr) => {
  if (!dateStr) return null;
  // Handle YYYY-MM format
  const [year, month] = dateStr.split('-');
  if (month) {
    const date = new Date(year, parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
  }
  return year;
};

export const ExperienceSection = ({ experience = [], isOwnProfile = false }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExperience, setEditingExperience] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null);

  // STRATEGY A: Rely on Apollo normalization, no refetchQueries needed
  const [updateMyProfile, { loading: updating }] = useMutation(queries.UPDATE_MY_PROFILE, {
    onCompleted: () => {
      toast.success('Experience updated!');
      setIsDialogOpen(false);
      setEditingExperience(null);
      setEditingIndex(null);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update experience');
    },
  });

  const handleAdd = () => {
    setEditingExperience(null);
    setEditingIndex(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (exp, index) => {
    setEditingExperience(exp);
    setEditingIndex(index);
    setIsDialogOpen(true);
  };

  const handleSave = async (formData) => {
    let updatedExperience;

    if (editingIndex !== null) {
      // Edit existing
      updatedExperience = [...experience];
      updatedExperience[editingIndex] = formData;
    } else {
      // Add new
      updatedExperience = [...experience, formData];
    }

    // Strip __typename from all items (Apollo cache adds this, but GraphQL input doesn't accept it)
    const cleanedExperience = updatedExperience.map(({ __typename, ...rest }) => rest);

    try {
      await updateMyProfile({
        variables: {
          input: { experience: cleanedExperience }
        }
      });
    } catch (err) {
      console.error('Save experience error:', err);
    }
  };

  const handleDelete = async () => {
    if (editingIndex === null) return;

    const updatedExperience = experience.filter((_, i) => i !== editingIndex);

    // Strip __typename from all items
    const cleanedExperience = updatedExperience.map(({ __typename, ...rest }) => rest);

    try {
      await updateMyProfile({
        variables: {
          input: { experience: cleanedExperience }
        }
      });
    } catch (err) {
      console.error('Delete experience error:', err);
    }
  };

  // Sort experience by startDate descending (most recent first)
  const sortedExperience = React.useMemo(() => {
    return [...experience].sort((a, b) => {
      const dateA = a.startDate || '0000-00';
      const dateB = b.startDate || '0000-00';
      return dateB.localeCompare(dateA);
    });
  }, [experience]);

  return (
    <>
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.2 }}
      >
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-stevensMaroon" />
                Experience
              </CardTitle>
              {isOwnProfile && (
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={handleAdd}
                  className="flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Add
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {experience.length > 0 ? (
              <div className="space-y-4">
                {sortedExperience.map((exp, index) => (
                  <div key={index} className="relative group">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{exp.title}</h4>
                        {exp.company && (
                          <p className="text-gray-700 mt-1">{exp.company}</p>
                        )}
                        {exp.location && (
                          <div className="flex items-center gap-2 text-gray-600 text-sm mt-2">
                            <MapPin className="w-4 h-4" />
                            <span>{exp.location}</span>
                          </div>
                        )}
                        {(exp.startDate || exp.endDate) && (
                          <div className="flex items-center gap-2 text-gray-600 text-sm mt-1">
                            <Calendar className="w-4 h-4" />
                            <span>
                              {formatDate(exp.startDate) || 'Start'} {exp.endDate ? `- ${formatDate(exp.endDate)}` : '- Present'}
                            </span>
                          </div>
                        )}
                        {exp.description && (
                          <p className="text-gray-600 text-sm mt-2 whitespace-pre-line">
                            {exp.description}
                          </p>
                        )}
                      </div>
                      {isOwnProfile && (
                        <Button
                          variant="ghost"
                          size="sm"
                          type="button"
                          onClick={() => handleEdit(exp, index)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    {index < sortedExperience.length - 1 && (
                      <div className="mt-4 border-b border-gray-200" />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                {isOwnProfile
                  ? 'Add your professional experience to showcase your background.'
                  : 'No experience added yet.'}
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {isOwnProfile && (
        <EditExperienceDialog
          isOpen={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          experience={editingExperience}
          onSave={handleSave}
          onDelete={handleDelete}
          updating={updating}
        />
      )}
    </>
  );
};
