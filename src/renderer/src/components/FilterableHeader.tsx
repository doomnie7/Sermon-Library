import React from 'react';
import { ChevronDown } from 'lucide-react';
import './FilterableHeader.css';

interface FilterableHeaderProps {
  label: string;
  columnKey: string;
  sortDirection?: 'asc' | 'desc' | null;
  onSort?: (columnKey: string) => void;
}

const FilterableHeader: React.FC<FilterableHeaderProps> = ({
  label,
  columnKey,
  sortDirection,
  onSort
}) => {
  const handleHeaderClick = () => {
    if (onSort) {
      onSort(columnKey);
    }
  };

  return (
    <div className="filterable-header">
      <div 
        className="header-content"
        onClick={handleHeaderClick}
      >
        <span className="header-label">{label}</span>
        <div className="header-icons">
          {sortDirection && (
            <ChevronDown 
              size={12} 
              className={`sort-icon ${sortDirection === 'asc' ? 'rotated' : ''}`} 
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default FilterableHeader;
