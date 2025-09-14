import React, { useState, useEffect, useRef } from 'react';
import { Sermon, ViewSettings, ExpandedSermon } from '../types';
import { FileText, MapPin, Settings, Book } from 'lucide-react';
import { format } from 'date-fns';
import { ColumnConfig } from './ColumnChooser';
import ColumnChooser from './ColumnChooser';
import FilterableHeader from './FilterableHeader';
import './SermonList.css';

// Thumbnail component for sermon images
interface ThumbnailProps {
  imageSrc?: string;
  alt: string;
  size?: 'small' | 'medium' | 'large';
  refreshKey?: number; // Add refresh key to force re-render
}

const Thumbnail: React.FC<ThumbnailProps> = ({ imageSrc, alt, size = 'medium', refreshKey = 0 }) => {
  const [displayImageUrl, setDisplayImageUrl] = useState<string>('');
  const [imageLoading, setImageLoading] = useState<boolean>(false);
  const [imageError, setImageError] = useState<boolean>(false);

  useEffect(() => {
    // Reset states when refresh key changes
    setDisplayImageUrl('');
    setImageLoading(false);
    setImageError(false);
    
    if (!imageSrc) {
      return;
    }

    const loadImage = async () => {
      if (imageSrc.startsWith('data:')) {
        setDisplayImageUrl(imageSrc);
        setImageError(false);
      } else {
        setImageLoading(true);
        try {
          const dataUrl = await window.electronAPI.loadImageAsDataUrl(imageSrc);
          setDisplayImageUrl(dataUrl);
          setImageError(false);
        } catch (error) {
          console.error('Failed to load thumbnail:', error);
          setImageError(true);
        }
        setImageLoading(false);
      }
    };

    loadImage();
  }, [imageSrc, refreshKey]);

  if (!imageSrc || imageError) {
    return <div className={`thumbnail-placeholder ${size}`} title="No image">📄</div>;
  }

  if (imageLoading) {
    return <div className={`thumbnail-placeholder ${size}`} title="Loading...">⏳</div>;
  }

  return (
    <div className={`thumbnail-container ${size}`}>
      <img 
        src={displayImageUrl} 
        alt={alt} 
        className="thumbnail-image"
        onError={() => setImageError(true)}
      />
    </div>
  );
};

interface SermonListProps {
  sermons: ExpandedSermon[];
  selectedSermon: ExpandedSermon | null;
  onSermonSelect: (sermon: ExpandedSermon) => void;
  onSermonDoubleClick?: (sermon: ExpandedSermon) => void;
  columnConfig: ColumnConfig[];
  onColumnConfigChange: (columns: ColumnConfig[]) => void;
  viewSettings: ViewSettings;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc' | null;
  onSort?: (columnKey: string) => void;
  imageRefreshKey?: number;
}

