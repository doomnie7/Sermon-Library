import React, { useState, useEffect } from 'react';
import { Sermon } from '../types';
import { Calendar, FileText, Tag, MapPin, Clock } from 'lucide-react';
import { format } from 'date-fns';
import './PreviewPane.css';

interface PreviewPaneProps {
  sermon: Sermon | null;
  onImageClick?: (imageSrc: string) => void;
  imageRefreshKey?: number;
}

const PreviewPane: React.FC<PreviewPaneProps> = ({ sermon, onImageClick, imageRefreshKey = 0 }) => {
  const [displayImageUrl, setDisplayImageUrl] = useState<string | null>(null);

  // Load image as data URL if it's a file path
  useEffect(() => {
    const loadImageUrl = async () => {
      if (!sermon?.image) {
        setDisplayImageUrl(null);
        return;
      }

      // If it's already a data URL, use it directly
      if (sermon.image.startsWith('data:')) {
        setDisplayImageUrl(sermon.image);
        return;
      }

      // If it's a file path, load it through Electron API
      if (window.electronAPI && window.electronAPI.loadImageAsDataUrl) {
        try {
          const dataUrl = await window.electronAPI.loadImageAsDataUrl(sermon.image);
          setDisplayImageUrl(dataUrl);
        } catch (error) {
          console.error('Error loading sermon image in preview:', error);
          setDisplayImageUrl(null);
        }
      } else {
        // Fallback for browser environment
        setDisplayImageUrl(sermon.image);
      }
    };

    loadImageUrl();
  }, [sermon?.image, imageRefreshKey]);

  if (!sermon) {
    return (
      <div className="preview-pane">
        <div className="preview-empty">
          <FileText size={48} />
          <p>Select a sermon to view details</p>
        </div>
      </div>
    );
  }

  // Calculate first preached date for display
  let firstPreachedDate = sermon.date;
  if (sermon.preachingHistory && sermon.preachingHistory.length > 0) {
    const firstPreaching = sermon.preachingHistory.reduce((earliest, instance) => {
      return instance.date < earliest.date ? instance : earliest;
    }, sermon.preachingHistory[0]);
    firstPreachedDate = firstPreaching.date;
  }

  // Sort preaching history from most recent to oldest
  const sortedPreachingHistory = sermon.preachingHistory 
    ? [...sermon.preachingHistory].sort((a, b) => b.date.getTime() - a.date.getTime())
    : [];

  return (
    <div className="preview-pane">
      <div className="preview-image-section">
        {displayImageUrl ? (
          <img 
            src={displayImageUrl} 
            alt="Sermon illustration"
            className="preview-image"
            onClick={() => onImageClick && onImageClick(displayImageUrl)}
          />
        ) : sermon?.image ? (
          <div className="preview-image-placeholder">
            <FileText size={48} />
            <span>Loading image...</span>
          </div>
        ) : (
          <div className="preview-image-placeholder">
            <FileText size={48} />
            <span>No image</span>
          </div>
        )}
      </div>
      
      <div className="preview-header">
        <h2 className="preview-title">{sermon.title}</h2>
        <div className="preview-metadata">
          <div className="metadata-item">
            <Calendar size={16} />
            <span>First Preached: {format(firstPreachedDate, 'MMMM dd, yyyy')}</span>
          </div>
          {sermon.series && (
            <div className="metadata-item">
              <FileText size={16} />
              <span>{sermon.series}</span>
            </div>
          )}
          {sermon.type && (
            <div className="metadata-item">
              <Tag size={16} />
              <span>{sermon.type}</span>
            </div>
          )}
        </div>
      </div>

      <div className="preview-content">
        {sermon.references && sermon.references.length > 0 && (
          <div className="preview-section">
            <h3>Scripture References</h3>
            <div className="references">
              {sermon.references.map((ref, index) => (
                <span key={index} className="reference">{ref}</span>
              ))}
            </div>
          </div>
        )}

        {sermon.summary && (
          <div className="preview-section">
            <h3>Summary</h3>
            <p>{sermon.summary}</p>
          </div>
        )}

        {sermon.tags.length > 0 && (
          <div className="preview-section">
            <h3>Tags</h3>
            <div className="tags">
              {sermon.tags.map((tag) => (
                <span key={tag} className="tag">
                  <Tag size={12} />
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {sortedPreachingHistory.length > 0 && (
          <div className="preview-section">
            <h3>Preaching History</h3>
            <div className="preaching-history">
              {sortedPreachingHistory.map((instance) => (
                <div key={instance.id} className="history-item">
                  <div className="history-header">
                    <div className="history-date">
                      <Clock size={14} />
                      <span>{format(instance.date, 'MMM dd, yyyy')}</span>
                    </div>
                    <div className="history-location">
                      <MapPin size={14} />
                      <span>{instance.location}</span>
                    </div>
                  </div>
                  {instance.audience && (
                    <div className="history-audience">
                      Audience: {instance.audience}
                    </div>
                  )}
                  {instance.notes && (
                    <div className="history-notes">
                      Notes: {instance.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {sermon.versions && sermon.versions.length > 0 && (
          <div className="preview-section">
            <h3>Versions</h3>
            <div className="versions">
              {sermon.versions.map((version) => (
                <div key={version.id} className="version-item">
                  <div className="version-header">
                    <span className="version-number">v{version.version}</span>
                    <span className="version-date">
                      {format(version.date, 'MMM dd, yyyy')}
                    </span>
                  </div>
                  <div className="version-title">{version.title}</div>
                  {version.changes && (
                    <div className="version-changes">{version.changes}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {sermon.filePath && (
          <div className="preview-section">
            <h3>File Information</h3>
            <div className="file-info">
              <div className="file-path">{sermon.filePath}</div>
              {sermon.fileSize && (
                <div className="file-size">
                  Size: {(sermon.fileSize / 1024 / 1024).toFixed(2)} MB
                </div>
              )}
              {sermon.lastModified && (
                <div className="file-modified">
                  Modified: {format(sermon.lastModified, 'MMM dd, yyyy HH:mm')}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PreviewPane;
