import { useState } from 'react';
import { Link } from 'react-router-dom';
export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        // TODO: Add login logic here
        alert(`Username: ${username}\nPassword: ${password}`);
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
            <div className="card shadow-sm" style={{ width: '100%', maxWidth: 400 }}>
                <div className="card-body">
                    <h3 className="card-title mb-4 text-center">Login</h3>
                    <form onSubmit={handleSubmit}>
                        <div className="mb-3">
                            <label htmlFor="username" className="form-label">Username</label>
                            <input
                                type="text"
                                className="form-control"
                                id="username"
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                required
                            />
                        </div>
                        <div className="mb-3">
                            <label htmlFor="password" className="form-label">Password</label>
                            <input
                                type="password"
                                className="form-control"
                                id="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        <button type="submit" className="btn btn-primary w-100">Login</button>
                    </form>
                    <div className="mt-3 text-center">
                        <span>New user? </span>
                        <Link to="/register">Register here</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
