import React, { useState, useEffect } from 'react';
import { Series, ViewSettings } from '../types';
import { FileText, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import './SeriesList.css';

// Thumbnail component for series images
interface ThumbnailProps {
  imageSrc?: string;
  alt: string;
  size?: 'small' | 'medium' | 'large';
  refreshKey?: number;
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
          console.error('Failed to load series thumbnail:', error);
          setImageError(true);
        }
        setImageLoading(false);
      }
    };

    loadImage();
  }, [imageSrc, refreshKey]);

  if (!imageSrc || imageError) {
    return <div className={`thumbnail-placeholder ${size}`} title="No image">📚</div>;
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

interface SeriesListProps {
  series: Series[];
  selectedSeries: Series | null;
  onSeriesSelect: (series: Series) => void;
  viewSettings: ViewSettings;
  imageRefreshKey?: number;
  sermons?: any[]; // Add sermons for fallback image logic
}

const SeriesList: React.FC<SeriesListProps> = ({
  series,
  selectedSeries,
  onSeriesSelect,
  viewSettings,
  imageRefreshKey = 0,
  sermons = []
}) => {
  // Helper function to get series image (custom or fallback)
  const getSeriesImage = (seriesItem: Series) => {
    // If series has a custom image, use that
    if (seriesItem.image) {
      return seriesItem.image;
    }
    
    // Otherwise, try to use the first sermon's image as fallback
    if (sermons.length > 0) {
      const seriesSermons = sermons.filter(sermon => sermon.series === seriesItem.title);
      if (seriesSermons.length > 0) {
        // Sort by series order or date to get the first one
        const sortedSermons = [...seriesSermons].sort((a, b) => {
          if (a.seriesOrder && b.seriesOrder) {
            return a.seriesOrder - b.seriesOrder;
          }
          return a.date.getTime() - b.date.getTime();
        });
        return sortedSermons[0]?.image || '';
      }
    }
    
    return '';
  };

  const renderListView = () => (
    <div className="series-list-view">
      {series.map((seriesItem) => (
        <div
          key={seriesItem.id}
          className={`series-item ${selectedSeries?.id === seriesItem.id ? 'selected' : ''}`}
          onClick={() => onSeriesSelect(seriesItem)}
        >
          <div className="series-content">
            <Thumbnail 
              imageSrc={getSeriesImage(seriesItem)} 
              alt={seriesItem.title}
              size="large"
              refreshKey={imageRefreshKey}
            />
            <div className="series-info">
              <div className="series-header">
                <h3 className="series-title">{seriesItem.title}</h3>
                <span className="series-count">{seriesItem.sermons.length} sermons</span>
              </div>
              
              {seriesItem.description && (
                <div className="series-description">
                  {seriesItem.description}
                </div>
              )}
              
              <div className="series-details">
                {seriesItem.startDate && (
                  <div className="detail-item">
                    <Calendar size={14} />
                    <span>
                      {(() => {
                        try {
                          const startDate = new Date(seriesItem.startDate);
                          if (isNaN(startDate.getTime())) return 'Invalid Date';
                          
                          let dateText = format(startDate, 'MMM dd, yyyy');
                          
                          if (seriesItem.endDate) {
                            const endDate = new Date(seriesItem.endDate);
                            if (!isNaN(endDate.getTime())) {
                              dateText += ` - ${format(endDate, 'MMM dd, yyyy')}`;
                            }
                          }
                          
                          return dateText;
                        } catch (error) {
                          console.error('Error formatting series date:', error);
                          return 'Date formatting error';
                        }
                      })()}
                    </span>
                  </div>
                )}
                <div className="detail-item">
                  <FileText size={14} />
                  <span>{seriesItem.sermons.length} sermon{seriesItem.sermons.length !== 1 ? 's' : ''}</span>
                </div>
              </div>
              
              {seriesItem.tags.length > 0 && (
                <div className="series-tags">
                  {seriesItem.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="tag">{tag}</span>
                  ))}
                  {seriesItem.tags.length > 3 && (
                    <span className="tag-more">+{seriesItem.tags.length - 3}</span>
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
    <div className="series-grid-view">
      {series.map((seriesItem) => (
        <div
          key={seriesItem.id}
          className={`series-card ${selectedSeries?.id === seriesItem.id ? 'selected' : ''}`}
          onClick={() => onSeriesSelect(seriesItem)}
        >
          <Thumbnail 
            imageSrc={getSeriesImage(seriesItem)} 
            alt={seriesItem.title}
            size="medium"
            refreshKey={imageRefreshKey}
          />
          <div className="card-content">
            <div className="card-header">
              <h4 className="card-title">{seriesItem.title}</h4>
              <span className="card-count">{seriesItem.sermons.length} sermons</span>
            </div>
            {seriesItem.startDate && (
              <div className="card-date">
                <Calendar size={12} />
                <span>
                  {(() => {
                    try {
                      const startDate = new Date(seriesItem.startDate);
                      if (isNaN(startDate.getTime())) return 'Invalid Date';
                      return format(startDate, 'MMM dd, yyyy');
                    } catch (error) {
                      return 'Date error';
                    }
                  })()}
                </span>
              </div>
            )}
            {seriesItem.tags.length > 0 && (
              <div className="card-tags">
                {seriesItem.tags.slice(0, 2).map((tag) => (
                  <span key={tag} className="card-tag">{tag}</span>
                ))}
                {seriesItem.tags.length > 2 && (
                  <span className="tag-more">+{seriesItem.tags.length - 2}</span>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="series-list">
      <div className="series-list-header">
        <h2>Series ({series.length})</h2>
      </div>
      <div className="series-list-content">
        {viewSettings.viewMode === 'list' && renderListView()}
        {viewSettings.viewMode === 'grid' && renderGridView()}
        {series.length === 0 && (
          <div className="empty-state">
            <FileText size={48} />
            <p>No series found</p>
            <p>Create your first series to get started</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SeriesList;
