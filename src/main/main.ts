import { app, BrowserWindow, Menu, ipcMain, dialog, clipboard } from 'electron';
import * as path from 'path';
import * as fs from 'fs/promises';
import sharp from 'sharp';

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

let mainWindow: BrowserWindow;

// User settings management
const userDataPath = app.getPath('userData');
const settingsPath = path.join(userDataPath, 'settings.json');

interface AppSettings {
  defaultBackupLocation?: string;
  hasShownBackupDialog?: boolean;
  darkMode?: boolean;
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function loadSettings(): Promise<AppSettings> {
  try {
    if (await fileExists(settingsPath)) {
      const data = await fs.readFile(settingsPath, 'utf-8');
      return JSON.parse(data) as AppSettings;
    }
  } catch (error) {
    console.error('Error loading settings:', error);
  }
  return {};
}

async function saveSettings(settings: AppSettings): Promise<void> {
  try {
    await fs.writeFile(settingsPath, JSON.stringify(settings, null, 2));
  } catch (error) {
    console.error('Error saving settings:', error);
  }
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    icon: path.join(__dirname, '../assets/icon.ico'),
    show: false,
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Handle window close event for auto-backup
  mainWindow.on('close', async (event) => {
    event.preventDefault();
    
    // Add a fallback timeout to force close after 30 seconds (give more time for dialog interactions)
    const forceCloseTimeout = setTimeout(() => {
      console.log('Force closing application after timeout');
      mainWindow.destroy();
    }, 30000);
    
    try {
      const settings = await loadSettings();
      
      // Show first-time backup dialog if needed
      if (!settings.hasShownBackupDialog) {
        // Clear timeout while showing dialogs
        clearTimeout(forceCloseTimeout);
        
        const result = await dialog.showMessageBox(mainWindow, {
          type: 'info',
          title: 'Automatic Backup Setup',
          message: 'Sermon Library will automatically create a backup every time you close the app.',
          detail: 'Would you like to choose a default backup location? You can change this later in the File menu.',
          buttons: ['Choose Location', 'Use Default Location', 'Cancel'],
          defaultId: 0,
          cancelId: 2
        });

        if (result.response === 2) {
          // User cancelled, don't close the app
          return;
        }

        let backupLocation: string;
        
        if (result.response === 0) {
          // User wants to choose location
          const folderResult = await dialog.showOpenDialog(mainWindow, {
            title: 'Choose Default Backup Location',
            properties: ['openDirectory'],
            defaultPath: app.getPath('documents')
          });

          if (folderResult.canceled) {
            // User cancelled folder selection, don't close the app
            return;
          }

          backupLocation = folderResult.filePaths[0];
        } else {
          // Use default location (Documents folder)
          backupLocation = path.join(app.getPath('documents'), 'Sermon Library Backups');
          
          // Create the default backup directory if it doesn't exist
          try {
            // Use async mkdir
            await fs.mkdir(backupLocation, { recursive: true });
          } catch (error) {
            console.error('Error creating default backup directory:', error);
          }
        }

        // Save the settings
        const updatedSettings: AppSettings = {
          ...settings,
          defaultBackupLocation: backupLocation,
          hasShownBackupDialog: true
        };
        await saveSettings(updatedSettings);

        // Show confirmation
        await dialog.showMessageBox(mainWindow, {
          type: 'info',
          title: 'Backup Location Set',
          message: `Backup location set to: ${backupLocation}`,
          detail: 'Your sermons will be automatically backed up here when you close the app.',
          buttons: ['OK']
        });
        
        // Restart the timeout with a shorter duration after dialogs are done
        setTimeout(() => {
          console.log('Force closing application after dialog timeout');
          mainWindow.destroy();
        }, 10000);
      } else {
        // Set a shorter timeout if no dialogs need to be shown
        clearTimeout(forceCloseTimeout);
        setTimeout(() => {
          console.log('Force closing application after short timeout');
          mainWindow.destroy();
        }, 5000);
      }
      
      // Listen for the renderer to confirm it's ready to close
      ipcMain.once('app-closing-done', () => {
        mainWindow.destroy();
      });

      // Try to request backup from renderer, but don't fail if renderer isn't ready
      if (mainWindow.webContents && !mainWindow.webContents.isDestroyed()) {
        mainWindow.webContents.send('app-closing');
      } else {
        // If renderer isn't ready, just close
        mainWindow.destroy();
      }
    } catch (error) {
      console.error('Error during app close sequence:', error);
      mainWindow.destroy();
    }
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5174');
    mainWindow.webContents.openDevTools();
  } else {
    // In production, use the proper Electron file protocol
    const rendererPath = path.join(__dirname, '..', 'renderer', 'index.html');
    console.log('Loading production renderer from:', rendererPath);
    
    // Use file:// protocol for production
    mainWindow.loadFile(rendererPath).catch((error) => {
      console.error('Failed to load renderer file:', error);
      console.log('__dirname:', __dirname);
      console.log('Trying alternative path...');
      
      // Alternative path if the above doesn't work
      const altPath = path.join(app.getAppPath(), 'dist', 'renderer', 'index.html');
      console.log('Alternative path:', altPath);
      mainWindow.loadFile(altPath).catch((altError) => {
        console.error('Alternative path also failed:', altError);
      });
    });
  }

  createMenu(loadSettings());
}

async function createMenu(settingsPromise: Promise<AppSettings>): Promise<void> {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Import CSV...',
          accelerator: 'CmdOrCtrl+I',
          click: () => {
            mainWindow.webContents.send('menu-import-csv');
          },
        },
        {
          label: 'Export CSV...',
          accelerator: 'CmdOrCtrl+E',
          click: () => {
            mainWindow.webContents.send('menu-export-csv');
          },
        },
        { type: 'separator' },
        {
          label: 'New Series',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow.webContents.send('menu-new-series');
          },
        },
        { type: 'separator' },
        {
          label: 'Create Backup...',
          accelerator: 'CmdOrCtrl+B',
          click: () => {
            mainWindow.webContents.send('menu-backup');
          },
        },
        {
          label: 'Restore from Backup...',
          accelerator: 'CmdOrCtrl+R',
          click: () => {
            mainWindow.webContents.send('menu-restore');
          },
        },
        {
          label: 'Change Backup Location',
          click: async () => {
            const result = await dialog.showOpenDialog(mainWindow, {
              title: 'Choose Default Backup Location',
              properties: ['openDirectory'],
              defaultPath: app.getPath('documents')
            });

            if (!result.canceled && result.filePaths.length > 0) {
              const backupLocation = result.filePaths[0];
              const settings = await loadSettings();
              const updatedSettings: AppSettings = {
                ...settings,
                defaultBackupLocation: backupLocation
              };
              await saveSettings(updatedSettings);

              // Show confirmation
              await dialog.showMessageBox(mainWindow, {
                type: 'info',
                title: 'Backup Location Updated',
                message: `Default backup location changed to: ${backupLocation}`,
                buttons: ['OK']
              });
            }
          },
        },
        { type: 'separator' },
        {
          label: 'Exit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          },
        },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        {
          label: 'Toggle Dark Mode',
          accelerator: 'CmdOrCtrl+Shift+D',
          type: 'checkbox',
          checked: (await settingsPromise).darkMode || false,
          click: async (menuItem) => {
            const settings = await loadSettings();
            const updatedSettings: AppSettings = {
              ...settings,
              darkMode: menuItem.checked
            };
            await saveSettings(updatedSettings);
            mainWindow.webContents.send('toggle-dark-mode', menuItem.checked);
          },
        },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'close' },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// IPC handlers