const SermonList: React.FC<SermonListProps> = ({
  sermons,
  selectedSermon,
  onSermonSelect,
  onSermonDoubleClick,
  columnConfig,
  onColumnConfigChange,
  viewSettings,
  sortColumn,
  sortDirection,
  onSort,
  imageRefreshKey = 0
}) => {
  const [isColumnChooserOpen, setIsColumnChooserOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsColumnChooserOpen(false);
      }
    };

    if (isColumnChooserOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isColumnChooserOpen]);

  const formatValue = (sermon: ExpandedSermon, columnKey: string) => {
    switch (columnKey) {
      case 'date':
        return format(sermon.date, 'yyyy-MM-dd');
      case 'preachingHistory':
        return sermon.preachingHistory ? `${sermon.preachingHistory.length}x` : '1x';
      case 'series':
        return sermon.series || '-';
      case 'references':
        return sermon.references ? sermon.references.join(', ') : '-';
      case 'place':
        return sermon.place || '-';
      case 'type':
        return sermon.type || '-';
      case 'tags':
        return sermon.tags.slice(0, 2).join(', ') + (sermon.tags.length > 2 ? ` +${sermon.tags.length - 2}` : '');
      case 'lastModified':
        return sermon.lastModified ? format(sermon.lastModified, 'yyyy-MM-dd') : '';
      case 'fileSize':
        return sermon.fileSize ? `${Math.round(sermon.fileSize / 1024)} KB` : '';
      default:
        return (sermon[columnKey as keyof Sermon] as string) || '';
    }
  };

  const visibleColumns = columnConfig
    .filter(col => col.visible)
    .sort((a, b) => a.order - b.order);

  const renderListView = () => (
    <div className="sermon-list-view">
      {sermons.map((sermon) => (
        <div
          key={sermon.id}
          className={`sermon-item ${selectedSermon?.id === sermon.id ? 'selected' : ''}`}
          onClick={() => onSermonSelect(sermon)}
          onDoubleClick={() => onSermonDoubleClick && onSermonDoubleClick(sermon)}
        >
          <div className="sermon-content">
            <Thumbnail 
              imageSrc={sermon.image} 
              alt={sermon.title}
              size="large"
              refreshKey={imageRefreshKey}
            />
            <div className="sermon-info">
              <div className="sermon-header">
                <h3 className="sermon-title">{sermon.title}</h3>
                <span className="sermon-date">{format(sermon.date, 'MMM dd, yyyy')}</span>
              </div>
              <div className="sermon-details">
                {sermon.series && (
                  <div className="detail-item">
                    <FileText size={14} />
                    <span>{sermon.series}</span>
                  </div>
                )}
                {sermon.references && sermon.references.length > 0 && (
                  <div className="detail-item">
                    <Book size={14} />
                    <span>{sermon.references.slice(0, 2).join(', ')}{sermon.references.length > 2 ? '...' : ''}</span>
                  </div>
                )}
                {sermon.preachingHistory && sermon.preachingHistory.length > 1 && (
                  <div className="detail-item">
                    <MapPin size={14} />
                    <span>{sermon.preachingHistory.length} locations</span>
                  </div>
                )}
              </div>
              {sermon.tags.length > 0 && (
                <div className="sermon-tags">
                  {sermon.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="tag">{tag}</span>
                  ))}
                  {sermon.tags.length > 3 && (
                    <span className="tag-more">+{sermon.tags.length - 3}</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderGridView = () => (
    <div className="sermon-grid-view">
      {sermons.map((sermon) => (
        <div
          key={sermon.id}
          className={`sermon-card ${selectedSermon?.id === sermon.id ? 'selected' : ''}`}
          onClick={() => onSermonSelect(sermon)}
          onDoubleClick={() => onSermonDoubleClick && onSermonDoubleClick(sermon)}
        >
          <Thumbnail 
            imageSrc={sermon.image} 
            alt={sermon.title}
            size="medium"
            refreshKey={imageRefreshKey}
          />
          <div className="card-content">
            <div className="card-header">
              <h4 className="card-title">{sermon.title}</h4>
              <span className="card-date">{format(sermon.date, 'MMM dd, yyyy')}</span>
            </div>
            {sermon.series && <div className="card-series">{sermon.series}</div>}
            {sermon.references && sermon.references.length > 0 && (
              <div className="card-references">
                <Book size={12} />
                <span>{sermon.references.slice(0, 1).join(', ')}{sermon.references.length > 1 ? '...' : ''}</span>
              </div>
            )}
            {sermon.preachingHistory && sermon.preachingHistory.length > 1 && (
              <div className="preaching-badge">
                {sermon.preachingHistory.length}x
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  const renderDetailsView = () => (
    <div className="sermon-details-view">
      <div className="details-header">
        {visibleColumns.map((column, index) => (
          <div key={column.key} className="column-header">
            <div className="column-header-content">
              {onSort ? (
                <FilterableHeader
                  label={column.label}
                  columnKey={column.key}
                  sortDirection={sortColumn === column.key ? sortDirection : null}
                  onSort={onSort}
                />
              ) : (
                column.label
              )}
              {index === visibleColumns.length - 1 && (
                <div className="column-actions-dropdown" ref={dropdownRef}>
                  <button 
                    className="choose-columns-btn-compact"
                    onClick={() => setIsColumnChooserOpen(true)}
                    title="Choose Columns"
                  >
                    <Settings size={12} />
                  </button>
                  {isColumnChooserOpen && (
                    <ColumnChooser
                      isOpen={isColumnChooserOpen}
                      onClose={() => setIsColumnChooserOpen(false)}
                      columns={columnConfig}
                      onSave={(newConfig) => {
                        onColumnConfigChange(newConfig);
                        setIsColumnChooserOpen(false);
                      }}
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      {sermons.map((sermon) => (
        <div
          key={sermon.id}
          className={`details-row ${selectedSermon?.id === sermon.id ? 'selected' : ''}`}
          onClick={() => onSermonSelect(sermon)}
          onDoubleClick={() => onSermonDoubleClick && onSermonDoubleClick(sermon)}
        >
          {visibleColumns.map((column) => (
            <div key={column.key} className={`details-cell ${column.key === 'title' ? 'title-cell' : ''}`}>
              {column.key === 'tags' ? (
                <div className="cell-tags">
                  {sermon.tags.slice(0, 2).map((tag) => (
                    <span key={tag} className="cell-tag">{tag}</span>
                  ))}
                  {sermon.tags.length > 2 && (
                    <span className="tag-more">+{sermon.tags.length - 2}</span>
                  )}
                </div>
              ) : (
                formatValue(sermon, column.key)
              )}
            </div>
          ))}
          <div className="details-cell"></div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="sermon-list">
      <div className="sermon-list-header">
        <h2>Sermons ({sermons.length})</h2>
      </div>
      <div className="sermon-list-content">
        {viewSettings.viewMode === 'list' && renderListView()}
        {viewSettings.viewMode === 'grid' && renderGridView()}
        {viewSettings.viewMode === 'details' && renderDetailsView()}
        {sermons.length === 0 && (
          <div className="empty-state">
            <FileText size={48} />
            <p>No sermons found</p>
            <p>Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SermonList;
