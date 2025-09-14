import { useState, useRef, useEffect, useCallback } from 'react';

export interface AutocompleteOptions<T> {
  items: T[];
  filterFn: (item: T, query: string) => boolean;
  extractLabel: (item: T) => string;
}

export function useAutocomplete<T>({ items, filterFn, extractLabel }: AutocompleteOptions<T>) {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredItems, setFilteredItems] = useState<T[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (value: string) => {
    setInputValue(value);
    if (value.trim()) {
      const filtered = items.filter(item => filterFn(item, value));
      setFilteredItems(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
      setFilteredItems([]);
    }
  };

  const selectItem = (item: T) => {
    setInputValue(extractLabel(item));
    setShowSuggestions(false);
    setFilteredItems([]);
  };

  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (inputRef.current && !inputRef.current.contains(event.target as Node)) {
      setShowSuggestions(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [handleClickOutside]);

  return { inputValue, setInputValue, showSuggestions, setShowSuggestions, filteredItems, inputRef, handleInputChange, selectItem };
}