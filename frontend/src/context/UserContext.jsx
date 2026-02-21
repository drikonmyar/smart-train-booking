import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const UserContext = createContext();
const USER_STORAGE_KEY = 'smart_train_booking_user';

function readStoredUser() {
    if (typeof window === 'undefined') {
        return null;
    }

    try {
        const raw = window.localStorage.getItem(USER_STORAGE_KEY);
        if (!raw) return null;

        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === 'object' ? parsed : null;
    } catch {
        window.localStorage.removeItem(USER_STORAGE_KEY);
        return null;
    }
}

export function UserProvider({ children }) {
    const [user, setUserState] = useState(() => readStoredUser());

    const setUser = useCallback((valueOrUpdater) => {
        setUserState((prevUser) => {
            const nextUser = typeof valueOrUpdater === 'function'
                ? valueOrUpdater(prevUser)
                : valueOrUpdater;

            if (typeof window !== 'undefined') {
                try {
                    if (nextUser) {
                        window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(nextUser));
                    } else {
                        window.localStorage.removeItem(USER_STORAGE_KEY);
                    }
                } catch {
                    // Ignore storage write errors and keep in-memory state.
                }
            }

            return nextUser;
        });
    }, []);

    const value = useMemo(() => ({ user, setUser }), [user, setUser]);

    return (
        <UserContext.Provider value={value}>
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    return useContext(UserContext);
}
