import React, { useState, useEffect } from 'react';
import { fetchItems, fetchBuildings, fetchDepartments } from '../services/api';
import { Search, Filter, Printer, ExternalLink, RefreshCw } from 'lucide-react';

export default function AssetTable({ onSelectAsset }) {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [loading, setLoading] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [building, setBuilding] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');

  // Dropdown options
  const [buildingsList, setBuildingsList] = useState([]);

  useEffect(() => {
    loadBuildings();
  }, []);

  useEffect(() => {
    loadItems();
  }, [page, building, category, status]);

  const loadBuildings = async () => {
    try {
      const res = await fetchBuildings();
      if (res.data) setBuildingsList(res.data);
    } catch (e) {
      // ignore
    }
  };

  const loadItems = async () => {
    setLoading(true);
    try {
      const res = await fetchItems({
        page,
        limit,
        search,
        building,
        category,
        status,
      });
      if (res.data) {
        setItems(res.data);
        setTotal(res.total || 0);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    loadItems();
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="glass-card">
      <div className="table-header-controls">
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 800 }}>Municipal Asset Directory</h2>
          <div style={{ fontSize: '13px', color: '#94a3b8' }}>
            Browse and filter all {total} individual physical units across MBMC offices
          </div>
        </div>

        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px' }}>
          <div className="search-input-wrapper" style={{ width: '280px' }}>
            <Search size={14} className="search-icon-left" />
            <input
              type="text"
              placeholder="Search tag, model, office, lot..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-secondary">
            Filter
          </button>
        </form>
      </div>

      <div className="filters-group" style={{ marginBottom: '18px' }}>
        <select
          className="select-filter"
          value={building}
          onChange={(e) => {
            setBuilding(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All Buildings & Wards</option>
          {buildingsList.map((b) => (
            <option key={b._id} value={b._id}>
              {b._id} ({b.count})
            </option>
          ))}
        </select>

        <select
          className="select-filter"
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All Categories</option>
          <option value="Seating">Seating (Chairs)</option>
          <option value="Desks & Tables">Desks & Tables</option>
          <option value="Storage">Storage (Cupboards/Racks)</option>
          <option value="Fixtures & Stands">Fixtures & Stands</option>
        </select>

        <select
          className="select-filter"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All Condition Statuses</option>
          <option value="Operational">Operational (Fine)</option>
          <option value="Damaged">Damaged (Broken)</option>
          <option value="Under Repair">Under Repair</option>
        </select>

        <button
          className="btn btn-secondary"
          onClick={() => {
            setSearch('');
            setBuilding('');
            setCategory('');
            setStatus('');
            setPage(1);
          }}
          title="Reset Filters"
        >
          <RefreshCw size={14} /> Reset
        </button>
      </div>

      <div className="custom-table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Asset Tag</th>
              <th>Unit</th>
              <th>Item Name</th>
              <th>Department / Floor</th>
              <th>Condition</th>
              <th>Office Lot</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                  Loading municipal assets...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                  No assets match the filter criteria.
                </td>
              </tr>
            ) : (
              items.map((item) => {
                const isDamaged = item.status === 'Damaged' || item.status === 'Partially Damaged';
                const statusColor = isDamaged ? '#f43f5e' : '#34d399';

                return (
                  <tr key={item._id}>
                    <td>
                      <span className="table-code">{item.assetCode}</span>
                    </td>
                    <td>
                      <span
                        style={{
                          fontFamily: 'monospace',
                          fontSize: '11px',
                          color: '#facc15',
                          background: '#0f172a',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          border: '1px solid #334155',
                          fontWeight: 700,
                        }}
                      >
                        {item.unitLabel || 'Unit ' + (item.unitNumber || 1)}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: '#fff' }}>{item.nameEnglish}</div>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>{item.nameMarathi}</div>
                    </td>
                    <td>
                      <div>{item.departmentEnglish}</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>
                        {item.floorEnglish} &bull; {item.buildingEnglish}
                      </div>
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: '11px',
                          padding: '3px 8px',
                          borderRadius: '12px',
                          fontWeight: 700,
                          background: `${statusColor}22`,
                          color: statusColor,
                          border: `1px solid ${statusColor}44`,
                        }}
                      >
                        {isDamaged ? 'Broken (Damaged)' : 'Fine (Operational)'}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#94a3b8' }}>
                        {item.lotCode || '-'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '4px 8px', fontSize: '11px' }}
                          onClick={() => onSelectAsset(item)}
                          title="Inspect Unit and Office Inventory"
                        >
                          <ExternalLink size={12} /> Inspect
                        </button>
                        <a
                          href={`/api/qr/${item.assetCode}/label`}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-secondary"
                          style={{ padding: '4px 8px', fontSize: '11px' }}
                          title="Print Tag"
                        >
                          <Printer size={12} />
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="pagination-controls">
        <span>
          Showing page <strong>{page}</strong> of <strong>{totalPages}</strong> ({total} total assets)
        </span>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className="btn btn-secondary"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </button>
          <button
            className="btn btn-secondary"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
