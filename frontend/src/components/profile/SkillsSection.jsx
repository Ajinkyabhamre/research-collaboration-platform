import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Award, X, Plus } from 'lucide-react';
import { fadeUp } from '../../lib/motion';
import { toast } from '../../lib/toast';
import queries from '../../queries';

export const SkillsSection = ({ skills = [], isOwnProfile = false }) => {
  const [skillInput, setSkillInput] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // STRATEGY A: Rely on Apollo normalization, no refetchQueries needed
  const [updateMyProfile, { loading: updating }] = useMutation(queries.UPDATE_MY_PROFILE, {
    onCompleted: () => {
      toast.success('Skills updated!');
      setSkillInput('');
      setIsAdding(false);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update skills');
    },
  });

  const handleAddSkill = async () => {
    const newSkill = skillInput.trim();
    if (!newSkill) {
      toast.error('Please enter a skill');
      return;
    }

    if (newSkill.length > 32) {
      toast.error('Skill name must be 32 characters or less');
      return;
    }

    if (skills.length >= 30) {
      toast.error('Maximum 30 skills allowed');
      return;
    }

    // Check for duplicates (case-insensitive)
    if (skills.some(s => s.toLowerCase() === newSkill.toLowerCase())) {
      toast.error('This skill already exists');
      return;
    }

    const updatedSkills = [...skills, newSkill];

    try {
      await updateMyProfile({
        variables: {
          input: { skills: updatedSkills }
        }
      });
    } catch (err) {
      console.error('Add skill error:', err);
    }
  };

  const handleRemoveSkill = async (skillToRemove) => {
    const updatedSkills = skills.filter(s => s !== skillToRemove);

    try {
      await updateMyProfile({
        variables: {
          input: { skills: updatedSkills }
        }
      });
    } catch (err) {
      console.error('Remove skill error:', err);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleAddSkill();
    }
  };

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      transition={{ delay: 0.15 }}
    >
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5 text-stevensMaroon" />
            Skills
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Add Skill Input (Own Profile Only) */}
          {isOwnProfile && (
            <div className="mb-4">
              {!isAdding ? (
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => setIsAdding(true)}
                  className="flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Add Skill
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="e.g., React, Python, Machine Learning"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    maxLength={32}
                    className="flex-1"
                    autoFocus
                  />
                  <Button
                    variant="primary"
                    size="sm"
                    type="button"
                    onClick={handleAddSkill}
                    disabled={updating || !skillInput.trim()}
                    loading={updating}
                  >
                    Add
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    type="button"
                    onClick={() => {
                      setIsAdding(false);
                      setSkillInput('');
                    }}
                    disabled={updating}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Skills List */}
          {skills.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {skills.map((skill, index) => (
                <Badge
                  key={`${skill}-${index}`}
                  variant="default"
                  className="flex items-center gap-1 group"
                >
                  {skill}
                  {isOwnProfile && (
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      disabled={updating}
                      className="ml-1 opacity-60 hover:opacity-100 transition-opacity"
                      aria-label={`Remove ${skill}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              {isOwnProfile
                ? 'Add skills to showcase your expertise.'
                : 'No skills added yet.'}
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};
