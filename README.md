# GridStrike React App

A React-based card game application built with Vite and Firebase Firestore for data storage.

## Features

- Card management (create, read, update, delete)
- Deck building and management
- Real-time data storage with Firebase Firestore
- Modern React UI with component-based architecture

## Setup

### Prerequisites

- Node.js 18+
- Firebase project

### Installation

1. Clone the repository
2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up Firebase:
   - Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
   - Enable Firestore Database
   - Get your Firebase config from Project Settings > General > Web Apps
   - Copy the config values to your `.env` file (see Configuration below)

### Configuration

Create a `.env` file in the root directory with your Firebase configuration:

```env
# Firebase Configuration - REPLACE WITH YOUR ACTUAL VALUES
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id

# Application Settings
VITE_DETAILED_ERRORS=true
VITE_LOG_LEVEL=Information

# Firestore Collections
VITE_COLLECTION_CARDS=cards
VITE_COLLECTION_DECKS=decks
```

### Running the Application

```bash
# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## Architecture

- **Frontend**: React 19 with Vite
- **Database**: Firebase Firestore
- **State Management**: React hooks
- **Styling**: CSS modules

## Project Structure

```
src/
├── components/         # Reusable UI components
├── config/            # Configuration files (Firebase, app settings)
├── models/           # Data models (Card, Deck)
├── pages/            # Page components
├── services/         # API services (Firebase operations)
└── assets/           # Static assets
```

## Firebase Firestore Collections

- `cards` - Individual card data
- `decks` - Deck configurations and card collections

## Development

The application uses Firebase Firestore for all data operations. The services in `src/services/` handle all CRUD operations and provide a clean API for the React components.

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
