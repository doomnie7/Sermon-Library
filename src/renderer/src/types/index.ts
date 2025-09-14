export interface Sermon {
  id: string;
  title: string;
  date: Date;
  series?: string;
  seriesOrder?: number; // Order of sermon within the series (1, 2, 3, etc.)
  tags: string[];
  summary?: string;
  references?: string[];
  filePath?: string;
  fileSize?: number;
  lastModified?: Date;
  versions?: SermonVersion[];
  preachingHistory?: PreachingInstance[];
  image?: string; // Path to sermon image (max 800x800px, compressed)
  type?: string; // Sermon type (e.g., Sunday Service, Bible Study, etc.)
  place?: string; // Location where sermon was given
}

export interface SermonVersion {
  id: string;
  version: number;
  title: string;
  date: Date;
  changes: string;
  filePath: string;
}

export interface PreachingInstance {
  id: string;
  date: Date;
  location: string;
  audience?: string;
  notes?: string;
}

export interface ExpandedSermon extends Sermon {
  originalDate: Date;
  preachingInstance: PreachingInstance | null;
}

export interface Series {
  id: string;
  title: string;
  description?: string;
  startDate?: Date;
  endDate?: Date;
  sermons: string[]; // sermon IDs
  tags: string[];
}

export interface FilterOptions {
  searchTerm?: string;
  searchField?: 'all' | 'series' | 'title' | 'references';
  series?: string;
  tags?: string[];
  type?: string;
  place?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface ViewSettings {
  sortBy: 'title' | 'date' | 'series' | 'firstPreached' | 'lastPreached';
  sortOrder: 'asc' | 'desc';
  viewMode: 'list' | 'grid' | 'details';
}

export type ViewType = 'sermons' | 'series';