ipcMain.handle('get-dark-mode', async () => {
  const settings = await loadSettings();
  return settings.darkMode || false;
});

ipcMain.handle('select-file', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'CSV Files', extensions: ['csv'] },
      { name: 'Documents', extensions: ['pdf', 'docx', 'doc', 'txt', 'md'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  });

  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

ipcMain.handle('save-file', async (_event, defaultName: string, content: string) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: defaultName,
    filters: [
      { name: 'CSV Files', extensions: ['csv'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  });

  if (!result.canceled && result.filePath) {
    try {
      await fs.writeFile(result.filePath, content, 'utf8');
      return result.filePath;
    } catch (error) {
      console.error('Error saving file:', error);
      throw error;
    }
  }
  return null;
});

ipcMain.handle('read-file', async (_event, filePath: string) => {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    return content;
  } catch (error) {
    console.error('Error reading file:', error);
    throw error;
  }
});

// Add a handler to focus the main window
ipcMain.on('focus-window', () => {
  if (mainWindow) {
    mainWindow.focus();
  }
});

function getSermonLibraryDataPath(subpath = ''): string {
  const appDataDir = path.join(userDataPath, 'SermonLibrary');
  return path.join(appDataDir, subpath);
}

// Data persistence handlers
ipcMain.handle('save-app-data', async (_event, filename: string, data: any) => {
  try {
    const appDataDir = getSermonLibraryDataPath();
    // Ensure directory exists
    await fs.mkdir(appDataDir, { recursive: true });

    const filePath = path.join(appDataDir, filename);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
    
    console.log(`Data saved to: ${filePath}`);
    return filePath;
  } catch (error) {
    console.error('Error saving app data:', error);
    throw error;
  }
});

