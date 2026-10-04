import React from 'react';
import { QrCode, Printer, Wrench, MapPin, Building, Calendar, Layers, ShieldCheck, AlertCircle, CheckCircle2, ExternalLink } from 'lucide-react';

export default function AssetCard({ asset, onOpenConditionReport, onSelectSibling }) {
  if (!asset) return null;

  const isDamaged = asset.status === 'Damaged' || asset.status === 'Partially Damaged';
  const statusClass = isDamaged ? 'status-damaged' : 'status-operational';

  const printLabelUrl = `/api/qr/${asset.assetCode}/label`;
  const siblingUnits = asset.siblingUnits || [];

  const lotTotal = asset.lotTotalQty || siblingUnits.length || 1;
  const lotFine = asset.lotUsableQty !== undefined
    ? asset.lotUsableQty
    : siblingUnits.filter((s) => s.status === 'Operational').length;
  const lotBroken = asset.lotDamagedQty !== undefined
    ? asset.lotDamagedQty
    : siblingUnits.filter((s) => s.status === 'Damaged' || s.status === 'Partially Damaged').length;

  return (
    <div className="showcase-container">
      <div className="asset-showcase-card">
        {/* Header badges */}
        <div className="showcase-header">
          <div className="id-pills">
            <span className="code-pill">Tag: {asset.assetCode}</span>
            <span className="model-pill">{asset.unitLabel || 'Unit ' + (asset.unitNumber || 1)}</span>
            {asset.lotCode && <span className="sample-tag" style={{ background: '#0f172a', border: '1px solid #334155' }}>Lot: {asset.lotCode}</span>}
          </div>
          <span className={`status-badge ${statusClass}`}>
            {isDamaged ? <AlertCircle size={14} /> : <ShieldCheck size={14} />}
            {isDamaged ? 'Damaged (Broken)' : 'Operational (Fine)'}
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

            {/* Condition Banner */}
            <div
              style={{
                marginTop: '14px',
                padding: '12px 16px',
                borderRadius: '10px',
                background: isDamaged ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                border: `1px solid ${isDamaged ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              {isDamaged ? (
                <AlertCircle size={20} color="#f87171" style={{ flexShrink: 0 }} />
              ) : (
                <CheckCircle2 size={20} color="#34d399" style={{ flexShrink: 0 }} />
              )}
              <div>
                <div style={{ fontWeight: 700, fontSize: '14px', color: isDamaged ? '#fca5a5' : '#86efac' }}>
                  {asset.conditionSummary || (isDamaged ? 'Damaged / Broken' : 'Operational / Fine')}
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                  This individual unit has its own unique QR code sticker for field auditing.
                </div>
              </div>
            </div>

            <div className="meta-details" style={{ marginTop: '16px' }}>
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
                <Wrench size={16} /> Update Condition
              </button>
            </div>
          </div>

          {/* QR Code Section */}
          <div className="showcase-qr">
            <img src={asset.qrCode?.dataUrl} alt={`QR for ${asset.assetCode}`} />
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#f8fafc', marginTop: '10px' }}>
              {asset.unitLabel || 'Unit ' + (asset.unitNumber || 1)}
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
              Code: {asset.assetCode}
            </div>
            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginTop: '10px' }}>
              <a
                href={asset.qrCode?.dataUrl}
                download={`${asset.assetCode}-qr.png`}
                className="sample-tag"
                style={{ textDecoration: 'none' }}
              >
                Download PNG
              </a>
              <a
                href={`/scan/${asset.assetCode}`}
                target="_blank"
                rel="noreferrer"
                className="sample-tag"
                style={{ textDecoration: 'none' }}
              >
                Scan View <ExternalLink size={10} style={{ display: 'inline' }} />
              </a>
            </div>
          </div>
        </div>

        {/* Office Inventory & Sibling Units Grid */}
        {siblingUnits && siblingUnits.length > 0 && (
          <div
            style={{
              marginTop: '24px',
              paddingTop: '20px',
              borderTop: '1px solid #334155',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: '#38bdf8' }}>
                  Office Inventory: {asset.departmentEnglish}
                </h3>
                <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                  {lotTotal} items total in this office lot &bull;{' '}
                  <span style={{ color: '#34d399', fontWeight: 700 }}>{lotFine} Fine (Operational)</span>,{' '}
                  <span style={{ color: '#f87171', fontWeight: 700 }}>{lotBroken} Broken (Damaged)</span>
                </div>
              </div>

              {asset.lotCode && (
                <a
                  href={`/api/qr/batch-labels?lotCode=${asset.lotCode}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-secondary"
                  style={{ fontSize: '12px', padding: '6px 14px' }}
                >
                  <Printer size={13} /> Print All {siblingUnits.length} Labels for this Office
                </a>
              )}
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                gap: '10px',
                marginTop: '12px',
              }}
            >
              {siblingUnits.map((sub) => {
                const isSubDamaged = sub.status === 'Damaged' || sub.status === 'Partially Damaged';
                const isCurrent = sub.assetCode === asset.assetCode;

                return (
                  <button
                    key={sub.assetCode}
                    type="button"
                    onClick={() => {
                      if (onSelectSibling) onSelectSibling(sub);
                    }}
                    style={{
                      background: isCurrent ? 'rgba(56, 189, 248, 0.15)' : '#0f172a',
                      border: `1.5px solid ${isCurrent ? '#38bdf8' : '#334155'}`,
                      borderRadius: '8px',
                      padding: '10px 8px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <div style={{ fontSize: '12px', fontWeight: 700, color: isCurrent ? '#38bdf8' : '#fff' }}>
                      {sub.unitLabel || 'Unit ' + sub.unitNumber}
                    </div>
                    <div style={{ fontFamily: 'monospace', fontSize: '10px', color: '#94a3b8' }}>
                      {sub.assetCode}
                    </div>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: '10px',
                        background: isSubDamaged ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                        color: isSubDamaged ? '#f87171' : '#34d399',
                        marginTop: '2px',
                      }}
                    >
                      {isSubDamaged ? 'Broken' : 'Fine'}
                    </span>
                    {isCurrent && (
                      <span style={{ fontSize: '9px', color: '#38bdf8', fontWeight: 700, marginTop: '2px' }}>
                        &bull; Active Unit
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
