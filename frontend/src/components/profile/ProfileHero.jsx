import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { Card } from '../ui/Card';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Mail, MapPin, Briefcase, Github as GitHub, Linkedin as LinkedIn, Globe, Edit as EditIcon, Camera, Link2 } from 'lucide-react';
import { fadeUp } from '../../lib/motion';

export const ProfileHero = ({
  user,
  userName,
  userEmail,
  userRole,
  userDepartment,
  projectsCount,
  uploadingPhoto,
  uploadingCover,
  fileInputRef,
  coverInputRef,
  onPhotoUpload,
  onCoverUpload,
  onOpenEditDialog,
  onOpenExternalLink,
  onCopyProfileLink,
  formatRole,
  roleColors,
  readOnly = false,
  showEmail = true,
}) => {
  return (
    <motion.div variants={fadeUp} initial="hidden" animate="visible">
      <Card className="overflow-hidden mb-6">
        {/* Cover Image */}
        <div
          className="h-48 bg-gradient-maroon relative group"
          style={user?.coverPhoto ? {
            backgroundImage: `url(${user.coverPhoto})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          } : {}}
        >
          {!readOnly && (
            <>
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                onChange={onCoverUpload}
                className="hidden"
              />
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => coverInputRef.current?.click()}
                disabled={uploadingCover}
                className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur-sm hover:bg-white shadow-md"
                title="Change cover"
              >
                <Camera className="w-4 h-4 mr-2" />
                {uploadingCover ? 'Uploading...' : 'Change cover'}
              </Button>
            </>
          )}
        </div>

        {/* Profile Info */}
        <div className="px-6 pb-6 -mt-16">
          <div className="flex items-end justify-between mb-4">
            <div className="relative">
              <Avatar
                src={user?.profilePhoto}
                name={userName}
                size="2xl"
                className="border-4 border-white shadow-lg"
              />
              {!readOnly && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={onPhotoUpload}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingPhoto}
                    className="absolute bottom-0 right-0 rounded-full p-2 bg-white shadow-md hover:bg-gray-50"
                    title="Change photo"
                  >
                    <Camera className="w-4 h-4" />
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="mb-4">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">{userName}</h1>

            {/* Headline */}
            {user?.headline && (
              <p className="text-lg text-gray-600 mb-2">
                {user.headline}
              </p>
            )}

            {/* Location */}
            {(user?.location || user?.city) && (
              <div className="flex items-center gap-2 text-gray-600 mb-3">
                <MapPin className="w-4 h-4" />
                <span>{user.location || user.city}</span>
              </div>
            )}

            {/* Social Links */}
            <div className="flex items-center gap-2 mb-3">
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => window.open(`mailto:${userEmail}`, '_blank')}
              >
                <Mail className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenExternalLink(user?.profileLinks?.github, 'GitHub profile');
                }}
              >
                <GitHub className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenExternalLink(user?.profileLinks?.linkedin, 'LinkedIn profile');
                }}
              >
                <LinkedIn className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenExternalLink(user?.profileLinks?.website, 'Website');
                }}
              >
                <Globe className="w-4 h-4" />
              </Button>
              {!readOnly ? (
                <Button
                  variant="primary"
                  size="sm"
                  type="button"
                  onClick={onOpenEditDialog}
                >
                  <EditIcon className="w-4 h-4 mr-1" />
                  Edit Details
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={onCopyProfileLink}
                >
                  <Link2 className="w-4 h-4 mr-1" />
                  Copy Link
                </Button>
              )}
            </div>

            {/* Email */}
            {showEmail && (
              <div className="flex items-center gap-2 text-gray-600 mb-3 text-sm">
                <Mail className="w-4 h-4" />
                <p>{userEmail}</p>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Badge variant={roleColors[userRole]}>{userRole}</Badge>
              <Badge variant="default">{userDepartment}</Badge>
            </div>
          </div>

          <div className="flex items-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-stevensMaroon" />
              <span>
                <span className="font-semibold text-gray-900">{projectsCount}</span> Project{projectsCount !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};
