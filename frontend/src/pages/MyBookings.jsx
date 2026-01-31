import { useEffect, useState } from 'react';
import { useUser } from '../context/UserContext';

export default function MyBookings() {
    const { user } = useUser();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const fetchBookings = async () => {
        if (!user) return;
        setLoading(true);
        setError('');

        try {
            const response = await fetch(`/api/bookings/user/${user.id}`);
            if (response.ok) {
                const data = await response.json();
                setBookings(Array.isArray(data) ? data : []);
            } else {
                setError('Failed to fetch bookings');
            }
        } catch (err) {
            setError('Server error');
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

    useEffect(() => {
        fetchBookings();
    }, [user]);

    const cancelBooking = async (bookingId) => {
        const confirmCancel = window.confirm('Are you sure you want to cancel this booking?');
        if (!confirmCancel) return;

        try {
            const response = await fetch(`/api/bookings/${bookingId}/cancel`, {
                method: 'POST'
            });

            if (response.ok) {
                alert('Booking cancelled successfully');
                fetchBookings(); // refresh list
            } else {
                const err = await response.text();
                alert(err || 'Cancellation failed');
            }
        } catch (err) {
            alert('Server error while cancelling booking');
        }
    };

    if (!user) {
        return (
            <div className="text-center mt-5">
                <h5>Please login to view your bookings</h5>
            </div>
        );
    }

    return (
        <div
            style={{
                minHeight: '90vh',
                width: '100vw',
                display: 'flex',
                justifyContent: 'center',
                background: '#f8f9fa'
            }}
        >
            <div style={{ width: '100%', maxWidth: '1100px' }}>
                <h3 className="text-center mb-4 mt-4">My Bookings</h3>

                {loading && <div className="text-center">Loading...</div>}
                {error && <div className="alert alert-danger text-center">{error}</div>}

                {bookings.length === 0 && !loading && (
                    <div className="alert alert-info text-center">
                        No bookings found
                    </div>
                )}

                {bookings.length > 0 && (
                    <div className="table-responsive">
                        <table className="table table-bordered table-hover align-middle text-center">
                            <thead className="table-light">
                                <tr>
                                    <th>Train</th>
                                    <th>Route</th>
                                    <th>Travel Date</th>
                                    <th>Seats</th>
                                    <th>Status</th>
                                    <th>Booked On</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {bookings.map(b => (
                                    <tr key={b.bookingId}>
                                        <td>
                                            <strong>{b.trainNumber}</strong><br />
                                            <small className="text-muted">{b.trainName}</small>
                                        </td>
                                        <td>{b.sourceStation} → {b.destinationStation}</td>
                                        <td>{b.travelDate}</td>
                                        <td>{b.seatsBooked}</td>
                                        <td>
                                            <span className={`badge ${b.status === 'CANCELLED'
                                                ? 'bg-danger'
                                                : 'bg-success'
                                                }`}>
                                                {b.status}
                                            </span>
                                        </td>
                                        <td>{formatBookingDate(b.createdAt)}</td>
                                        <td>
                                            <button
                                                className="btn btn-sm btn-danger"
                                                disabled={b.status === 'CANCELLED'}
                                                onClick={() => cancelBooking(b.bookingId)}
                                            >
                                                Cancel
                                            </button>
                                        </td>
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
