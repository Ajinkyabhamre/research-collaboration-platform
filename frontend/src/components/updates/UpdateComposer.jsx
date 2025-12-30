import { useState } from 'react';
import { useMutation } from '@apollo/client';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Textarea } from '../ui/Input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/Select';
import { Megaphone } from 'lucide-react';
import { toast } from 'sonner';
import { UPDATE_SUBJECTS } from '../../constants/updateSubjects';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import queries from '../../queries';

export const UpdateComposer = ({ projectId }) => {
  const { user } = useCurrentUser();
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');

  const [addUpdate, { loading }] = useMutation(queries.ADD_UPDATE, {
    onCompleted: () => {
      toast.success('Update posted successfully!');
      setSubject('');
      setContent('');
    },
    onError: (error) => {
      toast.error('Failed to post update: ' + error.message);
    },
    refetchQueries: [
      { query: queries.GET_UPDATES_BY_PROJECT_ID, variables: { projectId, limit: 10 } }
    ],
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!subject || !content.trim()) {
      toast.error('Please select a subject and enter content');
      return;
    }

    try {
      await addUpdate({
        variables: {
          posterId: user._id,
          subject: subject,
          content: content.trim(),
          projectId: projectId,
        },
      });
    } catch (err) {
      // Error handled by onError callback
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Megaphone className="w-5 h-5 text-stevensMaroon" />
        <h3 className="text-lg font-semibold text-gray-900">Post an Update</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Subject Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Subject
          </label>
          <Select value={subject} onValueChange={setSubject}>
            <SelectTrigger>
              <SelectValue placeholder="Select update type..." />
            </SelectTrigger>
            <SelectContent>
              {UPDATE_SUBJECTS.map(({ value, label }) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Content Textarea */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Content
          </label>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share project updates, announcements, or milestones..."
            rows={4}
            className="w-full"
          />
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button type="submit" loading={loading} disabled={loading || !subject || !content.trim()}>
            Post Update
          </Button>
        </div>
      </form>
    </Card>
  );
};
