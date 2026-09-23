import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import AssetCard from './components/AssetCard';
import AssetTable from './components/AssetTable';
import StatsDashboard from './components/StatsDashboard';
import QrScannerModal from './components/QrScannerModal';
import QrGeneratorModal from './components/QrGeneratorModal';
import ConditionReportModal from './components/ConditionReportModal';
import { lookupItem, fetchItemByCode, fetchItemByModel } from './services/api';
import { QrCode, Search, Camera, Database, BarChart3, Printer, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import './styles/index.css';

export default function App() {
  const [activeTab, setActiveTab] = useState('lookup'); // 'lookup', 'directory', 'analytics', 'print'
  
  // Selected asset for display
  const [currentAsset, setCurrentAsset] = useState(null);
  const [lookupQuery, setLookupQuery] = useState('');
  const [lookupError, setLookupError] = useState('');
  const [loading, setLoading] = useState(false);

  // Modals
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [isConditionModalOpen, setIsConditionModalOpen] = useState(false);

  // Load initial sample asset on first mount
  useEffect(() => {
    handleLookup('MBMC-MOD-0001');
  }, []);

  const handleLookup = async (queryTerm) => {
    if (!queryTerm || !queryTerm.trim()) return;
    setLoading(true);
    setLookupError('');
    try {
      const res = await lookupItem(queryTerm.trim());
      if (res.data) {
        setCurrentAsset(res.data);
        setActiveTab('lookup');
      } else {
        setLookupError(`No item found matching "${queryTerm}"`);
      }
    } catch (err) {
      setLookupError(`No asset or model found matching "${queryTerm}"`);
    } finally {
      setLoading(false);
    }
  };

  const handleScanResult = (code) => {
    setIsScannerOpen(false);
    handleLookup(code);
  };

  const handleAssetCreated = (newAsset) => {
    setCurrentAsset(newAsset);
    setIsGeneratorOpen(false);
    setActiveTab('lookup');
  };

  const handleAssetUpdated = (updatedAsset) => {
    setCurrentAsset(updatedAsset);
  };

  return (
    <div className="app-container">
      <Navbar
        onSearch={handleLookup}
        onOpenScanner={() => setIsScannerOpen(true)}
        onOpenGenerator={() => setIsGeneratorOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Tabs Navigation */}
      <nav className="tabs-nav">
        <button
          className={`tab-btn ${activeTab === 'lookup' ? 'active' : ''}`}
          onClick={() => setActiveTab('lookup')}
        >
          <Search size={16} /> Scan & Model Search
        </button>
        <button
          className={`tab-btn ${activeTab === 'directory' ? 'active' : ''}`}
          onClick={() => setActiveTab('directory')}
        >
          <Database size={16} /> Asset Directory (520 Items)
        </button>
        <button
          className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          <BarChart3 size={16} /> Municipal Analytics
        </button>
        <button
          className={`tab-btn ${activeTab === 'print' ? 'active' : ''}`}
          onClick={() => setActiveTab('print')}
        >
          <Printer size={16} /> QR Sticker Print Studio
        </button>
      </nav>

      {/* Tab Content */}
      <main className="main-content">
        {activeTab === 'lookup' && (
          <div>
            {/* Hero search bar for typing Model Number or Asset Code */}
            <div className="hero-lookup">
              <div className="hero-badge">
                <Sparkles size={14} /> MBMC Asset Verification Engine
              </div>
              <h1 className="hero-title">
                Scan QR or Type Model Number
              </h1>
              <p className="hero-desc">
                Instant lookup for municipal furniture, seating, cupboards, and tables across Mira Bhayandar Municipal Corporation offices.
              </p>

              <form
                className="lookup-input-group"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleLookup(lookupQuery);
                }}
              >
                <input
                  type="text"
                  className="lookup-input"
                  placeholder="Type Model Number (e.g. MBMC-MOD-0001) or Asset Tag..."
                  value={lookupQuery}
                  onChange={(e) => setLookupQuery(e.target.value)}
                />
                <button type="submit" className="btn btn-primary" style={{ padding: '0 24px', fontSize: '15px' }}>
                  Find Asset
                </button>
                <button
                  type="button"
                  className="btn btn-emerald"
                  onClick={() => setIsScannerOpen(true)}
                  title="Scan using Camera"
                >
                  <Camera size={18} />
                </button>
              </form>

              {lookupError && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: '#fb7185',
                    marginTop: '12px',
                    fontSize: '13px',
                  }}
                >
                  <AlertCircle size={16} />
                  <span>{lookupError}</span>
                </div>
              )}

              {/* Quick sample clicks */}
              <div className="quick-samples">
                <span>Quick Models:</span>
                <button type="button" className="sample-tag" onClick={() => handleLookup('MBMC-MOD-0001')}>
                  MBMC-MOD-0001 (Chairs)
                </button>
                <button type="button" className="sample-tag" onClick={() => handleLookup('MBMC-MOD-0002')}>
                  MBMC-MOD-0002 (Table)
                </button>
                <button type="button" className="sample-tag" onClick={() => handleLookup('MBMC-MOD-0003')}>
                  MBMC-MOD-0003 (Cupboard)
                </button>
                <button type="button" className="sample-tag" onClick={() => handleLookup('MBMC-AST-0050')}>
                  MBMC-AST-0050 (QR Tag)
                </button>
                <button type="button" className="sample-tag" onClick={() => handleLookup('MBMC-MOD-0250')}>
                  MBMC-MOD-0250 (Officer Chair)
                </button>
              </div>
            </div>

            {/* Selected Asset Display */}
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                Fetching item details from MBMC database...
              </div>
            ) : currentAsset ? (
              <AssetCard
                asset={currentAsset}
                onOpenConditionReport={() => setIsConditionModalOpen(true)}
              />
            ) : null}
          </div>
        )}

        {activeTab === 'directory' && (
          <AssetTable
            onSelectAsset={(asset) => {
              setCurrentAsset(asset);
              setActiveTab('lookup');
            }}
          />
        )}

        {activeTab === 'analytics' && <StatsDashboard />}

        {activeTab === 'print' && (
          <div className="glass-card" style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center', padding: '40px' }}>
            <Printer size={48} color="#38bdf8" style={{ margin: '0 auto 16px auto' }} />
            <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '8px' }}>
              MBMC Physical Tag Print Studio
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '14px', maxWidth: '500px', margin: '0 auto 24px auto' }}>
              Print official weather-resistant asset tags with municipal headers, asset codes, model numbers, and scannable QR codes.
            </p>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <a
                href="/api/qr/batch-labels?limit=40"
                target="_blank"
                rel="noreferrer"
                className="btn btn-primary"
                style={{ padding: '12px 24px', fontSize: '15px' }}
              >
                Open Multi-Label Sticker Sheet (40 Tags)
              </a>
              {currentAsset && (
                <a
                  href={`/api/qr/${currentAsset.assetCode}/label`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-secondary"
                  style={{ padding: '12px 24px', fontSize: '15px' }}
                >
                  Print Current Tag ({currentAsset.assetCode})
                </a>
              )}
              <button
                className="btn btn-secondary"
                onClick={() => setIsGeneratorOpen(true)}
                style={{ padding: '12px 24px', fontSize: '15px' }}
              >
                Custom QR Generator
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      <QrScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleScanResult}
      />

      <QrGeneratorModal
        isOpen={isGeneratorOpen}
        onClose={() => setIsGeneratorOpen(false)}
        onAssetCreated={handleAssetCreated}
      />

      <ConditionReportModal
        isOpen={isConditionModalOpen}
        asset={currentAsset}
        onClose={() => setIsConditionModalOpen(false)}
        onUpdated={handleAssetUpdated}
      />
    </div>
  );
}
