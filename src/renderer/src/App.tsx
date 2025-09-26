import { useState, useEffect, useRef } from 'react';
import Toolbar from './components/Toolbar';
import Sidebar from './components/Sidebar';
import SermonList from './components/SermonList';
import SeriesList from './components/SeriesList';
import PreviewPane from './components/PreviewPane';
import SeriesPreview from './components/SeriesPreview';
import SermonDetailsModal from './components/SermonDetailsModal';
import ImageViewer from './components/ImageViewer';
import ColumnChooser, { ColumnConfig } from './components/ColumnChooser';
import { Sermon, Series, FilterOptions, ViewSettings, ViewType, ExpandedSermon } from './types';
import './App.css';
import './dark-mode.css';

// Sample data - in a real app, this would come from a database
// Sample sermon data
const sampleSermons: Sermon[] = [
  {
    id: '1',
    title: 'The Power of Faith',
    date: new Date('2024-01-15'),
    series: 'Faith Series',
    seriesOrder: 1,
    tags: ['faith', 'power', 'christian living'],
    summary: 'An exploration of how faith transforms our daily lives and relationship with God.',
    references: ['Hebrews 11:1', 'Romans 1:17'],
    type: 'Sunday Service',
    place: 'Main Sanctuary',
    image: '',
    preachingHistory: [
      { id: '1a', date: new Date('2024-01-15'), location: 'Main Sanctuary' },
      { id: '1b', date: new Date('2024-03-10'), location: 'Youth Service' }
    ]
  },
  {
    id: '2',
    title: 'Walking in Love',
    date: new Date('2024-02-01'),
    series: 'Love Series',
    seriesOrder: 1,
    tags: ['love', 'relationships', 'community'],
    summary: 'Understanding the biblical concept of love and how to practice it in our communities.',
    references: ['1 Corinthians 13', 'John 13:34-35'],
    type: 'Bible Study',
    place: 'Fellowship Hall',
    image: '',
    preachingHistory: [
      { id: '2a', date: new Date('2024-02-01'), location: 'Main Sanctuary' }
    ]
  },
  {
    id: '3',
    title: 'Hope in Difficult Times',
    date: new Date('2024-02-15'),
    series: 'Faith Series',
    seriesOrder: 2,
    tags: ['hope', 'perseverance', 'trust'],
    summary: 'Finding hope and strength in God during life\'s challenges.',
    references: ['Romans 8:28', 'Jeremiah 29:11'],
    type: 'Sunday Service',
    place: 'Main Sanctuary',
    image: '',
    preachingHistory: [
      { id: '3a', date: new Date('2024-02-15'), location: 'Main Sanctuary' }
    ]
  }
];

