import { useCallback, useEffect, useMemo, useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useUser } from '../context/UserContext';

const EMPTY_FILTERS = {
    travelFrom: null,
    travelTo: null,
    bookedFrom: null,
    bookedTo: null,
    status: ''
};

const PAGE_SIZES = [5, 10, 20, 50];

const toDateOnly = (value) => {
    if (!value) return null;

    if (value instanceof Date) {
        const yyyy = value.getFullYear();
        const mm = String(value.getMonth() + 1).padStart(2, '0');
        const dd = String(value.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    }

    const asString = String(value);
    if (asString.includes('T')) {
        return asString.split('T')[0];
    }
    if (asString.length >= 10) {
        return asString.slice(0, 10);
    }
    return null;
};

const toDateTime = (value) => {
    if (!value) return null;

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return null;
    }
    return date;
};

const compareNullableStrings = (left, right) =>
    String(left || '').localeCompare(String(right || ''));

export default function MyBookings() {
    const { user } = useUser();

    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [flash, setFlash] = useState('');

    const [filters, setFilters] = useState(EMPTY_FILTERS);
    const [appliedFilters, setAppliedFilters] = useState(EMPTY_FILTERS);

    const [page, setPage] = useState(0);
    const [size, setSize] = useState(10);
    const [sortBy, setSortBy] = useState('bookedOn');
    const [sortDir, setSortDir] = useState('desc');
    const [cancellingBookingId, setCancellingBookingId] = useState(null);

    const fetchBookings = useCallback(async () => {
        if (!user) return;

        setLoading(true);
        setError('');

        try {
            const response = await fetch(`/api/bookings/user/${user.id}`);
            if (!response.ok) {
                setError('Failed to fetch bookings');
                setBookings([]);
                return;
            }

            const data = await response.json();
            setBookings(Array.isArray(data) ? data : []);
        } catch {
            setError('Server error');
            setBookings([]);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchBookings();
    }, [fetchBookings]);

    useEffect(() => {
        if (!flash) return undefined;
        const timer = setTimeout(() => setFlash(''), 2200);
        return () => clearTimeout(timer);
    }, [flash]);

    const formatBookingDate = (value) => {
        const date = toDateTime(value);
        if (!date) return '-';

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

    const formatTravelDate = (travelDateTime, travelDate) => {
        const withTime = toDateTime(travelDateTime);
        if (withTime) {
            return formatBookingDate(withTime);
        }
        return toDateOnly(travelDate) || '-';
    };

    const isCancellationLocked = (booking) => {
        const travelDateTime = toDateTime(booking?.travelDateTime);
        if (!travelDateTime) {
            return false;
        }

        const now = Date.now();
        const lockThreshold = now + (24 * 60 * 60 * 1000);
        return travelDateTime.getTime() <= lockThreshold;
    };

    const cancelBooking = async (bookingId) => {
        const confirmCancel = window.confirm('Are you sure you want to cancel this booking?');
        if (!confirmCancel) return;

        setCancellingBookingId(bookingId);
        setError('');
        try {
            const response = await fetch(`/api/bookings/${bookingId}/cancel`, {
                method: 'POST'
            });

            if (!response.ok) {
                const err = await response.text();
                setError(err || 'Cancellation failed');
                return;
            }

            setFlash('Booking cancelled successfully');
            await fetchBookings();
        } catch {
            setError('Server error while cancelling booking');
        } finally {
            setCancellingBookingId(null);
        }
    };

    const applyFilters = (event) => {
        event.preventDefault();

        if (
            filters.travelFrom &&
            filters.travelTo &&
            toDateOnly(filters.travelFrom) > toDateOnly(filters.travelTo)
        ) {
            setError('Travel From date cannot be after Travel To date');
            return;
        }

        if (
            filters.bookedFrom &&
            filters.bookedTo &&
            toDateOnly(filters.bookedFrom) > toDateOnly(filters.bookedTo)
        ) {
            setError('Booked From date cannot be after Booked To date');
            return;
        }

        setError('');
        setPage(0);
        setAppliedFilters({
            travelFrom: filters.travelFrom,
            travelTo: filters.travelTo,
            bookedFrom: filters.bookedFrom,
            bookedTo: filters.bookedTo,
            status: filters.status
        });
    };

    const resetFilters = () => {
        setFilters(EMPTY_FILTERS);
        setAppliedFilters(EMPTY_FILTERS);
        setPage(0);
        setError('');
    };

    const changeSort = (field) => {
        if (sortBy === field) {
            setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortBy(field);
            setSortDir('asc');
        }
        setPage(0);
    };

    const sortLabel = (field) => {
        if (sortBy !== field) return '';
        return sortDir === 'asc' ? '▲' : '▼';
    };

    const filteredAndSorted = useMemo(() => {
        const travelFrom = toDateOnly(appliedFilters.travelFrom);
        const travelTo = toDateOnly(appliedFilters.travelTo);
        const bookedFrom = toDateOnly(appliedFilters.bookedFrom);
        const bookedTo = toDateOnly(appliedFilters.bookedTo);
        const status = String(appliedFilters.status || '').toUpperCase();

        const filtered = bookings.filter((booking) => {
            const travelDate = toDateOnly(booking.travelDate);
            const bookedDate = toDateOnly(booking.createdAt);
            const bookingStatus = String(booking.status || '').toUpperCase();

            if (status && bookingStatus !== status) return false;
            if (travelFrom && (!travelDate || travelDate < travelFrom)) return false;
            if (travelTo && (!travelDate || travelDate > travelTo)) return false;
            if (bookedFrom && (!bookedDate || bookedDate < bookedFrom)) return false;
            if (bookedTo && (!bookedDate || bookedDate > bookedTo)) return false;
            return true;
        });

        const sorted = [...filtered].sort((left, right) => {
            let result = 0;

            switch (sortBy) {
                case 'train':
                    result = compareNullableStrings(left.trainNumber, right.trainNumber);
                    break;
                case 'route':
                    result = compareNullableStrings(
                        `${left.sourceStation || ''} ${left.destinationStation || ''}`,
                        `${right.sourceStation || ''} ${right.destinationStation || ''}`
                    );
                    break;
                case 'travelDate':
                    result = compareNullableStrings(toDateOnly(left.travelDate), toDateOnly(right.travelDate));
                    break;
                case 'seatsBooked':
                    result = (Number(left.seatsBooked) || 0) - (Number(right.seatsBooked) || 0);
                    break;
                case 'status':
                    result = compareNullableStrings(left.status, right.status);
                    break;
                case 'bookedOn':
                default: {
                    const leftTime = toDateTime(left.createdAt)?.getTime() || 0;
                    const rightTime = toDateTime(right.createdAt)?.getTime() || 0;
                    result = leftTime - rightTime;
                    break;
                }
            }

            return sortDir === 'asc' ? result : -result;
        });

        return sorted;
    }, [appliedFilters, bookings, sortBy, sortDir]);

    const totalElements = filteredAndSorted.length;
    const totalPages = totalElements === 0 ? 0 : Math.ceil(totalElements / size);
    const pagedBookings = filteredAndSorted.slice(page * size, page * size + size);

    useEffect(() => {
        if (totalPages === 0 && page !== 0) {
            setPage(0);
            return;
        }
        if (page >= totalPages && totalPages > 0) {
            setPage(totalPages - 1);
        }
    }, [page, totalPages]);

    if (!user) {
        return (
            <div className="text-center mt-5">
                <h5>Please login to view your bookings</h5>
            </div>
        );
    }

    const navbarOffset = 72;

    return (
        <div
            className="container-fluid app-shell"
            style={{
                position: 'fixed',
                top: navbarOffset,
                left: 0,
                right: 0,
                bottom: 0,
                paddingTop: 8,
                paddingBottom: 16,
                display: 'flex',
                justifyContent: 'center',
                overflow: 'hidden'
            }}
        >
            <div
                className="app-shell-inner"
                style={{
                    width: '100%',
                    maxWidth: 1320,
                    paddingLeft: 12,
                    paddingRight: 12,
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: 0,
                    height: '100%',
                    overflow: 'hidden'
                }}
            >
                <h3 className="mb-3 text-center page-title">My Bookings</h3>

                {flash && <div className="alert alert-success py-2">{flash}</div>}
                {error && <div className="alert alert-danger py-2">{error}</div>}

                <form className="card p-3 mb-3" onSubmit={applyFilters}>
                    <h6 className="mb-3">Search & Filters</h6>
                    <div className="row g-3 align-items-end">
                        <div className="col-md-2">
                            <label className="form-label">Travel From</label>
                            <DatePicker
                                selected={filters.travelFrom}
                                onChange={(date) =>
                                    setFilters((prev) => ({ ...prev, travelFrom: date }))
                                }
                                className="form-control"
                                dateFormat="yyyy-MM-dd"
                                placeholderText="From"
                            />
                        </div>
                        <div className="col-md-2">
                            <label className="form-label">Travel To</label>
                            <DatePicker
                                selected={filters.travelTo}
                                onChange={(date) =>
                                    setFilters((prev) => ({ ...prev, travelTo: date }))
                                }
                                className="form-control"
                                dateFormat="yyyy-MM-dd"
                                placeholderText="To"
                                minDate={filters.travelFrom}
                            />
                        </div>
                        <div className="col-md-2">
                            <label className="form-label">Booked From</label>
                            <DatePicker
                                selected={filters.bookedFrom}
                                onChange={(date) =>
                                    setFilters((prev) => ({ ...prev, bookedFrom: date }))
                                }
                                className="form-control"
                                dateFormat="yyyy-MM-dd"
                                placeholderText="From"
                            />
                        </div>
                        <div className="col-md-2">
                            <label className="form-label">Booked To</label>
                            <DatePicker
                                selected={filters.bookedTo}
                                onChange={(date) =>
                                    setFilters((prev) => ({ ...prev, bookedTo: date }))
                                }
                                className="form-control"
                                dateFormat="yyyy-MM-dd"
                                placeholderText="To"
                                minDate={filters.bookedFrom}
                            />
                        </div>
                        <div className="col-md-2">
                            <label className="form-label">Status</label>
                            <select
                                className="form-select"
                                value={filters.status}
                                onChange={(event) =>
                                    setFilters((prev) => ({ ...prev, status: event.target.value }))
                                }
                            >
                                <option value="">All</option>
                                <option value="BOOKED">BOOKED</option>
                                <option value="CANCELLED">CANCELLED</option>
                                <option value="TERMINATED">TERMINATED</option>
                            </select>
                        </div>
                        <div className="col-md-2 d-flex gap-2">
                            <button type="submit" className="btn btn-primary w-50">
                                Apply
                            </button>
                            <button type="button" className="btn btn-outline-secondary w-50" onClick={resetFilters}>
                                Reset
                            </button>
                        </div>
                    </div>
                </form>

                <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
                    <div>
                        <strong>Total Bookings:</strong> {totalElements}
                    </div>
                    <div className="d-flex align-items-center gap-2">
                        <span>Rows:</span>
                        <select
                            className="form-select"
                            style={{ width: 90 }}
                            value={size}
                            onChange={(event) => {
                                setSize(Number(event.target.value));
                                setPage(0);
                            }}
                        >
                            {PAGE_SIZES.map((pageSize) => (
                                <option key={pageSize} value={pageSize}>
                                    {pageSize}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                    <div className="table-responsive" style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
                        <table className="table table-bordered table-hover align-middle text-center mb-0">
                            <thead className="table-light sticky-top">
                                <tr>
                                    <th
                                        role="button"
                                        onClick={() => changeSort('train')}
                                    >
                                        Train {sortLabel('train')}
                                    </th>
                                    <th
                                        role="button"
                                        onClick={() => changeSort('route')}
                                    >
                                        Route {sortLabel('route')}
                                    </th>
                                    <th
                                        role="button"
                                        onClick={() => changeSort('travelDate')}
                                    >
                                        Travel Date {sortLabel('travelDate')}
                                    </th>
                                    <th
                                        role="button"
                                        onClick={() => changeSort('seatsBooked')}
                                    >
                                        Seats {sortLabel('seatsBooked')}
                                    </th>
                                    <th
                                        role="button"
                                        onClick={() => changeSort('status')}
                                    >
                                        Status {sortLabel('status')}
                                    </th>
                                    <th
                                        role="button"
                                        onClick={() => changeSort('bookedOn')}
                                    >
                                        Booked On {sortLabel('bookedOn')}
                                    </th>
                                    <th style={{ width: 92 }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan="7" className="text-center">Loading...</td>
                                    </tr>
                                ) : pagedBookings.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="text-center">No bookings found</td>
                                    </tr>
                                ) : (
                                    pagedBookings.map((booking) => {
                                        const cancellationLocked = isCancellationLocked(booking);
                                        const lockRow = cancellationLocked;
                                        const cancelDisabled =
                                            booking.status !== 'BOOKED' ||
                                            cancellationLocked ||
                                            cancellingBookingId === booking.bookingId;

                                        return (
                                        <tr
                                            key={booking.bookingId}
                                            className={lockRow ? 'table-secondary' : undefined}
                                            style={lockRow ? { backgroundColor: '#e9ecef' } : undefined}
                                        >
                                            <td>
                                                <strong>{booking.trainNumber}</strong><br />
                                                <small className="text-muted">{booking.trainName}</small>
                                            </td>
                                            <td>{booking.sourceStation} → {booking.destinationStation}</td>
                                            <td>{formatTravelDate(booking.travelDateTime, booking.travelDate)}</td>
                                            <td>{booking.seatsBooked}</td>
                                            <td>
                                                <span className={`badge ${
                                                    booking.status === 'BOOKED'
                                                        ? 'bg-success'
                                                        : booking.status === 'TERMINATED'
                                                            ? 'bg-dark'
                                                            : 'bg-danger'
                                                }`}>
                                                    {booking.status}
                                                </span>
                                            </td>
                                            <td>{formatBookingDate(booking.createdAt)}</td>
                                            <td>
                                                <button
                                                    className="btn btn-sm btn-danger"
                                                    title={cancellationLocked ? 'Cancellation locked within 24 hours of departure' : ''}
                                                    disabled={cancelDisabled}
                                                    onClick={() => cancelBooking(booking.bookingId)}
                                                >
                                                    {cancellingBookingId === booking.bookingId ? 'Cancelling...' : 'Cancel'}
                                                </button>
                                            </td>
                                        </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="d-flex justify-content-between align-items-center mt-3">
                        <button
                            className="btn btn-outline-secondary"
                            disabled={page <= 0}
                            onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
                        >
                            Previous
                        </button>
                        <span>
                            Page {totalPages === 0 ? 0 : page + 1} of {totalPages}
                        </span>
                        <button
                            className="btn btn-outline-secondary"
                            disabled={page >= totalPages - 1 || totalPages === 0}
                            onClick={() => setPage((prev) => prev + 1)}
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
