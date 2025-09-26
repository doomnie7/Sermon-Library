# 📚 Sermon Library

A modern desktop application for managing sermon libraries. Built with Electron, React, and TypeScript.

![Sermon Library](https://img.shields.io/badge/Electron-React-TypeScript-blue)
![Version](https://img.shields.io/badge/version-1.0.0-green)
![License](https://img.shields.io/badge/license-MIT-yellow)

## ✨ Features

- **📖 Sermon Management**: Add, edit, delete, and organize sermons
- **📚 Series Organization**: Group sermons into series for better organization
- **🖼️ Image Support**: Upload and manage sermon images with automatic resizing
- **🔍 Advanced Search**: Filter sermons by title, speaker, series, tags, and more
- **📊 Multiple Views**: List view and grid view for different preferences
- **🌙 Dark Mode**: Toggle between light and dark themes
- **💾 Auto-Backup**: Automatic backup system with configurable locations
- **📤 Export/Import**: Backup and restore your entire library
- **🏷️ Tagging System**: Organize sermons with custom tags
- **📅 Date Management**: Track sermon dates and preaching history
- **🔍 Autocomplete**: Smart autocomplete for places, types, and series

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/sermon-library.git
   cd sermon-library
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the application**
   ```bash
   # Development mode
   npm start
   
   # Or build and run
   npm run build
   npx electron .
   ```

### Building for Production

```bash
# Build the application
npm run build

# Create Windows installer
npm run dist:win

# Create MSI installer
npm run dist:msi

# Create NSIS installer
npm run dist:nsis
```

## 🛠️ Development

### Project Structure

```
sermon-library/
├── src/
│   ├── main/           # Electron main process
│   │   ├── main.ts     # Main process entry point
│   │   └── preload.ts  # Preload script
│   └── renderer/       # React frontend
│       ├── src/
│       │   ├── components/  # React components
│       │   ├── types/       # TypeScript type definitions
│       │   └── App.tsx      # Main React component
│       └── index.html
├── assets/             # Application assets
├── dist/               # Built application
└── release/            # Distribution files
```

### Available Scripts

- `npm start` - Start development server with Electron
- `npm run dev` - Start Vite development server
- `npm run build` - Build the application
- `npm run build:electron` - Build Electron main process
- `npm run dist` - Create distribution packages
- `npm run dist:win` - Create Windows installer
- `npm run dist:msi` - Create MSI installer
- `npm run dist:nsis` - Create NSIS installer

## 📱 Usage

### Adding Sermons
1. Click the "Add Sermon" button
2. Fill in sermon details (title, speaker, date, etc.)
3. Upload an image if desired
4. Add tags and references
5. Save the sermon

### Managing Series
1. Use the sidebar to view series
2. Create new series by adding sermons with the same series name
3. Edit series information in the series view

### Backup and Restore
1. Go to File → Backup to create a backup
2. Go to File → Restore to restore from a backup
3. Auto-backup runs automatically when closing the app

## 🔧 Configuration

The application stores data in:
- **Windows**: `%APPDATA%/sermon-library/SermonLibrary/`
- **macOS**: `~/Library/Application Support/sermon-library/SermonLibrary/`
- **Linux**: `~/.config/sermon-library/SermonLibrary/`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by [Calibre](https://calibre-ebook.com/) for its excellent library management
- Built with [Electron](https://www.electronjs.org/)
- Frontend powered by [React](https://reactjs.org/) and [Vite](https://vitejs.dev/)
- Icons and UI inspired by modern design principles

## 📞 Support

If you encounter any issues or have questions, please:
1. Check the [Issues](https://github.com/YOUR_USERNAME/sermon-library/issues) page
2. Create a new issue with detailed information
3. Include your operating system and application version

---

**Made with ❤️ for sermon management**