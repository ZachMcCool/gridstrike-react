import React from 'react';
import Library from './pages/Library.jsx';
import './App.css';

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>GridStrike Card Manager</h1>
        <nav>
          <a href="#library" className="nav-link active">Library</a>
          {/* Future navigation items can go here */}
        </nav>
      </header>
      
      <main className="app-main">
        <Library />
      </main>
      
      <footer className="app-footer">
        <p>&copy; 2025 GridStrike Card Game</p>
      </footer>
    </div>
  );
}

export default App;
