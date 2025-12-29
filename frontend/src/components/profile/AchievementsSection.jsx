import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Briefcase, FileText, Users, Trophy } from 'lucide-react';
import { fadeUp } from '../../lib/motion';

export const AchievementsSection = ({ user, projects, computeCollaborations }) => {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      transition={{ delay: 0.25 }}
    >
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-stevensMaroon" />
            Achievements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Projects Built */}
            <div className="flex flex-col items-center p-4 bg-blue-50 rounded-lg">
              <Briefcase className="w-8 h-8 text-blue-600 mb-2" />
              <p className="text-3xl font-bold text-gray-900">
                {user?.numOfProjects ?? projects.length}
              </p>
              <p className="text-sm text-gray-600 mt-1">Projects Built</p>
            </div>

            {/* Applications Submitted */}
            <div className="flex flex-col items-center p-4 bg-green-50 rounded-lg">
              <FileText className="w-8 h-8 text-green-600 mb-2" />
              <p className="text-3xl font-bold text-gray-900">
                {user?.numOfApplications ?? 0}
              </p>
              <p className="text-sm text-gray-600 mt-1">Applications Submitted</p>
            </div>

            {/* Collaborations */}
            <div className="flex flex-col items-center p-4 bg-purple-50 rounded-lg">
              <Users className="w-8 h-8 text-purple-600 mb-2" />
              <p className="text-3xl font-bold text-gray-900">
                {computeCollaborations(projects, user?._id)}
              </p>
              <p className="text-sm text-gray-600 mt-1">Collaborations</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
