import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Register() {
    const [form, setForm] = useState({
        fullName: '',
        email: '',
        username: '',
        password: '',
        phone: ''
    });

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };


    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            const response = await fetch('/api/users/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });
            if (response.ok) {
                setSuccess('Registration successful! Redirecting to login...');
                setTimeout(() => navigate('/login'), 1500);
            } else {
                const data = await response.json().catch(() => ({}));
                setError(data.message || 'Registration failed.');
            }
        } catch (err) {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: '#f8f9fa',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 0
        }}>
            <div className="card shadow-sm" style={{ width: '100%', maxWidth: 450 }}>
                <div className="card-body">
                    <h3 className="card-title mb-4 text-center">Register</h3>
                    <form onSubmit={handleSubmit}>
                        {error && <div className="alert alert-danger py-2">{error}</div>}
                        {success && <div className="alert alert-success py-2">{success}</div>}
                        <div className="mb-3">
                            <label htmlFor="fullName" className="form-label">Full Name</label>
                            <input
                                type="text"
                                className="form-control"
                                id="fullName"
                                name="fullName"
                                value={form.fullName}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="mb-3">
                            <label htmlFor="email" className="form-label">Email</label>
                            <input
                                type="email"
                                className="form-control"
                                id="email"
                                name="email"
                                value={form.email}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="mb-3">
                            <label htmlFor="username" className="form-label">Username</label>
                            <input
                                type="text"
                                className="form-control"
                                id="username"
                                name="username"
                                value={form.username}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="mb-3">
                            <label htmlFor="password" className="form-label">Password</label>
                            <input
                                type="password"
                                className="form-control"
                                id="password"
                                name="password"
                                value={form.password}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="mb-3">
                            <label htmlFor="phone" className="form-label">Phone</label>
                            <input
                                type="tel"
                                className="form-control"
                                id="phone"
                                name="phone"
                                value={form.phone}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                            {loading ? 'Registering...' : 'Register'}
                        </button>
                    </form>
                    <div className="mt-3 text-center">
                        <span>Already have an account? </span>
                        <Link to="/login">Login here</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
