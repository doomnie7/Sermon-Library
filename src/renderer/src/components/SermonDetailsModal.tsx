import { useState, useEffect, useRef } from 'react';
import { Sermon, PreachingInstance, Series } from '../types';
import { X, Calendar, FileText, Tag as TagIcon, MapPin, Building, Trash2, Plus } from 'lucide-react';
import ImageUpload from './ImageUpload';
import './SermonDetailsModal.css';

interface SermonDetailsModalProps {
  isOpen: boolean;
  sermon?: Sermon | null;
  series: Series[];
  places: string[];
  types: string[];
  onClose: () => void;
  onSave: (sermon: Sermon) => void;
  onDelete?: (sermonId: string) => void;
  imageRefreshKey?: number;
} 

const SermonDetailsModal: React.FC<SermonDetailsModalProps> = ({
  isOpen,
  sermon,
  series,
  places,
  types,
  onClose,
  onSave,
  onDelete,
  imageRefreshKey = 0
}) => {
  const [formData, setFormData] = useState<Partial<Sermon>>({
    title: '',
    date: new Date(),
    series: '',
    seriesOrder: undefined,
    summary: '',
    type: '',
    place: '',
    tags: [],
    references: [],
    image: '',
    preachingHistory: []
  });

  const [newTag, setNewTag] = useState('');
  const [newReference, setNewReference] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showHistoryDeleteConfirm, setShowHistoryDeleteConfirm] = useState<string | null>(null);
  
  // Series autocomplete state
  const [showSeriesSuggestions, setShowSeriesSuggestions] = useState(false);
  const [seriesInput, setSeriesInput] = useState('');
  const [filteredSeries, setFilteredSeries] = useState<Series[]>([]);
  const seriesInputRef = useRef<HTMLInputElement>(null);

  // Place autocomplete state
  const [showPlaceSuggestions, setShowPlaceSuggestions] = useState(false);
  const [placeInput, setPlaceInput] = useState('');
  const [filteredPlaces, setFilteredPlaces] = useState<string[]>([]);
  const placeInputRef = useRef<HTMLInputElement>(null);

  // Type autocomplete state
  const [showTypeSuggestions, setShowTypeSuggestions] = useState(false);
  const [typeInput, setTypeInput] = useState('');
  const [filteredTypes, setFilteredTypes] = useState<string[]>([]);
  const typeInputRef = useRef<HTMLInputElement>(null);

  // Focus management
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Focus the title input when modal opens
  useEffect(() => {
    if (isOpen && titleInputRef.current) {
      if (window.electronAPI) {
        window.electronAPI.focusWindow();
      }
      // Use setTimeout to ensure the modal is fully rendered
      const timer = setTimeout(() => {
        if (titleInputRef.current) {
          titleInputRef.current.focus();
          // Only select text if we're editing an existing sermon
          if (sermon && formData.title) {
            titleInputRef.current.select();
          }
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [isOpen, sermon]);

  // Update form data when sermon prop changes
  useEffect(() => {
    if (sermon) {
      // If sermon has preaching history, use the FIRST (oldest) entry for date and place
      let firstDate = sermon.date;
      let firstPlace = sermon.place || '';
      
      if (sermon.preachingHistory && sermon.preachingHistory.length > 0) {
        // Find the earliest (first preached) date
        const firstPreaching = sermon.preachingHistory.reduce((earliest, instance) => {
          return instance.date < earliest.date ? instance : earliest;
        }, sermon.preachingHistory[0]);
        
        firstDate = firstPreaching.date;
        firstPlace = firstPreaching.location;
      }
      
      setFormData({
        ...sermon,
        title: sermon.title || '',
        date: firstDate,
        series: sermon.series || '',
        seriesOrder: sermon.seriesOrder,
        summary: sermon.summary || '',
        type: sermon.type || '',
        place: firstPlace,
        tags: sermon.tags || [],
        references: sermon.references || [],
        image: sermon.image || '',
        preachingHistory: sermon.preachingHistory || []
      });
      
      // Reset input states for autocomplete
      setSeriesInput('');
      setPlaceInput('');
      setTypeInput('');
    } else {
      // Reset form for new sermon with today's date
      const today = new Date();
      setFormData({
        title: '',
        date: today,
        series: '',
        seriesOrder: undefined,
        summary: '',
        type: '',
        place: '',
        tags: [],
        references: [],
        image: '',
        preachingHistory: []
      });
      
      // Reset input states for autocomplete
      setSeriesInput('');
      setPlaceInput('');
      setTypeInput('');
    }
  }, [sermon]);

  // Handle clicks outside autocomplete suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (seriesInputRef.current && !seriesInputRef.current.contains(event.target as Node)) {
        setShowSeriesSuggestions(false);
      }
      if (placeInputRef.current && !placeInputRef.current.contains(event.target as Node)) {
        setShowPlaceSuggestions(false);
      }
      if (typeInputRef.current && !typeInputRef.current.contains(event.target as Node)) {
        setShowTypeSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);


  if (!isOpen) return null;

  const handleInputChange = (field: keyof Sermon, value: any) => {
    setFormData(prev => {
      const newFormData = { ...prev, [field]: value };
      
      // If changing date or place, also update the corresponding first preaching history entry if it exists
      if ((field === 'date' || field === 'place') && newFormData.preachingHistory && newFormData.preachingHistory.length > 0) {
        const updatedHistory = [...newFormData.preachingHistory];
        
        // Find the oldest (first preached) entry
        const oldestEntry = updatedHistory.reduce((earliest, instance) => {
          return instance.date < earliest.date ? instance : earliest;
        }, updatedHistory[0]);
        
        const oldestIndex = updatedHistory.findIndex(h => h.id === oldestEntry.id);
        
        if (field === 'date') {
          updatedHistory[oldestIndex] = { ...updatedHistory[oldestIndex], date: value };
        } else if (field === 'place') {
          updatedHistory[oldestIndex] = { ...updatedHistory[oldestIndex], location: value };
        }
        
        newFormData.preachingHistory = updatedHistory;
      }
      
      return newFormData;
    });
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags?.includes(newTag.trim())) {
      handleInputChange('tags', [...(formData.tags || []), newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    handleInputChange('tags', formData.tags?.filter(tag => tag !== tagToRemove) || []);
  };

  const addReference = () => {
    if (newReference.trim() && !formData.references?.includes(newReference.trim())) {
      handleInputChange('references', [...(formData.references || []), newReference.trim()]);
      setNewReference('');
    }
  };

  const removeReference = (refToRemove: string) => {
    handleInputChange('references', formData.references?.filter(ref => ref !== refToRemove) || []);
  };

  // Place input handlers
  const handlePlaceInputChange = (value: string) => {
    setPlaceInput(value);
    handleInputChange('place', value);
    
    if (value.trim()) {
      const filtered = places.filter(place => 
        place.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredPlaces(filtered);
      setShowPlaceSuggestions(filtered.length > 0);
    } else {
      setShowPlaceSuggestions(false);
      setFilteredPlaces([]);
    }
  };

  const selectPlace = (place: string) => {
    handleInputChange('place', place);
    setPlaceInput('');
    setShowPlaceSuggestions(false);
  };

  // Series input handlers
  const handleSeriesInputChange = (value: string) => {
    setSeriesInput(value);
    handleInputChange('series', value);
    
    if (value.trim()) {
      const filtered = series.filter(seriesItem => 
        seriesItem.title.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredSeries(filtered);
      setShowSeriesSuggestions(filtered.length > 0);
    } else {
      setShowSeriesSuggestions(false);
      setFilteredSeries([]);
    }
  };

  const selectSeries = (seriesTitle: string) => {
    handleInputChange('series', seriesTitle);
    setSeriesInput('');
    setShowSeriesSuggestions(false);
  };

  // Type input handlers
  const handleTypeInputChange = (value: string) => {
    setTypeInput(value);
    handleInputChange('type', value);
    
    if (value.trim()) {
      const filtered = types.filter(type => 
        type.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredTypes(filtered);
      setShowTypeSuggestions(filtered.length > 0);
    } else {
      setShowTypeSuggestions(false);
      setFilteredTypes([]);
    }
  };

  const selectType = (type: string) => {
    handleInputChange('type', type);
    setTypeInput('');
    setShowTypeSuggestions(false);
  };

  const handleSave = () => {
    // Use the preaching history from the form data (which includes all user changes)
    let preachingHistory = formData.preachingHistory || [];
    
    // For new sermons, ensure we have at least one preaching instance from the form date/place
    if (!sermon && preachingHistory.length === 0) {
      preachingHistory = [
        {
          id: Date.now().toString(),
          date: formData.date || new Date(),
          location: formData.place || 'Unknown Location'
        }
      ];
    }
    
    // The main sermon date should be the FIRST (oldest) date from preaching history
    const firstDate = preachingHistory.length > 0 ? 
      preachingHistory.reduce((earliest, instance) => {
        return instance.date < earliest ? instance.date : earliest;
      }, preachingHistory[0].date) : 
      (formData.date || new Date());
    
    // For place, use the location of the first preaching instance
    const firstInstance = preachingHistory.find(instance => instance.date.getTime() === firstDate.getTime());
    const firstPlace = firstInstance?.location || formData.place || 'Unknown Location';
    
    const sermonToSave: Sermon = {
      id: sermon?.id || Date.now().toString(),
      title: formData.title || 'Untitled Sermon',
      date: firstDate, // Use FIRST (oldest) date from preaching history
      series: formData.series,
      seriesOrder: formData.seriesOrder,
      summary: formData.summary,
      type: formData.type,
      place: firstPlace, // Use place from first preaching instance
      tags: formData.tags || [],
      references: formData.references || [],
      image: formData.image,
      versions: sermon?.versions,
      preachingHistory: preachingHistory,
      filePath: sermon?.filePath,
      fileSize: sermon?.fileSize,
      lastModified: sermon?.lastModified
    };
    onSave(sermonToSave);
    onClose();
  };

  const handleDeleteSermon = () => {
    if (sermon?.id && onDelete) {
      onDelete(sermon.id);
    }
    setShowDeleteConfirm(false);
  };

  const handleDeletePreachingInstance = (instanceId: string) => {
    const updatedHistory = formData.preachingHistory?.filter(instance => instance.id !== instanceId) || [];
    handleInputChange('preachingHistory', updatedHistory);
    setShowHistoryDeleteConfirm(null);
  };

  const addPreachingInstance = () => {
    // Calculate a date that's newer than the most recent preaching date
    let newDate = new Date();
    if (formData.preachingHistory && formData.preachingHistory.length > 0) {
      const mostRecentDate = formData.preachingHistory.reduce((latest, instance) => {
        return instance.date > latest ? instance.date : latest;
      }, formData.preachingHistory[0].date);
      
      // Set new date to one day after the most recent date
      newDate = new Date(mostRecentDate);
      newDate.setDate(newDate.getDate() + 1);
    }
    
    const newInstance: PreachingInstance = {
      id: Date.now().toString(),
      date: newDate,
      location: 'New Location'
    };
    
    const newHistory = [...(formData.preachingHistory || []), newInstance];
    handleInputChange('preachingHistory', newHistory);
  };

  const updatePreachingInstance = (instanceId: string, field: 'date' | 'location', value: any) => {
    const updatedHistory = formData.preachingHistory?.map(instance => {
      if (instance.id === instanceId) {
        return { ...instance, [field]: value };
      }
      return instance;
    }) || [];
    
    handleInputChange('preachingHistory', updatedHistory);
    
    // If this is the oldest/first preached instance, also update the main date/place fields
    const oldestInstance = updatedHistory.reduce((earliest, instance) => {
      return instance.date < earliest.date ? instance : earliest;
    }, updatedHistory[0]);
    
    if (oldestInstance && oldestInstance.id === instanceId) {
      if (field === 'date') {
        handleInputChange('date', value);
      } else if (field === 'location') {
        handleInputChange('place', value);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div 
        className="modal-content sermon-details-modal" 
        tabIndex={-1}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            onClose();
          }
        }}
      >
        <div className="modal-header">
          <h2>{sermon ? 'Edit Sermon' : 'Add New Sermon'}</h2>
          <button onClick={onClose} className="close-btn">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div className="form-grid">
            <div className="form-section">
              <div className="form-group">
                <label>Title *</label>
                <input
                  ref={titleInputRef}
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Enter sermon title"
                />
              </div>

              <div className="form-group">
                <label>Scripture References</label>
                <div className="references-input">
                  <div className="references-display">
                    {formData.references?.map((ref) => (
                      <span key={ref} className="reference">
                        {ref}
                        <button onClick={() => removeReference(ref)}>×</button>
                      </span>
                    ))}
                  </div>
                  <div className="add-reference">
                    <input
                      type="text"
                      value={newReference}
                      onChange={(e) => setNewReference(e.target.value)}
                      placeholder="Add scripture reference"
                      onKeyPress={(e) => e.key === 'Enter' && addReference()}
                    />
                    <button onClick={addReference}>Add</button>
                  </div>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>First Preached *</label>
                  <div className="input-with-icon">
                    <Calendar size={16} />
                    <input
                      type="date"
                      value={formData.date ? (() => {
                        const date = new Date(formData.date);
                        // Ensure we get the local date without timezone issues
                        const year = date.getFullYear();
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const day = String(date.getDate()).padStart(2, '0');
                        return `${year}-${month}-${day}`;
                      })() : ''}
                      onChange={(e) => {
                        // Parse date correctly to avoid timezone issues
                        const dateString = e.target.value;
                        if (dateString) {
                          const [year, month, day] = dateString.split('-').map(Number);
                          const date = new Date(year, month - 1, day); // month is 0-indexed
                          handleInputChange('date', date);
                        }
                      }}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Place *</label>
                  <div className="input-with-icon place-autocomplete" ref={placeInputRef}>
                    <MapPin size={16} />
                    <input
                      type="text"
                      value={placeInput || formData.place || ''}
                      onChange={(e) => handlePlaceInputChange(e.target.value)}
                      onFocus={() => {
                        if (placeInput && filteredPlaces.length > 0) {
                          setShowPlaceSuggestions(true);
                        }
                      }}
                      placeholder="Church or location name"
                    />
                    {showPlaceSuggestions && filteredPlaces.length > 0 && (
                      <div className="place-suggestions">
                        {filteredPlaces.map((place) => (
                          <div
                            key={place}
                            className="place-suggestion"
                            onClick={() => selectPlace(place)}
                          >
                            <span className="place-title">{place}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Series</label>
                  <div className="input-with-icon series-autocomplete" ref={seriesInputRef}>
                    <FileText size={16} />
                    <input
                      type="text"
                      value={seriesInput || formData.series || ''}
                      onChange={(e) => handleSeriesInputChange(e.target.value)}
                      onFocus={() => {
                        if (seriesInput && filteredSeries.length > 0) {
                          setShowSeriesSuggestions(true);
                        }
                      }}
                      placeholder="Series name"
                    />
                    {showSeriesSuggestions && filteredSeries.length > 0 && (
                      <div className="series-suggestions">
                        {filteredSeries.map((seriesItem) => (
                          <div
                            key={seriesItem.title}
                            className="series-suggestion"
                            onClick={() => selectSeries(seriesItem.title)}
                          >
                            <span className="series-title">{seriesItem.title}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <label>Series Order</label>
                  <div className="input-with-icon">
                    <FileText size={16} />
                    <input
                      type="number"
                      min="1"
                      value={formData.seriesOrder || ''}
                      onChange={(e) => handleInputChange('seriesOrder', e.target.value ? parseInt(e.target.value) : undefined)}
                      placeholder="Order in series"
                      disabled={!formData.series}
                    />
                  </div>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Type</label>
                  <div className="input-with-icon type-autocomplete" ref={typeInputRef}>
                    <Building size={16} />
                    <input
                      type="text"
                      value={typeInput || formData.type || ''}
                      onChange={(e) => handleTypeInputChange(e.target.value)}
                      onFocus={() => {
                        if (typeInput && filteredTypes.length > 0) {
                          setShowTypeSuggestions(true);
                        }
                      }}
                      placeholder="Enter sermon type (e.g., Sunday Service, Bible Study, etc.)"
                    />
                    {showTypeSuggestions && filteredTypes.length > 0 && (
                      <div className="type-suggestions">
                        {filteredTypes.map((type) => (
                          <div
                            key={type}
                            className="type-suggestion"
                            onClick={() => selectType(type)}
                          >
                            <span className="type-title">{type}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label>Summary</label>
                <textarea
                  value={formData.summary}
                  onChange={(e) => handleInputChange('summary', e.target.value)}
                  placeholder="Brief summary of the sermon"
                  rows={4}
                />
              </div>
            </div>

            <div className="form-section">
              <div className="form-group">
                <label>Sermon Image</label>
                <ImageUpload
                  value={formData.image}
                  onChange={(imagePath: string | null) => handleInputChange('image', imagePath || '')}
                  imageRefreshKey={imageRefreshKey}
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <div className="form-group">
              <label>Tags</label>
              <div className="tags-input">
                <div className="tags-display">
                  {formData.tags?.map((tag) => (
                    <span key={tag} className="tag">
                      <TagIcon size={12} />
                      {tag}
                      <button onClick={() => removeTag(tag)}>×</button>
                    </span>
                  ))}
                </div>
                <div className="add-tag">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add tag"
                    onKeyPress={(e) => e.key === 'Enter' && addTag()}
                  />
                  <button onClick={addTag}>Add</button>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label>Preaching History</label>
              <div className="preaching-history">
                {formData.preachingHistory?.map((instance) => (
                  <div key={instance.id} className="preaching-instance">
                    <div className="instance-info">
                      <div className="instance-date">
                        <Calendar size={14} />
                        <input
                          type="date"
                          value={(() => {
                            const date = new Date(instance.date);
                            const year = date.getFullYear();
                            const month = String(date.getMonth() + 1).padStart(2, '0');
                            const day = String(date.getDate()).padStart(2, '0');
                            return `${year}-${month}-${day}`;
                          })()}
                          onChange={(e) => {
                            const dateString = e.target.value;
                            if (dateString) {
                              const [year, month, day] = dateString.split('-').map(Number);
                              const date = new Date(year, month - 1, day);
                              updatePreachingInstance(instance.id, 'date', date);
                            }
                          }}
                          className="date-input"
                        />
                      </div>
                      <div className="instance-location">
                        <MapPin size={14} />
                        <input
                          type="text"
                          value={instance.location}
                          onChange={(e) => updatePreachingInstance(instance.id, 'location', e.target.value)}
                          className="location-input"
                          placeholder="Location"
                        />
                      </div>
                    </div>
                    <button 
                      onClick={() => setShowHistoryDeleteConfirm(instance.id)}
                      className="delete-instance-btn"
                      title="Delete this preaching instance"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                <button onClick={addPreachingInstance} className="add-instance-btn">
                  <Plus size={14} />
                  Add Additional Preaching Date
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Delete Confirmation Dialogs */}
        {showDeleteConfirm && (
          <div className="confirmation-overlay">
            <div className="confirmation-dialog">
              <h3>Delete Sermon</h3>
              <p>Are you sure you want to delete this sermon? This action cannot be undone.</p>
              <div className="confirmation-buttons">
                <button onClick={() => setShowDeleteConfirm(false)} className="btn-secondary">
                  Cancel
                </button>
                <button onClick={handleDeleteSermon} className="btn-danger">
                  Delete Sermon
                </button>
              </div>
            </div>
          </div>
        )}

        {showHistoryDeleteConfirm && (
          <div className="confirmation-overlay">
            <div className="confirmation-dialog">
              <h3>Delete Preaching Instance</h3>
              <p>Are you sure you want to delete this preaching date?</p>
              <div className="confirmation-buttons">
                <button onClick={() => setShowHistoryDeleteConfirm(null)} className="btn-secondary">
                  Cancel
                </button>
                <button 
                  onClick={() => handleDeletePreachingInstance(showHistoryDeleteConfirm)} 
                  className="btn-danger"
                >
                  Delete Date
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="modal-footer">
          {sermon && onDelete && (
            <button onClick={() => setShowDeleteConfirm(true)} className="btn-danger delete-sermon-btn">
              <Trash2 size={16} />
              Delete Sermon
            </button>
          )}
          <div className="footer-actions">
            <button onClick={onClose} className="btn-secondary">Cancel</button>
            <button onClick={handleSave} className="btn-primary">
              {sermon ? 'Save Changes' : 'Add Sermon'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SermonDetailsModal;
