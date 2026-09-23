import React from 'react';
import { QrCode, Printer, Wrench, MapPin, Building, Calendar, Layers, ShieldCheck } from 'lucide-react';

export default function AssetCard({ asset, onOpenConditionReport }) {
  if (!asset) return null;

  let statusClass = 'status-operational';
  if (asset.status === 'Partially Damaged') statusClass = 'status-partial';
  else if (asset.status === 'Damaged') statusClass = 'status-damaged';

  const printLabelUrl = `/api/qr/${asset.assetCode}/label`;

  return (
    <div className="showcase-container">
      <div className="asset-showcase-card">
        <div className="showcase-header">
          <div className="id-pills">
            <span className="code-pill">Asset: {asset.assetCode}</span>
            <span className="model-pill">Model: {asset.modelNumber || 'N/A'}</span>
          </div>
          <span className={`status-badge ${statusClass}`}>
            <ShieldCheck size={14} />
            {asset.status}
          </span>
        </div>

        <div className="showcase-body">
          <div>
            <div className="asset-names">
              <h2>{asset.nameEnglish}</h2>
              <div className="marathi-name">{asset.nameMarathi}</div>
              <span className="sample-tag" style={{ background: 'rgba(56, 189, 248, 0.1)', cursor: 'default' }}>
                {asset.category}
              </span>
            </div>

            <div className="qty-grid">
              <div className="qty-card">
                <div className="qty-val usable">{asset.usableQty}</div>
                <div className="qty-label">Usable</div>
              </div>
              <div className="qty-card">
                <div className="qty-val damaged">{asset.damagedQty}</div>
                <div className="qty-label">Damaged</div>
              </div>
              <div className="qty-card">
                <div className="qty-val total">{asset.totalQty}</div>
                <div className="qty-label">Total Items</div>
              </div>
            </div>

            <div className="meta-details">
              <div className="meta-item">
                <span><Building size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} /> Department:</span>
                <span>{asset.departmentEnglish} ({asset.departmentMarathi || '-'})</span>
              </div>
              <div className="meta-item">
                <span><Layers size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} /> Floor:</span>
                <span>{asset.floorEnglish} ({asset.floorMarathi || '-'})</span>
              </div>
              <div className="meta-item">
                <span><MapPin size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} /> Building / Ward:</span>
                <span>{asset.buildingEnglish} &bull; {asset.ward}</span>
              </div>
              <div className="meta-item">
                <span>Full Address:</span>
                <span>{asset.fullLocationEnglish}</span>
              </div>
              <div className="meta-item">
                <span><Calendar size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} /> Source Document:</span>
                <span>{asset.sourceFile}</span>
              </div>
            </div>

            <div className="showcase-actions">
              <a href={printLabelUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                <Printer size={16} /> Print Physical Label
              </a>
              <button className="btn btn-secondary" onClick={() => onOpenConditionReport(asset)}>
                <Wrench size={16} /> Update Condition / Report Issue
              </button>
            </div>
          </div>

          <div className="showcase-qr">
            <img src={asset.qrCode?.dataUrl} alt={`QR for ${asset.assetCode}`} />
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '10px' }}>
              Scannable QR Tag
            </div>
            <a
              href={asset.qrCode?.dataUrl}
              download={`${asset.assetCode}-qr.png`}
              className="sample-tag"
              style={{ marginTop: '8px', textDecoration: 'none', display: 'inline-block' }}
            >
              Download PNG
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
