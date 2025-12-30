import { useState } from 'react';
import { PageContainer, PageHeader } from '../components/layout/PageContainer';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/Tabs';
import { DiscoverTab } from '../components/projects/DiscoverTab';
import { MyProjectsTab } from '../components/projects/MyProjectsTab';
import { AppliedTab } from '../components/projects/AppliedTab';

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
          <TabsTrigger value="my-projects">
            My Projects
          </TabsTrigger>
          <TabsTrigger value="applied">
            Applied
          </TabsTrigger>
        </TabsList>

        <TabsContent value="discover">
          <DiscoverTab />
        </TabsContent>

        <TabsContent value="my-projects">
          <MyProjectsTab />
        </TabsContent>

        <TabsContent value="applied">
          <AppliedTab />
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
};
