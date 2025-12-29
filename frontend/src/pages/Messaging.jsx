import React, { useState, useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { useLocation, useSearchParams } from 'react-router-dom';
import { PageContainer, PageHeader } from '../components/layout/PageContainer';
import { Card } from '../components/ui/Card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/Tabs';
import { ConversationList } from '../components/messaging/ConversationList';
import { MessageThread } from '../components/messaging/MessageThread';
import { DirectMessageInbox } from '../components/messaging/DirectMessageInbox';
import { DirectMessageThread } from '../components/messaging/DirectMessageThread';
import { useCurrentUser } from '../hooks/useCurrentUser';
import queries from '../queries';
import { MessageSquare, Users } from 'lucide-react';

export const Messaging = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Read tab from query params or default to 'direct'
  const initialTab = searchParams.get('tab') || 'direct';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [activeProject, setActiveProject] = useState(null);
  const [activeConversation, setActiveConversation] = useState(null);
  const [conversationsKey, setConversationsKey] = useState(0);

  const { user, loading: userLoading } = useCurrentUser();

  // Fetch conversations to find and auto-select from navigation state
  const { data: conversationsData } = useQuery(queries.CONVERSATIONS, {
    skip: !user?._id,
    fetchPolicy: 'network-only',
  });

  // Fetch user's projects for project channels
  const { data: projectsData, loading: projectsLoading } = useQuery(
    queries.GET_PROJECTS_BY_USER_ID,
    {
      variables: { id: user?._id },
      skip: !user?._id,
      fetchPolicy: 'network-only',
    }
  );

  const projects = projectsData?.getProjectsByUserId || [];
  const loading = userLoading || projectsLoading;

  // Auto-select conversation when navigating from profile page
  useEffect(() => {
    const conversationId = location.state?.conversationId;
    if (conversationId && conversationsData?.conversations?.items) {
      const conversation = conversationsData.conversations.items.find(
        conv => conv._id === conversationId
      );
      if (conversation) {
        setActiveConversation(conversation);
        setActiveTab('direct');
      }
    }
  }, [location.state, conversationsData]);

  const handleSelectProject = (project) => {
    setActiveProject(project);
  };

  const handleSelectConversation = (conversation) => {
    setActiveConversation(conversation);
  };

  const handleConversationsUpdate = () => {
    // Trigger a re-render of conversations to update unread counts
    setConversationsKey(prev => prev + 1);
  };

  return (
    <PageContainer>
      <PageHeader title="Messaging" subtitle="Communicate with your team and colleagues" />

      <Card className="overflow-hidden h-[calc(100vh-14rem)]">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <div className="border-b border-border px-4">
            <TabsList className="bg-transparent">
              <TabsTrigger value="direct" className="gap-2">
                <MessageSquare className="w-4 h-4" />
                Direct Messages
              </TabsTrigger>
              <TabsTrigger value="projects" className="gap-2">
                <Users className="w-4 h-4" />
                Project Channels
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-hidden">
            {/* Direct Messages Tab */}
            <TabsContent value="direct" className="h-full m-0">
              <div className="grid grid-cols-1 lg:grid-cols-12 h-full">
                {/* Direct Message Inbox */}
                <div className="lg:col-span-4">
                  <DirectMessageInbox
                    key={conversationsKey}
                    activeConversationId={activeConversation?._id}
                    onSelectConversation={handleSelectConversation}
                    onConversationsUpdate={handleConversationsUpdate}
                  />
                </div>

                {/* Direct Message Thread */}
                <div className="lg:col-span-8">
                  {activeConversation ? (
                    <DirectMessageThread
                      conversation={activeConversation}
                      onMessageSent={handleConversationsUpdate}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full bg-gray-50">
                      <div className="text-center">
                        <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 font-medium mb-2">No conversation selected</p>
                        <p className="text-sm text-gray-400">
                          Select a conversation from the sidebar to start messaging
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Project Channels Tab */}
            <TabsContent value="projects" className="h-full m-0">
              <div className="grid grid-cols-1 lg:grid-cols-12 h-full">
                {/* Conversation List */}
                <div className="lg:col-span-4">
                  <ConversationList
                    projects={projects}
                    activeProjectId={activeProject?._id}
                    onSelectProject={handleSelectProject}
                    loading={loading}
                  />
                </div>

                {/* Message Thread */}
                <div className="lg:col-span-8">
                  <MessageThread project={activeProject} />
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </Card>
    </PageContainer>
  );
};