// Convert base64 image to file and return file path
const convertBase64ToFile = async (base64Data: string, sermonId: string): Promise<string | null> => {
  try {
    if (!base64Data.startsWith('data:image/')) {
      return null;
    }

    const imagesDir = getSermonLibraryDataPath('images');
    
    await fs.mkdir(imagesDir, { recursive: true });

    // Extract mime type and base64 string
    const matches = base64Data.match(/^data:image\/([^;]+);base64,(.+)$/);
    if (!matches) {
      return null;
    }

    const [, , base64String] = matches;
    
    // Always save as JPEG with compression (like ImageUpload component)
    const timestamp = Date.now();
    const filename = `sermon_${sermonId}_${timestamp}.jpg`;
    const filePath = path.join(imagesDir, filename);

    // Convert base64 to buffer
    const buffer = Buffer.from(base64String, 'base64');
    
    // Use sharp to compress as JPEG with 60% quality (matching ImageUpload component)
    await sharp(buffer)
      .jpeg({ quality: 60 })
      .toFile(filePath);

    console.log(`Converted and compressed base64 image to JPEG: ${filePath}`);
    return filePath;
  } catch (error) {
    console.error('Error converting base64 to file:', error);
    return null;
  }
};

// New handler for real-time data persistence
ipcMain.handle('save-sermon-data', async (_event, data: any) => {
  try {
    const appDataDir = getSermonLibraryDataPath();
    
    // Ensure directory exists
    await fs.mkdir(appDataDir, { recursive: true });
    
    // Convert any base64 images to files before saving
    if (data.sermons && Array.isArray(data.sermons)) {
      for (const sermon of data.sermons) {
        if (sermon.image && sermon.image.startsWith('data:image/')) {
          console.log(`Converting base64 image for sermon: ${sermon.title}`);
          const filePath = await convertBase64ToFile(sermon.image, sermon.id || Date.now().toString());
          if (filePath) {
            sermon.image = filePath;
            console.log(`Image converted and stored at: ${filePath}`);
          }
        }
      }
    }
    
    const filePath = path.join(appDataDir, 'sermons.json');
    const dataToSave = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      sermons: data.sermons || [],
      series: data.series || [],
      viewSettings: data.viewSettings || {},
      columnConfig: data.columnConfig || [],
      filters: data.filters || {}
    };
    
    await fs.writeFile(filePath, JSON.stringify(dataToSave, null, 2), 'utf8');
    console.log(`Sermon data saved to: ${filePath} (${dataToSave.sermons.length} sermons)`);
    return filePath;
  } catch (error) {
    console.error('Error saving sermon data:', error);
    throw error;
  }
});