function App() {
  const [sermons, setSermons] = useState<Sermon[]>([]);
  const [series, setSeries] = useState<Series[]>([]);
  const [selectedSermon, setSelectedSermon] = useState<ExpandedSermon | null>(null);
  const [selectedSeries, setSelectedSeries] = useState<Series | null>(null);
  const [filters, setFilters] = useState<FilterOptions>({});
  const [viewSettings, setViewSettings] = useState<ViewSettings>({
    sortBy: 'lastPreached',
    sortOrder: 'desc',
    viewMode: 'list'
  });
  const [currentView, setCurrentView] = useState<ViewType>('sermons');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSermon, setEditingSermon] = useState<Sermon | null>(null);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [imageViewerSrc, setImageViewerSrc] = useState('');
  const [isColumnChooserOpen, setIsColumnChooserOpen] = useState(false);
  const [dataManuallyRestored, setDataManuallyRestored] = useState(false); // Track if data was manually restored
  const [imageRefreshKey, setImageRefreshKey] = useState(0); // Force refresh of images

  // Refs to maintain current state for auto-backup
  const sermonsRef = useRef<Sermon[]>([]);
  const seriesRef = useRef<Series[]>([]);
  
  // Update refs whenever state changes
  useEffect(() => {
    sermonsRef.current = sermons;
  }, [sermons]);
  
  useEffect(() => {
    seriesRef.current = series;
  }, [series]);

  // Automatically clean up orphaned series when sermons change
  useEffect(() => {
    if (sermons.length === 0) return; // Skip cleanup during initial load
    
    const cleanedSeries = cleanupOrphanedSeries(sermons, series);
    if (cleanedSeries.length !== series.length) {
      console.log('🧹 Auto-cleanup triggered: removing orphaned series');
      setSeries(cleanedSeries);
    }
  }, [sermons]); // Trigger cleanup whenever sermons change

  const [columnConfig, setColumnConfig] = useState<ColumnConfig[]>([
    { key: 'date', label: 'Date', visible: true, order: 0 },
    { key: 'title', label: 'Title', visible: true, order: 1 },
    { key: 'series', label: 'Series', visible: true, order: 2 },
    { key: 'references', label: 'Scripture', visible: true, order: 3 },
    { key: 'place', label: 'Place', visible: true, order: 4 },
    { key: 'type', label: 'Type', visible: true, order: 5 },
    { key: 'tags', label: 'Tags', visible: true, order: 6 },
    { key: 'lastModified', label: 'Modified', visible: false, order: 7 },
    { key: 'fileSize', label: 'Size', visible: false, order: 8 },
  ]);
  const [columnSearchTerms, setColumnSearchTerms] = useState<{ [key: string]: string }>({});
  const [sortColumn, setSortColumn] = useState<string>('');
  // @ts-ignore - Used in setIsDarkMode calls
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>(null);

  // Utility function to clean up series that have no linked sermons
  const cleanupOrphanedSeries = (currentSermons: Sermon[], currentSeries: Series[]): Series[] => {
    // Get all series names that are actually used in sermons
    const usedSeriesNames = new Set(
      currentSermons
        .filter(sermon => sermon.series && sermon.series.trim() !== '')
        .map(sermon => sermon.series!)
    );
    
    // Demo series names to remove if not actually used
    const demoSeriesNames = new Set(['Faith Series', 'Love Series']);
    
    // Filter out series that have no linked sermons
    const cleanedSeries = currentSeries.filter(series => {
      // If this is a demo series, only keep it if it's actually used in current sermons
      if (demoSeriesNames.has(series.title)) {
        return usedSeriesNames.has(series.title);
      }
      // For non-demo series, keep ONLY if they have sermons currently linked by name
      return usedSeriesNames.has(series.title);
    });
    
    console.log(`🧹 Series cleanup: ${currentSeries.length} → ${cleanedSeries.length} (removed ${currentSeries.length - cleanedSeries.length} orphaned/demo series)`);
    return cleanedSeries;
  };

  // Data loading and initialization
  useEffect(() => {
    // Set up IPC listeners for menu actions
    if (window.electronAPI) {
      // Try to load existing data on startup
      const loadExistingData = async () => {
        console.log('🚀 Starting data initialization...');
        
        // Skip auto-loading if data was manually restored
        if (dataManuallyRestored) {
          console.log('🔄 Data was manually restored, skipping auto-load');
          return;
        }
        
        try {
          // First priority: Try to load real-time persisted data
          if (window.electronAPI.loadSermonData) {
            console.log('📂 Attempting to load persistent sermon data...');
            const persistentData = await window.electronAPI.loadSermonData();
            if (persistentData && persistentData.sermons && persistentData.sermons.length > 0) {
              console.log('✅ Loading data from persistent storage...');
              const loadedSermons = persistentData.sermons.map((sermon: any) => ({
                ...sermon,
                date: new Date(sermon.date),
                preachingHistory: sermon.preachingHistory ? sermon.preachingHistory.map((ph: any) => ({
                  ...ph,
                  date: new Date(ph.date)
                })) : []
              }));
              setSermons(loadedSermons);
              console.log('📊 Sermons loaded from persistent storage:', loadedSermons.length);

              if (persistentData.series && persistentData.series.length > 0) {
                const loadedSeries = persistentData.series.map((series: any) => ({
                  ...series,
                  startDate: series.startDate ? new Date(series.startDate) : undefined,
                  endDate: series.endDate ? new Date(series.endDate) : undefined
                }));
                setSeries(loadedSeries);
                console.log('📚 Series loaded from persistent storage:', loadedSeries.length);
              } else {
                console.log('📚 No series in persistent data, setting empty series array...');
                setSeries([]);
                console.log('📚 Empty series array set');
              }

              if (persistentData.viewSettings) {
                setViewSettings(persistentData.viewSettings);
              }

              if (persistentData.columnConfig) {
                setColumnConfig(persistentData.columnConfig);
              }

              console.log(`✅ Successfully loaded ${loadedSermons.length} sermons from persistent storage`);
              return; // Successfully loaded persistent data, skip backup loading
            } else {
              console.log('⚠️ No persistent data found, trying backup...');
            }
          }

          // Second priority: Load from backup if no persistent data
          if (!dataManuallyRestored) {
            console.log('📂 Attempting to load auto-backup...');
            if (window.electronAPI.loadLatestBackup) {
              const existingData = await window.electronAPI.loadLatestBackup();
              console.log('🔍 Backup data check:', existingData ? `Found data with ${existingData.sermons?.length || 0} sermons` : 'No data found');
              if (existingData && existingData.sermons && existingData.sermons.length > 0) {
                console.log('✅ Loading existing data from auto-backup...');
                // Load sermons
              const loadedSermons = existingData.sermons.map((sermon: any) => ({
                ...sermon,
                date: new Date(sermon.date),
                preachingHistory: sermon.preachingHistory ? sermon.preachingHistory.map((ph: any) => ({
                  ...ph,
                  date: new Date(ph.date)
                })) : []
              }));
              setSermons(loadedSermons);
              console.log('📊 Sermons loaded into state:', loadedSermons.length);

              // Load series if available, otherwise use sample series
              if (existingData.series && existingData.series.length > 0) {
                const loadedSeries = existingData.series.map((series: any) => ({
                  ...series,
                  startDate: series.startDate ? new Date(series.startDate) : undefined,
                  endDate: series.endDate ? new Date(series.endDate) : undefined
                }));
                setSeries(loadedSeries);
                console.log('📚 Series loaded into state:', loadedSeries.length);
              } else {
                console.log('📚 No series in backup data, setting empty series array...');
                setSeries([]);
                console.log('📚 Empty series array set');
              }

              // Load view settings if available
              if (existingData.viewSettings) {
                setViewSettings(existingData.viewSettings);
              }

              // Load column config if available
              if (existingData.columnConfig) {
                setColumnConfig(existingData.columnConfig);
              }

              console.log(`✅ Successfully loaded ${loadedSermons.length} sermons from existing backup`);
              return; // Successfully loaded data, don't load sample data
              } else {
                console.log('⚠️ No sermons found in backup data');
              }
            } else {
              console.log('⚠️ No backup data returned from loadLatestBackup');
            }
          } else {
            console.log('🔄 Data was manually restored, skipping auto-backup load');
          }
        } catch (error) {
          console.log('❌ Error loading existing data:', error);
        }
        
        // If no backup data was loaded, use sample data as fallback
        console.log('🎯 Loading sample data as fallback...');
        setSermons(sampleSermons);
        setSeries([]); // Start with empty series array instead of sample series
        console.log('📊 Sample data loaded: sermons =', sampleSermons.length, ', series = 0 (empty)');
      };

      // Load existing data
      loadExistingData();

      // Menu event listeners
      window.electronAPI.onMenuImportSermon(() => {
        console.log('Import sermon requested');
        // Handle import sermon
      });

      // Add CSV import/export menu handlers
      if (window.electronAPI.onMenuImportCSV) {
        window.electronAPI.onMenuImportCSV(() => {
          console.log('Menu import CSV requested');
          handleImport();
        });
      }

      if (window.electronAPI.onMenuExportCSV) {
        window.electronAPI.onMenuExportCSV(() => {
          console.log('Menu export CSV requested');
          handleExport();
        });
      }

      window.electronAPI.onMenuNewSeries(() => {
        console.log('New series requested');
        // Handle new series
      });

      // Cleanup listeners on unmount
      return () => {
        if (window.electronAPI) {
          window.electronAPI.removeAllListeners('menu-import-sermon');
          window.electronAPI.removeAllListeners('menu-import-csv');
          window.electronAPI.removeAllListeners('menu-export-csv');
          window.electronAPI.removeAllListeners('menu-new-series');
        }
      };
    }
  }, [dataManuallyRestored]); // Add dependency to re-run when manually restored flag changes

  // Initialize dark mode and set up toggle listener
  useEffect(() => {
    const initializeDarkMode = async () => {
      if (window.electronAPI && window.electronAPI.getDarkMode) {
        try {
          const savedDarkMode = await window.electronAPI.getDarkMode();
          setIsDarkMode(savedDarkMode);
          updateDarkModeClass(savedDarkMode);
        } catch (error) {
          console.error('Failed to load dark mode setting:', error);
        }
      }
    };

    const updateDarkModeClass = (isDark: boolean) => {
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    // Initialize dark mode on startup
    initializeDarkMode();

    // Set up listener for dark mode toggle from menu
    if (window.electronAPI && window.electronAPI.onToggleDarkMode) {
      window.electronAPI.onToggleDarkMode((isDark: boolean) => {
        setIsDarkMode(isDark);
        updateDarkModeClass(isDark);
      });
    }

    // Cleanup
    return () => {
      if (window.electronAPI && window.electronAPI.removeAllListeners) {
        window.electronAPI.removeAllListeners('toggle-dark-mode');
      }
    };
  }, []);

  // Set up event handlers that depend on current state
  useEffect(() => {
    if (window.electronAPI) {
      // Add backup/restore menu handlers with current state
      if (window.electronAPI.onMenuBackup) {
        window.electronAPI.onMenuBackup(() => {
          console.log('Menu backup requested');
          handleBackup();
        });
      }

      if (window.electronAPI.onMenuRestore) {
        window.electronAPI.onMenuRestore(() => {
          console.log('Menu restore requested');
          handleRestore();
        });
      }

      // Handle app closing - auto backup with current state
      if (window.electronAPI.onAppClosing) {
        window.electronAPI.onAppClosing(async () => {
          console.log('=== AUTO BACKUP STARTED ===');
          console.log('App is closing, creating auto-backup...');
          
          try {
            // Get current state values from refs
            const currentSermons = sermonsRef.current;
            const currentSeries = seriesRef.current;
            
            console.log('Current sermons in state:', currentSermons.length);
            console.log('Current series in state:', currentSeries.length);
            console.log('Sample sermon titles for auto-backup:', currentSermons.slice(0, 3).map(s => s.title));
            
            // Collect image data
            console.log('Collecting image data for auto-backup...');
            const imageData = await collectImageData(currentSermons);

            // Prepare backup data
            const backupData = {
              sermons: currentSermons,
              series: currentSeries,
              version: '1.0',
              timestamp: new Date().toISOString(),
              images: imageData
            };

            console.log('=== AUTO BACKUP DATA PREPARED ===');
            console.log('Auto-backup data sermons count:', backupData.sermons.length);
            console.log('Auto-backup data series count:', backupData.series.length);
            console.log('Auto-backup data size (approx):', JSON.stringify(backupData).length, 'characters');

            // Save auto-backup using the default location
            if (window.electronAPI.saveAutoBackup) {
              console.log('Calling saveAutoBackup...');
              const backupResult = await window.electronAPI.saveAutoBackup(backupData);
              console.log('Auto-backup result:', backupResult);
              if (backupResult) {
                console.log('✅ Auto-backup completed successfully');
              } else {
                console.log('⚠️ Auto-backup failed or no backup location set');
              }
            } else {
              console.log('❌ saveAutoBackup method not available');
            }
          } catch (error) {
            console.error('Auto-backup failed:', error);
          } finally {
            // Signal to main process that we're done
            if (window.electronAPI.appClosingDone) {
              window.electronAPI.appClosingDone();
            }
          }
        });
      }

      // Cleanup function
      return () => {
        if (window.electronAPI) {
          window.electronAPI.removeAllListeners('menu-backup');
          window.electronAPI.removeAllListeners('menu-restore');
          window.electronAPI.removeAllListeners('app-closing');
        }
      };
    }
  }, []); // Empty dependency array for stable event handlers

  // Auto-save effect: Save data whenever sermons or series change
  useEffect(() => {
    const saveDataToPersistentStorage = async () => {
      if (window.electronAPI && window.electronAPI.saveSermonData && sermons.length > 0) {
        try {
          const dataToSave = {
            sermons: sermons,
            series: series,
            viewSettings: viewSettings,
            columnConfig: columnConfig,
            filters: filters
          };
          await window.electronAPI.saveSermonData(dataToSave);
          console.log('💾 Auto-saved data to persistent storage');
        } catch (error) {
          console.error('Failed to auto-save data:', error);
        }
      }
    };

    // Debounce auto-save to avoid too frequent saves
    const timeoutId = setTimeout(saveDataToPersistentStorage, 1000);
    return () => clearTimeout(timeoutId);
  }, [sermons, series, viewSettings, columnConfig, filters]);

  // Create expanded sermons based on view mode
  const expandedSermons: ExpandedSermon[] = (() => {
    if (viewSettings.viewMode === 'details') {
      // For table/details view: show all preaching instances chronologically
      return sermons.flatMap(sermon => {
        if (sermon.preachingHistory && sermon.preachingHistory.length > 0) {
          // Create an entry for each preaching instance
          return sermon.preachingHistory.map(instance => ({
            ...sermon,
            id: `${sermon.id}-${instance.id}`, // Unique ID for each instance
            date: instance.date,
            place: instance.location, // Override place with instance location
            originalDate: sermon.date, // Keep original sermon date for reference
            preachingInstance: instance
          } as ExpandedSermon));
        } else {
          // For sermons without preaching history, use the original date
          return [{
            ...sermon,
            place: sermon.place || '', // Ensure place is not undefined
            originalDate: sermon.date,
            preachingInstance: null
          } as ExpandedSermon];
        }
      }).sort((a, b) => a.date.getTime() - b.date.getTime()); // Sort all entries chronologically
    } else {
      // For list and grid views: show each sermon only once, using most recent preached date
      return sermons.map(sermon => {
        if (sermon.preachingHistory && sermon.preachingHistory.length > 0) {
          // Find the most recent (latest) preaching instance
          const latestInstance = sermon.preachingHistory.reduce((latest, instance) => {
            return instance.date > latest.date ? instance : latest;
          }, sermon.preachingHistory[0]);
          
          return {
            ...sermon,
            id: sermon.id, // Keep the original sermon ID
            date: latestInstance.date, // Use the most recent preaching date
            place: latestInstance.location, // Use the most recent preaching location
            originalDate: sermon.date, // Keep original sermon date for reference
            preachingInstance: latestInstance
          } as ExpandedSermon;
        } else {
          // For sermons without preaching history, use the original date
          return {
            ...sermon,
            place: sermon.place || '', // Ensure place is not undefined
            originalDate: sermon.date,
            preachingInstance: null
          } as ExpandedSermon;
        }
      });
    }
  })();

  const filteredSermons = expandedSermons.filter(sermon => {
    // Apply search term filter with field-specific search
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      const searchField = filters.searchField || 'all';
      
      let matchesSearch = false;
      
      switch (searchField) {
        case 'all':
          matchesSearch = 
            sermon.title.toLowerCase().includes(searchLower) ||
            ((sermon.summary?.toLowerCase().includes(searchLower)) ?? false) ||
            ((sermon.series?.toLowerCase().includes(searchLower)) ?? false) ||
            ((sermon.references?.some(ref => ref.toLowerCase().includes(searchLower))) ?? false);
          break;
        case 'title':
          matchesSearch = sermon.title.toLowerCase().includes(searchLower);
          break;
        case 'series':
          matchesSearch = (sermon.series?.toLowerCase().includes(searchLower)) ?? false;
          break;
        case 'references':
          matchesSearch = (sermon.references?.some(ref => ref.toLowerCase().includes(searchLower))) ?? false;
          break;
        default:
          matchesSearch = 
            sermon.title.toLowerCase().includes(searchLower) ||
            ((sermon.summary?.toLowerCase().includes(searchLower)) ?? false);
      }
      
      if (!matchesSearch) {
        return false;
      }
    }
    
    if (filters.series && sermon.series !== filters.series) {
      return false;
    }

    if (filters.type && sermon.type !== filters.type) {
      return false;
    }

    if (filters.place && sermon.place !== filters.place) {
      return false;
    }
    
    if (filters.tags && filters.tags.length > 0) {
      const hasMatchingTag = filters.tags.some(tag => sermon.tags.includes(tag));
      if (!hasMatchingTag) {
        return false;
      }
    }

    // Apply column search filters
    for (const [columnKey, searchTerm] of Object.entries(columnSearchTerms)) {
      if (searchTerm && searchTerm.trim() !== '') {
        try {
          const sermonValue = getSermonValueForFilter(sermon, columnKey);
          if (sermonValue && !sermonValue.toLowerCase().includes(searchTerm.toLowerCase())) {
            return false;
          }
        } catch (error) {
          console.error(`Error filtering column ${columnKey}:`, error);
          // Continue with other filters if one fails
        }
      }
    }
    
    return true;
  });

  const getSermonValueForFilter = (sermon: ExpandedSermon, columnKey: string): string => {
    try {
      switch (columnKey) {
        case 'date':
          return sermon.date ? sermon.date.toISOString().split('T')[0] : ''; // Format as YYYY-MM-DD
        case 'firstPreached':
          // Find the first (oldest) preaching date
          if (sermon.preachingHistory && sermon.preachingHistory.length > 0) {
            const firstDate = sermon.preachingHistory.reduce((earliest, instance) => 
              instance.date < earliest.date ? instance : earliest
            ).date;
            return firstDate.toISOString().split('T')[0];
          }
          return sermon.date ? sermon.date.toISOString().split('T')[0] : '';
        case 'lastPreached':
          // Find the most recent preaching date
          if (sermon.preachingHistory && sermon.preachingHistory.length > 0) {
            const lastDate = sermon.preachingHistory.reduce((latest, instance) => 
              instance.date > latest.date ? instance : latest
            ).date;
            return lastDate.toISOString().split('T')[0];
          }
          return sermon.date ? sermon.date.toISOString().split('T')[0] : '';
        case 'preachingHistory':
          return sermon.preachingHistory ? `${sermon.preachingHistory.length}x` : '1x';
        case 'series':
          return sermon.series || '-';
        case 'references':
          return sermon.references ? sermon.references.join(', ') : '-';
        case 'place':
          return sermon.place || '-';
        case 'tags':
          return sermon.tags && Array.isArray(sermon.tags) 
            ? sermon.tags.slice(0, 2).join(', ') + (sermon.tags.length > 2 ? ` +${sermon.tags.length - 2}` : '')
            : '-';
        case 'lastModified':
          return sermon.lastModified ? sermon.lastModified.toISOString().split('T')[0] : '';
        case 'fileSize':
          return sermon.fileSize ? `${Math.round(sermon.fileSize / 1024)} KB` : '';
        default:
          const value = sermon[columnKey as keyof ExpandedSermon];
          return String(value || '');
      }
    } catch (error) {
      console.error(`Error getting value for column ${columnKey}:`, error);
      return '';
    }
  };

  // Helper function to convert Sermon to ExpandedSermon for compatibility
  const sermonToExpanded = (sermon: Sermon): ExpandedSermon => ({
    ...sermon,
    place: sermon.place || '',
    originalDate: sermon.date,
    preachingInstance: null
  });

  const handleAddSermon = () => {
    setEditingSermon(null);
    setIsModalOpen(true);
  };

  const handleEditSermon = () => {
    if (selectedSermon) {
      // Check if this is a composite ID (details view) or simple ID (list/grid view)
      const baseSermonId = selectedSermon.id.includes('-') 
        ? selectedSermon.id.split('-')[0] 
        : selectedSermon.id;
      
      // Find the actual sermon from the sermons array to ensure we have the latest data
      const actualSermon = sermons.find(s => s.id === baseSermonId);
      
      if (actualSermon) {
        setEditingSermon(sermonToExpanded(actualSermon));
      } else {
        // Fallback to the selected sermon if we can't find the base sermon
        setEditingSermon(selectedSermon);
      }
      setIsModalOpen(true);
    }
  };

  const handleSermonDoubleClick = (sermon: ExpandedSermon) => {
    // Check if this is a composite ID (details view) or simple ID (list/grid view)
    const baseSermonId = sermon.id.includes('-') 
      ? sermon.id.split('-')[0] 
      : sermon.id;
    
    // Find the actual sermon from the sermons array to ensure we have the latest data
    const actualSermon = sermons.find(s => s.id === baseSermonId);
    
    if (actualSermon) {
      setEditingSermon(sermonToExpanded(actualSermon));
    } else {
      // Fallback to the expanded sermon if we can't find the base sermon
      setEditingSermon(sermon);
    }
    setIsModalOpen(true);
  };

  const handleSaveSermon = (sermon: Sermon) => {
    let updatedSermons: Sermon[];
    
    if (editingSermon) {
      // Update existing sermon
      updatedSermons = sermons.map(s => s.id === sermon.id ? sermon : s);
      setSermons(updatedSermons);
    } else {
      // Add new sermon
      updatedSermons = [...sermons, sermon];
      setSermons(updatedSermons);
    }
    
    // Automatically create series if sermon has a series name and the series doesn't exist
    if (sermon.series && sermon.series.trim() !== '') {
      setSeries(prevSeries => {
        const seriesExists = prevSeries.some(s => s.title === sermon.series);
        
        if (!seriesExists) {
          // Create a new series
          const newSeries: Series = {
            id: `series-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            title: sermon.series!,
            description: `Auto-created series for "${sermon.series}"`,
            startDate: sermon.date, // Use sermon date as series start date
            endDate: undefined, // Will be updated when more sermons are added
            sermons: [sermon.id], // Add this sermon to the series
            tags: []
          };
          console.log(`📚 Auto-created new series: "${sermon.series}"`);
          const updatedSeries = [...prevSeries, newSeries];
          
          // Clean up orphaned series after adding new series
          return cleanupOrphanedSeries(updatedSermons, updatedSeries);
        } else {
          // Update existing series to include this sermon if it's not already there
          const updatedSeries = prevSeries.map(s => {
            if (s.title === sermon.series && !s.sermons.includes(sermon.id)) {
              return {
                ...s,
                sermons: [...s.sermons, sermon.id]
              };
            }
            return s;
          });
          
          // Clean up orphaned series after updating
          return cleanupOrphanedSeries(updatedSermons, updatedSeries);
        }
      });
    } else {
      // No series assigned, clean up any orphaned series
      setSeries(prevSeries => {
        return cleanupOrphanedSeries(updatedSermons, prevSeries);
      });
    }
    
    setSelectedSermon(sermonToExpanded(sermon));
  };

  const handleSermonSelect = (expandedSermon: ExpandedSermon) => {
    // Always select based on the fresh expanded sermon from the current data
    setSelectedSermon(expandedSermon);
  };

  // Helper function to convert ExpandedSermon back to full Sermon for preview
  const getFullSermonForPreview = (expandedSermon: ExpandedSermon | null): Sermon | null => {
    if (!expandedSermon) return null;
    
    // Check if this is a composite ID (details view) or simple ID (list/grid view)
    const baseSermonId = expandedSermon.id.includes('-') 
      ? expandedSermon.id.split('-')[0] 
      : expandedSermon.id;
    
    // Find the full sermon from the sermons array
    const fullSermon = sermons.find(s => s.id === baseSermonId);
    return fullSermon || null;
  };

  const handleDeleteSermon = (sermonId: string) => {
    setSermons(prevSermons => {
      const updatedSermons = prevSermons.filter(s => s.id !== sermonId);
      
      // Clean up series after sermon deletion
      setSeries(prevSeries => {
        const cleanedSeries = cleanupOrphanedSeries(updatedSermons, prevSeries);
        return cleanedSeries;
      });
      
      return updatedSermons;
    });
    
    setIsModalOpen(false);
    setEditingSermon(null);
    // Clear selection if the deleted sermon was selected
    if (selectedSermon?.id === sermonId) {
      setSelectedSermon(null);
    }
  };

  // Helper function to collect all image data for backup
  const collectImageData = async (sermonsToBackup: Sermon[]) => {
    console.log('=== COLLECTING IMAGE DATA ===');
    console.log('collectImageData called with', sermonsToBackup.length, 'sermons');
    const imageData: { [key: string]: any } = {};
    
    // First, log all sermons with images
    const sermonsWithImages = sermonsToBackup.filter(s => s.image);
    console.log('Sermons with images:', sermonsWithImages.length);
    sermonsWithImages.forEach(s => {
      console.log(`  - ${s.title}: ${s.image}`);
    });
    
    for (const sermon of sermonsToBackup) {
      console.log('Checking sermon:', sermon.title, 'image path:', sermon.image);
      if (sermon.image && window.electronAPI && window.electronAPI.readImageAsBase64) {
        console.log('Attempting to read image:', sermon.image);
        try {
          const imageInfo = await window.electronAPI.readImageAsBase64(sermon.image);
          if (imageInfo) {
            console.log('Successfully read image:', sermon.image, 'size:', imageInfo.base64?.length || 0);
            imageData[sermon.image] = imageInfo;
          } else {
            console.log('No image data returned for:', sermon.image);
          }
        } catch (error) {
          console.warn(`Failed to read image for sermon ${sermon.title}:`, error);
        }
      } else {
        if (!sermon.image) {
          console.log('Skipping sermon - no image path');
        } else if (!window.electronAPI) {
          console.log('Skipping sermon - no electronAPI');
        } else if (!window.electronAPI.readImageAsBase64) {
          console.log('Skipping sermon - no readImageAsBase64 function');
        }
      }
    }
    
    console.log('=== IMAGE COLLECTION COMPLETE ===');
    console.log('Collected image data for', Object.keys(imageData).length, 'images');
    console.log('Image paths collected:', Object.keys(imageData));
    return imageData;
  };

  const handleImageClick = (imageSrc: string) => {
    setImageViewerSrc(imageSrc);
    setImageViewerOpen(true);
  };

  const handleSeriesImageChange = (seriesId: string, imagePath: string | null) => {
    setSeries(prevSeries => 
      prevSeries.map(series => 
        series.id === seriesId 
          ? { ...series, image: imagePath || undefined }
          : series
      )
    );
    setImageRefreshKey(prev => prev + 1); // Force refresh of all images
  };

  const handleSeriesSelect = (seriesTitle: string | undefined) => {
    setFilters({ ...filters, series: seriesTitle });
    setSelectedSeries(null);
  };

  const handleSeriesClick = (series: Series) => {
    setSelectedSeries(series);
    setSelectedSermon(null);
  };

  const getSeriesSermons = (series: Series) => {
    return sermons.filter(sermon => sermon.series === series.title);
  };


  // Sort the filtered sermons
  const sortedSermons = [...filteredSermons].sort((a, b) => {
    // Apply column-based sorting if active (from table headers)
    if (sortColumn && sortDirection) {
      let comparison = 0;
      const aValue = getSermonValueForFilter(a, sortColumn);
      const bValue = getSermonValueForFilter(b, sortColumn);
      
      if (sortColumn === 'date' || sortColumn === 'lastModified' || sortColumn === 'firstPreached' || sortColumn === 'lastPreached') {
        // Date comparison
        let aDate: Date, bDate: Date;
        
        if (sortColumn === 'date') {
          aDate = a.date;
          bDate = b.date;
        } else if (sortColumn === 'lastModified') {
          aDate = a.lastModified || new Date(0);
          bDate = b.lastModified || new Date(0);
        } else if (sortColumn === 'firstPreached') {
          aDate = a.preachingHistory && a.preachingHistory.length > 0
            ? a.preachingHistory.reduce((earliest, instance) => 
                instance.date < earliest.date ? instance : earliest
              ).date
            : a.date;
          bDate = b.preachingHistory && b.preachingHistory.length > 0
            ? b.preachingHistory.reduce((earliest, instance) => 
                instance.date < earliest.date ? instance : earliest
              ).date
            : b.date;
        } else { // lastPreached
          aDate = a.preachingHistory && a.preachingHistory.length > 0
            ? a.preachingHistory.reduce((latest, instance) => 
                instance.date > latest.date ? instance : latest
              ).date
            : a.date;
          bDate = b.preachingHistory && b.preachingHistory.length > 0
            ? b.preachingHistory.reduce((latest, instance) => 
                instance.date > latest.date ? instance : latest
              ).date
            : b.date;
        }
        
        comparison = aDate.getTime() - bDate.getTime();
      } else if (sortColumn === 'fileSize') {
        // Numeric comparison for file size
        const aSize = a.fileSize || 0;
        const bSize = b.fileSize || 0;
        comparison = aSize - bSize;
      } else if (sortColumn === 'preachingHistory') {
        // Numeric comparison for preaching count
        const aCount = a.preachingHistory ? a.preachingHistory.length : 1;
        const bCount = b.preachingHistory ? b.preachingHistory.length : 1;
        comparison = aCount - bCount;
      } else {
        // String comparison
        comparison = aValue.localeCompare(bValue);
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    }

    // Apply view settings sorting (from toolbar dropdown)
    let comparison = 0;
    
    switch (viewSettings.sortBy) {
      case 'title':
        comparison = a.title.localeCompare(b.title);
        break;
      case 'series':
        const aSeries = a.series || '';
        const bSeries = b.series || '';
        comparison = aSeries.localeCompare(bSeries);
        break;
      case 'date':
        comparison = a.date.getTime() - b.date.getTime();
        break;
      case 'firstPreached':
        // Find the first (oldest) preaching date for each sermon
        const aFirstDate = a.preachingHistory && a.preachingHistory.length > 0
          ? a.preachingHistory.reduce((earliest, instance) => 
              instance.date < earliest.date ? instance : earliest
            ).date
          : a.date;
        const bFirstDate = b.preachingHistory && b.preachingHistory.length > 0
          ? b.preachingHistory.reduce((earliest, instance) => 
              instance.date < earliest.date ? instance : earliest
            ).date
          : b.date;
        comparison = aFirstDate.getTime() - bFirstDate.getTime();
        break;
      case 'lastPreached':
        // Find the most recent preaching date for each sermon
        const aLastDate = a.preachingHistory && a.preachingHistory.length > 0
          ? a.preachingHistory.reduce((latest, instance) => 
              instance.date > latest.date ? instance : latest
            ).date
          : a.date;
        const bLastDate = b.preachingHistory && b.preachingHistory.length > 0
          ? b.preachingHistory.reduce((latest, instance) => 
              instance.date > latest.date ? instance : latest
            ).date
          : b.date;
        comparison = aLastDate.getTime() - bLastDate.getTime();
        break;
      default:
        // Default: Sort by date chronologically (newest first)
        comparison = b.date.getTime() - a.date.getTime();
    }
    
    return viewSettings.sortOrder === 'asc' ? comparison : -comparison;
  });

  // CSV utility functions
  const parseCSV = (csvContent: string): Sermon[] => {
    const lines = csvContent.trim().split('\n');
    if (lines.length < 2) {
      console.warn('CSV file must have at least a header row and one data row');
      return [];
    }

    const sermons: Sermon[] = [];

    // Proper CSV parsing function that respects quoted fields
    const parseCSVLine = (line: string): string[] => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      let i = 0;

      while (i < line.length) {
        const char = line[i];
        const nextChar = line[i + 1];

        if (char === '"') {
          if (inQuotes && nextChar === '"') {
            // Escaped quote inside quoted field
            current += '"';
            i += 2;
          } else {
            // Start or end of quoted field
            inQuotes = !inQuotes;
            i++;
          }
        } else if (char === ',' && !inQuotes) {
          // Field delimiter outside quotes
          result.push(current.trim());
          current = '';
          i++;
        } else {
          // Regular character
          current += char;
          i++;
        }
      }

      // Add the last field
      result.push(current.trim());
      return result;
    };

    // Parse header row to get column mapping
    const headers = parseCSVLine(lines[0]).map(h => h.replace(/"/g, '').toLowerCase());
    console.log('CSV Headers found:', headers);

    // Create mapping object for flexible column matching
    const getColumnIndex = (possibleNames: string[]): number => {
      for (const name of possibleNames) {
        const index = headers.findIndex(h => h.includes(name.toLowerCase()));
        if (index !== -1) return index;
      }
      return -1;
    };

    // Map column indices
    const columnMap = {
      title: getColumnIndex(['title', 'sermon', 'name', 'subject']),
      date: getColumnIndex(['date', 'preached', 'when', 'time']),
      series: getColumnIndex(['series', 'collection', 'group']),
      summary: getColumnIndex(['summary', 'description', 'notes', 'content']),
      tags: getColumnIndex(['tags', 'keywords', 'categories']),
      references: getColumnIndex(['references', 'scripture', 'verses', 'bible']),
      type: getColumnIndex(['type', 'category', 'kind']),
      place: getColumnIndex(['place', 'location', 'venue', 'church'])
    };

    console.log('Column mapping:', columnMap);

    // Helper function to safely parse dates (prioritizes DD-MM-YYYY format)
    const parseDate = (dateString: string): Date => {
      if (!dateString || dateString.trim() === '') {
        console.warn('Empty date string found, using current date');
        return new Date();
      }
      
      const trimmed = dateString.trim();
      console.log(`Attempting to parse date: "${trimmed}"`);
      
      // Try DD-MM-YYYY format first (PRIMARY FORMAT)
      const ddmmyyyyMatch = trimmed.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
      if (ddmmyyyyMatch) {
        const [, dayStr, monthStr, yearStr] = ddmmyyyyMatch;
        const day = parseInt(dayStr, 10);
        const month = parseInt(monthStr, 10);
        const year = parseInt(yearStr, 10);
        
        // Validate date components
        if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 1900 && year <= 2100) {
          const parsedDate = new Date(year, month - 1, day);
          // Additional validation to ensure the date is actually valid (e.g., not Feb 30)
          if (parsedDate.getDate() === day && parsedDate.getMonth() === month - 1 && parsedDate.getFullYear() === year) {
            console.log(`✅ Successfully parsed "${trimmed}" as DD-MM-YYYY: ${parsedDate.toDateString()}`);
            return parsedDate;
          } else {
            console.warn(`❌ Invalid date components in DD-MM-YYYY: ${trimmed} (day=${day}, month=${month}, year=${year})`);
          }
        } else {
          console.warn(`❌ Out of range date components: day=${day}, month=${month}, year=${year}`);
        }
      }
      
      // Try DD/MM/YYYY format (with slashes)
      const ddmmSlashMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
      if (ddmmSlashMatch) {
        const [, dayStr, monthStr, yearStr] = ddmmSlashMatch;
        const day = parseInt(dayStr, 10);
        const month = parseInt(monthStr, 10);
        const year = parseInt(yearStr, 10);
        
        if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 1900 && year <= 2100) {
          const parsedDate = new Date(year, month - 1, day);
          if (parsedDate.getDate() === day && parsedDate.getMonth() === month - 1 && parsedDate.getFullYear() === year) {
            console.log(`✅ Successfully parsed "${trimmed}" as DD/MM/YYYY: ${parsedDate.toDateString()}`);
            return parsedDate;
          }
        }
      }
      
      // Try YYYY-MM-DD format (ISO format) - only as fallback
      const isoMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
      if (isoMatch) {
        const [, yearStr, monthStr, dayStr] = isoMatch;
        const year = parseInt(yearStr, 10);
        const month = parseInt(monthStr, 10);
        const day = parseInt(dayStr, 10);
        
        if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 1900 && year <= 2100) {
          const parsedDate = new Date(year, month - 1, day);
          if (parsedDate.getDate() === day && parsedDate.getMonth() === month - 1 && parsedDate.getFullYear() === year) {
            console.log(`✅ Successfully parsed "${trimmed}" as YYYY-MM-DD: ${parsedDate.toDateString()}`);
            return parsedDate;
          }
        }
      }
      
      console.error(`❌ FAILED to parse date: "${trimmed}"`);
      console.error(`❌ Expected format: DD-MM-YYYY (e.g., 25-12-2024, 05-01-2025)`);
      console.error(`❌ Also accepts: DD/MM/YYYY or YYYY-MM-DD as fallback`);
      console.error(`❌ Using current date instead for: "${trimmed}"`);
      return new Date();
    };

    // Helper function to safely get value from column
    const getValue = (values: string[], columnIndex: number, defaultValue: string = ''): string => {
      if (columnIndex === -1 || columnIndex >= values.length) return defaultValue;
      return values[columnIndex] || defaultValue;
    };

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]).map(v => v.replace(/"/g, ''));
      
      // Skip empty rows
      if (values.every(v => v === '')) continue;

      const dateValue = getValue(values, columnMap.date);
      const sermonDate = parseDate(dateValue);
      const locationValue = getValue(values, columnMap.place, 'Unknown Location');
      
      // Debug logging for problematic fields
      const referencesValue = getValue(values, columnMap.references);
      const typeValue = getValue(values, columnMap.type);
      console.log(`Row ${i}: References raw="${referencesValue}", Type raw="${typeValue}"`);
      console.log(`Row ${i}: References column index=${columnMap.references}, Type column index=${columnMap.type}`);
      console.log(`Row ${i}: Full parsed values:`, values);

      const title = getValue(values, columnMap.title, 'Untitled');
      
      // Check if a sermon with this title already exists
      const existingSermon = sermons.find(s => s.title.toLowerCase() === title.toLowerCase());
      
      if (existingSermon) {
        // Add this preaching instance to existing sermon
        const newPreachingInstance = {
          id: Date.now().toString() + Math.random(),
          date: sermonDate,
          location: locationValue
        };
        
        // Ensure preachingHistory exists
        if (!existingSermon.preachingHistory) {
          existingSermon.preachingHistory = [];
        }
        existingSermon.preachingHistory.push(newPreachingInstance);
        
        // Update the sermon's main date to be the earliest preached date
        const earliestDate = existingSermon.preachingHistory.reduce((earliest, instance) => 
          instance.date < earliest.date ? instance : earliest
        ).date;
        existingSermon.date = earliestDate;
        
        console.log(`✅ Merged preaching instance for "${title}" on ${sermonDate.toDateString()} at ${locationValue}`);
        console.log(`📊 Sermon "${title}" now has ${existingSermon.preachingHistory.length} preaching instances`);
      } else {
        // Create new sermon
        const sermon: Sermon = {
          id: Date.now().toString() + Math.random(),
          title: title,
          date: sermonDate,
          series: getValue(values, columnMap.series) || undefined,
          summary: getValue(values, columnMap.summary),
          tags: getValue(values, columnMap.tags) ? getValue(values, columnMap.tags).split(';').filter(t => t.length > 0) : [],
          references: referencesValue ? referencesValue.split(';').filter(r => r.length > 0) : [],
          type: typeValue,
          place: locationValue,
          preachingHistory: [{
            id: Date.now().toString(),
            date: sermonDate,
            location: locationValue
          }]
        };
        
        sermons.push(sermon);
        console.log(`🆕 Created new sermon: "${title}" preached on ${sermonDate.toDateString()} at ${locationValue}`);
      }
    }
    
    // Final summary of import results
    const totalPreachingInstances = sermons.reduce((total, sermon) => total + (sermon.preachingHistory?.length || 0), 0);
    console.log(`📈 Import Summary: ${sermons.length} unique sermons, ${totalPreachingInstances} total preaching instances`);
    
    return sermons;
  };

  const sermonsToCsv = (sermons: Sermon[]): string => {
    const headers = ['Title', 'Date', 'Series', 'Summary', 'Tags', 'References', 'Type', 'Place'];
    const rows = [headers.join(',')];

    sermons.forEach(sermon => {
      const row = [
        `"${sermon.title}"`,
        `"${sermon.date.toISOString().split('T')[0]}"`,
        `"${sermon.series || ''}"`,
        `"${sermon.summary || ''}"`,
        `"${sermon.tags.join(';')}"`,
        `"${sermon.references?.join(';') || ''}"`,
        `"${sermon.type || ''}"`,
        `"${sermon.place || ''}"`
      ];
      rows.push(row.join(','));
    });

    return rows.join('\n');
  };

  // Settings handlers
  const handleImport = async () => {
    console.log('CSV Import requested');
    
    // Show CSV format guide
    const csvGuide = `CSV Import Guide:

Required Column Headers (case-insensitive):
• Title - Sermon title
• Date - Date in DD-MM-YYYY format (e.g., 25-12-2024)
• Summary - Sermon description

Optional Column Headers:
• Series - Series name
• Tags - Semicolon-separated (e.g., "faith;hope;love")
• References - Scripture references, semicolon-separated (e.g., "John 3:16;Romans 8:28")
• Type - Sermon category
• Place - Location where preached

Example CSV structure:
Title,Date,Summary,Series,Tags,References,Type,Place
"The Power of Faith","15-01-2024","A sermon about faith","Faith Series","faith;power","Hebrews 11:1","Sunday Service","Main Church"

IMPORTANT: Date format must be DD-MM-YYYY (day-month-year)

Continue with import?`;

    const shouldContinue = confirm(csvGuide);
    if (!shouldContinue) return;

    if (window.electronAPI) {
      try {
        const filePath = await window.electronAPI.selectFile();
        if (filePath && filePath.endsWith('.csv')) {
          // Read CSV file content
          const csvContent = await window.electronAPI.readFile(filePath);
          const importedSermons = parseCSV(csvContent);
          setSermons(prevSermons => [...prevSermons, ...importedSermons]);
          console.log(`Imported ${importedSermons.length} sermons from CSV`);
          alert(`Successfully imported ${importedSermons.length} sermons!`);
        }
      } catch (error) {
        console.error('Error importing CSV:', error);
        alert('Error importing CSV: ' + error);
      }
    } else {
      alert('CSV Import: This feature requires the desktop application (Electron).');
    }
  };

  const handleExport = async () => {
    console.log('CSV Export requested');
    alert('CSV Export: This will save your sermons to a CSV file. (Electron required for full functionality)');
    if (window.electronAPI) {
      try {
        const csvContent = sermonsToCsv(sermons);
        const filePath = await window.electronAPI.saveFile('sermons.csv', csvContent);
        if (filePath) {
          console.log(`Exported ${sermons.length} sermons to ${filePath}`);
          alert(`Successfully exported ${sermons.length} sermons to ${filePath}!`);
        }
      } catch (error) {
        console.error('Error exporting CSV:', error);
        alert('Error exporting CSV: ' + error);
      }
    }
  };

  const handleBackup = async () => {
    console.log('=== MANUAL BACKUP STARTED ===');
    console.log('Backup requested');
    console.log('window.electronAPI:', window.electronAPI);
    console.log('selectBackupLocation method:', window.electronAPI?.selectBackupLocation);
    
    // First, let's check what data we actually have
    console.log('=== CURRENT STATE CHECK ===');
    console.log('Sermons state length:', sermons.length);
    console.log('Series state length:', series.length);
    console.log('First few sermon IDs:', sermons.slice(0, 5).map(s => s.id));
    console.log('Are sermons demo data?', sermons.some(s => s.title.includes('Sample')));
    
    if (window.electronAPI && typeof window.electronAPI.selectBackupLocation === 'function') {
      try {
        // Select backup location
        const backupPath = await window.electronAPI.selectBackupLocation();
        if (!backupPath) {
          console.log('Backup cancelled by user');
          return;
        }

        // Use refs to ensure we have the most current data
        const currentSermons = sermonsRef.current.length > 0 ? sermonsRef.current : sermons;
        const currentSeries = seriesRef.current.length > 0 ? seriesRef.current : series;

        // Collect image data
        console.log('Collecting image data for backup...');
        const imageData = await collectImageData(currentSermons);

        // Debug: Log current data state
        console.log('=== MANUAL BACKUP DATA DEBUG ===');
        console.log('Current sermons count (state):', sermons.length);
        console.log('Current sermons count (ref):', sermonsRef.current.length);
        console.log('Current series count (state):', series.length);
        console.log('Current series count (ref):', seriesRef.current.length);
        console.log('Using sermons count:', currentSermons.length);
        console.log('Using series count:', currentSeries.length);
        console.log('First sermon title:', currentSermons[0]?.title || 'No sermons');
        console.log('Sample sermon titles:', currentSermons.slice(0, 5).map(s => s.title));
        console.log('Sermon data sample:', currentSermons.slice(0, 2).map(s => ({ 
          id: s.id, 
          title: s.title, 
          type: s.type, 
          date: s.date,
          hasImage: !!s.image 
        })));

        // Prepare backup data using the most current data
        const backupData = {
          version: '1.0',
          timestamp: new Date().toISOString(),
          sermons: currentSermons,
          series: currentSeries,
          viewSettings: viewSettings,
          columnConfig: columnConfig,
          filters: filters,
          images: imageData
        };

        console.log('=== BACKUP DATA PREPARED ===');
        console.log('Backup data sermons count:', backupData.sermons.length);
        console.log('Backup data series count:', backupData.series.length);
        console.log('Backup data size (approx):', JSON.stringify(backupData).length, 'characters');

        // Save backup
        const savedPath = await window.electronAPI.saveBackup(backupPath, backupData);
        // Note: Don't reset dataManuallyRestored flag here as it causes data reload
        alert(`Backup successfully saved to: ${savedPath}`);
        console.log(`Backup saved to: ${savedPath}`);
        console.log('=== MANUAL BACKUP COMPLETED ===');
      } catch (error) {
        console.error('Backup failed:', error);
        alert('Failed to create backup. Please try again.');
      }
    } else {
      console.error('electronAPI.selectBackupLocation is not available');
      // Fallback: Create backup as JSON download
      try {
        const backupData = {
          version: '1.0',
          timestamp: new Date().toISOString(),
          sermons: sermons,
          series: series,
          viewSettings: viewSettings,
          columnConfig: columnConfig,
          filters: filters
        };

        const dataStr = JSON.stringify(backupData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `SermonLibrary_Backup_${new Date().toISOString().slice(0, 10)}.slb`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        alert('Backup downloaded as file to your Downloads folder.');
      } catch (error) {
        console.error('Fallback backup failed:', error);
        alert('Backup functionality is not available in this environment.');
      }
    }
  };

  const handleRestore = async () => {
    console.log('Restore requested');
    console.log('window.electronAPI:', window.electronAPI);
    console.log('loadBackup method:', window.electronAPI?.loadBackup);
    
    if (window.electronAPI && typeof window.electronAPI.loadBackup === 'function') {
      try {
        // Load backup file
        const backupData = await window.electronAPI.loadBackup();
        if (!backupData) {
          console.log('Restore cancelled by user');
          return;
        }

        // Confirm restore action
        const confirmed = confirm(
          `This will replace all current sermon data with the backup data from ${
            backupData.timestamp ? new Date(backupData.timestamp).toLocaleString() : 'unknown date'
          }. This action cannot be undone. Are you sure?`
        );

        if (!confirmed) {
          console.log('Restore cancelled by user');
          return;
        }

        // Set flag first to prevent auto-loading of other data
        setDataManuallyRestored(true);
        console.log('📝 Set data manually restored flag');

        // Restore data
        if (backupData.sermons) {
          // Convert date strings back to Date objects
          const restoredSermons = backupData.sermons.map((sermon: any) => ({
            ...sermon,
            date: new Date(sermon.date),
            preachingHistory: sermon.preachingHistory?.map((instance: any) => ({
              ...instance,
              date: new Date(instance.date)
            })) || [],
            versions: sermon.versions?.map((version: any) => ({
              ...version,
              date: new Date(version.date)
            })) || [],
            lastModified: sermon.lastModified ? new Date(sermon.lastModified) : undefined
          }));
          
          setSermons(restoredSermons);
          console.log('📊 Restored sermons:', restoredSermons.length);
        }

        // Restore images if they exist in backup
        if (backupData.images && window.electronAPI.restoreImageFromBackup) {
          console.log('Restoring images from backup...');
          const imagePathMappings: { [oldPath: string]: string } = {};
          
          for (const [originalPath, imageInfo] of Object.entries(backupData.images)) {
            try {
              // Generate new path in the app's images directory
              const fileName = originalPath.split(/[/\\]/).pop() || 'restored_image.jpg';
              const newImagePath = await window.electronAPI.restoreImageFromBackup(imageInfo, fileName);
              if (newImagePath) {
                imagePathMappings[originalPath] = newImagePath;
                console.log(`Image restored: ${originalPath} -> ${newImagePath}`);
              }
            } catch (error) {
              console.warn(`Failed to restore image ${originalPath}:`, error);
            }
          }
          
          // Update sermon image paths to point to restored locations
          if (Object.keys(imagePathMappings).length > 0) {
            setSermons(currentSermons => 
              currentSermons.map(sermon => ({
                ...sermon,
                image: sermon.image && imagePathMappings[sermon.image] 
                  ? imagePathMappings[sermon.image] 
                  : sermon.image
              }))
            );
            console.log('📸 Updated sermon image paths after restore');
          }
        }

        if (backupData.series) {
          // Convert date strings back to Date objects for series
          let restoredSeries = backupData.series.map((series: any) => ({
            ...series,
            startDate: series.startDate ? new Date(series.startDate) : undefined,
            endDate: series.endDate ? new Date(series.endDate) : undefined
          }));
          
          // Clean up any orphaned or demo series immediately
          if (backupData.sermons) {
            restoredSeries = cleanupOrphanedSeries(
              backupData.sermons.map((sermon: any) => ({
                ...sermon,
                date: new Date(sermon.date)
              })), 
              restoredSeries
            );
          }
          
          setSeries(restoredSeries);
          console.log('📚 Restored and cleaned series:', restoredSeries.length);
        } else {
          // No series in backup, set empty array
          setSeries([]);
          console.log('📚 No series in backup data, set empty series array');
        }

        if (backupData.viewSettings) {
          setViewSettings(backupData.viewSettings);
        }

        if (backupData.columnConfig) {
          setColumnConfig(backupData.columnConfig);
        }

        alert('Backup successfully restored!');
        console.log('Backup restored successfully');
        
      } catch (error) {
        console.error('Restore failed:', error);
        alert('Failed to restore backup. Please check the file and try again.');
      }
    } else {
      console.error('electronAPI.loadBackup is not available');
      // Fallback: Use file input for browser environment
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.slb,.json';
      
      input.onchange = (event) => {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const content = e.target?.result as string;
            const backupData = JSON.parse(content);

            // Confirm restore action
            const confirmed = confirm(
              `This will replace all current sermon data with the backup data from ${
                backupData.timestamp ? new Date(backupData.timestamp).toLocaleString() : 'unknown date'
              }. This action cannot be undone. Are you sure?`
            );

            if (!confirmed) {
              console.log('Restore cancelled by user');
              return;
            }

            // Restore data
            if (backupData.sermons) {
              // Convert date strings back to Date objects
              const restoredSermons = backupData.sermons.map((sermon: any) => ({
                ...sermon,
                date: new Date(sermon.date),
                preachingHistory: sermon.preachingHistory?.map((instance: any) => ({
                  ...instance,
                  date: new Date(instance.date)
                })) || [],
                versions: sermon.versions?.map((version: any) => ({
                  ...version,
                  date: new Date(version.date)
                })) || [],
                lastModified: sermon.lastModified ? new Date(sermon.lastModified) : undefined
              }));
              
              setSermons(restoredSermons);
              setDataManuallyRestored(true); // Mark that data was manually restored
            }

            if (backupData.viewSettings) {
              setViewSettings(backupData.viewSettings);
            }

            if (backupData.columnConfig) {
              setColumnConfig(backupData.columnConfig);
            }

            alert('Backup successfully restored!');
            console.log('Backup restored successfully');
            
          } catch (error) {
            console.error('Failed to parse backup file:', error);
            alert('Failed to restore backup. Please check the file format and try again.');
          }
        };
        reader.readAsText(file);
      };
      
      input.click();
    }
  };

  // @ts-ignore - Reserved for future column chooser functionality
  const handleChooseColumns = () => {
    setIsColumnChooserOpen(true);
    console.log('Choose columns modal opened');
  };

  const handleSaveColumns = (newColumns: ColumnConfig[]) => {
    setColumnConfig(newColumns);
    console.log('Column configuration updated:', newColumns);
  };

  // @ts-ignore - Reserved for future column search functionality  
  const handleColumnSearchChange = (columnKey: string, searchTerm: string) => {
    setColumnSearchTerms(prev => ({
      ...prev,
      [columnKey]: searchTerm
    }));
  };

  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      // Toggle sort direction
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortDirection(null);
        setSortColumn('');
      } else {
        setSortDirection('asc');
      }
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  // Compute unique values for filters
  const types = Array.from(new Set(sermons.map(sermon => sermon.type).filter(Boolean))) as string[];
  
  // Collect places from both sermon.place and all preaching history locations
  const allPlaces = sermons.flatMap(sermon => {
    const places = [];
    if (sermon.place) {
      places.push(sermon.place);
    }
    if (sermon.preachingHistory) {
      places.push(...sermon.preachingHistory.map(instance => instance.location));
    }
    return places;
  });
  const places = Array.from(new Set(allPlaces.filter(Boolean))) as string[];
  
  const tags = Array.from(new Set(sermons.flatMap(sermon => sermon.tags)));

  return (
    <div className="app">
      <Toolbar 
        onFiltersChange={setFilters}
        onViewSettingsChange={setViewSettings}
        viewSettings={viewSettings}
        selectedSermon={selectedSermon}
        onAddSermon={handleAddSermon}
        onEditSermon={handleEditSermon}
      />
      <div className="app-content">
        <Sidebar 
          selectedSeries={filters.series}
          onSeriesSelect={handleSeriesSelect}
          currentView={currentView}
          onViewChange={setCurrentView}
          filters={filters}
          onFiltersChange={setFilters}
          types={types}
          places={places}
          tags={tags}
        />
        
        {currentView === 'sermons' ? (
          <SermonList 
            sermons={sortedSermons}
            selectedSermon={selectedSermon}
            onSermonSelect={handleSermonSelect}
            onSermonDoubleClick={handleSermonDoubleClick}
            columnConfig={columnConfig}
            onColumnConfigChange={setColumnConfig}
            viewSettings={viewSettings}
            sortColumn={sortColumn}
            sortDirection={sortDirection}
            onSort={handleSort}
          />
        ) : (
          <SeriesList
            series={series}
            selectedSeries={selectedSeries}
            onSeriesSelect={handleSeriesClick}
            viewSettings={viewSettings}
            imageRefreshKey={imageRefreshKey}
            sermons={sermons}
          />
        )}
        
        {currentView === 'sermons' ? (
          <PreviewPane 
            sermon={getFullSermonForPreview(selectedSermon)}
            onImageClick={handleImageClick}
          />
        ) : (
          <SeriesPreview
            series={selectedSeries}
            sermons={selectedSeries ? getSeriesSermons(selectedSeries) : []}
            onSermonClick={(sermon) => {
              setCurrentView('sermons');
              setSelectedSermon(sermonToExpanded(sermon));
              setFilters({ ...filters, series: sermon.series });
            }}
            onImageChange={handleSeriesImageChange}
            onImageClick={handleImageClick}
          />
        )}
      </div>
      
      <SermonDetailsModal
        isOpen={isModalOpen}
        sermon={editingSermon}
        series={series}
        places={places}
        types={types}
        onClose={() => {
          setIsModalOpen(false);
          setEditingSermon(null);
        }}
        onSave={handleSaveSermon}
        onDelete={handleDeleteSermon}
      />
      
      <ImageViewer
        isOpen={imageViewerOpen}
        imageSrc={imageViewerSrc}
        onClose={() => setImageViewerOpen(false)}
      />
      
      <ColumnChooser
        isOpen={isColumnChooserOpen}
        onClose={() => setIsColumnChooserOpen(false)}
        columns={columnConfig}
        onSave={handleSaveColumns}
      />
    </div>
  );
}

export default App;
