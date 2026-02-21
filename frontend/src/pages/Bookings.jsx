import React, { useEffect, useRef, useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useUser } from '../context/UserContext';

const BookingsPage = () => {
    const { user } = useUser();
    const isAdmin = (user?.role || '').toUpperCase() === 'ADMIN';

    const [filters, setFilters] = useState({
        bookingFromDate: null,
        bookingToDate: null,
        travelFromDate: null,
        travelToDate: null,
        username: '',
        trainNumber: '',
        status: '',
        minSeatsBooked: '',
        maxSeatsBooked: '',
        sourceStation: '',
        destinationStation: ''
    });

    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [sourceSuggestions, setSourceSuggestions] = useState([]);
    const [destSuggestions, setDestSuggestions] = useState([]);
    const [showSourceDropdown, setShowSourceDropdown] = useState(false);
    const [showDestDropdown, setShowDestDropdown] = useState(false);

    const sourceRef = useRef(null);
    const destRef = useRef(null);

    /* ----------------- COMMON HANDLERS ----------------- */

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const searchStations = async (query, setter) => {
        try {
            const res = await fetch(`/api/stations/search?q=${query || ''}`);
            const data = await res.json();
            setter(data);
        } catch (err) {
            console.error('Station search failed', err);
        }
    };

    const fetchBookings = async () => {
        if (!isAdmin) return;
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/bookings/getall', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-User-Role': user?.role || ''
                },
                body: JSON.stringify({
                    bookingFromDate: filters.bookingFromDate || null,
                    bookingToDate: filters.bookingToDate || null,
                    travelFromDate: filters.travelFromDate || null,
                    travelToDate: filters.travelToDate || null,
                    username: filters.username || null,
                    trainNumber: filters.trainNumber || null,
                    status: filters.status || null,
                    minSeatsBooked: filters.minSeatsBooked || null,
                    maxSeatsBooked: filters.maxSeatsBooked || null,
                    sourceStation: filters.sourceStation || null,
                    destinationStation: filters.destinationStation || null
                })
            });

            if (!res.ok) {
                const payload = await res.json().catch(() => null);
                setError(payload?.message || 'Failed to fetch bookings');
                setBookings([]);
                return;
            }

            const data = await res.json();
            setBookings(Array.isArray(data) ? data : []);
        } catch {
            setError('Failed to fetch bookings');
            setBookings([]);
        } finally {
            setLoading(false);
        }
    };

    const formatBookingDate = (dateStr) => {
        const date = new Date(dateStr);

        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');

        const time = date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        });

        return `${yyyy}-${mm}-${dd} ${time}`;
    };

    /* --------- CLOSE DROPDOWNS ON OUTSIDE CLICK --------- */

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (sourceRef.current && !sourceRef.current.contains(e.target)) {
                setShowSourceDropdown(false);
            }
            if (destRef.current && !destRef.current.contains(e.target)) {
                setShowDestDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (!user) {
        return (
            <div className="container py-5">
                <div className="alert alert-warning mt-5">
                    Please login as an admin to access Bookings management.
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
        <div className="container-fluid mt-4">
            <div className="row justify-content-center">
                <div className="col-12 col-xl-10">

                    <h3 className="mb-3 text-center">Admin Booking Search</h3>
                    {error && (
                        <div className="alert alert-danger py-2">{error}</div>
                    )}

                    {/* FILTERS */}
                    <div className="card p-3 mb-4">
                        <div className="row g-3">

                            {/* DATE FILTERS */}
                            <div className="col-md-3">
                                <label className="form-label mb-1">Booking From</label>
                                <DatePicker
                                    selected={
                                        filters.bookingFromDate
                                            ? new Date(filters.bookingFromDate)
                                            : null
                                    }
                                    onChange={(date) =>
                                        setFilters(prev => ({
                                            ...prev,
                                            bookingFromDate: date
                                                ? date.toLocaleDateString('en-CA') // yyyy-MM-dd
                                                : ''
                                        }))
                                    }
                                    className="form-control w-100"
                                    wrapperClassName="w-100"
                                    dateFormat="yyyy-MM-dd"
                                    placeholderText="Select date"
                                    maxDate={filters.bookingToDate}
                                    isClearable
                                />
                            </div>

                            <div className="col-md-3">
                                <label className="form-label mb-1">Booking To</label>
                                <DatePicker
                                    selected={
                                        filters.bookingToDate
                                            ? new Date(filters.bookingToDate)
                                            : null
                                    }
                                    onChange={(date) =>
                                        setFilters(prev => ({
                                            ...prev,
                                            bookingToDate: date
                                                ? date.toLocaleDateString('en-CA') // yyyy-MM-dd
                                                : ''
                                        }))
                                    }
                                    className="form-control w-100"
                                    wrapperClassName="w-100"
                                    dateFormat="yyyy-MM-dd"
                                    placeholderText="Select date"
                                    minDate={filters.bookingFromDate}
                                    isClearable
                                />
                            </div>

                            <div className="col-md-3">
                                <label className="form-label mb-1">Travel From</label>
                                <DatePicker
                                    selected={
                                        filters.travelFromDate
                                            ? new Date(filters.travelFromDate)
                                            : null
                                    }
                                    onChange={(date) =>
                                        setFilters(prev => ({
                                            ...prev,
                                            travelFromDate: date
                                                ? date.toLocaleDateString('en-CA') // yyyy-MM-dd
                                                : ''
                                        }))
                                    }
                                    className="form-control w-100"
                                    wrapperClassName="w-100"
                                    dateFormat="yyyy-MM-dd"
                                    placeholderText="Select date"
                                    maxDate={filters.travelToDate}
                                    isClearable
                                />
                            </div>

                            <div className="col-md-3">
                                <label className="form-label mb-1">Travel To</label>
                                <DatePicker
                                    selected={
                                        filters.travelToDate
                                            ? new Date(filters.travelToDate)
                                            : null
                                    }
                                    onChange={(date) =>
                                        setFilters(prev => ({
                                            ...prev,
                                            travelToDate: date
                                                ? date.toLocaleDateString('en-CA') // yyyy-MM-dd
                                                : ''
                                        }))
                                    }
                                    className="form-control w-100"
                                    wrapperClassName="w-100"
                                    dateFormat="yyyy-MM-dd"
                                    placeholderText="Select date"
                                    minDate={filters.travelFromDate}
                                    isClearable
                                />
                            </div>

                            {/* SOURCE STATION */}
                            <div className="col-md-3 position-relative" ref={sourceRef}>
                                <label>Source Station</label>
                                <input
                                    className="form-control"
                                    value={filters.sourceStation}
                                    name="sourceStation"
                                    placeholder="Type source station"
                                    onFocus={() => {
                                        setShowSourceDropdown(true);
                                        searchStations(filters.sourceStation, setSourceSuggestions);
                                    }}
                                    onChange={(e) => {
                                        handleChange(e);
                                        setShowSourceDropdown(true);
                                        searchStations(e.target.value, setSourceSuggestions);
                                    }}
                                />

                                {showSourceDropdown && sourceSuggestions.length > 0 && (
                                    <ul
                                        className="dropdown-menu show"
                                        style={{
                                            position: 'absolute',
                                            top: '100%',
                                            left: 0,
                                            width: '100%',
                                            maxHeight: '200px',
                                            overflowY: 'auto',
                                            overflowX: 'hidden',
                                            zIndex: 1000
                                        }}
                                    >
                                        {sourceSuggestions.map(s => (
                                            <li key={s.id}>
                                                <button
                                                    type="button"
                                                    className="dropdown-item"
                                                    style={{
                                                        whiteSpace: 'nowrap',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis'
                                                    }}
                                                    onClick={() => {
                                                        setFilters(prev => ({ ...prev, sourceStation: s.name }));
                                                        setShowSourceDropdown(false);
                                                    }}
                                                >
                                                    {s.name} ({s.code})
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            {/* DESTINATION STATION */}
                            <div className="col-md-3 position-relative" ref={destRef}>
                                <label>Destination Station</label>
                                <input
                                    className="form-control"
                                    value={filters.destinationStation}
                                    name="destinationStation"
                                    placeholder="Type destination station"
                                    onFocus={() => {
                                        setShowDestDropdown(true);
                                        searchStations(filters.destinationStation, setDestSuggestions);
                                    }}
                                    onChange={(e) => {
                                        handleChange(e);
                                        setShowDestDropdown(true);
                                        searchStations(e.target.value, setDestSuggestions);
                                    }}
                                />

                                {showDestDropdown && destSuggestions.length > 0 && (
                                    <ul
                                        className="dropdown-menu show"
                                        style={{
                                            position: 'absolute',
                                            top: '100%',
                                            left: 0,
                                            width: '100%',
                                            maxHeight: '200px',
                                            overflowY: 'auto',
                                            overflowX: 'hidden',
                                            zIndex: 1000
                                        }}
                                    >
                                        {destSuggestions.map(s => (
                                            <li key={s.id}>
                                                <button
                                                    type="button"
                                                    className="dropdown-item"
                                                    style={{
                                                        whiteSpace: 'nowrap',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis'
                                                    }}
                                                    onClick={() => {
                                                        setFilters(prev => ({ ...prev, destinationStation: s.name }));
                                                        setShowDestDropdown(false);
                                                    }}
                                                >
                                                    {s.name} ({s.code})
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            {/* OTHER FILTERS */}
                            <div className="col-md-3">
                                <label>Username</label>
                                <input name="username" className="form-control" onChange={handleChange} />
                            </div>

                            <div className="col-md-3">
                                <label>Train Number</label>
                                <input name="trainNumber" className="form-control" onChange={handleChange} />
                            </div>

                            <div className="col-md-3">
                                <label>Status</label>
                                <select name="status" className="form-control" onChange={handleChange}>
                                    <option value="">All</option>
                                    <option value="BOOKED">BOOKED</option>
                                    <option value="CANCELLED">CANCELLED</option>
                                    <option value="TERMINATED">TERMINATED</option>
                                </select>
                            </div>

                            <div className="col-md-3">
                                <label>Seats (Min)</label>
                                <input type="number" name="minSeatsBooked" className="form-control" onChange={handleChange} />
                            </div>

                            <div className="col-md-3">
                                <label>Seats (Max)</label>
                                <input type="number" name="maxSeatsBooked" className="form-control" onChange={handleChange} />
                            </div>

                            <div className="col-12 text-end mt-3">
                                <button className="btn btn-primary" onClick={fetchBookings}>
                                    Search
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* RESULTS TABLE */}
                    <div className="card">
                        <div style={{ maxHeight: 400, overflow: 'auto' }}>
                            <table className="table table-bordered table-striped mb-0">
                                <thead className="table-dark sticky-top">
                                    <tr>
                                        <th>ID</th>
                                        <th>User</th>
                                        <th>Train</th>
                                        <th>Source</th>
                                        <th>Destination</th>
                                        <th>Travel Date</th>
                                        <th>Seats</th>
                                        <th>Status</th>
                                        <th>Booking Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr><td colSpan="9" className="text-center">Loading...</td></tr>
                                    ) : bookings.length === 0 ? (
                                        <tr><td colSpan="9" className="text-center">No bookings found</td></tr>
                                    ) : bookings.map(b => (
                                        <tr key={b.bookingId}>
                                            <td>{b.bookingId}</td>
                                            <td>{b.user?.username}</td>
                                            <td>{b.train?.trainNumber}</td>
                                            <td>{b.sourceStation?.name}</td>
                                            <td>{b.destinationStation?.name}</td>
                                            <td>{b.travelDate}</td>
                                            <td>{b.seatsBooked}</td>
                                            <td>{b.status}</td>
                                            <td>{formatBookingDate(b.bookingDate)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default BookingsPage;
