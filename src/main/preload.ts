import { contextBridge, ipcRenderer } from 'electron';

const electronAPI = {
  selectFile: () => ipcRenderer.invoke('select-file'),
  saveFile: (defaultName: string, content: string) => ipcRenderer.invoke('save-file', defaultName, content),
  readFile: (filePath: string) => ipcRenderer.invoke('read-file', filePath),
  onMenuImportSermon: (callback: () => void) => ipcRenderer.on('menu-import-sermon', callback),
  onMenuImportCSV: (callback: () => void) => ipcRenderer.on('menu-import-csv', callback),
  onMenuExportCSV: (callback: () => void) => ipcRenderer.on('menu-export-csv', callback),
  onMenuNewSeries: (callback: () => void) => ipcRenderer.on('menu-new-series', callback),
  onMenuBackup: (callback: () => void) => ipcRenderer.on('menu-backup', callback),
  onMenuRestore: (callback: () => void) => ipcRenderer.on('menu-restore', callback),
  onAppClosing: (callback: () => void) => ipcRenderer.on('app-closing', callback),
  appClosingDone: () => ipcRenderer.send('app-closing-done'),
  removeAllListeners: (channel: string) => ipcRenderer.removeAllListeners(channel),
  
  // Data persistence
  saveAppData: (filename: string, data: any) => ipcRenderer.invoke('save-app-data', filename, data),
  loadAppData: (filename: string) => ipcRenderer.invoke('load-app-data', filename),
  getAppDataPath: () => ipcRenderer.invoke('get-app-data-path'),
  
  // Real-time sermon data persistence
  saveSermonData: (data: any) => ipcRenderer.invoke('save-sermon-data', data),
  loadSermonData: () => ipcRenderer.invoke('load-sermon-data'),
  
  // Backup functions
  selectBackupLocation: () => ipcRenderer.invoke('select-backup-location'),
  saveBackup: (filePath: string, data: any) => ipcRenderer.invoke('save-backup', filePath, data),
  loadBackup: () => ipcRenderer.invoke('load-backup'),
  loadLatestBackup: () => ipcRenderer.invoke('load-latest-backup'),
  
  // Settings and auto-backup
  getDefaultBackupLocation: () => ipcRenderer.invoke('get-default-backup-location'),
  setDefaultBackupLocation: () => ipcRenderer.invoke('set-default-backup-location'),
  saveAutoBackup: (data: any) => ipcRenderer.invoke('save-auto-backup', data),
  
  // Dark mode
  getDarkMode: () => ipcRenderer.invoke('get-dark-mode'),
  onToggleDarkMode: (callback: (isDark: boolean) => void) => ipcRenderer.on('toggle-dark-mode', (_, isDark) => callback(isDark)),
  
  // Image handling
  selectImage: () => ipcRenderer.invoke('select-image'),
  saveSermonImage: (imageData: string, sermonId: string) => ipcRenderer.invoke('save-sermon-image', imageData, sermonId),
  deleteSermonImage: (imagePath: string) => ipcRenderer.invoke('delete-sermon-image', imagePath),
  getClipboardImage: () => ipcRenderer.invoke('get-clipboard-image'),
  loadImageAsDataUrl: (imagePath: string) => ipcRenderer.invoke('load-image-as-dataurl', imagePath),
  readImageAsBase64: (imagePath: string) => ipcRenderer.invoke('read-image-as-base64', imagePath),
  restoreImageFromBackup: (imageInfo: any, newImagePath: string) => ipcRenderer.invoke('restore-image-from-backup', imageInfo, newImagePath),
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);

export type ElectronAPI = typeof electronAPI;
