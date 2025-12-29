import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../ui/Card';
import { Avatar } from '../ui/Avatar';
import { useCurrentUser } from '../../hooks/useCurrentUser';

export const LeftSidebar = () => {
  const { user, loading } = useCurrentUser();

  if (loading) {
    return (
      <Card className="animate-pulse">
        <div className="h-24 bg-gray-200 rounded"></div>
      </Card>
    );
  }

  const userName = user ? `${user.firstName} ${user.lastName}` : 'User';
  const userRole = user?.role || 'STUDENT';
  const userDepartment = user?.department?.replace('_', ' ') || 'Department';

  return (
    <Card className="overflow-hidden">
      {/* Cover background */}
      <div className="h-14 bg-gradient-to-r from-stevensMaroon to-stevensMaroon-700"></div>

      {/* Profile section */}
      <div className="px-4 pb-4 -mt-8">
        <Avatar name={userName} size="lg" className="border-4 border-white mb-3" />
        <Link to="/me" className="hover:underline">
          <h3 className="font-semibold text-gray-900">{userName}</h3>
        </Link>
        <p className="text-sm text-gray-600 mt-1">
          {userRole} | {userDepartment}
        </p>
      </div>

      <div className="border-t border-gray-200 px-4 py-3">
        <Link
          to="/me"
          className="text-sm text-gray-600 hover:text-stevensMaroon flex justify-between items-center"
        >
          <span>Profile views</span>
          <span className="font-semibold text-stevensMaroon">142</span>
        </Link>
      </div>

      <div className="border-t border-gray-200">
        <Link
          to="/projects"
          className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
        >
          My Projects
        </Link>
        <Link
          to="/application"
          className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
        >
          My Applications
        </Link>
        <Link
          to="/projects"
          className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Saved Projects
        </Link>
      </div>
    </Card>
  );
};