ipcMain.handle('load-app-data', async (_event, filename: string) => {
  try {
    const filePath = getSermonLibraryDataPath(filename);
    
    if (await fileExists(filePath)) {
      const content = await fs.readFile(filePath, 'utf8');
      return JSON.parse(content);
    } else {
      console.log(`No saved data found at: ${filePath}`);
      return null;
    }
  } catch (error) {
    console.error('Error loading app data:', error);
    return null;
  }
});

// New handler for loading real-time sermon data
ipcMain.handle('load-sermon-data', async () => {
  try {
    const filePath = getSermonLibraryDataPath('sermons.json');
    
    if (await fileExists(filePath)) {
      const content = await fs.readFile(filePath, 'utf8');
      const data = JSON.parse(content);
      console.log(`Sermon data loaded from: ${filePath} (${data.sermons?.length || 0} sermons)`);
      return data;
    } else {
      console.log(`No sermon data found at: ${filePath}`);
      return null;
    }
  } catch (error) {
    console.error('Error loading sermon data:', error);
    return null;
  }
});

ipcMain.handle('get-app-data-path', async () => {
  try {
    return getSermonLibraryDataPath();
  } catch (error) {
    console.error('Error getting app data path:', error);
    throw error;
  }
});

// Backup handlers
ipcMain.handle('select-backup-location', async () => {
  try {
    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'Select Backup Location',
      defaultPath: 'SermonLibrary_Backup.slb',
      filters: [
        { name: 'Sermon Library Backup', extensions: ['slb'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });

    if (!result.canceled && result.filePath) {
      return result.filePath;
    }
    return null;
  } catch (error) {
    console.error('Error selecting backup location:', error);
    throw error;
  }
});

ipcMain.handle('save-backup', async (_event, filePath: string, data: any) => {
  try {
    // Ensure the file has .slb extension
    const backupPath = filePath.endsWith('.slb') ? filePath : `${filePath}.slb`;
    
    await fs.writeFile(backupPath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`Backup saved to: ${backupPath}`);
    return backupPath;
  } catch (error) {
    console.error('Error saving backup:', error);
    throw error;
  }
});

ipcMain.handle('load-backup', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Select Backup File to Restore',
      filters: [
        { name: 'Sermon Library Backup', extensions: ['slb'] },
        { name: 'All Files', extensions: ['*'] }
      ],
      properties: ['openFile']
    });

    if (!result.canceled && result.filePaths.length > 0) {
      const filePath = result.filePaths[0];
      const content = await fs.readFile(filePath, 'utf8');
      const data = JSON.parse(content);
      console.log(`Backup loaded from: ${filePath}`);
      return data;
    }
    return null;
  } catch (error) {
    console.error('Error loading backup:', error);
    throw error;
  }
});

// Settings management handlers
ipcMain.handle('get-default-backup-location', async () => {
  try {
    const settings = await loadSettings();
    return settings.defaultBackupLocation || null;
  } catch (error) {
    console.error('Error getting default backup location:', error);
    return null;
  }
});

ipcMain.handle('set-default-backup-location', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Choose Default Backup Location',
      properties: ['openDirectory'],
      defaultPath: app.getPath('documents')
    });

    if (!result.canceled && result.filePaths.length > 0) {
      const backupLocation = result.filePaths[0];
      const settings = await loadSettings();
      const updatedSettings: AppSettings = {
        ...settings,
        defaultBackupLocation: backupLocation
      };
      await saveSettings(updatedSettings);
      return backupLocation;
    }
    return null;
  } catch (error) {
    console.error('Error setting default backup location:', error);
    return null;
  }
});

ipcMain.handle('save-auto-backup', async (_event, data: any) => {
  try {
    const settings = await loadSettings();
    if (!settings.defaultBackupLocation) {
      console.warn('No default backup location set');
      return false;
    }

    // Create backup filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `SermonLibrary_AutoBackup_${timestamp}.slb`;
    const filePath = path.join(settings.defaultBackupLocation, filename);

    // Ensure backup directory exists
    const backupDir = path.dirname(filePath);
    await fs.mkdir(backupDir, { recursive: true });

    // Save backup file
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    console.log('Auto-backup saved to:', filePath);
    return true;
  } catch (error) {
    console.error('Error saving auto-backup:', error);
    return false;
  }
});

