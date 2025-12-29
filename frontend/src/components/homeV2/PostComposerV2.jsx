import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../ui/Card';
import { Button, IconButton } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/Tooltip';
import { useUser, useAuth } from '@clerk/clerk-react';
import { Image, Video, X, Calendar, FileText, ChevronDown } from 'lucide-react';
import { toast } from '../../lib/toast';
import { cn } from '../../lib/utils';
import { uploadMultipleMedia } from '../../lib/upload';
import { ImageEditorDialog } from './ImageEditorDialog';

export const PostComposerV2 = ({ onPost }) => {
  const { user } = useUser();
  const { getToken } = useAuth();
  const [text, setText] = useState('');
  const [mediaFiles, setMediaFiles] = useState([]);
  const [mediaType, setMediaType] = useState(null); // 'image' | 'video'
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [currentEditIndex, setCurrentEditIndex] = useState(0);
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const textareaRef = useRef(null);

  const userName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'User';

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 4) {
      toast.error('Maximum 4 images allowed');
      return;
    }

    // Create preview URLs and mark as not edited yet
    const previews = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      type: 'image',
      edited: false,
    }));

    setMediaFiles(previews);
    setMediaType('image');
    setIsExpanded(true);

    // Open editor for first image
    setCurrentEditIndex(0);
    setEditorOpen(true);
  };

  const handleVideoSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const preview = {
      file,
      preview: URL.createObjectURL(file),
      type: 'video',
    };

    setMediaFiles([preview]);
    setMediaType('video');
    setIsExpanded(true);
  };

  const removeMedia = () => {
    // Revoke object URLs to free memory
    mediaFiles.forEach((media) => URL.revokeObjectURL(media.preview));
    setMediaFiles([]);
    setMediaType(null);
    setEditorOpen(false);
    setCurrentEditIndex(0);
  };

  const handleApplyEdit = (editedFile) => {
    // Replace file and regenerate preview for current index
    setMediaFiles((prev) => {
      const updated = [...prev];
      // Revoke old preview URL
      URL.revokeObjectURL(updated[currentEditIndex].preview);
      // Set new file with edited flag
      updated[currentEditIndex] = {
        file: editedFile,
        preview: URL.createObjectURL(editedFile),
        type: 'image',
        edited: true,
      };
      return updated;
    });

    // Move to next image or close editor
    if (currentEditIndex < mediaFiles.length - 1) {
      setCurrentEditIndex(currentEditIndex + 1);
    } else {
      setEditorOpen(false);
      setCurrentEditIndex(0);
    }
  };

  const handleSkipEdit = () => {
    // Keep original, move to next or close
    if (currentEditIndex < mediaFiles.length - 1) {
      setCurrentEditIndex(currentEditIndex + 1);
    } else {
      setEditorOpen(false);
      setCurrentEditIndex(0);
    }
  };

  const handleExpand = () => {
    setIsExpanded(true);
    // Focus textarea after expansion animation
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 100);
  };

  const handleSubmit = async () => {
    if (!text.trim() && mediaFiles.length === 0) {
      toast.error('Please add some text or media');
      return;
    }

    setIsPosting(true);
    setUploadProgress(null);

    try {
      // Get Clerk token for authentication
      const token = await getToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      // Upload media files if any
      let media = null;
      if (mediaFiles.length > 0) {
        setUploadProgress({ current: 0, total: mediaFiles.length });

        const uploadedMedia = await uploadMultipleMedia(
          mediaFiles.map(m => m.file),
          token,
          (current, total) => {
            setUploadProgress({ current, total });
          }
        );

        // Transform uploaded media to GraphQL format
        if (mediaType === 'image') {
          media = {
            type: 'image',
            images: uploadedMedia.map((m, idx) => ({
              url: m.url,
              alt: `Post image ${idx + 1}`,
            })),
          };
        } else if (mediaType === 'video') {
          media = {
            type: 'video',
            video: {
              url: uploadedMedia[0].url,
              posterUrl: null,
            },
          };
        }

        setUploadProgress(null);
      }

      // Call onPost callback with uploaded media URLs
      await onPost({
        text: text.trim(),
        media,
      });

      // Reset form
      setText('');
      removeMedia();
      setIsExpanded(false);
      toast.success('Posted!');
    } catch (error) {
      console.error('Error posting:', error);
      toast.error(error.message || 'Failed to create post');
    } finally {
      setIsPosting(false);
      setUploadProgress(null);
    }
  };

  const canPost = (text.trim() || mediaFiles.length > 0) && !isPosting;

  return (
    <>
      {/* Image Editor Dialog */}
      {mediaType === 'image' && mediaFiles.length > 0 && (
        <ImageEditorDialog
          open={editorOpen}
          onOpenChange={setEditorOpen}
          file={mediaFiles[currentEditIndex]?.file}
          onApply={handleApplyEdit}
          onSkip={handleSkipEdit}
        />
      )}

      <Card className="mb-4 overflow-hidden">
      <div className="p-4">
        <div className="flex gap-3">
          <Avatar name={userName} size="md" className="flex-shrink-0" />

          {!isExpanded ? (
            // Collapsed Pill State
            <button
              type="button"
              onClick={handleExpand}
              className="flex-1 px-5 py-3 border border-borderLight rounded-full text-left text-sm text-muted-foreground hover:bg-muted transition-colors"
              aria-label="Start a post"
            >
              Start a post...
            </button>
          ) : (
            // Expanded Editor State
            <div className="flex-1">
              <textarea
                ref={textareaRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="What do you want to talk about?"
                className="w-full resize-none border-none focus:outline-none focus:ring-0 bg-transparent placeholder:text-muted-foreground text-gray-900 text-sm min-h-[80px] max-h-[300px]"
                rows={3}
                aria-label="Post content"
                disabled={isPosting}
              />
            </div>
          )}
        </div>

        {/* Media Preview */}
        <AnimatePresence>
          {mediaFiles.length > 0 && isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-3 ml-14 relative"
            >
              <IconButton
                onClick={removeMedia}
                className="absolute top-2 right-2 z-10 bg-white/90 hover:bg-white shadow-md"
                size="sm"
                aria-label="Remove media"
              >
                <X className="w-4 h-4" />
              </IconButton>

              {mediaType === 'image' && (
                <div
                  className={cn(
                    'grid gap-2 rounded-lg overflow-hidden border border-borderLight',
                    mediaFiles.length === 1 && 'grid-cols-1',
                    mediaFiles.length === 2 && 'grid-cols-2',
                    mediaFiles.length === 3 && 'grid-cols-2',
                    mediaFiles.length === 4 && 'grid-cols-2'
                  )}
                >
                  {mediaFiles.map((media, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        'relative bg-gray-100',
                        mediaFiles.length === 1 && 'aspect-video',
                        mediaFiles.length === 2 && 'aspect-[4/3]',
                        mediaFiles.length === 3 && idx === 0 && 'row-span-2 aspect-square',
                        mediaFiles.length === 3 && idx > 0 && 'aspect-video',
                        mediaFiles.length === 4 && 'aspect-square'
                      )}
                    >
                      <img
                        src={media.preview}
                        alt={`Preview ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}

              {mediaType === 'video' && (
                <div className="rounded-lg overflow-hidden border border-borderLight bg-gray-100">
                  <video
                    src={mediaFiles[0].preview}
                    controls
                    className="w-full max-h-80"
                  />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Actions Bar */}
      {isExpanded && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="px-4 pb-4 flex items-center justify-between border-t border-borderLight pt-3"
        >
          <div className="flex items-center gap-1">
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageSelect}
              className="hidden"
              aria-label="Upload images"
            />
            <Tooltip>
              <TooltipTrigger asChild>
                <IconButton
                  onClick={() => imageInputRef.current?.click()}
                  variant="ghost"
                  size="sm"
                  disabled={mediaType === 'video' || isPosting}
                  aria-label="Add photos"
                >
                  <Image className="w-5 h-5 text-gray-600" />
                </IconButton>
              </TooltipTrigger>
              <TooltipContent>Add photos</TooltipContent>
            </Tooltip>

            <input
              ref={videoInputRef}
              type="file"
              accept="video/*"
              onChange={handleVideoSelect}
              className="hidden"
              aria-label="Upload video"
            />
            <Tooltip>
              <TooltipTrigger asChild>
                <IconButton
                  onClick={() => videoInputRef.current?.click()}
                  variant="ghost"
                  size="sm"
                  disabled={mediaType === 'image' || isPosting}
                  aria-label="Add video"
                >
                  <Video className="w-5 h-5 text-purple-600" />
                </IconButton>
              </TooltipTrigger>
              <TooltipContent>Add video</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <IconButton
                  variant="ghost"
                  size="sm"
                  disabled
                  aria-label="Add event (coming soon)"
                >
                  <Calendar className="w-5 h-5 text-orange-600" />
                </IconButton>
              </TooltipTrigger>
              <TooltipContent>Coming soon</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <IconButton
                  variant="ghost"
                  size="sm"
                  disabled
                  aria-label="Write article (coming soon)"
                >
                  <FileText className="w-5 h-5 text-blue-600" />
                </IconButton>
              </TooltipTrigger>
              <TooltipContent>Coming soon</TooltipContent>
            </Tooltip>
          </div>

          <div className="flex items-center gap-2">
            {/* Audience Selector (UI only) */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted rounded-full transition-colors"
                  disabled
                  aria-label="Select audience (coming soon)"
                >
                  <span>Anyone</span>
                  <ChevronDown className="w-3 h-3" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Coming soon</TooltipContent>
            </Tooltip>

            <Button
              variant="primary"
              onClick={handleSubmit}
              disabled={!canPost}
              loading={isPosting}
              size="sm"
              className="px-6"
              style={{ backgroundColor: '#9D1535', color: 'white' }}
              aria-label={isPosting ? 'Posting...' : 'Post'}
            >
              {uploadProgress
                ? `Uploading ${uploadProgress.current}/${uploadProgress.total}...`
                : isPosting
                  ? 'Posting...'
                  : 'Post'}
            </Button>
          </div>
        </motion.div>
      )}
      </Card>
    </>
  );
};
