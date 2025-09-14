# Sermon Library Desktop Application

This is a desktop application for managing sermon libraries, inspired by Calibre's layout and functionality.

## Project Overview
- **Technology Stack**: Electron + React + TypeScript
- **Purpose**: Manage sermon collections with metadata-rich browsing
- **Features**: Document previewing, sermon versioning, filtering, series organization

## Key Features
- Metadata-rich sermon browsing similar to Calibre's book management
- Document preview functionality
- Sermon versioning for multiple instances of the same sermon
- Flexible filtering and search capabilities
- Thematic series organization
- Support for sermons preached multiple times
- Detailed metadata editing

## Development Guidelines
- Follow React best practices for component organization
- Use TypeScript for type safety
- Implement responsive design principles
- Maintain clean separation between main process and renderer
- Use modern Electron security practices

## Project Structure
- `src/main/` - Electron main process and preload scripts
- `src/renderer/` - React frontend application
- `src/renderer/src/components/` - React components (Toolbar, Sidebar, SermonList, PreviewPane)
- `src/renderer/src/types/` - TypeScript type definitions

## Available Commands
- `npm run start` - Start development server
- `npm run build` - Build for production
- `npm run dist` - Create distributable packages
