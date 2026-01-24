import { Link } from 'react-router-dom';
export default function Navbar() {
    return (
        <nav className="navbar navbar-expand-lg navbar-dark bg-dark fixed-top w-100">
            <div className="container-fluid">
                <Link className="navbar-brand fw-bold" to="/">
                    Smart Train Booking
                </Link>
                <button
                    className="navbar-toggler"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#navbarNav"
                    aria-controls="navbarNav"
                    aria-expanded="false"
                    aria-label="Toggle navigation"
                >
                    <span className="navbar-toggler-icon"></span>
                </button>
                <div className="collapse navbar-collapse justify-content-end" id="navbarNav">
                    <ul className="navbar-nav">
                        <li className="nav-item">
                            <Link className="nav-link" to="/login">Login</Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link" to="/register">Register</Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link" to="/search-trains">Search Trains</Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link" to="/stations">Stations</Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link" to="/trains">Trains</Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link" to="/bookings">Bookings</Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link" to="/my-bookings">My Bookings</Link>
                        </li>
                    </ul>
                </div>
            </div>
        </nav>
    );
}
