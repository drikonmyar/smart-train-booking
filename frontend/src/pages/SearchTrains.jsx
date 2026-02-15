import { useState, useEffect, useRef } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useUser } from '../context/UserContext';

export default function SearchTrains() {
    const [form, setForm] = useState({
        sourceStationName: '',
        destinationStationName: '',
        travelDate: null
    });
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showBookingForm, setShowBookingForm] = useState(false);
    const [selectedTrain, setSelectedTrain] = useState(null);
    const [seatsBooked, setSeatsBooked] = useState(1);
    const [sourceSuggestions, setSourceSuggestions] = useState([]);
    const [destSuggestions, setDestSuggestions] = useState([]);
    const [showSourceDropdown, setShowSourceDropdown] = useState(false);
    const [showDestDropdown, setShowDestDropdown] = useState(false);
    const sourceRef = useRef(null);
    const destinationRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                sourceRef.current &&
                !sourceRef.current.contains(event.target)
            ) {
                setShowSourceDropdown(false);
            }

            if (
                destinationRef.current &&
                !destinationRef.current.contains(event.target)
            ) {
                setShowDestDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const searchStations = async (query, setter) => {
        try {
            const response = await fetch(`/api/stations/search?q=${query || ''}`);
            if (response.ok) {
                const data = await response.json();
                setter(Array.isArray(data) ? data : []);
            }
        } catch {
            setter([]);
        }
    };

    const formatDate = (date) => date.toLocaleDateString('en-CA');

    const normalizeStationName = (value) => (value || '').trim().toLowerCase();

    const isSameStation = (left, right) =>
        normalizeStationName(left) !== '' &&
        normalizeStationName(left) === normalizeStationName(right);

    const formatDateTime = (value) => {
        if (!value) return '-';

        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
            return value;
        }

        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        const hh = String(date.getHours()).padStart(2, '0');
        const min = String(date.getMinutes()).padStart(2, '0');

        return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
    };

    const handleDateChange = (date) => {
        setForm({ ...form, travelDate: date });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setResults([]);
        try {
            const payload = {
                ...form,
                travelDate: form.travelDate ? formatDate(form.travelDate) : ''
            };
            const response = await fetch('/api/trains/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (response.ok) {
                const data = await response.json();
                setResults(Array.isArray(data) ? data : []);
            } else {
                setError('No trains found or server error.');
            }
        } catch (err) {
            setError('Network error.');
        } finally {
            setLoading(false);
        }
    };

    const { user } = useUser();
    const openBookingForm = (train) => {
        if (!user) {
            alert('Please login to book a train');
            return;
        }
        setSelectedTrain(train);
        setSeatsBooked(1);
        setShowBookingForm(true);
    };

    const confirmBooking = async () => {
        try {
            const response = await fetch('/api/bookings/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.id,
                    trainId: selectedTrain.trainId,
                    sourceStationName: selectedTrain.sourceStation,
                    destinationStationName: selectedTrain.destinationStation,
                    travelDate: formatDate(form.travelDate),
                    seatsBooked: seatsBooked
                })
            });

            if (response.ok) {
                alert('Train booked successfully');
                setShowBookingForm(false);
            } else {
                const err = await response.text();
                alert(err || 'Booking failed');
            }
        } catch {
            alert('Server error while booking');
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
                <h3 className="mb-4 text-center">Search Trains</h3>
                <form className="row g-3 mb-4 justify-content-center" onSubmit={handleSubmit}>
                    <div className="col-md-3 position-relative" ref={sourceRef}>
                        <label className="form-label">Source Station</label>

                        <input
                            type="text"
                            className="form-control"
                            value={form.sourceStationName}
                            placeholder="Type source station"
                            onFocus={() => {
                                setShowSourceDropdown(true);
                                searchStations(form.sourceStationName, setSourceSuggestions);
                            }}
                            onChange={(e) => {
                                const value = e.target.value;
                                setForm({ ...form, sourceStationName: value });
                                setShowSourceDropdown(true);
                                searchStations(value, setSourceSuggestions);
                            }}
                            required
                        />

                        {showSourceDropdown && sourceSuggestions.length > 0 && (
                            <ul
                                className="dropdown-menu show w-100"
                                style={{
                                    maxHeight: '220px',
                                    overflowY: 'auto',
                                    overflowX: 'hidden'
                                }}
                            >
                                {sourceSuggestions.map(station => {
                                    const isDisabled = isSameStation(
                                        station.name,
                                        form.destinationStationName
                                    );

                                    return (
                                        <li key={station.id}>
                                        <button
                                            type="button"
                                            className={`dropdown-item text-truncate${isDisabled ? ' disabled' : ''}`}
                                            disabled={isDisabled}
                                            style={{
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                maxWidth: '100%',
                                                opacity: isDisabled ? 0.6 : 1,
                                                cursor: isDisabled ? 'not-allowed' : 'pointer'
                                            }}
                                            onClick={() => {
                                                if (isDisabled) return;
                                                setForm({ ...form, sourceStationName: station.name });
                                                setShowSourceDropdown(false);
                                            }}
                                        >
                                            {station.name} ({station.code})
                                        </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>
                    <div className="col-md-3 position-relative" ref={destinationRef}>
                        <label className="form-label">Destination Station</label>

                        <input
                            type="text"
                            className="form-control"
                            value={form.destinationStationName}
                            placeholder="Type destination station"
                            onFocus={() => {
                                setShowDestDropdown(true);
                                searchStations(form.destinationStationName, setDestSuggestions);
                            }}
                            onChange={(e) => {
                                const value = e.target.value;
                                setForm({ ...form, destinationStationName: value });
                                setShowDestDropdown(true);
                                searchStations(value, setDestSuggestions);
                            }}
                            required
                        />

                        {showDestDropdown && destSuggestions.length > 0 && (
                            <ul
                                className="dropdown-menu show w-100"
                                style={{
                                    maxHeight: '220px',
                                    overflowY: 'auto',
                                    overflowX: 'hidden'
                                }}
                            >
                                {destSuggestions.map(station => {
                                    const isDisabled = isSameStation(
                                        station.name,
                                        form.sourceStationName
                                    );

                                    return (
                                        <li key={station.id}>
                                        <button
                                            type="button"
                                            className={`dropdown-item text-truncate${isDisabled ? ' disabled' : ''}`}
                                            disabled={isDisabled}
                                            style={{
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                maxWidth: '100%',
                                                opacity: isDisabled ? 0.6 : 1,
                                                cursor: isDisabled ? 'not-allowed' : 'pointer'
                                            }}
                                            onClick={() => {
                                                if (isDisabled) return;
                                                setForm({ ...form, destinationStationName: station.name });
                                                setShowDestDropdown(false);
                                            }}
                                        >
                                            {station.name} ({station.code})
                                        </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>
                    <div className="col-md-3">
                        <label className="form-label">Travel Date</label>
                        <DatePicker
                            selected={form.travelDate}
                            onChange={handleDateChange}
                            className="form-control"
                            dateFormat="yyyy-MM-dd"
                            placeholderText="Select a date"
                            minDate={new Date()}
                            required
                        />
                    </div>
                    <div className="col-md-2 d-flex align-items-end">
                        <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                            {loading ? 'Searching...' : 'Search'}
                        </button>
                    </div>
                </form>
                {error && <div className="alert alert-danger text-center">{error}</div>}
                {results.length > 0 && (
                    <div className="table-responsive mt-4">
                        <table className="table table-bordered align-middle text-center">
                            <thead className="table-light">
                                <tr>
                                    <th>Train Number</th>
                                    <th>Train Name</th>
                                    <th>Source (Departure)</th>
                                    <th>Destination (Arrival)</th>
                                    <th>Seats Remaining</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {results.map(train => (
                                    <tr key={train.trainId}>
                                        <td>{train.trainNumber}</td>
                                        <td>{train.trainName}</td>
                                        <td>
                                            {train.sourceStation}
                                            <br />
                                            <small className="text-muted">
                                                {formatDateTime(train.departureDateTime ?? train.departureTime)}
                                            </small>
                                        </td>
                                        <td>
                                            {train.destinationStation}
                                            <br />
                                            <small className="text-muted">
                                                {formatDateTime(train.arrivalDateTime ?? train.arrivalTime)}
                                            </small>
                                        </td>
                                        <td>{train.seatsRemaining}</td>
                                        <td><button
                                            className="btn btn-success btn-sm"
                                            onClick={() => openBookingForm(train)}
                                            disabled={train.seatsRemaining <= 0}
                                        >
                                            Book Now
                                        </button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {showBookingForm && (
                            <div
                                className="modal fade show"
                                style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}
                            >
                                <div className="modal-dialog modal-dialog-centered">
                                    <div className="modal-content">
                                        <div className="modal-header">
                                            <h5 className="modal-title">Book Train</h5>
                                            <button
                                                type="button"
                                                className="btn-close"
                                                onClick={() => setShowBookingForm(false)}
                                            ></button>
                                        </div>

                                        <div className="modal-body">
                                            <p><strong>{selectedTrain.trainName}</strong></p>
                                            <p>
                                                {selectedTrain.sourceStation} → {selectedTrain.destinationStation}
                                            </p>

                                            <div className="mb-3">
                                                <label className="form-label">Number of Seats</label>
                                                <input
                                                    type="number"
                                                    className="form-control"
                                                    min="1"
                                                    max={selectedTrain.seatsRemaining}
                                                    value={seatsBooked}
                                                    onChange={(e) => setSeatsBooked(Number(e.target.value))}
                                                />
                                                <small className="text-muted">
                                                    Max available: {selectedTrain.seatsRemaining}
                                                </small>
                                            </div>
                                        </div>

                                        <div className="modal-footer">
                                            <button
                                                className="btn btn-secondary"
                                                onClick={() => setShowBookingForm(false)}
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                className="btn btn-success"
                                                onClick={confirmBooking}
                                                disabled={seatsBooked < 1 || seatsBooked > selectedTrain.seatsRemaining}
                                            >
                                                Confirm Booking
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
