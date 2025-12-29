import React from 'react';
import { PageContainer, PageHeader } from '../components/layout/PageContainer';
import { Card } from '../components/ui/Card';
import { SimpleTabs as Tabs } from '../components/ui/Tabs';
import { EmptyState } from '../components/ui/EmptyState';
import { NotificationCard } from '../components/notifications/NotificationCard';
import { mockNotifications } from '../mocks/notifications';
import { Bell, AtSign } from 'lucide-react';

export const Notifications = () => {
  const allNotifications = mockNotifications;
  const mentionNotifications = mockNotifications.filter(
    (notif) => notif.type === 'mention'
  );

  const tabs = [
    {
      label: `All (${allNotifications.length})`,
      content: (
        <div className="space-y-3 mt-4">
          {allNotifications.length > 0 ? (
            allNotifications.map((notification) => (
              <NotificationCard key={notification.id} notification={notification} />
            ))
          ) : (
            <EmptyState
              icon={Bell}
              title="No notifications"
              description="You're all caught up! Check back later for updates."
            />
          )}
        </div>
      ),
    },
    {
      label: `Mentions (${mentionNotifications.length})`,
      content: (
        <div className="space-y-3 mt-4">
          {mentionNotifications.length > 0 ? (
            mentionNotifications.map((notification) => (
              <NotificationCard key={notification.id} notification={notification} />
            ))
          ) : (
            <EmptyState
              icon={AtSign}
              title="No mentions yet"
              description="When someone mentions you, it will appear here."
            />
          )}
        </div>
      ),
    },
  ];

  return (
    <PageContainer>
      <div className="max-w-3xl mx-auto">
        <PageHeader
          title="Notifications"
          subtitle="Stay updated with your research activities"
        />

        <Card>
          <Tabs tabs={tabs} defaultTab={0} />
        </Card>
      </div>
    </PageContainer>
  );
};
