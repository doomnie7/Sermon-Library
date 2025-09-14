import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import './ImageViewer.css';

interface ImageViewerProps {
  isOpen: boolean;
  imageSrc: string;
  onClose: () => void;
}

const ImageViewer: React.FC<ImageViewerProps> = ({ isOpen, imageSrc, onClose }) => {
  const [displayImageUrl, setDisplayImageUrl] = useState<string>('');
  const [imageLoading, setImageLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!imageSrc) {
      setDisplayImageUrl('');
      return;
    }

    const loadImage = async () => {
      if (imageSrc.startsWith('data:')) {
        setDisplayImageUrl(imageSrc);
      } else {
        setImageLoading(true);
        try {
          const dataUrl = await window.electronAPI.loadImageAsDataUrl(imageSrc);
          setDisplayImageUrl(dataUrl);
        } catch (error) {
          console.error('Failed to load image:', error);
          setDisplayImageUrl(imageSrc);
        }
        setImageLoading(false);
      }
    };

    loadImage();
  }, [imageSrc]);

  if (!isOpen) return null;

  return (
    <div className="image-viewer-overlay" onClick={onClose}>
      <div className="image-viewer-content" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="image-viewer-close">
          <X size={24} />
        </button>
        {imageLoading ? (
          <div className="image-loading">Loading image...</div>
        ) : displayImageUrl ? (
          <img src={displayImageUrl} alt="Full size sermon image" />
        ) : (
          <div className="no-image">No image to display</div>
        )}
      </div>
    </div>
  );
};

export default ImageViewer;
