import { useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

export default function SearchTrains() {
    const [form, setForm] = useState({
        sourceStationName: '',
        destinationStationName: '',
        travelDate: null
    });
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
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
                travelDate: form.travelDate ? form.travelDate.toISOString().split('T')[0] : ''
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
                        <input type="text" className="form-control" name="sourceStationName" value={form.sourceStationName} onChange={handleChange} required />
                    </div>
                    <div className="col-md-3">
                        <label className="form-label">Destination Station</label>
                        <input type="text" className="form-control" name="destinationStationName" value={form.destinationStationName} onChange={handleChange} required />
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
                                        <td><button className="btn btn-success btn-sm">Book Now</button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
