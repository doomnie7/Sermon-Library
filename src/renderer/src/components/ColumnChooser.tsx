import React, { useState, useEffect } from 'react';
import { X, ChevronUp, ChevronDown } from 'lucide-react';
import './ColumnChooser.css';

export interface ColumnConfig {
  key: string;
  label: string;
  visible: boolean;
  order: number;
}

interface ColumnChooserProps {
  isOpen: boolean;
  onClose: () => void;
  columns: ColumnConfig[];
  onSave: (columns: ColumnConfig[]) => void;
}

const ColumnChooser: React.FC<ColumnChooserProps> = ({
  isOpen,
  onClose,
  columns,
  onSave
}) => {
  const [localColumns, setLocalColumns] = useState<ColumnConfig[]>([]);

  useEffect(() => {
    if (isOpen) {
      setLocalColumns([...columns].sort((a, b) => a.order - b.order));
    }
  }, [isOpen, columns]);

  if (!isOpen) return null;

  const handleToggleColumn = (columnKey: string) => {
    setLocalColumns(prev => 
      prev.map(col => 
        col.key === columnKey 
          ? { ...col, visible: !col.visible }
          : col
      )
    );
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    
    setLocalColumns(prev => {
      const newColumns = [...prev];
      [newColumns[index - 1], newColumns[index]] = [newColumns[index], newColumns[index - 1]];
      return newColumns.map((col, i) => ({ ...col, order: i }));
    });
  };

  const handleMoveDown = (index: number) => {
    if (index === localColumns.length - 1) return;
    
    setLocalColumns(prev => {
      const newColumns = [...prev];
      [newColumns[index], newColumns[index + 1]] = [newColumns[index + 1], newColumns[index]];
      return newColumns.map((col, i) => ({ ...col, order: i }));
    });
  };

  const handleSave = () => {
    onSave(localColumns);
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <div className="column-chooser-dropdown">
      <div className="dropdown-header">
        <span className="dropdown-title">Choose Columns</span>
        <button className="close-btn" onClick={onClose}>
          <X size={14} />
        </button>
      </div>
      
      <div className="dropdown-body">
        <div className="columns-list">
          {localColumns.map((column, index) => (
            <div key={column.key} className="column-item">
              <label className="column-checkbox">
                <input
                  type="checkbox"
                  checked={column.visible}
                  onChange={() => handleToggleColumn(column.key)}
                />
                <span className="checkbox-label">{column.label}</span>
              </label>
              
              <div className="column-controls">
                <button
                  className="move-btn"
                  onClick={() => handleMoveUp(index)}
                  disabled={index === 0}
                  title="Move up"
                >
                  <ChevronUp size={12} />
                </button>
                <button
                  className="move-btn"
                  onClick={() => handleMoveDown(index)}
                  disabled={index === localColumns.length - 1}
                  title="Move down"
                >
                  <ChevronDown size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="dropdown-footer">
        <button className="btn btn-secondary" onClick={handleCancel}>
          Cancel
        </button>
        <button className="btn btn-primary" onClick={handleSave}>
          Apply
        </button>
      </div>
    </div>
  );
};

export default ColumnChooser;
