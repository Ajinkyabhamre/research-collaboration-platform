import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { SignIn, SignUp, SignedIn, SignedOut } from '@clerk/clerk-react';

import { AppShell } from './components/layout/AppShell';
import ProtectedRoute from './components/ProtectedRoute';
import { useMessageNotifications } from './hooks/useMessageNotifications';

// New Pages
import { Landing } from './pages/Landing';
import { Home } from './pages/Home';
import { Projects } from './pages/Projects';
import { ProjectDetails } from './pages/ProjectDetails';
import { ProjectRequests } from './pages/ProjectRequests';
import { Messaging } from './pages/Messaging';
import { Notifications } from './pages/Notifications';
import { Profile } from './pages/Profile';
import { PublicProfile } from './pages/PublicProfile';

// Old components (keep for now to avoid breaking existing routes)
import NotFound from './components/common/NotFound';
import UserDashboard from './components/dashboard/UserDashboard';
import EditUser from './components/dashboard/EditUser';
import ProjectList from './components/project/List';
import OldProjectDetails from './components/project/[id]/Details';
import Requests from './components/project/[id]/Requests';
import Team from './components/project/[id]/Team';
import ProjectLayout from './components/project/[id]/ProjectWrapper';
import ProjectAdd from './components/project/Add';
import Chat from './components/Chat';
import Newsfeed from './components/Newsfeed';
import ApplicationList from './components/application/List';
import ApplicationDetails from './components/application/[id]/Details';
import AllProjectList from './components/all_projects/List';


