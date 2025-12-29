import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';

export const RightSidebar = () => {
  return (
    <div className="space-y-4">
      {/* Trending */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Trending at Stevens Research</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-500">#1 Trending</p>
              <Link to="/projects" className="text-sm font-medium hover:text-stevensMaroon">
                Machine Learning Research
              </Link>
              <p className="text-xs text-gray-500 mt-1">45 active projects</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">#2 Trending</p>
              <Link to="/projects" className="text-sm font-medium hover:text-stevensMaroon">
                Sustainable Energy
              </Link>
              <p className="text-xs text-gray-500 mt-1">32 active projects</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">#3 Trending</p>
              <Link to="/projects" className="text-sm font-medium hover:text-stevensMaroon">
                Quantum Computing
              </Link>
              <p className="text-xs text-gray-500 mt-1">18 active projects</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Suggested Projects */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Suggested Projects</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <Link to="/projects/1" className="text-sm font-medium hover:text-stevensMaroon">
                AI-Driven Cybersecurity
              </Link>
              <p className="text-xs text-gray-600 mt-1">Dr. Sarah Johnson</p>
              <div className="flex items-center space-x-2 mt-1">
                <Badge variant="primary" className="text-xs">3 positions</Badge>
              </div>
            </div>
            <div>
              <Link to="/projects/2" className="text-sm font-medium hover:text-stevensMaroon">
                Renewable Energy Storage
              </Link>
              <p className="text-xs text-gray-600 mt-1">Dr. Robert Williams</p>
              <div className="flex items-center space-x-2 mt-1">
                <Badge variant="primary" className="text-xs">2 positions</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Announcements */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Announcements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium">Research Symposium 2024</p>
              <p className="text-xs text-gray-600 mt-1">
                Submit your abstracts by Dec 31st
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">New Grant Opportunities</p>
              <p className="text-xs text-gray-600 mt-1">
                NSF funding applications now open
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
