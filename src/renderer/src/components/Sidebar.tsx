import { FilterOptions } from '../types';
import { BookOpen, FolderOpen, MapPin, FileText, ChevronDown } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import './Sidebar.css';

interface SidebarProps {
  selectedSeries?: string;
  onSeriesSelect: (seriesId: string | undefined) => void;
  currentView: 'sermons' | 'series';
  onViewChange: (view: 'sermons' | 'series') => void;
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  types: string[];
  places: string[];
  tags: string[];
}

const Sidebar: React.FC<SidebarProps> = ({
  selectedSeries,
  onSeriesSelect,
  currentView,
  onViewChange,
  filters,
  onFiltersChange,
  types,
  places,
  tags
}) => {
  const [dropdownStates, setDropdownStates] = useState({
    type: false,
    place: false
  });

  const sidebarRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        setDropdownStates({
          type: false,
          place: false
        });
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleFilterChange = (filterType: keyof FilterOptions, value: string | undefined) => {
    const newFilters = { ...filters };
    if (value) {
      (newFilters as any)[filterType] = value;
    } else {
      delete (newFilters as any)[filterType];
    }
    onFiltersChange(newFilters);
  };

  const toggleDropdown = (filterType: 'type' | 'place') => {
    setDropdownStates(prev => ({
      type: false,
      place: false,
      [filterType]: !prev[filterType]
    }));
  };

  const getDisplayValue = (filterType: 'type' | 'place') => {
    switch (filterType) {
      case 'type':
        return filters.type || 'All Types';
      case 'place':
        return filters.place || 'All Places';
      default:
        return '';
    }
  };

  return (
    <div className="sidebar" ref={sidebarRef}>
      <div className="sidebar-header">
        <h3>Library</h3>
      </div>
      
      <div className="sidebar-section">
        <div 
          className={`sidebar-item ${currentView === 'sermons' && !selectedSeries ? 'active' : ''}`}
          onClick={() => {
            onViewChange('sermons');
            onSeriesSelect(undefined);
          }}
        >
          <BookOpen size={16} />
          <span>All Sermons</span>
        </div>
        <div 
          className={`sidebar-item ${currentView === 'series' ? 'active' : ''}`}
          onClick={() => onViewChange('series')}
        >
          <FolderOpen size={16} />
          <span>All Series</span>
        </div>
      </div>

      <div className="sidebar-section">
        <div className="sidebar-section-header">
          <h4>Type</h4>
        </div>
        <div className="filter-dropdown">
          <div 
            className="dropdown-header"
            onClick={() => toggleDropdown('type')}
          >
            <FileText size={16} />
            <span>{getDisplayValue('type')}</span>
            <ChevronDown 
              size={16} 
              className={`dropdown-caret ${dropdownStates.type ? 'open' : ''}`}
            />
          </div>
          {dropdownStates.type && (
            <div className="dropdown-list">
              <div 
                className={`dropdown-item ${!filters.type ? 'active' : ''}`}
                onClick={() => {
                  handleFilterChange('type', undefined);
                  toggleDropdown('type');
                }}
              >
                All Types
              </div>
              {types.map((type) => (
                <div
                  key={type}
                  className={`dropdown-item ${filters.type === type ? 'active' : ''}`}
                  onClick={() => {
                    handleFilterChange('type', type);
                    toggleDropdown('type');
                  }}
                >
                  {type}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="sidebar-section">
        <div className="sidebar-section-header">
          <h4>Place</h4>
        </div>
        <div className="filter-dropdown">
          <div 
            className="dropdown-header"
            onClick={() => toggleDropdown('place')}
          >
            <MapPin size={16} />
            <span>{getDisplayValue('place')}</span>
            <ChevronDown 
              size={16} 
              className={`dropdown-caret ${dropdownStates.place ? 'open' : ''}`}
            />
          </div>
          {dropdownStates.place && (
            <div className="dropdown-list">
              <div 
                className={`dropdown-item ${!filters.place ? 'active' : ''}`}
                onClick={() => {
                  handleFilterChange('place', undefined);
                  toggleDropdown('place');
                }}
              >
                All Places
              </div>
              {places.map((place) => (
                <div
                  key={place}
                  className={`dropdown-item ${filters.place === place ? 'active' : ''}`}
                  onClick={() => {
                    handleFilterChange('place', place);
                    toggleDropdown('place');
                  }}
                >
                  {place}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="sidebar-section">
        <div className="sidebar-section-header">
          <h4>Tags</h4>
        </div>
        <div className="tag-cloud">
          {tags.map((tag) => (
            <span 
              key={tag} 
              className={`tag ${filters.tags?.includes(tag) ? 'active' : ''}`}
              onClick={() => {
                const currentTags = filters.tags || [];
                const newTags = currentTags.includes(tag)
                  ? currentTags.filter(t => t !== tag)
                  : [...currentTags, tag];
                
                const newFilters = { ...filters };
                if (newTags.length > 0) {
                  newFilters.tags = newTags;
                } else {
                  delete newFilters.tags;
                }
                onFiltersChange(newFilters);
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