const App = () => {
  // Enable real-time message notifications
  useMessageNotifications();

  return (
    <Routes>
        {/* Public Routes */}
        <Route
          path="/"
          element={
            <>
              <SignedIn>
                <Navigate to="/home" replace />
              </SignedIn>
              <SignedOut>
                <Landing />
              </SignedOut>
            </>
          }
        />

        {/* Clerk Authentication Routes */}
        <Route
          path="/sign-in/*"
          element={
            <>
              <SignedIn>
                <Navigate to="/home" replace />
              </SignedIn>
              <SignedOut>
                <div className="min-h-screen flex items-center justify-center bg-appBg">
                  <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" />
                </div>
              </SignedOut>
            </>
          }
        />

        <Route
          path="/sign-up/*"
          element={
            <>
              <SignedIn>
                <Navigate to="/home" replace />
              </SignedIn>
              <SignedOut>
                <div className="min-h-screen flex items-center justify-center bg-appBg">
                  <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" />
                </div>
              </SignedOut>
            </>
          }
        />

        {/* New Protected Routes (LinkedIn-style) */}
        <Route
          path="/home"
          element={
            <ProtectedRoute allowedRoles={['PROFESSOR', 'ADMIN', 'STUDENT']}>
              <AppShell>
                <Home />
              </AppShell>
            </ProtectedRoute>
          }
        />

        <Route
          path="/projects"
          element={
            <ProtectedRoute allowedRoles={['PROFESSOR', 'ADMIN', 'STUDENT']}>
              <AppShell>
                <Projects />
              </AppShell>
            </ProtectedRoute>
          }
        />

        <Route
          path="/projects/:id"
          element={
            <ProtectedRoute allowedRoles={['PROFESSOR', 'ADMIN', 'STUDENT']}>
              <AppShell>
                <ProjectDetails />
              </AppShell>
            </ProtectedRoute>
          }
        />

        <Route
          path="/projects/:id/requests"
          element={
            <ProtectedRoute allowedRoles={['PROFESSOR', 'ADMIN']}>
              <AppShell>
                <ProjectRequests />
              </AppShell>
            </ProtectedRoute>
          }
        />

        <Route
          path="/messaging"
          element={
            <ProtectedRoute allowedRoles={['PROFESSOR', 'ADMIN', 'STUDENT']}>
              <AppShell>
                <Messaging />
              </AppShell>
            </ProtectedRoute>
          }
        />

        <Route
          path="/notifications"
          element={
            <ProtectedRoute allowedRoles={['PROFESSOR', 'ADMIN', 'STUDENT']}>
              <AppShell>
                <Notifications />
              </AppShell>
            </ProtectedRoute>
          }
        />

        <Route
          path="/me"
          element={
            <ProtectedRoute allowedRoles={['PROFESSOR', 'ADMIN', 'STUDENT']}>
              <AppShell>
                <Profile />
              </AppShell>
            </ProtectedRoute>
          }
        />

        {/* Public Profile Route - No Authentication Required */}
        <Route
          path="/u/:userId"
          element={
            <AppShell>
              <PublicProfile />
            </AppShell>
          }
        />

        {/* Old Routes - Redirect or keep for backward compatibility */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={['PROFESSOR', 'ADMIN', 'STUDENT']}>
              <Navigate to="/home" replace />
            </ProtectedRoute>
          }
        />

        <Route
          path="/user/:id"
          element={
            <ProtectedRoute allowedRoles={['PROFESSOR', 'ADMIN', 'STUDENT']}>
              <AppShell>
                <UserDashboard />
              </AppShell>
            </ProtectedRoute>
          }
        />

        <Route
          path="/edituser"
          element={
            <ProtectedRoute allowedRoles={['PROFESSOR', 'ADMIN', 'STUDENT']}>
              <AppShell>
                <EditUser />
              </AppShell>
            </ProtectedRoute>
          }
        />

        <Route
          path="/newsfeed"
          element={
            <ProtectedRoute allowedRoles={['PROFESSOR', 'ADMIN', 'STUDENT']}>
              <AppShell>
                <Newsfeed />
              </AppShell>
            </ProtectedRoute>
          }
        />

        <Route
          path="/allprojects"
          element={
            <ProtectedRoute allowedRoles={['PROFESSOR', 'ADMIN', 'STUDENT']}>
              <AppShell>
                <AllProjectList />
              </AppShell>
            </ProtectedRoute>
          }
        />

        <Route
          path="/project"
          element={
            <ProtectedRoute allowedRoles={['PROFESSOR', 'ADMIN', 'STUDENT']}>
              <AppShell>
                <ProjectList />
              </AppShell>
            </ProtectedRoute>
          }
        />

        <Route
          path="/project/add"
          element={
            <ProtectedRoute allowedRoles={['PROFESSOR']}>
              <AppShell>
                <ProjectAdd />
              </AppShell>
            </ProtectedRoute>
          }
        />

        <Route
          path="/project/:id"
          element={
            <ProtectedRoute allowedRoles={['PROFESSOR', 'ADMIN', 'STUDENT']}>
              <AppShell>
                <ProjectLayout />
              </AppShell>
            </ProtectedRoute>
          }
        >
          <Route
            path=""
            element={
              <ProtectedRoute allowedRoles={['PROFESSOR', 'ADMIN', 'STUDENT']}>
                <OldProjectDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="team"
            element={
              <ProtectedRoute allowedRoles={['PROFESSOR', 'ADMIN', 'STUDENT']}>
                <Team />
              </ProtectedRoute>
            }
          />
          <Route
            path="requests"
            element={
              <ProtectedRoute allowedRoles={['PROFESSOR', 'ADMIN']}>
                <Requests />
              </ProtectedRoute>
            }
          />
        </Route>

        <Route
          path="/chat"
          element={
            <ProtectedRoute allowedRoles={['STUDENT', 'PROFESSOR', 'ADMIN']}>
              <AppShell>
                <Chat />
              </AppShell>
            </ProtectedRoute>
          }
        />

        <Route
          path="/application"
          element={
            <ProtectedRoute allowedRoles={['PROFESSOR', 'ADMIN', 'STUDENT']}>
              <AppShell>
                <ApplicationList />
              </AppShell>
            </ProtectedRoute>
          }
        />

        <Route
          path="/application/:id"
          element={
            <ProtectedRoute allowedRoles={['PROFESSOR', 'ADMIN', 'STUDENT']}>
              <AppShell>
                <ApplicationDetails />
              </AppShell>
            </ProtectedRoute>
          }
        />

        {/* 404 Not Found */}
        <Route path="*" element={<NotFound />} />
      </Routes>
  );
};

export default App;
