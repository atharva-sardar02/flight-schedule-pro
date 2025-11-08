import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <Router>
      <div className="App">
        <header className="bg-blue-600 text-white p-4">
          <h1 className="text-2xl font-bold">Flight Schedule Pro</h1>
          <p className="text-sm">Weather Monitoring & AI-Powered Rescheduling</p>
        </header>
        <main className="container mx-auto p-4">
          <Routes>
            <Route path="/" element={
              <div className="text-center py-12">
                <h2 className="text-3xl font-bold mb-4">Welcome to Flight Schedule Pro</h2>
                <p className="text-gray-600">Intelligent weather monitoring and AI-powered rescheduling for flight training.</p>
              </div>
            } />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;

