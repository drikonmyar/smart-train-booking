import { useState } from 'react';
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
    const [stations, setStations] = useState([]);
    const [stationsLoading, setStationsLoading] = useState(false);
    const [stationsLoaded, setStationsLoaded] = useState(false);
    const [showBookingForm, setShowBookingForm] = useState(false);
    const [selectedTrain, setSelectedTrain] = useState(null);
    const [seatsBooked, setSeatsBooked] = useState(1);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const fetchStations = async () => {
        if (stationsLoaded || stationsLoading) return;
        setStationsLoading(true);
        try {
            const response = await fetch('/api/stations/getall');
            if (response.ok) {
                const data = await response.json();
                setStations(Array.isArray(data) ? data : []);
                setStationsLoaded(true);
            }
        } catch (err) {
            // Optionally handle error
        } finally {
            setStationsLoading(false);
        }
    };

    const formatDate = (date) => date.toLocaleDateString('en-CA');

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
                    <div className="col-md-3">
                        <label className="form-label">Source Station</label>
                        <select
                            className="form-select"
                            name="sourceStationName"
                            value={form.sourceStationName}
                            onChange={handleChange}
                            onFocus={fetchStations}
                            required
                        >
                            <option value="" disabled>Select a station</option>
                            {stations.map(station => (
                                <option key={station.id} value={station.name}>
                                    {station.name} ({station.code})
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="col-md-3">
                        <label className="form-label">Destination Station</label>
                        <select
                            className="form-select"
                            name="destinationStationName"
                            value={form.destinationStationName}
                            onChange={handleChange}
                            onFocus={fetchStations}
                            required
                        >
                            <option value="" disabled>Select a station</option>
                            {stations.map(station => (
                                <option key={station.id} value={station.name}>
                                    {station.name} ({station.code})
                                </option>
                            ))}
                        </select>
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
                                        <td>{train.sourceStation} <br /><small className="text-muted">{train.departureTime}</small></td>
                                        <td>{train.destinationStation} <br /><small className="text-muted">{train.arrivalTime}</small></td>
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
