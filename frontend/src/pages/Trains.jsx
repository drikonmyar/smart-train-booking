import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useUser } from '../context/UserContext';

const api = axios.create({
    baseURL: '/api'
});

const EMPTY_FILTERS = {
    trainNumber: '',
    trainName: '',
    sourceStation: '',
    destinationStation: '',
    status: '',
    createdFrom: null,
    createdTo: null
};

const EMPTY_FORM = {
    trainNumber: '',
    trainName: '',
    sourceStationId: '',
    destinationStationId: '',
    totalSeats: '',
    startTime: '',
    endTime: '',
    status: 'ACTIVE'
};

const PAGE_SIZES = [5, 10, 20, 50];

export default function Trains() {
    const { user } = useUser();
    const isAdmin = (user?.role || '').toUpperCase() === 'ADMIN';

    const [stations, setStations] = useState([]);
    const [filters, setFilters] = useState(EMPTY_FILTERS);
    const [appliedFilters, setAppliedFilters] = useState(EMPTY_FILTERS);
    const [filterSourceSuggestions, setFilterSourceSuggestions] = useState([]);
    const [filterDestinationSuggestions, setFilterDestinationSuggestions] = useState([]);
    const [showFilterSourceSuggestions, setShowFilterSourceSuggestions] = useState(false);
    const [showFilterDestinationSuggestions, setShowFilterDestinationSuggestions] = useState(false);

    const [page, setPage] = useState(0);
    const [size, setSize] = useState(10);
    const [sortBy, setSortBy] = useState('trainNumber');
    const [sortDir, setSortDir] = useState('asc');

    const [trainsPage, setTrainsPage] = useState({
        content: [],
        totalElements: 0,
        totalPages: 0,
        number: 0
    });
    const [loading, setLoading] = useState(false);
    const [tableError, setTableError] = useState('');

    const [showFormModal, setShowFormModal] = useState(false);
    const [editingTrainId, setEditingTrainId] = useState(null);
    const [formData, setFormData] = useState(EMPTY_FORM);
    const [sourceStationInput, setSourceStationInput] = useState('');
    const [destinationStationInput, setDestinationStationInput] = useState('');
    const [sourceStationSuggestions, setSourceStationSuggestions] = useState([]);
    const [destinationStationSuggestions, setDestinationStationSuggestions] = useState([]);
    const [showSourceSuggestions, setShowSourceSuggestions] = useState(false);
    const [showDestinationSuggestions, setShowDestinationSuggestions] = useState(false);
    const [formError, setFormError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const [detailsModal, setDetailsModal] = useState(false);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [detailsError, setDetailsError] = useState('');
    const [selectedTrainDetails, setSelectedTrainDetails] = useState(null);

    const [deleteModal, setDeleteModal] = useState(false);
    const [deleteTrain, setDeleteTrain] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const [flash, setFlash] = useState(null);
    const sourceStationRef = useRef(null);
    const destinationStationRef = useRef(null);
    const filterSourceRef = useRef(null);
    const filterDestinationRef = useRef(null);

    const adminHeaders = useMemo(
        () => ({ 'X-User-Role': user?.role || '' }),
        [user?.role]
    );

    useEffect(() => {
        if (!flash) return undefined;

        const timer = setTimeout(() => setFlash(null), 2500);
        return () => clearTimeout(timer);
    }, [flash]);

    useEffect(() => {
        if (!showFormModal) return undefined;

        const handleClickOutside = (event) => {
            if (sourceStationRef.current && !sourceStationRef.current.contains(event.target)) {
                setShowSourceSuggestions(false);
            }
            if (destinationStationRef.current && !destinationStationRef.current.contains(event.target)) {
                setShowDestinationSuggestions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showFormModal]);

    useEffect(() => {
        const handleFilterOutsideClick = (event) => {
            if (filterSourceRef.current && !filterSourceRef.current.contains(event.target)) {
                setShowFilterSourceSuggestions(false);
            }
            if (filterDestinationRef.current && !filterDestinationRef.current.contains(event.target)) {
                setShowFilterDestinationSuggestions(false);
            }
        };

        document.addEventListener('mousedown', handleFilterOutsideClick);
        return () => document.removeEventListener('mousedown', handleFilterOutsideClick);
    }, []);

    const formatDateForApi = (date) => {
        if (!date) return null;
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    };

    const formatDateTime = (value) => {
        if (!value) return '-';
        const [datePart, timePartRaw] = String(value).split('T');
        if (!datePart) return '-';
        const timePart = timePartRaw ? timePartRaw.slice(0, 8) : '';
        return timePart ? `${datePart} ${timePart}` : datePart;
    };

    const toInputTime = (value) => {
        if (!value) return '';
        return String(value).slice(0, 5);
    };

    const normalizeStationName = (value) => (value || '').trim().toLowerCase();

    const isSameStationName = (left, right) =>
        normalizeStationName(left) !== '' &&
        normalizeStationName(left) === normalizeStationName(right);

    const weekDays = [
        { key: 'MONDAY', label: 'M' },
        { key: 'TUESDAY', label: 'T' },
        { key: 'WEDNESDAY', label: 'W' },
        { key: 'THURSDAY', label: 'T' },
        { key: 'FRIDAY', label: 'F' },
        { key: 'SATURDAY', label: 'S' },
        { key: 'SUNDAY', label: 'S' }
    ];

    const formatRunningDaysForCsv = (runningDays) => {
        const runningDaysSet = new Set(Array.isArray(runningDays) ? runningDays : []);
        return weekDays
            .filter((day) => runningDaysSet.has(day.key))
            .map((day) => day.label)
            .join(' ');
    };

    const renderRunningDays = (runningDays) => {
        const runningDaysSet = new Set(Array.isArray(runningDays) ? runningDays : []);

        return (
            <span className="d-inline-flex flex-wrap gap-1 align-items-center">
                {weekDays.map((day, index) => (
                    <span
                        key={`${day.key}-${index}`}
                        className={`badge rounded-pill ${runningDaysSet.has(day.key)
                            ? 'bg-success'
                            : 'bg-light text-secondary border'
                            }`}
                        title={day.key}
                    >
                        {day.label}
                    </span>
                ))}
            </span>
        );
    };

    const renderEndTimeWithOffset = (endTime, arrivalDayOffset) => (
        <span>
            {toInputTime(endTime)}
            {(arrivalDayOffset ?? 0) > 0 && (
                <span
                    className="badge bg-light text-dark border ms-1"
                    title={`Arrives ${arrivalDayOffset} day${arrivalDayOffset === 1 ? '' : 's'} after departure`}
                >
                    +{arrivalDayOffset}
                </span>
            )}
        </span>
    );

    const toApiTime = (value) => {
        if (!value) return value;
        return value.length === 5 ? `${value}:00` : value;
    };

    const extractErrorMessage = (error, fallbackMessage) => {
        const payload = error?.response?.data;
        if (!payload) return fallbackMessage;

        if (payload.validationErrors && typeof payload.validationErrors === 'object') {
            return Object.entries(payload.validationErrors)
                .map(([field, message]) => `${field}: ${message}`)
                .join(', ');
        }

        if (payload.message) return payload.message;
        if (typeof payload === 'string') return payload;
        return fallbackMessage;
    };

    const fetchStations = useCallback(async () => {
        try {
            const response = await api.get('/stations/search');
            const data = Array.isArray(response.data) ? response.data : [];
            const sorted = [...data].sort((a, b) => a.name.localeCompare(b.name));
            setStations(sorted);
        } catch {
            setStations([]);
        }
    }, []);

    const searchStations = useCallback(async (query, excludedStationId, setter) => {
        try {
            const response = await api.get('/stations/search', {
                params: { q: query || '' }
            });
            const data = Array.isArray(response.data) ? response.data : [];
            const filtered = data
                .filter((station) => !excludedStationId || String(station.id) !== String(excludedStationId))
                .slice(0, 20);
            setter(filtered);
        } catch {
            setter([]);
        }
    }, []);

    const fetchTrains = useCallback(async () => {
        setLoading(true);
        setTableError('');

        try {
            const params = {
                page,
                size,
                sortBy,
                sortDir
            };

            if (appliedFilters.trainNumber.trim()) {
                params.trainNumber = appliedFilters.trainNumber.trim();
            }
            if (appliedFilters.trainName.trim()) {
                params.trainName = appliedFilters.trainName.trim();
            }
            if (appliedFilters.sourceStation.trim()) {
                params.sourceStation = appliedFilters.sourceStation.trim();
            }
            if (appliedFilters.destinationStation.trim()) {
                params.destinationStation = appliedFilters.destinationStation.trim();
            }
            if (appliedFilters.status) {
                params.status = appliedFilters.status;
            }
            if (appliedFilters.createdFrom) {
                params.createdFrom = formatDateForApi(appliedFilters.createdFrom);
            }
            if (appliedFilters.createdTo) {
                params.createdTo = formatDateForApi(appliedFilters.createdTo);
            }

            const response = await api.get('/admin/trains', {
                params,
                headers: adminHeaders
            });

            setTrainsPage({
                content: response.data?.content || [],
                totalElements: response.data?.totalElements || 0,
                totalPages: response.data?.totalPages || 0,
                number: response.data?.number || 0
            });
        } catch (error) {
            setTableError(extractErrorMessage(error, 'Failed to load trains'));
        } finally {
            setLoading(false);
        }
    }, [adminHeaders, appliedFilters, page, size, sortBy, sortDir]);

    useEffect(() => {
        if (!isAdmin) {
            return;
        }
        fetchStations();
    }, [isAdmin, fetchStations]);

    useEffect(() => {
        if (!isAdmin) {
            return;
        }
        fetchTrains();
    }, [isAdmin, fetchTrains]);

    const resetForm = () => {
        setFormData(EMPTY_FORM);
        setSourceStationInput('');
        setDestinationStationInput('');
        setSourceStationSuggestions([]);
        setDestinationStationSuggestions([]);
        setShowSourceSuggestions(false);
        setShowDestinationSuggestions(false);
        setFormError('');
        setEditingTrainId(null);
    };

    const openCreateModal = () => {
        resetForm();
        setShowFormModal(true);
    };

    const loadTrainDetails = async (trainId) => {
        const response = await api.get(`/admin/trains/${trainId}`, {
            headers: adminHeaders
        });
        return response.data;
    };

    const openEditModal = async (event, trainId) => {
        event.stopPropagation();
        setFormError('');
        setSubmitting(true);
        try {
            const details = await loadTrainDetails(trainId);
            const routeStops = Array.isArray(details.routeStops) ? details.routeStops : [];
            const sourceStop = routeStops[0];
            const destinationStop = routeStops[routeStops.length - 1];

            const sourceStationId = sourceStop?.stationId ||
                stations.find((station) => station.name === details.sourceStation)?.id || '';
            const destinationStationId = destinationStop?.stationId ||
                stations.find((station) => station.name === details.destinationStation)?.id || '';

            setFormData({
                trainNumber: details.trainNumber || '',
                trainName: details.trainName || '',
                sourceStationId: sourceStationId ? String(sourceStationId) : '',
                destinationStationId: destinationStationId ? String(destinationStationId) : '',
                totalSeats: details.totalSeats ?? '',
                startTime: toInputTime(details.startTime),
                endTime: toInputTime(details.endTime),
                status: details.status || 'ACTIVE'
            });
            setSourceStationInput(sourceStop?.stationName || details.sourceStation || '');
            setDestinationStationInput(destinationStop?.stationName || details.destinationStation || '');
            setSourceStationSuggestions([]);
            setDestinationStationSuggestions([]);
            setShowSourceSuggestions(false);
            setShowDestinationSuggestions(false);
            setEditingTrainId(trainId);
            setShowFormModal(true);
        } catch (error) {
            setFlash({
                type: 'danger',
                message: extractErrorMessage(error, 'Failed to load train for edit')
            });
        } finally {
            setSubmitting(false);
        }
    };

    const validateForm = () => {
        if (!formData.trainNumber.trim()) return 'Train number is required';
        if (!formData.trainName.trim()) return 'Train name is required';
        if (!formData.sourceStationId) return 'Source station is required';
        if (!formData.destinationStationId) return 'Destination station is required';
        if (formData.sourceStationId === formData.destinationStationId) {
            return 'Source and destination cannot be same';
        }

        const totalSeats = Number(formData.totalSeats);
        if (!Number.isInteger(totalSeats) || totalSeats <= 0) {
            return 'Total seats must be a positive number';
        }

        if (!formData.startTime || !formData.endTime) {
            return 'Start time and end time are required';
        }

        if (formData.startTime === formData.endTime) {
            return 'Start and end time cannot be same';
        }

        return null;
    };

    const handleSaveTrain = async () => {
        const validationError = validateForm();
        if (validationError) {
            setFormError(validationError);
            return;
        }

        setFormError('');
        setSubmitting(true);

        const payload = {
            trainNumber: formData.trainNumber.trim().toUpperCase(),
            trainName: formData.trainName.trim(),
            sourceStationId: Number(formData.sourceStationId),
            destinationStationId: Number(formData.destinationStationId),
            totalSeats: Number(formData.totalSeats),
            startTime: toApiTime(formData.startTime),
            endTime: toApiTime(formData.endTime),
            status: formData.status || 'ACTIVE'
        };

        try {
            if (editingTrainId) {
                await api.put(`/admin/trains/${editingTrainId}`, payload, {
                    headers: adminHeaders
                });
                setFlash({ type: 'success', message: 'Train updated successfully' });
            } else {
                await api.post('/admin/trains', payload, {
                    headers: adminHeaders
                });
                setFlash({ type: 'success', message: 'Train created successfully' });
            }

            setShowFormModal(false);
            resetForm();
            setPage(0);
            await fetchTrains();
        } catch (error) {
            setFormError(extractErrorMessage(error, 'Failed to save train'));
        } finally {
            setSubmitting(false);
        }
    };

    const openDeleteModal = (event, train) => {
        event.stopPropagation();
        setDeleteTrain(train);
        setDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!deleteTrain) return;

        setDeleting(true);
        try {
            await api.delete(`/admin/trains/${deleteTrain.id}`, {
                headers: adminHeaders
            });
            setFlash({ type: 'success', message: 'Train marked as inactive' });
            setDeleteModal(false);
            setDeleteTrain(null);
            await fetchTrains();
        } catch (error) {
            setFlash({
                type: 'danger',
                message: extractErrorMessage(error, 'Failed to delete train')
            });
        } finally {
            setDeleting(false);
        }
    };

    const openDetailsModal = async (trainId) => {
        setDetailsModal(true);
        setDetailsLoading(true);
        setDetailsError('');
        setSelectedTrainDetails(null);

        try {
            const details = await loadTrainDetails(trainId);
            setSelectedTrainDetails(details);
        } catch (error) {
            setDetailsError(extractErrorMessage(error, 'Failed to load train details'));
        } finally {
            setDetailsLoading(false);
        }
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

    const applyFilters = (event) => {
        event.preventDefault();

        if (filters.createdFrom && filters.createdTo && filters.createdFrom > filters.createdTo) {
            setTableError('Created From date cannot be after Created To date');
            return;
        }

        setTableError('');
        setPage(0);
        setShowFilterSourceSuggestions(false);
        setShowFilterDestinationSuggestions(false);
        setAppliedFilters({
            trainNumber: filters.trainNumber,
            trainName: filters.trainName,
            sourceStation: filters.sourceStation,
            destinationStation: filters.destinationStation,
            status: filters.status,
            createdFrom: filters.createdFrom,
            createdTo: filters.createdTo
        });
    };

    const resetFilters = () => {
        setFilters(EMPTY_FILTERS);
        setAppliedFilters(EMPTY_FILTERS);
        setFilterSourceSuggestions([]);
        setFilterDestinationSuggestions([]);
        setShowFilterSourceSuggestions(false);
        setShowFilterDestinationSuggestions(false);
        setPage(0);
    };

    const exportCsv = () => {
        const rows = trainsPage.content || [];
        if (rows.length === 0) {
            setFlash({ type: 'warning', message: 'No rows to export' });
            return;
        }

        const headers = [
            'Train Number',
            'Train Name',
            'Source Station',
            'Destination Station',
            'Total Seats',
            'Available Seats',
            'Status',
            'Start Time',
            'End Time',
            'Arrival Day Offset',
            'Running Days',
            'Created At',
            'Modified At'
        ];

        const csvBody = rows.map((row) => [
            row.trainNumber,
            row.trainName,
            row.sourceStation,
            row.destinationStation,
            row.totalSeats,
            row.availableSeats,
            row.status,
            row.startTime,
            row.endTime,
            row.arrivalDayOffset ?? 0,
            formatRunningDaysForCsv(row.runningDays),
            formatDateTime(row.createdAt),
            formatDateTime(row.modifiedAt)
        ].map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`).join(','));

        const csv = [headers.join(','), ...csvBody].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `trains-page-${page + 1}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    if (!user) {
        return (
            <div className="container py-5">
                <div className="alert alert-warning mt-5">
                    Please login as an admin to access Trains management.
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

    const navbarOffset = 72;

    return (
        <div
            className="container-fluid"
            style={{
                position: 'fixed',
                top: navbarOffset,
                left: 0,
                right: 0,
                bottom: 0,
                paddingTop: 8,
                paddingBottom: 16,
                background: '#f8f9fa',
                display: 'flex',
                justifyContent: 'center',
                overflow: 'hidden'
            }}
        >
            <div
                style={{
                    width: '100%',
                    maxWidth: 1320,
                    margin: '0 auto',
                    paddingLeft: 12,
                    paddingRight: 12,
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: 0,
                    height: '100%',
                    overflow: 'hidden'
                }}
            >
                <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                    <h3 className="mb-0">Trains Management</h3>
                    <div className="d-flex gap-2">
                        <button className="btn btn-outline-success" onClick={exportCsv}>
                            Export CSV
                        </button>
                        <button className="btn btn-primary" onClick={openCreateModal}>
                            Add Train
                        </button>
                    </div>
                </div>

                {flash && (
                    <div className={`alert alert-${flash.type} py-2`}>
                        {flash.message}
                    </div>
                )}

                <form className="card p-3 mb-3" onSubmit={applyFilters}>
                    <h6 className="mb-3">Search & Filters</h6>
                    <div className="row g-3 align-items-end">
                        <div className="col-md-3">
                            <label className="form-label">Train Number</label>
                            <input
                                type="text"
                                className="form-control"
                                value={filters.trainNumber}
                                onChange={(event) => setFilters((prev) => ({
                                    ...prev,
                                    trainNumber: event.target.value
                                }))}
                                placeholder="Type Train Number..."
                            />
                        </div>
                        <div className="col-md-3">
                            <label className="form-label">Train Name</label>
                            <input
                                type="text"
                                className="form-control"
                                value={filters.trainName}
                                onChange={(event) => setFilters((prev) => ({
                                    ...prev,
                                    trainName: event.target.value
                                }))}
                                placeholder="Type Train Name..."
                            />
                        </div>
                        <div className="col-md-3 position-relative" ref={filterSourceRef}>
                            <label className="form-label">Source Station</label>
                            <input
                                type="text"
                                className="form-control"
                                value={filters.sourceStation}
                                onFocus={() => {
                                    setShowFilterSourceSuggestions(true);
                                    searchStations(filters.sourceStation, null, setFilterSourceSuggestions);
                                }}
                                onChange={(event) => {
                                    const value = event.target.value;
                                    setFilters((prev) => ({
                                        ...prev,
                                        sourceStation: value
                                    }));
                                    setShowFilterSourceSuggestions(true);
                                    searchStations(value, null, setFilterSourceSuggestions);
                                }}
                                placeholder="Type Source Station..."
                            />

                            {showFilterSourceSuggestions && filterSourceSuggestions.length > 0 && (
                                <ul
                                    className="dropdown-menu show w-100"
                                    style={{
                                        maxHeight: '220px',
                                        overflowY: 'auto',
                                        overflowX: 'hidden',
                                        zIndex: 1100
                                    }}
                                >
                                    {filterSourceSuggestions.map((station) => {
                                        const isDisabled = isSameStationName(
                                            station.name,
                                            filters.destinationStation
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
                                                        textOverflow: 'ellipsis'
                                                    }}
                                                    onClick={() => {
                                                        if (isDisabled) return;
                                                        setFilters((prev) => ({
                                                            ...prev,
                                                            sourceStation: station.name
                                                        }));
                                                        setShowFilterSourceSuggestions(false);
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
                        <div className="col-md-3 position-relative" ref={filterDestinationRef}>
                            <label className="form-label">Destination Station</label>
                            <input
                                type="text"
                                className="form-control"
                                value={filters.destinationStation}
                                onFocus={() => {
                                    setShowFilterDestinationSuggestions(true);
                                    searchStations(filters.destinationStation, null, setFilterDestinationSuggestions);
                                }}
                                onChange={(event) => {
                                    const value = event.target.value;
                                    setFilters((prev) => ({
                                        ...prev,
                                        destinationStation: value
                                    }));
                                    setShowFilterDestinationSuggestions(true);
                                    searchStations(value, null, setFilterDestinationSuggestions);
                                }}
                                placeholder="Type Destination Station..."
                            />

                            {showFilterDestinationSuggestions && filterDestinationSuggestions.length > 0 && (
                                <ul
                                    className="dropdown-menu show w-100"
                                    style={{
                                        maxHeight: '220px',
                                        overflowY: 'auto',
                                        overflowX: 'hidden',
                                        zIndex: 1100
                                    }}
                                >
                                    {filterDestinationSuggestions.map((station) => {
                                        const isDisabled = isSameStationName(
                                            station.name,
                                            filters.sourceStation
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
                                                        textOverflow: 'ellipsis'
                                                    }}
                                                    onClick={() => {
                                                        if (isDisabled) return;
                                                        setFilters((prev) => ({
                                                            ...prev,
                                                            destinationStation: station.name
                                                        }));
                                                        setShowFilterDestinationSuggestions(false);
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

                        <div className="col-md-2">
                            <label className="form-label">Status</label>
                            <select
                                className="form-select"
                                value={filters.status}
                                onChange={(event) => setFilters((prev) => ({
                                    ...prev,
                                    status: event.target.value
                                }))}
                            >
                                <option value="">All</option>
                                <option value="ACTIVE">Active</option>
                                <option value="INACTIVE">Inactive</option>
                            </select>
                        </div>
                        <div className="col-md-2">
                            <label className="form-label">Created From</label>
                            <DatePicker
                                selected={filters.createdFrom}
                                onChange={(date) => setFilters((prev) => ({
                                    ...prev,
                                    createdFrom: date
                                }))}
                                className="form-control"
                                dateFormat="yyyy-MM-dd"
                                placeholderText="From"
                            />
                        </div>
                        <div className="col-md-2">
                            <label className="form-label">Created To</label>
                            <DatePicker
                                selected={filters.createdTo}
                                onChange={(date) => setFilters((prev) => ({
                                    ...prev,
                                    createdTo: date
                                }))}
                                className="form-control"
                                dateFormat="yyyy-MM-dd"
                                placeholderText="To"
                                minDate={filters.createdFrom}
                            />
                        </div>
                        <div className="col-md-3 d-flex gap-2">
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
                        <strong>Total Trains:</strong> {trainsPage.totalElements}
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

                {tableError && (
                    <div className="alert alert-danger py-2">{tableError}</div>
                )}

                <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                    <div className="table-responsive" style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
                        <table className="table table-hover table-bordered align-middle mb-0">
                            <thead className="table-dark sticky-top">
                                <tr>
                                    <th
                                        role="button"
                                        onClick={() => changeSort('trainNumber')}
                                    >
                                        Train Number {sortLabel('trainNumber')}
                                    </th>
                                    <th
                                        role="button"
                                        onClick={() => changeSort('trainName')}
                                    >
                                        Train Name {sortLabel('trainName')}
                                    </th>
                                    <th>Source Station</th>
                                    <th>Destination Station</th>
                                    <th>Running Days</th>
                                    <th>Total Seats</th>
                                    <th>Available Seats</th>
                                    <th>Status</th>
                                    <th>Start Time</th>
                                    <th>End Time</th>
                                    <th
                                        role="button"
                                        onClick={() => changeSort('createdAt')}
                                    >
                                        Created At {sortLabel('createdAt')}
                                    </th>
                                    <th>Modified At</th>
                                    <th style={{ width: 130, minWidth: 130 }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan="13" className="text-center">Loading...</td>
                                    </tr>
                                ) : trainsPage.content.length === 0 ? (
                                    <tr>
                                        <td colSpan="13" className="text-center">No trains found</td>
                                    </tr>
                                ) : (
                                    trainsPage.content.map((train) => (
                                        <tr
                                            key={train.id}
                                            onClick={() => openDetailsModal(train.id)}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <td>{train.trainNumber}</td>
                                            <td>{train.trainName}</td>
                                            <td>{train.sourceStation}</td>
                                            <td>{train.destinationStation}</td>
                                            <td>{renderRunningDays(train.runningDays)}</td>
                                            <td>{train.totalSeats}</td>
                                            <td>{train.availableSeats}</td>
                                            <td>
                                                <span className={`badge ${train.status === 'ACTIVE' ? 'bg-success' : 'bg-secondary'}`}>
                                                    {train.status}
                                                </span>
                                            </td>
                                            <td>{toInputTime(train.startTime)}</td>
                                            <td>{renderEndTimeWithOffset(train.endTime, train.arrivalDayOffset)}</td>
                                            <td>{formatDateTime(train.createdAt)}</td>
                                            <td>{formatDateTime(train.modifiedAt)}</td>
                                            <td>
                                                <div className="d-flex gap-1">
                                                    <button
                                                        className="btn btn-sm btn-outline-primary"
                                                        onClick={(event) => openEditModal(event, train.id)}
                                                        disabled={submitting}
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        className="btn btn-sm btn-outline-danger"
                                                        onClick={(event) => openDeleteModal(event, train)}
                                                        disabled={deleting}
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
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
                            Page {trainsPage.totalPages === 0 ? 0 : page + 1} of {trainsPage.totalPages}
                        </span>
                        <button
                            className="btn btn-outline-secondary"
                            disabled={page >= trainsPage.totalPages - 1 || trainsPage.totalPages === 0}
                            onClick={() => setPage((prev) => prev + 1)}
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>

            {showFormModal && (
                <div className="modal fade show d-block" style={{ background: 'rgba(0,0,0,0.45)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">
                                    {editingTrainId ? 'Edit Train' : 'Add Train'}
                                </h5>
                                <button
                                    className="btn-close"
                                    type="button"
                                    onClick={() => {
                                        setShowFormModal(false);
                                        resetForm();
                                    }}
                                />
                            </div>
                            <div className="modal-body">
                                {formError && (
                                    <div className="alert alert-danger py-2">{formError}</div>
                                )}
                                <div className="row g-3">
                                    <div className="col-md-6">
                                        <label className="form-label">Train Number</label>
                                        <input
                                            className="form-control"
                                            value={formData.trainNumber}
                                            onChange={(event) => setFormData((prev) => ({
                                                ...prev,
                                                trainNumber: event.target.value.toUpperCase()
                                            }))}
                                            maxLength={10}
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">Train Name</label>
                                        <input
                                            className="form-control"
                                            value={formData.trainName}
                                            onChange={(event) => setFormData((prev) => ({
                                                ...prev,
                                                trainName: event.target.value
                                            }))}
                                        />
                                    </div>
                                    <div className="col-md-6 position-relative" ref={sourceStationRef}>
                                        <label className="form-label">Source Station</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={sourceStationInput}
                                            placeholder="Type source station"
                                            onFocus={() => {
                                                setShowSourceSuggestions(true);
                                                searchStations(
                                                    sourceStationInput,
                                                    formData.destinationStationId,
                                                    setSourceStationSuggestions
                                                );
                                            }}
                                            onChange={(event) => {
                                                const value = event.target.value;
                                                setSourceStationInput(value);
                                                setShowSourceSuggestions(true);
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    sourceStationId: ''
                                                }));
                                                searchStations(
                                                    value,
                                                    formData.destinationStationId,
                                                    setSourceStationSuggestions
                                                );
                                            }}
                                        />

                                        {showSourceSuggestions && sourceStationSuggestions.length > 0 && (
                                            <ul
                                                className="dropdown-menu show w-100"
                                                style={{
                                                    maxHeight: '220px',
                                                    overflowY: 'auto',
                                                    overflowX: 'hidden',
                                                    zIndex: 1100
                                                }}
                                            >
                                                {sourceStationSuggestions.map((station) => {
                                                    const isDisabled = String(station.id) === formData.destinationStationId;
                                                    return (
                                                        <li key={station.id}>
                                                            <button
                                                                type="button"
                                                                className={`dropdown-item text-truncate${isDisabled ? ' disabled' : ''}`}
                                                                disabled={isDisabled}
                                                                style={{
                                                                    whiteSpace: 'nowrap',
                                                                    overflow: 'hidden',
                                                                    textOverflow: 'ellipsis'
                                                                }}
                                                                onClick={() => {
                                                                    if (isDisabled) return;
                                                                    setSourceStationInput(station.name);
                                                                    setFormData((prev) => ({
                                                                        ...prev,
                                                                        sourceStationId: String(station.id)
                                                                    }));
                                                                    setShowSourceSuggestions(false);
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
                                    <div className="col-md-6 position-relative" ref={destinationStationRef}>
                                        <label className="form-label">Destination Station</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={destinationStationInput}
                                            placeholder="Type destination station"
                                            onFocus={() => {
                                                setShowDestinationSuggestions(true);
                                                searchStations(
                                                    destinationStationInput,
                                                    formData.sourceStationId,
                                                    setDestinationStationSuggestions
                                                );
                                            }}
                                            onChange={(event) => {
                                                const value = event.target.value;
                                                setDestinationStationInput(value);
                                                setShowDestinationSuggestions(true);
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    destinationStationId: ''
                                                }));
                                                searchStations(
                                                    value,
                                                    formData.sourceStationId,
                                                    setDestinationStationSuggestions
                                                );
                                            }}
                                        />

                                        {showDestinationSuggestions && destinationStationSuggestions.length > 0 && (
                                            <ul
                                                className="dropdown-menu show w-100"
                                                style={{
                                                    maxHeight: '220px',
                                                    overflowY: 'auto',
                                                    overflowX: 'hidden',
                                                    zIndex: 1100
                                                }}
                                            >
                                                {destinationStationSuggestions.map((station) => {
                                                    const isDisabled = String(station.id) === formData.sourceStationId;
                                                    return (
                                                        <li key={station.id}>
                                                            <button
                                                                type="button"
                                                                className={`dropdown-item text-truncate${isDisabled ? ' disabled' : ''}`}
                                                                disabled={isDisabled}
                                                                style={{
                                                                    whiteSpace: 'nowrap',
                                                                    overflow: 'hidden',
                                                                    textOverflow: 'ellipsis'
                                                                }}
                                                                onClick={() => {
                                                                    if (isDisabled) return;
                                                                    setDestinationStationInput(station.name);
                                                                    setFormData((prev) => ({
                                                                        ...prev,
                                                                        destinationStationId: String(station.id)
                                                                    }));
                                                                    setShowDestinationSuggestions(false);
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
                                    <div className="col-md-4">
                                        <label className="form-label">Total Seats</label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            min="1"
                                            value={formData.totalSeats}
                                            onChange={(event) => setFormData((prev) => ({
                                                ...prev,
                                                totalSeats: event.target.value
                                            }))}
                                        />
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label">Start Time</label>
                                        <input
                                            type="time"
                                            className="form-control"
                                            value={formData.startTime}
                                            onChange={(event) => setFormData((prev) => ({
                                                ...prev,
                                                startTime: event.target.value
                                            }))}
                                        />
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label">End Time</label>
                                        <input
                                            type="time"
                                            className="form-control"
                                            value={formData.endTime}
                                            onChange={(event) => setFormData((prev) => ({
                                                ...prev,
                                                endTime: event.target.value
                                            }))}
                                        />
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label">Status</label>
                                        <select
                                            className="form-select"
                                            value={formData.status}
                                            onChange={(event) => setFormData((prev) => ({
                                                ...prev,
                                                status: event.target.value
                                            }))}
                                        >
                                            <option value="ACTIVE">ACTIVE</option>
                                            <option value="INACTIVE">INACTIVE</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => {
                                        setShowFormModal(false);
                                        resetForm();
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="btn btn-primary"
                                    onClick={handleSaveTrain}
                                    disabled={submitting}
                                >
                                    {submitting ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {deleteModal && (
                <div className="modal fade show d-block" style={{ background: 'rgba(0,0,0,0.45)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Confirm Delete</h5>
                                <button
                                    className="btn-close"
                                    type="button"
                                    onClick={() => {
                                        setDeleteModal(false);
                                        setDeleteTrain(null);
                                    }}
                                />
                            </div>
                            <div className="modal-body">
                                Are you sure you want to delete train{' '}
                                <strong>{deleteTrain?.trainNumber}</strong>?
                                <div className="small text-muted mt-2">
                                    Soft delete will set train status to INACTIVE.
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => {
                                        setDeleteModal(false);
                                        setDeleteTrain(null);
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="btn btn-danger"
                                    onClick={confirmDelete}
                                    disabled={deleting}
                                >
                                    {deleting ? 'Deleting...' : 'Delete'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {detailsModal && (
                <div className="modal fade show d-block" style={{ background: 'rgba(0,0,0,0.45)' }}>
                    <div className="modal-dialog modal-lg modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Train Details</h5>
                                <button
                                    className="btn-close"
                                    type="button"
                                    onClick={() => {
                                        setDetailsModal(false);
                                        setSelectedTrainDetails(null);
                                        setDetailsError('');
                                    }}
                                />
                            </div>
                            <div className="modal-body">
                                {detailsLoading && <div>Loading details...</div>}
                                {!detailsLoading && detailsError && (
                                    <div className="alert alert-danger py-2">{detailsError}</div>
                                )}
                                {!detailsLoading && !detailsError && selectedTrainDetails && (
                                    <>
                                        <div className="row mb-3">
                                            <div className="col-md-6">
                                                <strong>Train:</strong> {selectedTrainDetails.trainNumber} - {selectedTrainDetails.trainName}
                                            </div>
                                            <div className="col-md-6">
                                                <strong>Status:</strong> {selectedTrainDetails.status}
                                            </div>
                                            <div className="col-md-6">
                                                <strong>Source:</strong> {selectedTrainDetails.sourceStation}
                                            </div>
                                            <div className="col-md-6">
                                                <strong>Destination:</strong> {selectedTrainDetails.destinationStation}
                                            </div>
                                            <div className="col-md-6">
                                                <strong>Running Days:</strong> {renderRunningDays(selectedTrainDetails.runningDays)}
                                            </div>
                                            <div className="col-md-6">
                                                <strong>Start Time:</strong> {toInputTime(selectedTrainDetails.startTime)}
                                            </div>
                                            <div className="col-md-6">
                                                <strong>End Time:</strong> {renderEndTimeWithOffset(
                                                    selectedTrainDetails.endTime,
                                                    selectedTrainDetails.arrivalDayOffset
                                                )}
                                            </div>
                                            <div className="col-md-6">
                                                <strong>Total Seats:</strong> {selectedTrainDetails.totalSeats}
                                            </div>
                                            <div className="col-md-6">
                                                <strong>Available Seats:</strong> {selectedTrainDetails.availableSeats}
                                            </div>
                                        </div>

                                        <h6>Route</h6>
                                        <div className="table-responsive mb-3">
                                            <table className="table table-sm table-bordered">
                                                <thead className="table-light">
                                                    <tr>
                                                        <th>Stop</th>
                                                        <th>Station</th>
                                                        <th>Code</th>
                                                        <th>Minutes From Source</th>
                                                        <th>Scheduled Time</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {(selectedTrainDetails.routeStops || []).map((stop) => (
                                                        <tr key={`${stop.stationId}-${stop.stopOrder}`}>
                                                            <td>{stop.stopOrder}</td>
                                                            <td>{stop.stationName}</td>
                                                            <td>{stop.stationCode}</td>
                                                            <td>{stop.minutesFromSource}</td>
                                                            <td>{toInputTime(stop.scheduledTime)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        <h6>Booking Stats</h6>
                                        <div className="row">
                                            <div className="col-md-3">
                                                <div className="border rounded p-2">
                                                    <div className="small text-muted">Total Bookings</div>
                                                    <div className="fw-bold">{selectedTrainDetails.totalBookings ?? 0}</div>
                                                </div>
                                            </div>
                                            <div className="col-md-3">
                                                <div className="border rounded p-2">
                                                    <div className="small text-muted">Active Bookings</div>
                                                    <div className="fw-bold">{selectedTrainDetails.activeBookings ?? 0}</div>
                                                </div>
                                            </div>
                                            <div className="col-md-3">
                                                <div className="border rounded p-2">
                                                    <div className="small text-muted">Cancelled</div>
                                                    <div className="fw-bold">{selectedTrainDetails.cancelledBookings ?? 0}</div>
                                                </div>
                                            </div>
                                            <div className="col-md-3">
                                                <div className="border rounded p-2">
                                                    <div className="small text-muted">Seats Booked</div>
                                                    <div className="fw-bold">{selectedTrainDetails.seatsBooked ?? 0}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
