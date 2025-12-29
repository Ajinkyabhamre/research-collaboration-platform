import { useState, useRef, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button, IconButton } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { Textarea } from '../ui/Input';
import { useUser, useAuth } from '@clerk/clerk-react';
import { Image, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { toast } from '../../lib/toast';
import { ImageEditorDialog } from './ImageEditorDialog';
import { uploadMultipleMedia } from '../../lib/upload';

export const PostComposerV3 = ({ onPost }) => {
  const { user } = useUser();
  const { getToken } = useAuth();
  const [text, setText] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [imageFiles, setImageFiles] = useState([]);
  const [editorOpen, setEditorOpen] = useState(false);
  const [currentEditIndex, setCurrentEditIndex] = useState(0);
  const [isPosting, setIsPosting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  const textareaRef = useRef(null);
  const imageInputRef = useRef(null);

  const userName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'User';

  const handleExpand = () => {
    setIsExpanded(true);
    // Focus textarea after expansion
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 100);
  };

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 4) {
      toast.error('Maximum 4 images allowed');
      return;
    }

    const previews = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file)
    }));

    setImageFiles(previews);

    // Open editor for first image
    setCurrentEditIndex(0);
    setEditorOpen(true);
  };

  const handleApplyEdit = (editedFile) => {
    // Replace file and regenerate preview for current index
    setImageFiles((prev) => {
      const updated = [...prev];
      // Revoke old preview URL
      URL.revokeObjectURL(updated[currentEditIndex].preview);
      // Set new file with edited preview
      updated[currentEditIndex] = {
        file: editedFile,
        preview: URL.createObjectURL(editedFile)
      };
      return updated;
    });

    // Move to next image or close editor
    if (currentEditIndex < imageFiles.length - 1) {
      setCurrentEditIndex(currentEditIndex + 1);
    } else {
      setEditorOpen(false);
      setCurrentEditIndex(0);
    }
  };

  const handleSkipEdit = () => {
    // Keep original, move to next or close
    if (currentEditIndex < imageFiles.length - 1) {
      setCurrentEditIndex(currentEditIndex + 1);
    } else {
      setEditorOpen(false);
      setCurrentEditIndex(0);
    }
  };

  const removeImage = (index) => {
    setImageFiles(prev => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);

      // If we removed all images, close editor
      if (updated.length === 0) {
        setEditorOpen(false);
        setCurrentEditIndex(0);
      }

      return updated;
    });
  };

  const handleCancel = () => {
    // Cleanup image URLs
    imageFiles.forEach(img => URL.revokeObjectURL(img.preview));
    setImageFiles([]);
    setText('');
    setIsExpanded(false);
    setEditorOpen(false);
    setCurrentEditIndex(0);
  };

  const handlePost = async () => {
    const trimmedText = text.trim();
    if (!trimmedText && imageFiles.length === 0) return;

    setIsPosting(true);
    setUploadProgress(null);

    try {
      // 1. Get Clerk token for authentication
      const token = await getToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      // 2. Upload images if any
      let media = null;
      if (imageFiles.length > 0) {
        setUploadProgress({ current: 0, total: imageFiles.length });

        const uploadedMedia = await uploadMultipleMedia(
          imageFiles.map(img => img.file),
          token,
          (current, total) => {
            setUploadProgress({ current, total });
          }
        );

        // Transform to frontend format
        media = {
          type: 'image',
          images: uploadedMedia.map((m, idx) => ({
            url: m.url,
            alt: `Post image ${idx + 1}`,
          })),
        };

        setUploadProgress(null);
      }

      // 3. Call parent's onPost (HomeFeedV2.handleCreatePost)
      //    This will call GraphQL mutation + optimistic update
      await onPost({
        text: trimmedText,
        media,
      });

      // 4. Success! Reset form
      imageFiles.forEach(img => URL.revokeObjectURL(img.preview));
      setImageFiles([]);
      setText('');
      setIsExpanded(false);
      setEditorOpen(false);
      setCurrentEditIndex(0);
      toast.success('Posted!');
    } catch (error) {
      console.error('Error posting:', error);

      // Keep composer open so user can retry
      // Note: If upload succeeded but createPost failed, uploaded files become orphaned.
      // These will remain in backend storage but won't be attached to a post.
      // TODO: Implement cleanup endpoint or TTL for orphaned files.

      toast.error(error.message || 'Failed to create post');
    } finally {
      setIsPosting(false);
      setUploadProgress(null);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      imageFiles.forEach(img => URL.revokeObjectURL(img.preview));
    };
  }, [imageFiles]);

  const canPost = (text.trim().length > 0 || imageFiles.length > 0) && !isPosting;

  return (
    <>
      {/* Image Editor Dialog */}
      {imageFiles.length > 0 && (
        <ImageEditorDialog
          open={editorOpen}
          onOpenChange={setEditorOpen}
          file={imageFiles[currentEditIndex]?.file}
          onApply={handleApplyEdit}
          onSkip={handleSkipEdit}
        />
      )}

      <Card className="mb-4">
        <div className="p-4">
        <div className="flex gap-3">
          <Avatar name={userName} size="md" className="flex-shrink-0" />

          {!isExpanded ? (
            // Collapsed State: Pill Button
            <button
              type="button"
              onClick={handleExpand}
              className="flex-1 px-5 py-3 border border-borderLight rounded-full text-left text-sm text-muted-foreground hover:bg-muted transition-colors"
              aria-label="Start a post"
            >
              Start a post...
            </button>
          ) : (
            // Expanded State: Textarea
            <div className="flex-1">
              <Textarea
                ref={textareaRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="What do you want to talk about?"
                className="w-full resize-none border-none focus:outline-none focus:ring-0 bg-transparent placeholder:text-muted-foreground text-gray-900 text-sm min-h-[80px] max-h-[300px]"
                rows={3}
                aria-label="Post content"
              />
            </div>
          )}
        </div>

        {/* Hidden File Input */}
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageSelect}
          className="hidden"
          aria-label="Upload images"
        />

        {/* Image Preview Grid */}
        {imageFiles.length > 0 && isExpanded && (
          <div className="mt-3 relative">
            <div
              className={cn(
                'grid gap-2 rounded-lg overflow-hidden border border-borderLight',
                imageFiles.length === 1 && 'grid-cols-1',
                imageFiles.length === 2 && 'grid-cols-2',
                imageFiles.length === 3 && 'grid-cols-2',
                imageFiles.length === 4 && 'grid-cols-2'
              )}
            >
              {imageFiles.map((image, idx) => (
                <div
                  key={idx}
                  className={cn(
                    'relative bg-gray-100',
                    imageFiles.length === 1 && 'aspect-video',
                    imageFiles.length === 2 && 'aspect-[4/3]',
                    imageFiles.length === 3 && idx === 0 && 'row-span-2 aspect-square',
                    imageFiles.length === 3 && idx > 0 && 'aspect-video',
                    imageFiles.length === 4 && 'aspect-square'
                  )}
                >
                  <img
                    src={image.preview}
                    alt={`Preview ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/90 hover:bg-white shadow-md flex items-center justify-center transition-colors"
                    aria-label={`Remove image ${idx + 1}`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons (shown when expanded) */}
        {isExpanded && (
          <div className="mt-3 flex items-center justify-between gap-2 pt-3 border-t border-borderLight">
            <IconButton
              type="button"
              onClick={() => imageInputRef.current?.click()}
              aria-label="Add photos"
              disabled={isPosting}
            >
              <Image className="w-5 h-5 text-gray-600" />
            </IconButton>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={handleCancel}
                size="sm"
                className="px-4"
                disabled={isPosting}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={handlePost}
                disabled={!canPost}
                loading={isPosting}
                size="sm"
                className="px-6"
                style={{ backgroundColor: '#9D1535', color: 'white' }}
              >
                {uploadProgress
                  ? `Uploading ${uploadProgress.current}/${uploadProgress.total}...`
                  : isPosting
                    ? 'Posting...'
                    : 'Post'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
    </>
  );
};
