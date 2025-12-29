import React, { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { Card } from '../ui/Card';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { UPDATE_SUBJECTS } from '../../constants/updateSubjects';
import queries from '../../queries';

export const FeedComposer = ({ onPostSuccess }) => {
  const { user } = useCurrentUser();
  const [showComposer, setShowComposer] = useState(false);
  const [content, setContent] = useState('');
  const [subject, setSubject] = useState('');
  const [projectId, setProjectId] = useState('');
  const [error, setError] = useState('');

  const [addUpdate, { loading: postLoading }] = useMutation(queries.ADD_UPDATE);

  // Fetch user's projects for the dropdown
  const { data: userData } = useQuery(queries.GET_USER_BY_ID, {
    variables: { id: user?._id },
    skip: !user?._id,
  });

  const userName = user ? `${user.firstName} ${user.lastName}` : 'User';
  const userRole = user?.role;

  // Only show composer for PROFESSOR and ADMIN roles
  if (!user || (userRole !== 'PROFESSOR' && userRole !== 'ADMIN')) {
    return null;
  }

  const userProjects = userData?.getUserById?.projects || [];

  const handlePost = async () => {
    setError('');

    // Validation
    if (!subject || !content.trim() || !projectId) {
      setError('Please fill in all fields');
      return;
    }

    try {
      await addUpdate({
        variables: {
          posterId: user._id,
          subject,
          content: content.trim(),
          projectId,
        },
      });

      // Reset form
      setContent('');
      setSubject('');
      setProjectId('');
      setShowComposer(false);
      setError('');

      // Refetch updates feed
      if (onPostSuccess) {
        onPostSuccess();
      }
    } catch (err) {
      console.error('Error adding update:', err);
      setError(err.message || 'Failed to post update. Please try again.');
    }
  };

  const handleCancel = () => {
    setShowComposer(false);
    setContent('');
    setSubject('');
    setProjectId('');
    setError('');
  };

  return (
    <Card className="mb-4">
      {!showComposer ? (
        <div className="flex items-center space-x-3">
          <Avatar name={userName} size="md" />
          <button
            onClick={() => setShowComposer(true)}
            className="flex-1 text-left px-4 py-2 rounded-full border border-gray-300
                     text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Share a research update...
          </button>
        </div>
      ) : (
        <div>
          <div className="flex space-x-3 mb-3">
            <Avatar name={userName} size="md" />
            <div className="flex-1">
              <p className="font-semibold text-sm">{userName}</p>
              <p className="text-xs text-gray-600">{userRole}</p>
            </div>
          </div>

          {/* Subject Selector */}
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Update Type
            </label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-stevensMaroon focus:border-transparent text-sm"
            >
              <option value="">Select update type</option>
              {UPDATE_SUBJECTS.map((subj) => (
                <option key={subj.value} value={subj.value}>
                  {subj.label}
                </option>
              ))}
            </select>
          </div>

          {/* Project Selector */}
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Project
            </label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-stevensMaroon focus:border-transparent text-sm"
            >
              <option value="">Select a project</option>
              {userProjects.map((project) => (
                <option key={project._id} value={project._id}>
                  {project.title}
                </option>
              ))}
            </select>
          </div>

          {/* Content Editor */}
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share details about your research update..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-stevensMaroon focus:border-transparent resize-none text-sm"
            rows={4}
          />

          {/* Error Message */}
          {error && (
            <div className="mt-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 mt-3 pt-3 border-t border-gray-200">
            <Button variant="ghost" size="sm" onClick={handleCancel} disabled={postLoading}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handlePost}
              disabled={!content.trim() || !subject || !projectId || postLoading}
              style={{ backgroundColor: '#9D1535', color: 'white' }}
            >
              {postLoading ? 'Posting...' : 'Post'}
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};