ipcMain.handle('load-latest-backup', async () => {
  try {
    const settings = await loadSettings();
    if (!settings.defaultBackupLocation) {
      return null;
    }

    const backupLocation = settings.defaultBackupLocation;

    // Check if backup directory exists
    if (!(await fileExists(backupLocation))) {
      return null;
    }

    // Find the most recent auto-backup file with the most sermons
    const files = await fs.readdir(backupLocation);
    const backupFiles = (await Promise.all(files
      .filter(file => file.startsWith('SermonLibrary_AutoBackup_') && file.endsWith('.slb'))
      .map(async file => {
        const filePath = path.join(backupLocation, file);
        try {
          const content = await fs.readFile(filePath, 'utf8');
          const data = JSON.parse(content);
          return {
            name: file,
            path: filePath,
            mtime: (await fs.stat(filePath)).mtime,
            sermonCount: data.sermons ? data.sermons.length : 0
          };
        } catch (error) {
          return {
            name: file,
            path: filePath,
            mtime: (await fs.stat(filePath)).mtime,
            sermonCount: 0
          };
        }
      })))
      .sort((a, b) => {
        // First sort by sermon count (descending), then by date (descending)
        if (a.sermonCount !== b.sermonCount) {
          return b.sermonCount - a.sermonCount;
        }
        return b.mtime.getTime() - a.mtime.getTime();
      });

    if (backupFiles.length === 0) {
      return null;
    }

    // Load the backup with the most sermons
    const bestBackup = backupFiles[0];
    console.log(`Loading backup: ${bestBackup.name} with ${bestBackup.sermonCount} sermons`);
    const content = await fs.readFile(bestBackup.path, 'utf8');
    const data = JSON.parse(content);
    
    console.log('Backup loaded from:', bestBackup.path);
    return data;
  } catch (error) {
    console.error('Error loading latest backup:', error);
    return null;
  }
});

// Image IPC handlers
ipcMain.handle('select-image', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Select Sermon Image',
      properties: ['openFile'],
      filters: [
        { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });

    if (!result.canceled && result.filePaths.length > 0) {
      const filePath = result.filePaths[0];
      
      // Read the file and convert to data URL
      const fileBuffer = await fs.readFile(filePath);
      const fileExtension = path.extname(filePath).toLowerCase();
      let mimeType = 'image/jpeg'; // default
      
      switch (fileExtension) {
        case '.png': mimeType = 'image/png'; break;
        case '.gif': mimeType = 'image/gif'; break;
        case '.bmp': mimeType = 'image/bmp'; break;
        case '.webp': mimeType = 'image/webp'; break;
        default: mimeType = 'image/jpeg'; break;
      }
      
      const base64Data = fileBuffer.toString('base64');
      return `data:${mimeType};base64,${base64Data}`;
    }
    return null;
  } catch (error) {
    console.error('Error selecting image:', error);
    return null;
  }
});

