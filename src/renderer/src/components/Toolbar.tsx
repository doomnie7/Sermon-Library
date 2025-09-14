import { useState, useEffect, useRef } from 'react';
import { Search, Grid, List, Plus, Edit, Table, ChevronDown } from 'lucide-react';
import { FilterOptions, ViewSettings } from '../types';
import './Toolbar.css';

interface ToolbarProps {
  onFiltersChange: (filters: FilterOptions) => void;
  onViewSettingsChange: (settings: ViewSettings) => void;
  viewSettings: ViewSettings;
  selectedSermon?: any;
  onAddSermon: () => void;
  onEditSermon: (sermon: any) => void;
}

const Toolbar: React.FC<ToolbarProps> = ({
  onFiltersChange,
  onViewSettingsChange,
  viewSettings,
  selectedSermon,
  onAddSermon,
  onEditSermon
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchField, setSearchField] = useState<'all' | 'series' | 'title' | 'references'>('all');
  const [searchDropdownOpen, setSearchDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setSearchDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    onFiltersChange({ searchTerm: value, searchField });
  };

  const handleSearchFieldChange = (field: 'all' | 'series' | 'title' | 'references') => {
    setSearchField(field);
    setSearchDropdownOpen(false);
    onFiltersChange({ searchTerm, searchField: field });
  };

  const getSearchFieldLabel = () => {
    switch (searchField) {
      case 'all': return 'All Fields';
      case 'series': return 'Series';
      case 'title': return 'Title';
      case 'references': return 'Scripture';
      default: return 'All Fields';
    }
  };

  const handleSortChange = (sortBy: ViewSettings['sortBy']) => {
    onViewSettingsChange({
      ...viewSettings,
      sortBy,
      sortOrder: viewSettings.sortBy === sortBy && viewSettings.sortOrder === 'asc' ? 'desc' : 'asc'
    });
  };

  const handleViewModeChange = (viewMode: ViewSettings['viewMode']) => {
    onViewSettingsChange({ ...viewSettings, viewMode });
  };

  return (
    <div className="toolbar">
      <div className="toolbar-section">
        <button className="toolbar-btn primary" onClick={onAddSermon}>
          <Plus size={16} />
          Add Sermon
        </button>
        <button 
          className={`toolbar-btn ${selectedSermon ? '' : 'disabled'}`}
          onClick={() => selectedSermon && onEditSermon(selectedSermon)}
          disabled={!selectedSermon}
        >
          <Edit size={16} />
          Edit Sermon
        </button>
      </div>

      <div className="toolbar-section search-section">
        <div className="search-container" ref={dropdownRef}>
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search sermons, series..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="search-input"
          />
          <div 
            className="search-field-selector"
            onClick={() => setSearchDropdownOpen(!searchDropdownOpen)}
          >
            <span className="search-field-label">{getSearchFieldLabel()}</span>
            <ChevronDown 
              size={14} 
              className={`search-chevron ${searchDropdownOpen ? 'open' : ''}`}
            />
          </div>
          {searchDropdownOpen && (
            <div className="search-field-options">
              <button
                className="search-field-option"
                onClick={() => handleSearchFieldChange('all')}
              >
                All Fields
              </button>
              <button
                className="search-field-option"
                onClick={() => handleSearchFieldChange('series')}
              >
                Series
              </button>
              <button
                className="search-field-option"
                onClick={() => handleSearchFieldChange('title')}
              >
                Title
              </button>
              <button
                className="search-field-option"
                onClick={() => handleSearchFieldChange('references')}
              >
                Scripture Reference
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="toolbar-section">
        <div className="sort-controls">
          <label>Sort by:</label>
          <select 
            value={viewSettings.sortBy}
            onChange={(e) => handleSortChange(e.target.value as ViewSettings['sortBy'])}
            className="sort-select"
          >
            <option value="date">Date</option>
            <option value="firstPreached">First Preached</option>
            <option value="lastPreached">Last Preached</option>
            <option value="title">Title</option>
            <option value="series">Series</option>
          </select>
          <button
            className="toolbar-btn"
            onClick={() => onViewSettingsChange({
              ...viewSettings,
              sortOrder: viewSettings.sortOrder === 'asc' ? 'desc' : 'asc'
            })}
          >
            {viewSettings.sortOrder === 'asc' ? '↑' : '↓'}
          </button>
        </div>

        <div className="view-controls">
          <button
            className={`toolbar-btn ${viewSettings.viewMode === 'list' ? 'active' : ''}`}
            onClick={() => handleViewModeChange('list')}
          >
            <List size={16} />
          </button>
          <button
            className={`toolbar-btn ${viewSettings.viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => handleViewModeChange('grid')}
          >
            <Grid size={16} />
          </button>
          <button
            className={`toolbar-btn ${viewSettings.viewMode === 'details' ? 'active' : ''}`}
            onClick={() => handleViewModeChange('details')}
          >
            <Table size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Toolbar;
