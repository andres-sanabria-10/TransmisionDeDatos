import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles.css';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './components/HomePage';
import ModulacionAM from './components/ModulacionAM';
import ModulacionDigital from './components/ModulacionDigital';

function App() {
  return (
    <Router>
      <div className="app-container">
        <Header />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/analogicas" element={<ModulacionAM />} />
            <Route path="/digitales" element={<ModulacionDigital />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;