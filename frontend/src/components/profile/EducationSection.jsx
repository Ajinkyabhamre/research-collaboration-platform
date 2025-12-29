import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { GraduationCap, MapPin, Calendar, Edit2, Plus } from 'lucide-react';
import { fadeUp } from '../../lib/motion';
import { toast } from '../../lib/toast';
import { EditEducationDialog } from './EditEducationDialog';
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

export const EducationSection = ({ education = [], isOwnProfile = false }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEducation, setEditingEducation] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null);

  // STRATEGY A: Rely on Apollo normalization, no refetchQueries needed
  const [updateMyProfile, { loading: updating }] = useMutation(queries.UPDATE_MY_PROFILE, {
    onCompleted: () => {
      toast.success('Education updated!');
      setIsDialogOpen(false);
      setEditingEducation(null);
      setEditingIndex(null);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update education');
    },
  });

  const handleAdd = () => {
    setEditingEducation(null);
    setEditingIndex(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (edu, index) => {
    setEditingEducation(edu);
    setEditingIndex(index);
    setIsDialogOpen(true);
  };

  const handleSave = async (formData) => {
    let updatedEducation;

    if (editingIndex !== null) {
      // Edit existing
      updatedEducation = [...education];
      updatedEducation[editingIndex] = formData;
    } else {
      // Add new
      updatedEducation = [...education, formData];
    }

    // Strip __typename from all items (Apollo cache adds this, but GraphQL input doesn't accept it)
    const cleanedEducation = updatedEducation.map(({ __typename, ...rest }) => rest);

    try {
      await updateMyProfile({
        variables: {
          input: { education: cleanedEducation }
        }
      });
    } catch (err) {
      console.error('Save education error:', err);
    }
  };

  const handleDelete = async () => {
    if (editingIndex === null) return;

    const updatedEducation = education.filter((_, i) => i !== editingIndex);

    // Strip __typename from all items
    const cleanedEducation = updatedEducation.map(({ __typename, ...rest }) => rest);

    try {
      await updateMyProfile({
        variables: {
          input: { education: cleanedEducation }
        }
      });
    } catch (err) {
      console.error('Delete education error:', err);
    }
  };

  // Sort education by startDate descending (most recent first)
  const sortedEducation = React.useMemo(() => {
    return [...education].sort((a, b) => {
      const dateA = a.startDate || '0000-00';
      const dateB = b.startDate || '0000-00';
      return dateB.localeCompare(dateA);
    });
  }, [education]);

  return (
    <>
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.18 }}
      >
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-stevensMaroon" />
                Education
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
            {education.length > 0 ? (
              <div className="space-y-4">
                {sortedEducation.map((edu, index) => (
                  <div key={index} className="relative group">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{edu.institution}</h4>
                        {(edu.degree || edu.field) && (
                          <p className="text-gray-700 mt-1">
                            {[edu.degree, edu.field].filter(Boolean).join(' in ')}
                          </p>
                        )}
                        {edu.location && (
                          <div className="flex items-center gap-2 text-gray-600 text-sm mt-2">
                            <MapPin className="w-4 h-4" />
                            <span>{edu.location}</span>
                          </div>
                        )}
                        {(edu.startDate || edu.endDate) && (
                          <div className="flex items-center gap-2 text-gray-600 text-sm mt-1">
                            <Calendar className="w-4 h-4" />
                            <span>
                              {formatDate(edu.startDate) || 'Start'} {edu.endDate ? `- ${formatDate(edu.endDate)}` : '- Present'}
                            </span>
                          </div>
                        )}
                        {edu.description && (
                          <p className="text-gray-600 text-sm mt-2 whitespace-pre-line">
                            {edu.description}
                          </p>
                        )}
                      </div>
                      {isOwnProfile && (
                        <Button
                          variant="ghost"
                          size="sm"
                          type="button"
                          onClick={() => handleEdit(edu, index)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    {index < sortedEducation.length - 1 && (
                      <div className="mt-4 border-b border-gray-200" />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                {isOwnProfile
                  ? 'Add your educational background to showcase your qualifications.'
                  : 'No education added yet.'}
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {isOwnProfile && (
        <EditEducationDialog
          isOpen={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          education={editingEducation}
          onSave={handleSave}
          onDelete={handleDelete}
          updating={updating}
        />
      )}
    </>
  );
};
