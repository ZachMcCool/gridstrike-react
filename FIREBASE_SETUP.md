# Firebase Setup Guide for GridStrike React App

This guide will help you set up Firebase Firestore for the GridStrike React application.

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Create a project" or "Add project"
3. Enter your project name (e.g., "gridstrike-react")
4. Choose whether to enable Google Analytics (optional)
5. Click "Create project"

## Step 2: Enable Firestore Database

1. In your Firebase project console, click on "Firestore Database" in the left sidebar
2. Click "Create database"
3. Choose "Start in test mode" for development (you'll set up security rules later)
4. Select a location for your database (choose one close to your users)
5. Click "Done"

## Step 3: Get Your Firebase Configuration

1. In the Firebase console, click on the gear icon (Project settings)
2. Scroll down to "Your apps" section
3. Click on "Web" icon (</>) to add a web app
4. Register your app with a nickname (e.g., "GridStrike Web App")
5. Copy the Firebase config object that appears

## Step 4: Configure Your Environment Variables

1. Open the `.env` file in your project root
2. Replace the placeholder values with your actual Firebase config:

```env
# Firebase Configuration - REPLACE WITH YOUR ACTUAL VALUES
VITE_FIREBASE_API_KEY=your-actual-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-actual-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-actual-sender-id
VITE_FIREBASE_APP_ID=your-actual-app-id
```

The values should look something like this (example):

```env
VITE_FIREBASE_API_KEY=AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_FIREBASE_AUTH_DOMAIN=gridstrike-react.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=gridstrike-react
VITE_FIREBASE_STORAGE_BUCKET=gridstrike-react.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:xxxxxxxxxxxxxxxxxxxxxx
```

## Step 5: Set Up Security Rules (Recommended)

For development, you can start with these basic rules. In production, you'll want more restrictive rules.

1. Go to Firestore Database > Rules in the Firebase console
2. Replace the default rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write access to cards and decks collections
    match /cards/{document} {
      allow read, write: if true; // For development only
    }
    match /decks/{document} {
      allow read, write: if true; // For development only
    }
  }
}
```

**Important**: These rules allow anyone to read and write to your database. For production, implement proper authentication and authorization.

## Step 6: Test the Connection

1. Start your development server: `npm run dev`
2. Open the application in your browser
3. Check the browser console for any Firebase connection errors
4. Try creating a card or deck to test the Firestore integration

## Collections Structure

The app will automatically create these collections when you first add data:

### Cards Collection (`cards`)

- `cardName` (string): Name of the card
- `faction` (string): Card faction
- `cardType` (string): Type of card
- `rarity` (string): Card rarity
- `description` (string): Card description
- `flavorText` (string): Flavor text
- `artwork` (string): Artwork URL
- `cost` (number): Card cost
- `attack` (number): Attack value
- `defense` (number): Defense value
- `health` (number): Health value

### Decks Collection (`decks`)

- `name` (string): Deck name
- `faction` (string): Deck faction
- `cards` (array): Array of card objects with `cardId` and `quantity`
- `userId` (string): User ID (for future authentication)

## Production Considerations

Before deploying to production:

1. **Security Rules**: Implement proper authentication and restrictive rules
2. **Authentication**: Add Firebase Auth for user management
3. **Indexes**: Create composite indexes for complex queries
4. **Environment Variables**: Use separate Firebase projects for development and production

## Troubleshooting

### Common Issues:

1. **"Firebase API key not found"**

   - Check that your `.env` file has the correct variable names with `VITE_` prefix
   - Ensure there are no spaces around the `=` in your `.env` file

2. **"Permission denied" errors**

   - Check your Firestore security rules
   - Ensure your project ID is correct

3. **"Project not found"**

   - Verify your `VITE_FIREBASE_PROJECT_ID` matches your Firebase project ID exactly

4. **Network errors**
   - Check your internet connection
   - Verify Firebase services are not blocked by your firewall

For more help, check the [Firebase documentation](https://firebase.google.com/docs) or the browser console for detailed error messages.
