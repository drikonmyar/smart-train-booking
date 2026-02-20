import React, { useEffect, useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useUser } from '../context/UserContext';

const StationsPage = () => {
    const { user } = useUser();
    const isAdmin = (user?.role || '').toUpperCase() === 'ADMIN';

    const [query, setQuery] = useState('');
    const [stations, setStations] = useState([]);
    const [filteredStations, setFilteredStations] = useState([]);
    const [loading, setLoading] = useState(false);

    const [newStation, setNewStation] = useState({ name: '', code: '' });
    const [creating, setCreating] = useState(false);

    /* -------- DATE FILTERS -------- */
    const [createdFrom, setCreatedFrom] = useState(null);
    const [createdTo, setCreatedTo] = useState(null);
    const [modifiedFrom, setModifiedFrom] = useState(null);
    const [modifiedTo, setModifiedTo] = useState(null);

    const formatDateParam = (date) => {
        if (!date) return null;

        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');

        return `${y}-${m}-${d}`;
    };

    const formatDateTime = (value) => {
        if (!value) return '-';
        const [datePart, timePartRaw] = String(value).split('T');
        if (!datePart || !timePartRaw) return '-';
        const timePart = timePartRaw.slice(0, 8);
        return `${datePart} ${timePart}`;
    };

    /* ---------------- FETCH STATIONS ---------------- */

    const fetchStations = async (
        q = query,
        cf = createdFrom,
        ct = createdTo,
        mf = modifiedFrom,
        mt = modifiedTo
    ) => {
        if (!isAdmin) return;
        setLoading(true);
        try {
            const params = new URLSearchParams();

            if (q) params.append('q', q);
            if (cf) params.append('createdFrom', formatDateParam(cf));
            if (ct) params.append('createdTo', formatDateParam(ct));
            if (mf) params.append('modifiedFrom', formatDateParam(mf));
            if (mt) params.append('modifiedTo', formatDateParam(mt));

            const res = await fetch(`/api/stations/search?${params.toString()}`);
            const data = await res.json();

            setStations(data);
            setFilteredStations(data);
        } catch (err) {
            console.error('Failed to fetch stations', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!isAdmin) return;
        fetchStations();
    }, [isAdmin]);

    /* ---------------- FILTER LOGIC ---------------- */

    useEffect(() => {
        if (!isAdmin) return;
        fetchStations();
    }, [isAdmin, query, createdFrom, createdTo, modifiedFrom, modifiedTo]);

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
                headers: {
                    'Content-Type': 'application/json',
                    'X-User-Role': user?.role || ''
                },
                body: JSON.stringify(newStation)
            });

            if (!res.ok) throw new Error();

            setNewStation({ name: '', code: '' });
            fetchStations(query);
        } catch {
            alert('Failed to create station');
        } finally {
            setCreating(false);
        }
    };

    /* ---------------- EDIT ---------------- */

    const [showEditModal, setShowEditModal] = useState(false);
    const [editingStation, setEditingStation] = useState(null);
    const [editForm, setEditForm] = useState({ name: '', code: '' });

    const updateStation = async () => {
        if (!editForm.name || !editForm.code) {
            alert('Station name and code are required');
            return;
        }

        try {
            const res = await fetch(`/api/stations/${editingStation.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-User-Role': user?.role || ''
                },
                body: JSON.stringify(editForm)
            });

            if (!res.ok) throw new Error();

            setShowEditModal(false);
            fetchStations(query);
        } catch {
            alert('Failed to update station');
        }
    };

    if (!user) {
        return (
            <div className="container py-5">
                <div className="alert alert-warning mt-5">
                    Please login as an admin to access Station management.
                </div>
            </div>
        );
    }

    if (!isAdmin) {
        return (
            <div className="container py-5">
                <div className="alert alert-danger mt-5">
                    Access denied. Only ADMIN users can access this page.
                </div>
            </div>
        );
    }

    return (
        <div style={{
            minHeight: '90vh',
            width: '100vw',
            display: 'flex',
            justifyContent: 'center',
            background: '#f8f9fa',
            paddingTop: 30
        }}>
            <div style={{ width: '100%', maxWidth: 1000 }}>

                <h3 className="mb-4 text-center">Station Management</h3>

                {/* ---------- SEARCH & DATE FILTERS ---------- */}
                <div className="card p-3 mb-4">
                    <h5 className="mb-3">Search Station</h5>

                    <div className="row g-3 align-items-end">

                        {/* Text Search */}
                        <div className="col-md-4">
                            <label className="form-label">Station Name or Code</label>
                            <input
                                className="form-control"
                                placeholder="Type station name or code"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                            />
                        </div>

                        {/* Created From */}
                        <div className="col-md-2">
                            <label className="form-label">Created From</label>
                            <DatePicker
                                selected={createdFrom}
                                onChange={(date) => {
                                    setCreatedFrom(date);
                                    if (createdTo && date && date > createdTo) {
                                        setCreatedTo(null);
                                    }
                                }}
                                className="form-control"
                                dateFormat="yyyy-MM-dd"
                                placeholderText="From"
                            />
                        </div>

                        {/* Created To */}
                        <div className="col-md-2">
                            <label className="form-label">Created To</label>
                            <DatePicker
                                selected={createdTo}
                                onChange={setCreatedTo}
                                minDate={createdFrom}
                                className="form-control"
                                dateFormat="yyyy-MM-dd"
                                placeholderText="To"
                            />
                        </div>

                        {/* Modified From */}
                        <div className="col-md-2">
                            <label className="form-label">Modified From</label>
                            <DatePicker
                                selected={modifiedFrom}
                                onChange={(date) => {
                                    setModifiedFrom(date);
                                    if (modifiedTo && date && date > modifiedTo) {
                                        setModifiedTo(null);
                                    }
                                }}
                                className="form-control"
                                dateFormat="yyyy-MM-dd"
                                placeholderText="From"
                            />
                        </div>

                        {/* Modified To */}
                        <div className="col-md-2">
                            <label className="form-label">Modified To</label>
                            <DatePicker
                                selected={modifiedTo}
                                onChange={setModifiedTo}
                                minDate={modifiedFrom}
                                className="form-control"
                                dateFormat="yyyy-MM-dd"
                                placeholderText="To"
                            />
                        </div>

                    </div>
                </div>

                {/* -------- CREATE -------- */}
                <div className="card p-3 mb-4">
                    <h5>Create New Station</h5>
                    <div className="row g-3">
                        <div className="col-md-6">
                            <label>Name</label>
                            <input
                                className="form-control"
                                value={newStation.name}
                                onChange={e => setNewStation(p => ({ ...p, name: e.target.value }))}
                            />
                        </div>
                        <div className="col-md-4">
                            <label>Code</label>
                            <input
                                className="form-control"
                                value={newStation.code}
                                onChange={e => setNewStation(p => ({
                                    ...p,
                                    code: e.target.value.toUpperCase()
                                }))}
                            />
                        </div>
                        <div className="col-md-2 d-flex align-items-end">
                            <button
                                className="btn btn-success w-100"
                                onClick={createStation}
                                disabled={creating}
                            >
                                Create
                            </button>
                        </div>
                    </div>
                </div>

                {/* -------- TABLE -------- */}
                <div style={{ maxHeight: 420, overflow: 'auto' }}>
                    <table className="table table-bordered table-striped">
                        <thead className="table-dark sticky-top">
                            <tr>
                                <th>ID</th>
                                <th>Name</th>
                                <th>Code</th>
                                <th>Created At</th>
                                <th>Modified At</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="6" className="text-center">Loading...</td></tr>
                            ) : filteredStations.length === 0 ? (
                                <tr><td colSpan="6" className="text-center">No stations found</td></tr>
                            ) : (
                                filteredStations.map(s => (
                                    <tr key={s.id}>
                                        <td>{s.id}</td>
                                        <td>{s.name}</td>
                                        <td>{s.code}</td>
                                        <td>{formatDateTime(s.createdAt)}</td>
                                        <td>{formatDateTime(s.modifiedDate)}</td>
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

                {/* -------- EDIT MODAL -------- */}
                {showEditModal && (
                    <div className="modal fade show d-block" style={{ background: 'rgba(0,0,0,.5)' }}>
                        <div className="modal-dialog modal-dialog-centered">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5>Edit Station</h5>
                                    <button className="btn-close" onClick={() => setShowEditModal(false)} />
                                </div>
                                <div className="modal-body">
                                    <label>Name</label>
                                    <input
                                        className="form-control mb-2"
                                        value={editForm.name}
                                        onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
                                    />
                                    <label>Code</label>
                                    <input
                                        className="form-control"
                                        value={editForm.code}
                                        onChange={e => setEditForm(p => ({
                                            ...p,
                                            code: e.target.value.toUpperCase()
                                        }))}
                                    />
                                </div>
                                <div className="modal-footer">
                                    <button className="btn btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
                                    <button className="btn btn-primary" onClick={updateStation}>Save</button>
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
