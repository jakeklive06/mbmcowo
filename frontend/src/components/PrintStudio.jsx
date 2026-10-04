import React, { useState, useEffect } from 'react';
import {
  Printer,
  FileText,
  CheckCircle,
  AlertTriangle,
  Building,
  Briefcase,
  Layers,
  ExternalLink,
  Sliders,
  Sparkles,
  Info,
  QrCode,
} from 'lucide-react';
import { fetchBuildings, fetchDepartments, fetchStatsOverview } from '../services/api';

export default function PrintStudio({ currentAsset, onOpenGenerator }) {
  const [buildings, setBuildings] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [selectedBuilding, setSelectedBuilding] = useState('all');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [batchPreset, setBatchPreset] = useState('all');

  useEffect(() => {
    async function loadMetadata() {
      try {
        setLoading(true);
        const [bldRes, deptRes, statRes] = await Promise.all([
          fetchBuildings(),
          fetchDepartments(),
          fetchStatsOverview(),
        ]);
        if (bldRes.success) setBuildings(bldRes.data);
        if (deptRes.success) setDepartments(deptRes.data);
        if (statRes.success) setStats(statRes.data);
      } catch (err) {
        console.error('Failed to load print studio metadata:', err);
      } finally {
        setLoading(false);
      }
    }
    loadMetadata();
  }, []);

  // Compute query url for filtered batch printing
  const buildPrintUrl = () => {
    const params = new URLSearchParams();
    if (selectedBuilding && selectedBuilding !== 'all') {
      params.append('building', selectedBuilding);
    }
    if (selectedDepartment && selectedDepartment !== 'all') {
      params.append('department', selectedDepartment);
    }
    if (selectedStatus && selectedStatus !== 'all') {
      params.append('status', selectedStatus);
    }

    if (batchPreset === 'all') {
      params.append('limit', 'all');
    } else {
      const [skipVal, limitVal] = batchPreset.split(':');
      params.append('skip', skipVal);
      params.append('limit', limitVal);
    }

    return `/api/qr/batch-labels?${params.toString()}`;
  };

  // Estimate matching count based on selection
  const getEstimatedCount = () => {
    if (!stats) return '3,443';
    if (selectedBuilding === 'all' && selectedDepartment === 'all' && selectedStatus === 'all' && batchPreset === 'all') {
      return stats.totalAssets?.toLocaleString() || '3,443';
    }
    if (selectedStatus === 'Damaged' && selectedBuilding === 'all' && selectedDepartment === 'all') {
      return stats.damagedCount?.toLocaleString() || '139';
    }
    if (selectedStatus === 'Operational' && selectedBuilding === 'all' && selectedDepartment === 'all') {
      return stats.usableCount?.toLocaleString() || '3,304';
    }
    if (selectedBuilding !== 'all') {
      const b = buildings.find((x) => x._id === selectedBuilding);
      if (b) {
        if (selectedStatus === 'Damaged') return b.damagedCount || 0;
        if (selectedStatus === 'Operational') return b.usableCount || 0;
        return b.count || 0;
      }
    }
    return 'Custom Selection';
  };

  return (
    <div className="print-studio" style={{ maxWidth: '1050px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Banner */}
      <div
        className="glass-card"
        style={{
          padding: '28px',
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.85) 0%, rgba(30, 41, 59, 0.85) 100%)',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div style={{ background: '#0284c7', color: '#fff', padding: '6px', borderRadius: '8px', display: 'flex' }}>
                <Printer size={22} />
              </div>
              <h2 style={{ fontSize: '24px', fontWeight: 800, margin: 0, color: '#f8fafc' }}>
                MBMC Physical Asset Tag Print Studio
              </h2>
            </div>
            <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0, maxWidth: '650px', lineHeight: 1.5 }}>
              Generate official high-resolution, weather-resistant physical sticker tags with municipal seals, individual QR codes, Marathi titles, unit numbers (<code style={{ color: '#38bdf8' }}>Unit X of Y</code>), and precise room locations for all <strong>3,443 physical assets</strong>.
            </p>
          </div>

          <button
            onClick={onOpenGenerator}
            className="btn btn-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}
          >
            <QrCode size={16} />
            <span>Generate Custom QR</span>
          </button>
        </div>

        {/* Quick KPI Strip */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '12px',
            marginTop: '20px',
            paddingTop: '16px',
            borderTop: '1px solid rgba(148, 163, 184, 0.15)',
          }}
        >
          <div>
            <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Total Physical Assets</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#38bdf8' }}>
              {stats?.totalAssets?.toLocaleString() || '3,443'} Tags
            </div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Operational / Fine</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#34d399' }}>
              {stats?.usableCount?.toLocaleString() || '3,304'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Damaged / Broken</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#fb7185' }}>
              {stats?.damagedCount?.toLocaleString() || '139'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Offices / Rooms</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#fbbf24' }}>
              {stats?.totalOffices || '447'}
            </div>
          </div>
        </div>
      </div>

      {/* Primary Action Hero Card: Print ALL Assets */}
      <div
        className="glass-card"
        style={{
          padding: '28px',
          background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.15) 0%, rgba(14, 165, 233, 0.05) 100%)',
          border: '1.5px solid #0284c7',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '12px',
            right: '16px',
            background: 'rgba(56, 189, 248, 0.2)',
            color: '#38bdf8',
            fontSize: '11px',
            fontWeight: 800,
            padding: '3px 10px',
            borderRadius: '999px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          All-Inclusive Mode
        </div>

        <div
          style={{
            background: '#0284c7',
            color: '#ffffff',
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px',
            boxShadow: '0 0 24px rgba(2, 132, 199, 0.5)',
          }}
        >
          <Printer size={32} />
        </div>

        <h3 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 8px 0', color: '#f8fafc' }}>
          Print All Municipal Assets (All 3,443 Physical Tags)
        </h3>
        <p style={{ color: '#94a3b8', fontSize: '14px', maxWidth: '620px', margin: '0 0 20px 0', lineHeight: 1.5 }}>
          Opens the complete sticker sheet covering all 3,443 physical items across 10 municipal buildings and 95 departments. Formatted in a high-density, 3-column printable grid with zero page break clipping.
        </p>

        <a
          href="/api/qr/batch-labels?limit=all"
          target="_blank"
          rel="noreferrer"
          className="btn btn-primary"
          style={{
            padding: '14px 32px',
            fontSize: '16px',
            fontWeight: 800,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            boxShadow: '0 4px 20px rgba(2, 132, 199, 0.4)',
          }}
        >
          <Printer size={20} />
          <span>Open & Print All 3,443 Asset Tags Now</span>
          <ExternalLink size={16} />
        </a>

        <div style={{ marginTop: '14px', fontSize: '12px', color: '#64748b' }}>
          Supports instant browser printing (`Ctrl + P`), Save to PDF, or export to thermal label roll printers.
        </div>
      </div>

      {/* Filtered & Batch Printing Controls */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Sliders size={20} color="#38bdf8" />
          <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>
            Custom Filtered Batch Printing
          </h3>
        </div>
        <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 20px 0' }}>
          Target specific municipal buildings, departments, repair conditions, or split into manageable print batches (e.g. 500 tags per ream).
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '16px',
            marginBottom: '20px',
          }}
        >
          {/* Building Filter */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>
              Building / Complex
            </label>
            <select
              value={selectedBuilding}
              onChange={(e) => setSelectedBuilding(e.target.value)}
              style={{
                width: '100%',
                background: '#1e293b',
                color: '#fff',
                border: '1px solid #334155',
                borderRadius: '8px',
                padding: '10px 12px',
                fontSize: '13px',
              }}
            >
              <option value="all">All Buildings (10 Complexes)</option>
              {buildings.map((b) => (
                <option key={b._id} value={b._id}>
                  {b._id} ({b.count} tags)
                </option>
              ))}
            </select>
          </div>

          {/* Department Filter */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>
              Department / Office
            </label>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              style={{
                width: '100%',
                background: '#1e293b',
                color: '#fff',
                border: '1px solid #334155',
                borderRadius: '8px',
                padding: '10px 12px',
                fontSize: '13px',
              }}
            >
              <option value="all">All Departments (95)</option>
              {departments.map((d) => (
                <option key={d._id} value={d._id}>
                  {d._id} ({d.count} tags)
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>
              Physical Condition Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              style={{
                width: '100%',
                background: '#1e293b',
                color: '#fff',
                border: '1px solid #334155',
                borderRadius: '8px',
                padding: '10px 12px',
                fontSize: '13px',
              }}
            >
              <option value="all">All Conditions (Operational & Damaged)</option>
              <option value="Operational">Operational / Fine Only (3,304 items)</option>
              <option value="Damaged">Damaged / Broken Only (139 items for repair)</option>
            </select>
          </div>

          {/* Batch Range Preset */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>
              Batch Range (Chunking)
            </label>
            <select
              value={batchPreset}
              onChange={(e) => setBatchPreset(e.target.value)}
              style={{
                width: '100%',
                background: '#1e293b',
                color: '#fff',
                border: '1px solid #334155',
                borderRadius: '8px',
                padding: '10px 12px',
                fontSize: '13px',
              }}
            >
              <option value="all">All Matching (No batch limit)</option>
              <option value="0:500">Batch 1: Items 1 – 500 (500 tags)</option>
              <option value="500:500">Batch 2: Items 501 – 1,000 (500 tags)</option>
              <option value="1000:500">Batch 3: Items 1,001 – 1,500 (500 tags)</option>
              <option value="1500:500">Batch 4: Items 1,501 – 2,000 (500 tags)</option>
              <option value="2000:500">Batch 5: Items 2,001 – 2,500 (500 tags)</option>
              <option value="2500:500">Batch 6: Items 2,501 – 3,000 (500 tags)</option>
              <option value="3000:500">Batch 7: Items 3,001 – 3,443 (443 tags)</option>
            </select>
          </div>
        </div>

        {/* Filter Action Row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            paddingTop: '16px',
            borderTop: '1px solid #334155',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#94a3b8' }}>
            <Info size={16} color="#38bdf8" />
            <span>
              Estimated target items: <strong style={{ color: '#38bdf8' }}>{getEstimatedCount()}</strong>
            </span>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => {
                setSelectedBuilding('all');
                setSelectedDepartment('all');
                setSelectedStatus('all');
                setBatchPreset('all');
              }}
              className="btn btn-secondary"
              style={{ fontSize: '13px' }}
            >
              Reset Filters
            </button>

            <a
              href={buildPrintUrl()}
              target="_blank"
              rel="noreferrer"
              className="btn btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '13px', padding: '10px 20px' }}
            >
              <Printer size={16} />
              <span>Print Filtered Sticker Sheet</span>
              <ExternalLink size={14} />
            </a>
          </div>
        </div>
      </div>

      {/* Contextual Single Unit & Office Room Printing */}
      {currentAsset && (
        <div
          className="glass-card"
          style={{
            padding: '24px',
            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.6) 100%)',
            border: '1px solid #334155',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <FileText size={18} color="#38bdf8" />
            <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>
              Currently Selected Asset Printing ({currentAsset.assetCode})
            </h3>
          </div>
          <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 16px 0' }}>
            Quickly print an individual tag or all chairs/items located in the same room.
          </p>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <a
              href={`/api/qr/${currentAsset.assetCode}/label`}
              target="_blank"
              rel="noreferrer"
              className="btn btn-secondary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '13px', padding: '10px 16px' }}
            >
              <Printer size={15} />
              <span>Print Single Tag ({currentAsset.assetCode} - {currentAsset.unitLabel})</span>
            </a>

            {currentAsset.lotCode && (
              <a
                href={`/api/qr/batch-labels?lotCode=${currentAsset.lotCode}`}
                target="_blank"
                rel="noreferrer"
                className="btn btn-secondary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '13px', padding: '10px 16px' }}
              >
                <Layers size={15} />
                <span>
                  Print All {currentAsset.totalUnitsInLot} Tags for This Room ({currentAsset.departmentEnglish})
                </span>
              </a>
            )}
          </div>
        </div>
      )}

      {/* Printing Instructions & Specifications */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '16px',
        }}
      >
        <div className="glass-card" style={{ padding: '20px' }}>
          <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CheckCircle size={16} color="#34d399" />
            Recommended Sticker Paper Specs
          </h4>
          <ul style={{ margin: 0, paddingLeft: '18px', color: '#94a3b8', fontSize: '12.5px', lineHeight: 1.6 }}>
            <li>Standard A4 3-column sticker labels (approx 70mm x 40mm each).</li>
            <li>Synthetic polyester or vinyl label stock recommended for durability.</li>
            <li>Compatible with standard office laser/inkjet printers and Zebra thermal rolls.</li>
          </ul>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={16} color="#38bdf8" />
            Browser Print Setup Tips
          </h4>
          <ul style={{ margin: 0, paddingLeft: '18px', color: '#94a3b8', fontSize: '12.5px', lineHeight: 1.6 }}>
            <li><strong>Margins:</strong> Set to <em>Default</em> or <em>Minimum</em> (8mm).</li>
            <li><strong>Options:</strong> Ensure <em>"Background graphics"</em> is checked.</li>
            <li><strong>Scale:</strong> Leave at 100% or adjust to 95% if printer margins clip.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