ipcMain.handle('save-sermon-image', async (_event, imageData: string, sermonId: string) => {
  try {
    const imagesDir = getSermonLibraryDataPath('images');
    
    // Create images directory if it doesn't exist
    await fs.mkdir(imagesDir, { recursive: true });

    // Generate unique filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `sermon_${sermonId}_${timestamp}.jpg`;
    const imagePath = path.join(imagesDir, filename);
    
    // Convert base64 to buffer and save
    const base64Data = imageData.replace(/^data:image\/[a-z]+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    await fs.writeFile(imagePath, buffer);
    
    return imagePath;
  } catch (error) {
    console.error('Error saving sermon image:', error);
    return null;
  }
});

ipcMain.handle('delete-sermon-image', async (_event, imagePath: string) => {
  try {
    if (await fileExists(imagePath)) {
      await fs.unlink(imagePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting sermon image:', error);
    return false;
  }
});

ipcMain.handle('get-clipboard-image', async () => {
  try {
    const clipboardImage = clipboard.readImage();
    
    console.log('Clipboard image check:', {
      isEmpty: clipboardImage.isEmpty(),
      size: clipboardImage.getSize(),
      aspectRatio: clipboardImage.getAspectRatio()
    });
    
    if (clipboardImage.isEmpty()) {
      console.log('No image found in clipboard');
      return null;
    }
    
    // Use sharp for consistent processing with other image inputs
    const imageBuffer = clipboardImage.toPNG(); // Get as buffer
    const maxSize = 800;

    const resizedBuffer = await sharp(imageBuffer)
      .resize({
        width: maxSize,
        height: maxSize,
        fit: 'inside', // maintains aspect ratio
        withoutEnlargement: true, // don't enlarge smaller images
      })
      .jpeg({ quality: 60 })
      .toBuffer();

    const base64Data = resizedBuffer.toString('base64');
    const dataUrl = `data:image/jpeg;base64,${base64Data}`;

    const metadata = await sharp(resizedBuffer).metadata();
    console.log('Successfully processed clipboard image, resized to:', {
      width: metadata.width,
      height: metadata.height,
    });

    return dataUrl;
  } catch (error) {
    console.error('Error getting clipboard image:', error);
    return null;
  }
});

// Load existing image file as data URL
ipcMain.handle('load-image-as-dataurl', async (_event, imagePath: string) => {
  try {
    if (!imagePath || !(await fileExists(imagePath))) {
      return null;
    }
    
    const fileBuffer = await fs.readFile(imagePath);
    const fileExtension = path.extname(imagePath).toLowerCase();
    let mimeType = 'image/jpeg'; // default
    
    switch (fileExtension) {
      case '.png': mimeType = 'image/png'; break;
      case '.gif': mimeType = 'image/gif'; break;
      case '.bmp': mimeType = 'image/bmp'; break;
      case '.webp': mimeType = 'image/webp'; break;
      default: mimeType = 'image/jpeg'; break;
    }
    
    const base64Data = fileBuffer.toString('base64');
    return `data:${mimeType};base64,${base64Data}`;
  } catch (error) {
    console.error('Error loading image as data URL:', error);
    return null;
  }
});

// Read image file as base64 string for backup purposes
ipcMain.handle('read-image-as-base64', async (_event, imagePath: string) => {
  try {
    if (!imagePath || !(await fileExists(imagePath))) {
      return null;
    }
    
    const fileBuffer = await fs.readFile(imagePath);
    const fileExtension = path.extname(imagePath).toLowerCase();
    let mimeType = 'image/jpeg'; // default
    
    switch (fileExtension) {
      case '.png': mimeType = 'image/png'; break;
      case '.gif': mimeType = 'image/gif'; break;
      case '.bmp': mimeType = 'image/bmp'; break;
      case '.webp': mimeType = 'image/webp'; break;
      default: mimeType = 'image/jpeg'; break;
    }
    
    const base64Data = fileBuffer.toString('base64');
    return {
      base64: base64Data,
      mimeType: mimeType,
      originalPath: imagePath
    };
  } catch (error) {
    console.error('Error reading image as base64:', error);
    return null;
  }
});

// Restore image from backup data
ipcMain.handle('restore-image-from-backup', async (_event, imageInfo: any, fileName: string) => {
  try {
    if (!imageInfo || !imageInfo.base64 || !fileName) {
      return null;
    }
    
    // Generate proper path in the sermon library images directory
    const imagesDir = getSermonLibraryDataPath('images');
    const fullImagePath = path.join(imagesDir, fileName);
    
    // Create directory if it doesn't exist
    await fs.mkdir(imagesDir, { recursive: true });
    
    // Convert base64 back to buffer and write to file
    const imageBuffer = Buffer.from(imageInfo.base64, 'base64');
    await fs.writeFile(fullImagePath, imageBuffer);
    
    console.log('Image restored to:', fullImagePath);
    return fullImagePath;
  } catch (error) {
    console.error('Error restoring image from backup:', error);
    return null;
  }
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
