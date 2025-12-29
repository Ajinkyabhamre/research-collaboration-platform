import { useState, useCallback, useEffect } from 'react';
import Cropper from 'react-easy-crop';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Crop, RotateCw, ZoomIn } from 'lucide-react';
import { cn } from '../../lib/utils';
import { getCroppedBlob, blobToFile, getMimeType } from '../../lib/imageCrop';
import { toast } from '../../lib/toast';

const ASPECT_PRESETS = [
  { label: '1:1', value: 1, icon: '□' },
  { label: '4:5', value: 4 / 5, icon: '▭' },
  { label: '16:9', value: 16 / 9, icon: '▬' },
  { label: '3:1', value: 3, icon: '▬' },
];

export const ImageEditorDialog = ({
  open,
  onOpenChange,
  file,
  onApply,
  onSkip,
  initialAspect = 1,
  lockedAspect = false // When true, locks aspect ratio and hides skip button
}) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [aspect, setAspect] = useState(1); // Default 1:1
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Create preview URL from file
  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);

      // Cleanup on unmount or file change
      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [file]);

  // Reset state when dialog opens with new file
  useEffect(() => {
    if (open && file) {
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setRotation(0);
      setAspect(initialAspect);
      setCroppedAreaPixels(null);
    }
  }, [open, file, initialAspect]);

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleApply = async () => {
    if (!croppedAreaPixels || !previewUrl) {
      toast.error('Please select a crop area');
      return;
    }

    setIsProcessing(true);

    try {
      const mimeType = getMimeType(file.name);
      const quality = mimeType === 'image/png' ? 1.0 : 0.92;

      const croppedBlob = await getCroppedBlob(
        previewUrl,
        croppedAreaPixels,
        rotation,
        mimeType,
        quality
      );

      // Generate new filename
      const originalName = file.name;
      const ext = originalName.split('.').pop();
      const baseName = originalName.substring(0, originalName.lastIndexOf('.'));
      const newFilename = `edited-${baseName}.${ext}`;

      const editedFile = blobToFile(croppedBlob, newFilename);

      // Call parent handler with edited file
      onApply(editedFile);
    } catch (error) {
      console.error('Error cropping image:', error);
      toast.error('Failed to crop image. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSkip = () => {
    onSkip();
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  if (!file || !previewUrl) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b border-borderLight">
          <DialogTitle className="flex items-center gap-2">
            <Crop className="w-5 h-5" />
            Edit Image
          </DialogTitle>
          <DialogDescription>
            Crop, zoom, and rotate your image before uploading
          </DialogDescription>
        </DialogHeader>

        {/* Cropper Area */}
        <div className="flex-1 relative bg-black">
          <Cropper
            image={previewUrl}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={aspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onRotationChange={setRotation}
            onCropComplete={onCropComplete}
            objectFit="contain"
            showGrid={true}
            style={{
              containerStyle: {
                width: '100%',
                height: '100%',
              },
            }}
          />
        </div>

        {/* Controls */}
        <div className="px-6 py-4 border-t border-borderLight space-y-4 bg-white">
          {/* Aspect Ratio Presets - Hidden when locked */}
          {!lockedAspect && (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Crop className="w-4 h-4" />
                Aspect Ratio
              </label>
              <div className="flex gap-2">
                {ASPECT_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setAspect(preset.value)}
                    className={cn(
                      'flex-1 px-3 py-2 rounded-lg border-2 transition-all',
                      'text-sm font-medium',
                      aspect === preset.value
                        ? 'border-stevensMaroon bg-stevensMaroon/5 text-stevensMaroon'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    )}
                  >
                    <div className="text-lg mb-1">{preset.icon}</div>
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Zoom Slider */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <ZoomIn className="w-4 h-4" />
              Zoom: {zoom.toFixed(1)}x
            </label>
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-stevensMaroon"
            />
          </div>

          {/* Rotation Slider */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <RotateCw className="w-4 h-4" />
              Rotation: {rotation}°
            </label>
            <input
              type="range"
              min={0}
              max={360}
              step={1}
              value={rotation}
              onChange={(e) => setRotation(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-stevensMaroon"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={handleCancel}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            {!lockedAspect && (
              <Button
                type="button"
                variant="secondary"
                onClick={handleSkip}
                disabled={isProcessing}
              >
                Skip Edit
              </Button>
            )}
            <Button
              type="button"
              variant="primary"
              onClick={handleApply}
              loading={isProcessing}
              disabled={isProcessing}
              className="px-6"
              style={{ backgroundColor: '#9D1535', color: 'white' }}
            >
              {isProcessing ? 'Processing...' : 'Apply'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
