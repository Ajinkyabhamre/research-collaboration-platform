import React, { useState } from 'react';
import { useLazyQuery, useQuery } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import queries from '../../queries';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/Dialog';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { Skeleton } from '../ui/Skeleton';
import { Search, MessageSquare, X } from 'lucide-react';
import { toast } from 'sonner';

const formatDepartment = (dept) => {
  if (!dept) return '';
  const deptMap = {
    COMPUTER_SCIENCE: 'Computer Science',
    ELECTRICAL_AND_COMPUTER_ENGINEERING: 'Electrical & Computer Engineering',
    MECHANICAL_ENGINEERING: 'Mechanical Engineering',
    CIVIL_ENVIRONMENTAL_AND_OCEAN_ENGINEERING: 'Civil, Environmental & Ocean Engineering',
    CHEMICAL_ENGINEERING_AND_MATERIALS_SCIENCE: 'Chemical Engineering & Materials Science',
    BIOMEDICAL_ENGINEERING: 'Biomedical Engineering',
    SYSTEMS_AND_ENTERPRISES: 'Systems & Enterprises',
    MATHEMATICAL_SCIENCES: 'Mathematical Sciences',
    PHYSICS: 'Physics',
    CHEMISTRY_AND_CHEMICAL_BIOLOGY: 'Chemistry & Chemical Biology',
  };
  return deptMap[dept] || dept.replace(/_/g, ' ');
};

const formatRole = (role) => {
  const roleMap = {
    STUDENT: 'Student',
    PROFESSOR: 'Professor',
    ADMIN: 'Administrator',
  };
  return roleMap[role] || role;
};

export const UserSearchModal = ({ open, onOpenChange, onUserSelected }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const { user: currentUser } = useCurrentUser();
  const navigate = useNavigate();

  const [searchUsers, { data, loading, error }] = useLazyQuery(queries.SEARCH_USER_BY_NAME, {
    fetchPolicy: 'network-only',
  });

  // Load users when modal opens
  React.useEffect(() => {
    if (open) {
      // Search with single space to match all users
      searchUsers({ variables: { searchTerm: ' ' } });
    }
  }, [open, searchUsers]);

  const [getOrCreateConversation, { loading: creatingConversation }] = useLazyQuery(
    queries.GET_OR_CREATE_CONVERSATION,
    {
      fetchPolicy: 'network-only',
      onCompleted: (data) => {
        console.log('[UserSearchModal] getOrCreateConversation completed:', data);

        if (data?.getOrCreateConversation) {
          const conversation = data.getOrCreateConversation;

          // Log the conversation data
          console.log('[UserSearchModal] Conversation:', conversation);

          // Close modal
          onOpenChange(false);
          setSearchTerm('');

          // Notify parent to select this conversation
          if (onUserSelected) {
            console.log('[UserSearchModal] Calling onUserSelected with conversation:', conversation._id);
            onUserSelected(conversation);
          } else {
            console.error('[UserSearchModal] No onUserSelected callback provided!');
          }

          toast.success('Conversation opened');
        } else {
          console.error('[UserSearchModal] No conversation data in response');
          toast.error('Failed to create conversation');
        }
      },
      onError: (error) => {
        console.error('[UserSearchModal] Error creating conversation:', error);
        toast.error('Failed to open conversation', {
          description: error.message,
        });
      },
    }
  );

  const handleSearch = (value) => {
    setSearchTerm(value);
    // Search immediately - empty search shows all users
    const term = value.trim() || ' '; // Use space for empty search to match all
    searchUsers({ variables: { searchTerm: term } });
  };

  const handleStartConversation = async (user) => {
    console.log('[UserSearchModal] Starting conversation with user:', user);

    if (!user._id) {
      toast.error('Invalid user selected');
      return;
    }

    if (user._id === currentUser?._id) {
      toast.error('You cannot message yourself');
      return;
    }

    console.log('[UserSearchModal] Calling getOrCreateConversation with recipientId:', user._id);

    try {
      await getOrCreateConversation({ variables: { recipientId: user._id } });
    } catch (error) {
      console.error('[UserSearchModal] Exception in getOrCreateConversation:', error);
      toast.error('Failed to start conversation');
    }
  };

  const users = data?.searchUserByName || [];
  const filteredUsers = users.filter((user) => user._id !== currentUser?._id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>New Message</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search users by name..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 pr-10"
              autoFocus
            />
            {searchTerm && (
              <button
                onClick={() => {
                  setSearchTerm('');
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Loading State */}
          {loading && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-border">
                  <Skeleton className="w-12 h-12 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-32 mb-2" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                  <Skeleton className="h-9 w-20" />
                </div>
              ))}
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center py-8 text-red-500">
              <p className="font-medium">Error searching users</p>
              <p className="text-sm text-gray-500 mt-1">{error.message}</p>
            </div>
          )}

          {/* Results */}
          {!loading && !error && data && (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Search className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="font-medium">No users found</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Try a different search term
                  </p>
                </div>
              ) : (
                filteredUsers.map((user) => (
                  <div
                    key={user._id}
                    className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-gray-50 transition-colors"
                  >
                    {/* Avatar */}
                    <Avatar
                      src={user.profilePhoto}
                      fallback={user.firstName[0] + (user.lastName?.[0] || '')}
                      className="w-12 h-12"
                    />

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-gray-900 truncate">
                          {user.firstName} {user.lastName}
                        </p>
                        <Badge
                          variant={
                            user.role === 'PROFESSOR'
                              ? 'default'
                              : user.role === 'STUDENT'
                              ? 'secondary'
                              : 'destructive'
                          }
                          className="shrink-0"
                        >
                          {formatRole(user.role)}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500 truncate">
                        {formatDepartment(user.department)}
                      </p>
                      {user.headline && (
                        <p className="text-xs text-gray-400 truncate mt-0.5">
                          {user.headline}
                        </p>
                      )}
                    </div>

                    {/* Message Button */}
                    <Button
                      onClick={() => handleStartConversation(user)}
                      disabled={creatingConversation}
                      size="sm"
                      className="shrink-0"
                    >
                      <MessageSquare className="w-4 h-4 mr-1" />
                      Message
                    </Button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
