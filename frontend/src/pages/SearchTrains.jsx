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
    const [seatsBooked, setSeatsBooked] = useState('1');
    const [sourceSuggestions, setSourceSuggestions] = useState([]);
    const [destSuggestions, setDestSuggestions] = useState([]);
    const [showSourceDropdown, setShowSourceDropdown] = useState(false);
    const [showDestDropdown, setShowDestDropdown] = useState(false);
    const [sourceHighlightedIndex, setSourceHighlightedIndex] = useState(-1);
    const [destHighlightedIndex, setDestHighlightedIndex] = useState(-1);
    const [bookedTrainNumbersForDate, setBookedTrainNumbersForDate] = useState([]);
    const sourceRef = useRef(null);
    const destinationRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                sourceRef.current &&
                !sourceRef.current.contains(event.target)
            ) {
                setShowSourceDropdown(false);
                setSourceHighlightedIndex(-1);
            }

            if (
                destinationRef.current &&
                !destinationRef.current.contains(event.target)
            ) {
                setShowDestDropdown(false);
                setDestHighlightedIndex(-1);
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

    const isSourceSuggestionDisabled = (station) =>
        isSameStation(station?.name, form.destinationStationName);

    const isDestinationSuggestionDisabled = (station) =>
        isSameStation(station?.name, form.sourceStationName);

    const findNextEnabledIndex = (suggestions, currentIndex, direction, isDisabledFn) => {
        if (!Array.isArray(suggestions) || suggestions.length === 0) {
            return -1;
        }

        let nextIndex = currentIndex;
        for (let i = 0; i < suggestions.length; i += 1) {
            nextIndex = (nextIndex + direction + suggestions.length) % suggestions.length;
            if (!isDisabledFn(suggestions[nextIndex])) {
                return nextIndex;
            }
        }
        return -1;
    };

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

    const handleSwapStations = () => {
        setForm((prev) => ({
            ...prev,
            sourceStationName: prev.destinationStationName,
            destinationStationName: prev.sourceStationName
        }));
        setSourceSuggestions(destSuggestions);
        setDestSuggestions(sourceSuggestions);
        setShowSourceDropdown(false);
        setShowDestDropdown(false);
        setSourceHighlightedIndex(-1);
        setDestHighlightedIndex(-1);
    };

    const handleSourceInputKeyDown = (event) => {
        if (event.key === 'ArrowDown') {
            event.preventDefault();
            setShowSourceDropdown(true);
            if (sourceSuggestions.length === 0) {
                searchStations(form.sourceStationName, setSourceSuggestions);
                return;
            }
            setSourceHighlightedIndex((prev) =>
                findNextEnabledIndex(sourceSuggestions, prev, 1, isSourceSuggestionDisabled)
            );
            return;
        }

        if (event.key === 'ArrowUp') {
            event.preventDefault();
            setShowSourceDropdown(true);
            if (sourceSuggestions.length === 0) {
                searchStations(form.sourceStationName, setSourceSuggestions);
                return;
            }
            setSourceHighlightedIndex((prev) =>
                findNextEnabledIndex(sourceSuggestions, prev, -1, isSourceSuggestionDisabled)
            );
            return;
        }

        if (event.key === 'Enter' && showSourceDropdown && sourceHighlightedIndex >= 0) {
            event.preventDefault();
            const station = sourceSuggestions[sourceHighlightedIndex];
            if (!station || isSourceSuggestionDisabled(station)) {
                return;
            }
            setForm({ ...form, sourceStationName: station.name });
            setShowSourceDropdown(false);
            setSourceHighlightedIndex(-1);
            return;
        }

        if (event.key === 'Escape') {
            setShowSourceDropdown(false);
            setSourceHighlightedIndex(-1);
        }
    };

    const handleDestinationInputKeyDown = (event) => {
        if (event.key === 'ArrowDown') {
            event.preventDefault();
            setShowDestDropdown(true);
            if (destSuggestions.length === 0) {
                searchStations(form.destinationStationName, setDestSuggestions);
                return;
            }
            setDestHighlightedIndex((prev) =>
                findNextEnabledIndex(destSuggestions, prev, 1, isDestinationSuggestionDisabled)
            );
            return;
        }

        if (event.key === 'ArrowUp') {
            event.preventDefault();
            setShowDestDropdown(true);
            if (destSuggestions.length === 0) {
                searchStations(form.destinationStationName, setDestSuggestions);
                return;
            }
            setDestHighlightedIndex((prev) =>
                findNextEnabledIndex(destSuggestions, prev, -1, isDestinationSuggestionDisabled)
            );
            return;
        }

        if (event.key === 'Enter' && showDestDropdown && destHighlightedIndex >= 0) {
            event.preventDefault();
            const station = destSuggestions[destHighlightedIndex];
            if (!station || isDestinationSuggestionDisabled(station)) {
                return;
            }
            setForm({ ...form, destinationStationName: station.name });
            setShowDestDropdown(false);
            setDestHighlightedIndex(-1);
            return;
        }

        if (event.key === 'Escape') {
            setShowDestDropdown(false);
            setDestHighlightedIndex(-1);
        }
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
    const isLoggedInUser = (user?.role || '').toUpperCase() === 'USER';
    const bookingLoginMessage = 'Please Login as a USER to Book Tickets';
    const maxSeatsPerBookingRequest = 9;

    const getSeatUpperBound = () => {
        const remaining = Number(selectedTrain?.seatsRemaining);
        if (!Number.isFinite(remaining) || remaining <= 0) {
            return maxSeatsPerBookingRequest;
        }
        return Math.max(1, Math.min(remaining, maxSeatsPerBookingRequest));
    };

    const parseSeatInputValue = (value) => {
        const parsed = Number(value);
        if (!Number.isInteger(parsed)) {
            return null;
        }
        return parsed;
    };

    const handleSeatsInputChange = (event) => {
        const value = event.target.value;
        if (value === '') {
            setSeatsBooked('');
            return;
        }

        if (!/^\d+$/.test(value)) {
            return;
        }

        setSeatsBooked(value);
    };

    const handleSeatsInputBlur = () => {
        const parsed = parseSeatInputValue(seatsBooked);
        const upperBound = getSeatUpperBound();
        if (parsed === null) {
            setSeatsBooked('1');
            return;
        }
        const clamped = Math.max(1, Math.min(parsed, upperBound));
        setSeatsBooked(String(clamped));
    };

    const handleSeatsInputWheel = (event) => {
        if (document.activeElement !== event.currentTarget) {
            return;
        }

        event.preventDefault();
        const upperBound = getSeatUpperBound();
        const currentValue = parseSeatInputValue(seatsBooked) ?? 1;
        const nextValue = event.deltaY < 0 ? currentValue + 1 : currentValue - 1;
        const clamped = Math.max(1, Math.min(nextValue, upperBound));
        setSeatsBooked(String(clamped));
    };

    useEffect(() => {
        if (!isLoggedInUser || !user?.id || !form.travelDate) {
            setBookedTrainNumbersForDate([]);
            return;
        }

        let cancelled = false;
        const selectedDate = formatDate(form.travelDate);

        const fetchBookedTrains = async () => {
            try {
                const response = await fetch(`/api/bookings/user/${user.id}`);
                if (!response.ok) {
                    if (!cancelled) {
                        setBookedTrainNumbersForDate([]);
                    }
                    return;
                }

                const bookings = await response.json();
                const bookedTrainNumbers = (Array.isArray(bookings) ? bookings : [])
                    .filter((booking) =>
                        String(booking?.status || '').toUpperCase() === 'BOOKED' &&
                        booking?.travelDate === selectedDate
                    )
                    .map((booking) => booking?.trainNumber)
                    .filter(Boolean);

                if (!cancelled) {
                    setBookedTrainNumbersForDate(bookedTrainNumbers);
                }
            } catch {
                if (!cancelled) {
                    setBookedTrainNumbersForDate([]);
                }
            }
        };

        fetchBookedTrains();

        return () => {
            cancelled = true;
        };
    }, [form.travelDate, isLoggedInUser, user?.id]);

    const openBookingForm = (train) => {
        if (!user || !isLoggedInUser) {
            alert(bookingLoginMessage);
            return;
        }
        setSelectedTrain(train);
        setSeatsBooked('1');
        setShowBookingForm(true);
    };

    const confirmBooking = async () => {
        const upperBound = getSeatUpperBound();
        const parsedSeatsBooked = parseSeatInputValue(seatsBooked);

        if (parsedSeatsBooked === null || parsedSeatsBooked < 1) {
            alert('Please enter a valid seat count');
            return;
        }
        if (parsedSeatsBooked > upperBound) {
            setSeatsBooked(String(upperBound));
            alert(`Maximum allowed seats here is ${upperBound}`);
            return;
        }

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
                    seatsBooked: parsedSeatsBooked
                })
            });

            if (response.ok) {
                alert('Train booked successfully');
                setBookedTrainNumbersForDate((prev) => {
                    if (!selectedTrain?.trainNumber || prev.includes(selectedTrain.trainNumber)) {
                        return prev;
                    }
                    return [...prev, selectedTrain.trainNumber];
                });
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
        <div className="search-shell">
            <div className="search-shell-inner">
                <h3 className="mb-2 text-center page-title">Find Your Route</h3>
                <p className="text-center text-muted mb-4">Search live train schedules and book seats instantly.</p>
                <form className="mb-4 card p-3 search-form search-form-inline" onSubmit={handleSubmit}>
                    <div className="search-inline-route-group">
                    <div className="position-relative search-inline-source" ref={sourceRef}>
                        <label className="form-label">Source Station</label>

                        <input
                            type="text"
                            className="form-control"
                            value={form.sourceStationName}
                            placeholder="Type source station"
                            onFocus={() => {
                                setShowSourceDropdown(true);
                                setSourceHighlightedIndex(-1);
                                searchStations(form.sourceStationName, setSourceSuggestions);
                            }}
                            onChange={(e) => {
                                const value = e.target.value;
                                setForm({ ...form, sourceStationName: value });
                                setShowSourceDropdown(true);
                                setSourceHighlightedIndex(-1);
                                searchStations(value, setSourceSuggestions);
                            }}
                            onKeyDown={handleSourceInputKeyDown}
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
                                {sourceSuggestions.map((station, index) => {
                                    const isDisabled = isSourceSuggestionDisabled(station);

                                    return (
                                        <li key={station.id}>
                                        <button
                                            type="button"
                                            className={`dropdown-item text-truncate${isDisabled ? ' disabled' : ''}${!isDisabled && index === sourceHighlightedIndex ? ' active' : ''}`}
                                            disabled={isDisabled}
                                            style={{
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                maxWidth: '100%',
                                                opacity: isDisabled ? 0.6 : 1,
                                                cursor: isDisabled ? 'not-allowed' : 'pointer'
                                            }}
                                            onMouseEnter={() => {
                                                if (!isDisabled) {
                                                    setSourceHighlightedIndex(index);
                                                }
                                            }}
                                            onClick={() => {
                                                if (isDisabled) return;
                                                setForm({ ...form, sourceStationName: station.name });
                                                setShowSourceDropdown(false);
                                                setSourceHighlightedIndex(-1);
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
                    <button
                        type="button"
                        className="btn swap-mid-btn"
                        onClick={handleSwapStations}
                        aria-label="Swap source and destination stations"
                        title="Swap source and destination"
                    >
                        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                            <path
                                d="M7.1 8.1 4.2 11l2.9 2.9M4.5 11h15m-2.6 2.9L19.8 11l-2.9-2.9"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </button>
                    <div className="position-relative search-inline-destination" ref={destinationRef}>
                        <label className="form-label">Destination Station</label>

                        <input
                            type="text"
                            className="form-control"
                            value={form.destinationStationName}
                            placeholder="Type destination station"
                            onFocus={() => {
                                setShowDestDropdown(true);
                                setDestHighlightedIndex(-1);
                                searchStations(form.destinationStationName, setDestSuggestions);
                            }}
                            onChange={(e) => {
                                const value = e.target.value;
                                setForm({ ...form, destinationStationName: value });
                                setShowDestDropdown(true);
                                setDestHighlightedIndex(-1);
                                searchStations(value, setDestSuggestions);
                            }}
                            onKeyDown={handleDestinationInputKeyDown}
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
                                {destSuggestions.map((station, index) => {
                                    const isDisabled = isDestinationSuggestionDisabled(station);

                                    return (
                                        <li key={station.id}>
                                        <button
                                            type="button"
                                            className={`dropdown-item text-truncate${isDisabled ? ' disabled' : ''}${!isDisabled && index === destHighlightedIndex ? ' active' : ''}`}
                                            disabled={isDisabled}
                                            style={{
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                maxWidth: '100%',
                                                opacity: isDisabled ? 0.6 : 1,
                                                cursor: isDisabled ? 'not-allowed' : 'pointer'
                                            }}
                                            onMouseEnter={() => {
                                                if (!isDisabled) {
                                                    setDestHighlightedIndex(index);
                                                }
                                            }}
                                            onClick={() => {
                                                if (isDisabled) return;
                                                setForm({ ...form, destinationStationName: station.name });
                                                setShowDestDropdown(false);
                                                setDestHighlightedIndex(-1);
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
                    </div>
                    <div className="search-inline-date">
                        <label className="form-label">Travel Date</label>
                        <DatePicker
                            selected={form.travelDate}
                            onChange={handleDateChange}
                            className="form-control w-100"
                            wrapperClassName="w-100"
                            dateFormat="yyyy-MM-dd"
                            placeholderText="Select a date"
                            minDate={new Date()}
                            required
                        />
                    </div>
                    <div className="d-flex align-items-end search-inline-action">
                        <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                            {loading ? 'Searching...' : 'Search'}
                        </button>
                    </div>
                </form>
                {error && <div className="alert alert-danger text-center">{error}</div>}
                {results.length > 0 && (
                    <div className="table-responsive mt-4 card p-0 overflow-hidden">
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
                                        <td>
                                            {(() => {
                                                const isBooked = bookedTrainNumbersForDate.includes(train.trainNumber);
                                                const cannotBook =
                                                    isBooked || !isLoggedInUser || train.seatsRemaining <= 0;
                                                const disabledMessage = !user || !isLoggedInUser
                                                    ? bookingLoginMessage
                                                    : (isBooked ? 'Already booked for selected date' : (train.seatsRemaining <= 0 ? 'No seats available' : ''));

                                                return (
                                            <span
                                                title={disabledMessage}
                                                style={{ display: 'inline-block' }}
                                            >
                                                <button
                                                    className={`btn btn-sm ${isBooked ? 'btn-secondary' : 'btn-success'}`}
                                                    onClick={() => openBookingForm(train)}
                                                    disabled={cannotBook}
                                                >
                                                    {isBooked ? 'Booked' : 'Book Now'}
                                                </button>
                                            </span>
                                                );
                                            })()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                {showBookingForm && selectedTrain && (
                    <div
                        className="modal fade show search-booking-modal"
                        style={{ display: 'block' }}
                        role="dialog"
                        aria-modal="true"
                    >
                        <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable search-booking-dialog">
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
                                            max={getSeatUpperBound()}
                                            value={seatsBooked}
                                            onChange={handleSeatsInputChange}
                                            onBlur={handleSeatsInputBlur}
                                            onWheel={handleSeatsInputWheel}
                                            onFocus={(event) => event.target.select()}
                                        />
                                        <small className="text-muted">
                                            Max available now: {getSeatUpperBound()}
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
                                        disabled={
                                            parseSeatInputValue(seatsBooked) === null ||
                                            parseSeatInputValue(seatsBooked) < 1 ||
                                            parseSeatInputValue(seatsBooked) > getSeatUpperBound()
                                        }
                                    >
                                        Confirm Booking
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
