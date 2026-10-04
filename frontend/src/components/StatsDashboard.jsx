import React, { useState, useEffect } from 'react';
import { fetchStatsOverview, fetchStatsByBuilding, fetchStatsByDepartment } from '../services/api';
import { BarChart3, ShieldCheck, AlertTriangle, Building, Layers } from 'lucide-react';

export default function StatsDashboard() {
  const [overview, setOverview] = useState(null);
  const [buildings, setBuildings] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [ovRes, bRes, dRes] = await Promise.all([
          fetchStatsOverview(),
          fetchStatsByBuilding(),
          fetchStatsByDepartment(),
        ]);
        if (ovRes.data) setOverview(ovRes.data);
        if (bRes.data) setBuildings(bRes.data);
        if (dRes.data) setDepartments(dRes.data.slice(0, 8)); // Top 8
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="glass-card" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
        Loading municipal asset analytics...
      </div>
    );
  }

  const physical = overview?.physicalItems || { total: 0, usable: 0, damaged: 0, healthRatePercent: 100 };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div className="glass-card" style={{ borderLeft: '4px solid #38bdf8' }}>
          <div style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
            Total Asset Records
          </div>
          <div style={{ fontSize: '32px', fontWeight: 800, marginTop: '4px' }}>
            {overview?.totalAssetRecords || 0}
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
            Unique physical QR asset units
          </div>
        </div>

        <div className="glass-card" style={{ borderLeft: '4px solid #34d399' }}>
          <div style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
            Usable Physical Items
          </div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: '#34d399', marginTop: '4px' }}>
            {physical.usable}
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
            {physical.healthRatePercent}% Operational condition
          </div>
        </div>

        <div className="glass-card" style={{ borderLeft: '4px solid #f43f5e' }}>
          <div style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
            Damaged / Broken Items
          </div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: '#f43f5e', marginTop: '4px' }}>
            {physical.damaged}
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
            Requiring maintenance or replacement
          </div>
        </div>

        <div className="glass-card" style={{ borderLeft: '4px solid #60a5fa' }}>
          <div style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
            Total Physical Assets
          </div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: '#60a5fa', marginTop: '4px' }}>
            {physical.total}
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
            Chairs, Desks, Cupboards, Racks
          </div>
        </div>
      </div>

      {/* Buildings & Departments Visual Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div className="glass-card">
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Building size={16} color="#38bdf8" /> Top Buildings & Wards
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {buildings.slice(0, 6).map((b) => {
              const pct = Math.round((b.totalPhysicalQty / (physical.total || 1)) * 100);
              return (
                <div key={b._id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 600 }}>{b._id}</span>
                    <span style={{ color: '#94a3b8' }}>{b.totalPhysicalQty} items ({pct}%)</span>
                  </div>
                  <div style={{ height: '6px', background: '#0f172a', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, #2563eb, #06b6d4)' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="glass-card">
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={16} color="#38bdf8" /> Top Municipal Departments
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {departments.map((d) => {
              const pct = Math.round((d.totalPhysicalQty / (physical.total || 1)) * 100);
              return (
                <div key={d._id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 600 }}>{d._id}</span>
                    <span style={{ color: '#94a3b8' }}>{d.totalPhysicalQty} items</span>
                  </div>
                  <div style={{ height: '6px', background: '#0f172a', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(pct * 4, 100)}%`, height: '100%', background: 'linear-gradient(90deg, #10b981, #06b6d4)' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
