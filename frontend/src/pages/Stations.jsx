import React, { useEffect, useState } from 'react';

const StationsPage = () => {
    const [query, setQuery] = useState('');
    const [stations, setStations] = useState([]);
    const [loading, setLoading] = useState(false);

    const [newStation, setNewStation] = useState({
        name: '',
        code: ''
    });

    const [creating, setCreating] = useState(false);

    /* ---------------- FETCH STATIONS ---------------- */

    const fetchStations = async (q = '') => {
        setLoading(true);
        try {
            const res = await fetch(`/api/stations/search?q=${q}`);
            const data = await res.json();
            setStations(data);
        } catch (err) {
            console.error('Failed to fetch stations', err);
        } finally {
            setLoading(false);
        }
    };

    /* Load all stations initially */
    useEffect(() => {
        fetchStations();
    }, []);

    /* ---------------- CREATE STATION ---------------- */

    const createStation = async () => {
        if (!newStation.name || !newStation.code) {
            alert('Station name and code are required');
            return;
        }

        setCreating(true);
        try {
            const res = await fetch('/api/stations/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newStation)
            });

            if (!res.ok) {
                throw new Error('Create failed');
            }

            setNewStation({ name: '', code: '' });
            fetchStations(query); // refresh list
        } catch (err) {
            console.error('Failed to create station', err);
            alert('Failed to create station');
        } finally {
            setCreating(false);
        }
    };

    const [showEditModal, setShowEditModal] = useState(false);
    const [editingStation, setEditingStation] = useState(null);
    const [editForm, setEditForm] = useState({
        name: '',
        code: ''
    });

    const updateStation = async () => {
        if (!editForm.name || !editForm.code) {
            alert('Station name and code are required');
            return;
        }

        try {
            const res = await fetch(`/api/stations/${editingStation.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editForm)
            });

            if (!res.ok) {
                throw new Error('Update failed');
            }

            setShowEditModal(false);
            setEditingStation(null);
            fetchStations(query);
        } catch (err) {
            console.error(err);
            alert('Failed to update station');
        }
    };

    return (
        <div style={{
            minHeight: '90vh',
            width: '100vw',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#f8f9fa',
        }}>
            <div style={{ width: '100%', maxWidth: 900 }}>
                <h3 className="mb-4 text-center">Station Management</h3>

                {/* ---------- SEARCH ---------- */}
                <div className="card p-3 mb-4">
                    <label className="mb-1">Search Station</label>
                    <input
                        className="form-control"
                        placeholder="Type station name or code"
                        value={query}
                        onChange={(e) => {
                            const val = e.target.value;
                            setQuery(val);
                            fetchStations(val);
                        }}
                    />
                </div>

                {/* ---------- CREATE STATION ---------- */}
                <div className="card p-3 mb-4">
                    <h5 className="mb-3">Create New Station</h5>

                    <div className="row g-3">
                        <div className="col-md-6">
                            <label>Station Name</label>
                            <input
                                className="form-control"
                                value={newStation.name}
                                onChange={(e) =>
                                    setNewStation(prev => ({ ...prev, name: e.target.value }))
                                }
                            />
                        </div>

                        <div className="col-md-4">
                            <label>Station Code</label>
                            <input
                                className="form-control"
                                value={newStation.code}
                                onChange={(e) =>
                                    setNewStation(prev => ({
                                        ...prev,
                                        code: e.target.value.toUpperCase()
                                    }))
                                }
                            />
                        </div>

                        <div className="col-md-2 d-flex align-items-end">
                            <button
                                className="btn btn-success w-100"
                                onClick={createStation}
                                disabled={creating}
                            >
                                {creating ? 'Creating...' : 'Create'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* ---------- TABLE ---------- */}
                <div
                    style={{
                        maxHeight: 400,
                        overflow: 'auto',
                        border: '1px solid #ddd',
                        borderRadius: 6
                    }}
                >
                    <table className="table table-bordered table-striped mb-0">
                        <thead className="table-dark" style={{ position: 'sticky', top: 0 }}>
                            <tr>
                                <th>ID</th>
                                <th>Name</th>
                                <th>Code</th>
                                <th>Created At</th>
                                <th>Modified At</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="text-center">Loading...</td>
                                </tr>
                            ) : stations.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="text-center">No stations found</td>
                                </tr>
                            ) : (
                                stations.map(s => (
                                    <tr key={s.id}>
                                        <td>{s.id}</td>
                                        <td className="text-truncate" style={{ maxWidth: 200 }}>
                                            {s.name}
                                        </td>
                                        <td>{s.code}</td>
                                        <td>
                                            {new Date(s.createdAt)
                                                .toISOString()
                                                .slice(0, 19)
                                                .replace('T', ' ')}
                                        </td>
                                        <td>
                                            {new Date(s.modifiedDate)
                                                .toISOString()
                                                .slice(0, 19)
                                                .replace('T', ' ')}
                                        </td>
                                        <td className="text-center">
                                            <button
                                                className="btn btn-sm btn-outline-primary"
                                                onClick={() => {
                                                    setEditingStation(s);
                                                    setEditForm({ name: s.name, code: s.code });
                                                    setShowEditModal(true);
                                                }}
                                            >
                                                ✏️
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                {showEditModal && (
                    <div
                        className="modal fade show d-block"
                        style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
                    >
                        <div className="modal-dialog modal-dialog-centered">
                            <div className="modal-content">

                                <div className="modal-header">
                                    <h5 className="modal-title">Edit Station</h5>
                                    <button
                                        className="btn-close"
                                        onClick={() => setShowEditModal(false)}
                                    />
                                </div>

                                <div className="modal-body">
                                    <div className="mb-3">
                                        <label className="form-label">Station Name</label>
                                        <input
                                            className="form-control"
                                            value={editForm.name}
                                            onChange={(e) =>
                                                setEditForm(prev => ({
                                                    ...prev,
                                                    name: e.target.value
                                                }))
                                            }
                                        />
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label">Station Code</label>
                                        <input
                                            className="form-control"
                                            value={editForm.code}
                                            onChange={(e) =>
                                                setEditForm(prev => ({
                                                    ...prev,
                                                    code: e.target.value.toUpperCase()
                                                }))
                                            }
                                        />
                                    </div>
                                </div>

                                <div className="modal-footer">
                                    <button
                                        className="btn btn-secondary"
                                        onClick={() => setShowEditModal(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        className="btn btn-primary"
                                        onClick={updateStation}
                                    >
                                        Save Changes
                                    </button>
                                </div>

                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StationsPage;