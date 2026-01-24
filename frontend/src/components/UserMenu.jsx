import { useUser } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

// Helper to generate a random avatar URL (using DiceBear Avatars)
function getAvatarUrl(username) {
    return `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(username)}`;
}

export default function UserMenu() {
    const { user, setUser } = useUser();
    const [open, setOpen] = useState(false);
    const navigate = useNavigate();

    if (!user) return null;

    const handleLogout = () => {
        setUser(null);
        setOpen(false);
        navigate('/login');
    };

    return (
        <div className="dropdown" style={{ position: 'relative' }}>
            <img
                src={getAvatarUrl(user.username)}
                alt="avatar"
                style={{ width: 36, height: 36, borderRadius: '50%', cursor: 'pointer', border: '2px solid #ccc' }}
                onClick={() => setOpen(v => !v)}
            />
            {open && (
                <div className="dropdown-menu show" style={{ right: 0, left: 'auto', minWidth: 200, position: 'absolute', top: 40, zIndex: 1000 }}>
                    <div className="px-3 py-2">
                        <div className="fw-bold">{user.fullName}</div>
                        <div className="text-muted small">{user.email}</div>
                        <div className="text-muted small">@{user.username}</div>
                    </div>
                    <div className="dropdown-divider"></div>
                    <button className="dropdown-item text-danger" onClick={handleLogout}>Logout</button>
                </div>
            )}
        </div>
    );
}
