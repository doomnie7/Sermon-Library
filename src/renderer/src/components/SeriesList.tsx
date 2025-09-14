import { Series } from '../types';
import { FileText, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import './SeriesList.css';

interface SeriesListProps {
  series: Series[];
  selectedSeries: Series | null;
  onSeriesSelect: (series: Series) => void;
}

const SeriesList: React.FC<SeriesListProps> = ({
  series,
  selectedSeries,
  onSeriesSelect
}) => {
  return (
    <div className="series-list">
      <div className="series-list-header">
        <h2>Series ({series.length})</h2>
      </div>
      <div className="series-list-content">
        {series.map((seriesItem) => (
          <div
            key={seriesItem.id}
            className={`series-item ${selectedSeries?.id === seriesItem.id ? 'selected' : ''}`}
            onClick={() => onSeriesSelect(seriesItem)}
          >
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
        ))}
        
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
