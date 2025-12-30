import { useState } from 'react';
import { PageContainer, PageHeader } from '../components/layout/PageContainer';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/Tabs';
import { DiscoverTab } from '../components/projects/DiscoverTab';

export const ProjectsHub = () => {
  const [activeTab, setActiveTab] = useState('discover');

  return (
    <PageContainer>
      <PageHeader
        title="Research Projects"
        subtitle="Discover and apply to cutting-edge research opportunities at Stevens"
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="discover">Discover</TabsTrigger>
          <TabsTrigger value="my-projects" disabled>
            My Projects
          </TabsTrigger>
          <TabsTrigger value="applied" disabled>
            Applied
          </TabsTrigger>
        </TabsList>

        <TabsContent value="discover">
          <DiscoverTab />
        </TabsContent>

        <TabsContent value="my-projects">
          <div className="text-center py-12 text-muted-foreground">
            <p>My Projects tab coming soon...</p>
          </div>
        </TabsContent>

        <TabsContent value="applied">
          <div className="text-center py-12 text-muted-foreground">
            <p>Applied tab coming soon...</p>
          </div>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
};
