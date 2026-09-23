import React, { useState } from 'react';
import { QrCode, Search, Camera, Plus, BarChart3, Building2, X } from 'lucide-react';

export default function Navbar({ onSearch, onOpenScanner, onOpenGenerator, activeTab, setActiveTab }) {
  const [searchInput, setSearchInput] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      onSearch(searchInput.trim());
    }
  };

  const handleClear = () => {
    setSearchInput('');
  };

  return (
    <header className="navbar">
      <div className="brand-section" onClick={() => setActiveTab('lookup')}>
        <div className="brand-logo">
          <QrCode size={22} />
        </div>
        <div>
          <div className="brand-title">MBMC Asset Portal</div>
          <div className="brand-subtitle">Mira Bhayandar Municipal Corp</div>
        </div>
      </div>

      <div className="nav-center">
        <form onSubmit={handleSubmit} className="search-input-wrapper">
          <Search size={16} className="search-icon-left" />
          <input
            type="text"
            placeholder="Search Model No (MBMC-MOD-...) or Asset Code..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          {searchInput && (
            <button type="button" onClick={handleClear} className="search-clear-btn">
              <X size={14} />
            </button>
          )}
        </form>
      </div>

      <div className="nav-actions">
        <button className="btn btn-primary" onClick={onOpenScanner} title="Open Camera Scanner">
          <Camera size={16} />
          <span>Scan QR</span>
        </button>
        <button className="btn btn-secondary" onClick={onOpenGenerator} title="Create / Generate QR">
          <Plus size={16} />
          <span>Generate QR</span>
        </button>
      </div>
    </header>
  );
}
