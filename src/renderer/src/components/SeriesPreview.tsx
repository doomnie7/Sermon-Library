import { Series, Sermon } from '../types';
import { Calendar, FileText } from 'lucide-react';
import { format } from 'date-fns';
import ImageUpload from './ImageUpload';
import './SeriesPreview.css';

interface SeriesPreviewProps {
  series: Series | null;
  sermons: Sermon[];
  onSermonClick?: (sermon: Sermon) => void;
  onImageChange?: (seriesId: string, imagePath: string | null) => void;
  onImageClick?: (imageSrc: string) => void;
  imageRefreshKey?: number;
}

const SeriesPreview: React.FC<SeriesPreviewProps> = ({ 
  series, 
  sermons,
  onSermonClick,
  onImageChange,
  imageRefreshKey = 0
}) => {
  // Determine which image to use: series image or first sermon image as fallback
  const getImageToDisplay = () => {
    // If series has a custom image, use that
    if (series?.image) {
      return series.image;
    }
    
    // Otherwise, use the first sermon's image as fallback
    if (series && sermons.length > 0) {
      // Sort sermons by series order or date to get the first one
      const sortedSermons = [...sermons].sort((a, b) => {
        if (a.seriesOrder && b.seriesOrder) {
          return a.seriesOrder - b.seriesOrder;
        }
        return a.date.getTime() - b.date.getTime();
      });
      
      const firstSermon = sortedSermons[0];
      return firstSermon?.image;
    }
    
    return '';
  };
  if (!series) {
    return (
      <div className="series-preview">
        <div className="preview-empty">
          <FileText size={48} />
          <p>Select a series to view details</p>
        </div>
      </div>
    );
  }

  return (
    <div className="series-preview">
      <div className="series-preview-image-section">
        <div className="series-preview-image-upload">
          <ImageUpload
            value={getImageToDisplay()}
            onChange={(imagePath: string | null) => onImageChange && series && onImageChange(series.id, imagePath)}
            placeholder="Drop series image here or right-click to add"
            imageRefreshKey={imageRefreshKey}
          />
        </div>
        {!series?.image && getImageToDisplay() && (
          <div className="series-image-fallback-indicator">
            <span>Using first sermon image</span>
          </div>
        )}
      </div>

      <div className="series-preview-header">
        <h2 className="series-preview-title">{series.title}</h2>
        <div className="series-preview-metadata">
          {series.startDate && (
            <div className="metadata-item">
              <Calendar size={16} />
              <span>
                {format(series.startDate, 'MMMM dd, yyyy')}
                {series.endDate && ` - ${format(series.endDate, 'MMMM dd, yyyy')}`}
              </span>
            </div>
          )}
          <div className="metadata-item">
            <FileText size={16} />
            <span>{sermons.length} sermon{sermons.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>

      <div className="series-preview-content">
        {series.description && (
          <div className="preview-section">
            <h3>Description</h3>
            <p>{series.description}</p>
          </div>
        )}

        {series.tags.length > 0 && (
          <div className="preview-section">
            <h3>Tags</h3>
            <div className="tags">
              {series.tags.map((tag) => (
                <span key={tag} className="tag">{tag}</span>
              ))}
            </div>
          </div>
        )}

        <div className="preview-section">
          <h3>Sermons in this Series</h3>
          <div className="sermons-in-series">
            {sermons.map((sermon) => (
              <div
                key={sermon.id}
                className="sermon-item-mini"
                onClick={() => onSermonClick && onSermonClick(sermon)}
              >
                <div className="sermon-mini-header">
                  <h4 className="sermon-mini-title">{sermon.title}</h4>
                  <span className="sermon-mini-date">
                    {format(sermon.date, 'MMM dd')}
                  </span>
                </div>
                <div className="sermon-mini-details">
                  {sermon.preachingHistory && sermon.preachingHistory.length > 1 && (
                    <span className="preaching-count">
                      {sermon.preachingHistory.length}x preached
                    </span>
                  )}
                </div>
              </div>
            ))}
            
            {sermons.length === 0 && (
              <div className="no-sermons">
                <p>No sermons in this series yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeriesPreview;
