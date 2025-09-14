import React, { useState, useRef, useCallback } from 'react';
import { Image as ImageIcon, Upload } from 'lucide-react';
import './ImageUpload.css';

interface ImageUploadProps {
  value?: string; // Current image path
  onChange: (imagePath: string | null) => void;
  placeholder?: string;
  disabled?: boolean;
  imageRefreshKey?: number; // Force refresh of image display
}

const ImageUpload: React.FC<ImageUploadProps> = ({ 
  value, 
  onChange, 
  placeholder = "Drop image here or right-click to add",
  disabled = false,
  imageRefreshKey = 0
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [displayUrl, setDisplayUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load image as data URL if it's a file path
  React.useEffect(() => {
    const loadImageUrl = async () => {
      if (!value) {
        setDisplayUrl(null);
        return;
      }

      // If it's already a data URL, use it directly
      if (value.startsWith('data:')) {
        setDisplayUrl(value);
        return;
      }

      // If it's a file path, load it through Electron API
      if (window.electronAPI && window.electronAPI.loadImageAsDataUrl) {
        try {
          const dataUrl = await window.electronAPI.loadImageAsDataUrl(value);
          setDisplayUrl(dataUrl);
        } catch (error) {
          console.error('Error loading image:', error);
          setDisplayUrl(null);
        }
      } else {
        // Fallback for browser environment
        setDisplayUrl(value);
      }
    };

    loadImageUrl();
  }, [value, imageRefreshKey]);

  // Resize and compress image to max 800x800px
  const resizeImage = useCallback((file: File): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();
      
      img.onload = () => {
        const maxSize = 800;
        let { width, height } = img;
        
        // Calculate new dimensions while maintaining aspect ratio
        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.6); // 60% quality
        resolve(dataUrl);
      };
      
      img.src = URL.createObjectURL(file);
    });
  }, []);

  // Handle file processing
  const processFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    try {
      const resizedImage = await resizeImage(file);
      
      if (window.electronAPI && window.electronAPI.saveSermonImage) {
        const sermonId = Date.now().toString(); // Use timestamp as temp ID
        const savedPath = await window.electronAPI.saveSermonImage(resizedImage, sermonId);
        if (savedPath) {
          onChange(savedPath);
        }
      } else {
        // Browser fallback - use data URL
        onChange(resizedImage);
      }
    } catch (error) {
      console.error('Error processing image:', error);
      alert('Error processing image');
    }
  }, [resizeImage, onChange]);

  // Handle drag events
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      processFile(files[0]);
    }
  }, [disabled, processFile]);

  // Handle right-click context menu
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (!disabled) {
      setContextMenu({ x: e.clientX, y: e.clientY });
    }
  }, [disabled]);

  // Handle context menu actions
  const handleSelectImage = useCallback(async () => {
    setContextMenu(null);
    
    if (window.electronAPI && window.electronAPI.selectImage) {
      const imageDataUrl = await window.electronAPI.selectImage();
      if (imageDataUrl) {
        // Convert data URL to blob for processing
        const response = await fetch(imageDataUrl);
        const blob = await response.blob();
        const file = new File([blob], 'selected-image', { type: blob.type });
        processFile(file);
      }
    } else {
      // Browser fallback
      fileInputRef.current?.click();
    }
  }, [processFile]);

  const handlePasteFromClipboard = useCallback(async () => {
    setContextMenu(null);
    
    if (window.electronAPI && window.electronAPI.getClipboardImage) {
      try {
        const clipboardImage = await window.electronAPI.getClipboardImage();
        if (clipboardImage) {
          onChange(clipboardImage);
        } else {
          // Show a more user-friendly message
          console.log('No image found in clipboard. Copy an image first, then try pasting.');
          // You could replace this with a toast notification if you have one
          const notification = document.createElement('div');
          notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #f44336;
            color: white;
            padding: 12px 16px;
            border-radius: 4px;
            z-index: 10000;
            font-family: system-ui, -apple-system, sans-serif;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          `;
          notification.textContent = 'No image found in clipboard. Copy an image first, then try pasting.';
          document.body.appendChild(notification);
          setTimeout(() => {
            if (notification.parentNode) {
              notification.parentNode.removeChild(notification);
            }
          }, 3000);
        }
      } catch (error) {
        console.error('Error accessing clipboard:', error);
        const notification = document.createElement('div');
        notification.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          background: #f44336;
          color: white;
          padding: 12px 16px;
          border-radius: 4px;
          z-index: 10000;
          font-family: system-ui, -apple-system, sans-serif;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        `;
        notification.textContent = 'Error accessing clipboard. Please try again.';
        document.body.appendChild(notification);
        setTimeout(() => {
          if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
          }
        }, 3000);
      }
    } else {
      // Browser fallback - try to read from clipboard
      try {
        const clipboardItems = await navigator.clipboard.read();
        for (const clipboardItem of clipboardItems) {
          for (const type of clipboardItem.types) {
            if (type.startsWith('image/')) {
              const blob = await clipboardItem.getType(type);
              const file = new File([blob], 'clipboard-image', { type });
              processFile(file);
              return;
            }
          }
        }
        alert('No image found in clipboard');
      } catch (error) {
        console.error('Error reading clipboard:', error);
        alert('Could not access clipboard');
      }
    }
  }, [onChange, processFile]);

  const handleRemoveImage = useCallback(async () => {
    setContextMenu(null);
    
    if (value && window.electronAPI && window.electronAPI.deleteSermonImage) {
      await window.electronAPI.deleteSermonImage(value);
    }
    onChange(null);
  }, [value, onChange]);

  // Handle file input change (browser fallback)
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  }, [processFile]);

  // Close context menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <div className="image-upload-container">
      <div
        className={`image-upload ${isDragging ? 'dragging' : ''} ${disabled ? 'disabled' : ''}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onContextMenu={handleContextMenu}
      >
        {displayUrl ? (
          <img src={displayUrl} alt="Sermon" className="sermon-image" />
        ) : (
          <div className="image-placeholder">
            <ImageIcon size={48} />
            <Upload size={24} className="upload-icon" />
            <p>{placeholder}</p>
          </div>
        )}
      </div>

      {/* Hidden file input for browser fallback */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInputChange}
        style={{ display: 'none' }}
      />

      {/* Context Menu */}
      {contextMenu && (
        <div 
          className="context-menu"
          style={{ 
            position: 'fixed',
            top: contextMenu.y,
            left: contextMenu.x,
            zIndex: 1000
          }}
        >
          <button onClick={handleSelectImage}>Change Image</button>
          <button onClick={handlePasteFromClipboard}>Paste from Clipboard</button>
          {value && <button onClick={handleRemoveImage}>Remove Image</button>}
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
