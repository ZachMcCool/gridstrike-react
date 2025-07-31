import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import Library from './pages/Library.jsx';
import Rules from './pages/Rules.jsx';
import './App.css';

function Navigation() {
  const location = useLocation();
  
  return (
    <nav>
      <Link 
        to="/" 
        className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
      >
        Library
      </Link>
      <Link 
        to="/rules" 
        className={`nav-link ${location.pathname === '/rules' ? 'active' : ''}`}
      >
        Rules
      </Link>
    </nav>
  );
}

function App() {
  return (
    <Router>
      <div className="app">
        <header className="app-header">
          <h1>GridStrike Card Manager</h1>
          <Navigation />
        </header>
        
        <main className="app-main">
          <Routes>
            <Route path="/" element={<Library />} />
            <Route path="/rules" element={<Rules />} />
          </Routes>
        </main>
        
        <footer className="app-footer">
          <p>&copy; 2025 GridStrike Card Game</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;
