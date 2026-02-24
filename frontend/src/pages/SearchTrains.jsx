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
    const [showIntroMessage, setShowIntroMessage] = useState(true);
    const [hasSearched, setHasSearched] = useState(false);
    const [showNoResultsMessage, setShowNoResultsMessage] = useState(false);
    const [showBookingForm, setShowBookingForm] = useState(false);
    const [selectedTrain, setSelectedTrain] = useState(null);
    const [seatsBooked, setSeatsBooked] = useState('1');
    const [sourceSuggestions, setSourceSuggestions] = useState([]);
    const [destSuggestions, setDestSuggestions] = useState([]);
    const [showSourceDropdown, setShowSourceDropdown] = useState(false);
    const [showDestDropdown, setShowDestDropdown] = useState(false);
    const [showTravelDatePopup, setShowTravelDatePopup] = useState(false);
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

    const hideSearchHintMessages = () => {
        setShowIntroMessage(false);
        setShowNoResultsMessage(false);
    };

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
        hideSearchHintMessages();
    };

    const handleSwapStations = () => {
        setForm((prev) => ({
            ...prev,
            sourceStationName: prev.destinationStationName,
            destinationStationName: prev.sourceStationName
        }));
        hideSearchHintMessages();
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
            hideSearchHintMessages();
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
            hideSearchHintMessages();
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
        setHasSearched(true);
        hideSearchHintMessages();
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
                const trains = Array.isArray(data) ? data : [];
                setResults(trains);
                setShowNoResultsMessage(trains.length === 0);
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
    const normalizedRole = (user?.role || '').toUpperCase();
    const isLoggedInUser = normalizedRole === 'USER';
    const isAdmin = normalizedRole === 'ADMIN';
    const currentModeLabel = isAdmin ? 'Admin Mode' : (isLoggedInUser ? 'User Mode' : 'Guest Mode');
    const bookingLoginMessage = 'Please Login as a USER to Book Tickets';
    const maxSeatsPerBookingRequest = 9;
    const isSearchPopupOpen = showSourceDropdown || showDestDropdown || showTravelDatePopup;
    const selectedTravelDateLabel = form.travelDate
        ? form.travelDate.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        })
        : 'Not selected';

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
        <div className="search-shell premium-search-shell">
            <div className="search-shell-inner premium-search-inner">
                <section className="card p-4 p-lg-5 search-hero-card">
                    <div className="search-hero-content">
                        <div>
                            <span className="search-hero-tag">Smart Rail Experience</span>
                            <h1 className="mb-2 page-title search-hero-title">Search live routes and book in minutes.</h1>
                            <p className="mb-0 search-hero-copy">
                                Compare departures, check availability, and reserve seats from one streamlined screen.
                            </p>
                        </div>
                        <div className="search-hero-metrics">
                            <div className="search-metric">
                                <span className="search-metric-value">{results.length}</span>
                                <span className="search-metric-label">Trains Found</span>
                            </div>
                            <div className="search-metric">
                                <span className="search-metric-value">{selectedTravelDateLabel}</span>
                                <span className="search-metric-label">Travel Date</span>
                            </div>
                            <div className="search-metric">
                                <span className="search-metric-value">{currentModeLabel}</span>
                                <span className="search-metric-label">Booking Access</span>
                            </div>
                        </div>
                    </div>
                </section>

                <form className="mb-2 card p-3 p-lg-4 search-form search-form-inline premium-search-form" onSubmit={handleSubmit}>
                    <div className="search-inline-route-group">
                        <div className="position-relative search-inline-source search-field-shell" ref={sourceRef}>
                            <label className="form-label premium-field-label">Source Station</label>

                            <input
                                type="text"
                                className="form-control premium-input"
                                value={form.sourceStationName}
                                placeholder="Type source station"
                            onFocus={() => {
                                setShowSourceDropdown(true);
                                setSourceHighlightedIndex(-1);
                                hideSearchHintMessages();
                                searchStations(form.sourceStationName, setSourceSuggestions);
                            }}
                            onChange={(e) => {
                                const value = e.target.value;
                                setForm({ ...form, sourceStationName: value });
                                setShowSourceDropdown(true);
                                setSourceHighlightedIndex(-1);
                                hideSearchHintMessages();
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
                                                        hideSearchHintMessages();
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
                            className="btn swap-mid-btn premium-swap-btn"
                            onClick={handleSwapStations}
                            aria-label="Swap source and destination stations"
                            title="Swap source and destination"
                        >
                            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                                <path
                                    d="M4 8h12m0 0-3-3m3 3-3 3M20 16H8m0 0 3-3m-3 3 3 3"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </button>

                        <div className="position-relative search-inline-destination search-field-shell" ref={destinationRef}>
                            <label className="form-label premium-field-label">Destination Station</label>

                            <input
                                type="text"
                                className="form-control premium-input"
                                value={form.destinationStationName}
                                placeholder="Type destination station"
                            onFocus={() => {
                                setShowDestDropdown(true);
                                setDestHighlightedIndex(-1);
                                hideSearchHintMessages();
                                searchStations(form.destinationStationName, setDestSuggestions);
                            }}
                            onChange={(e) => {
                                const value = e.target.value;
                                setForm({ ...form, destinationStationName: value });
                                setShowDestDropdown(true);
                                setDestHighlightedIndex(-1);
                                hideSearchHintMessages();
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
                                                        hideSearchHintMessages();
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

                    <div className="search-inline-date search-field-shell">
                        <label className="form-label premium-field-label">Travel Date</label>
                        <DatePicker
                            selected={form.travelDate}
                            onChange={handleDateChange}
                            onCalendarOpen={() => {
                                setShowTravelDatePopup(true);
                                hideSearchHintMessages();
                            }}
                            onCalendarClose={() => setShowTravelDatePopup(false)}
                            className="form-control w-100 premium-input"
                            wrapperClassName="w-100"
                            dateFormat="yyyy-MM-dd"
                            placeholderText="Select a date"
                            minDate={new Date()}
                            required
                        />
                    </div>

                    <div className="d-flex align-items-end search-inline-action">
                        <button type="submit" className="btn btn-primary w-100 premium-search-btn" disabled={loading}>
                            {loading ? 'Searching...' : 'Search Trains'}
                        </button>
                    </div>
                </form>

                {error && <div className="alert alert-danger text-center mt-3">{error}</div>}

                {!loading && showIntroMessage && !hasSearched && !error && results.length === 0 && (
                    <div className={`card p-3 p-md-4 mt-3 search-empty-card${isSearchPopupOpen ? ' search-empty-card-below-popup' : ''}`}>
                        <h6 className="mb-2">Start by choosing your route and travel date.</h6>
                        <p className="mb-0 text-muted">
                            You can search trains without login, and sign in only when you are ready to book.
                        </p>
                    </div>
                )}

                {!loading && showNoResultsMessage && results.length === 0 && !error && (
                    <div className={`card p-3 p-md-4 mt-3 search-empty-card${isSearchPopupOpen ? ' search-empty-card-below-popup' : ''}`}>
                        <h6 className="mb-2">No trains found for this route.</h6>
                        <p className="mb-0 text-muted">Try swapping stations or selecting a different travel date.</p>
                    </div>
                )}

                {results.length > 0 && (
                    <section className="search-results-zone">
                        <div className="search-results-head">
                            <h5 className="mb-0">Available Trains</h5>
                            <span>{results.length} options found</span>
                        </div>

                        <div className="search-results-grid">
                            {results.map((train) => {
                                const isBooked = bookedTrainNumbersForDate.includes(train.trainNumber);
                                const noSeats = Number(train.seatsRemaining) <= 0;
                                const cannotBook = isBooked || !isLoggedInUser || noSeats;
                                const disabledMessage = !user || !isLoggedInUser
                                    ? bookingLoginMessage
                                    : (isBooked ? 'Already booked for selected date' : (noSeats ? 'No seats available' : ''));
                                const seatStatusClass = noSeats
                                    ? 'seat-pill seat-pill-danger'
                                    : (Number(train.seatsRemaining) <= 20 ? 'seat-pill seat-pill-warning' : 'seat-pill seat-pill-success');

                                return (
                                    <article className="card p-3 p-md-4 search-train-card" key={train.trainId}>
                                        <div className="search-train-card-top">
                                            <div>
                                                <p className="mb-1 search-train-number">{train.trainNumber}</p>
                                                <h6 className="mb-0">{train.trainName}</h6>
                                            </div>
                                            <span className={seatStatusClass}>{train.seatsRemaining} seats left</span>
                                        </div>

                                        <div className="search-train-route">
                                            <div className="search-train-point">
                                                <span className="search-train-point-label">From</span>
                                                <strong>{train.sourceStation}</strong>
                                                <small>{formatDateTime(train.departureDateTime ?? train.departureTime)}</small>
                                            </div>

                                            <div className="search-train-track" aria-hidden="true">
                                                <span className="search-train-track-line"></span>
                                                <span className="search-train-track-marker"></span>
                                            </div>

                                            <div className="search-train-point search-train-point-destination">
                                                <span className="search-train-point-label">To</span>
                                                <strong>{train.destinationStation}</strong>
                                                <small>{formatDateTime(train.arrivalDateTime ?? train.arrivalTime)}</small>
                                            </div>
                                        </div>

                                        <div className="search-train-card-actions">
                                            <small className="text-muted">
                                                {isBooked
                                                    ? 'Already booked for selected date'
                                                    : (noSeats ? 'Currently sold out' : 'Instant confirmation available')}
                                            </small>
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
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    </section>
                )}

                {showBookingForm && selectedTrain && (
                    <div
                        className="modal fade show search-booking-modal"
                        style={{ display: 'block' }}
                        role="dialog"
                        aria-modal="true"
                    >
                        <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable search-booking-dialog">
                            <div className="modal-content search-booking-content">
                                <div className="modal-header">
                                    <h5 className="modal-title">Book Train</h5>
                                    <button
                                        type="button"
                                        className="btn-close"
                                        onClick={() => setShowBookingForm(false)}
                                    ></button>
                                </div>

                                <div className="modal-body">
                                    <div className="search-booking-summary">
                                        <p className="mb-1"><strong>{selectedTrain.trainName}</strong> ({selectedTrain.trainNumber})</p>
                                        <p className="mb-0">
                                            {selectedTrain.sourceStation} to {selectedTrain.destinationStation}
                                        </p>
                                    </div>

                                    <div className="mt-3">
                                        <label className="form-label">Number of Seats</label>
                                        <input
                                            type="number"
                                            className="form-control premium-input"
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
