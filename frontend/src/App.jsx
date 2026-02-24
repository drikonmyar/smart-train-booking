
import { Navigate, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';


import Login from './pages/Login';
import Register from './pages/Register';
import SearchTrains from './pages/SearchTrains';
import MyBookings from './pages/MyBookings';
import Bookings from './pages/Bookings';
import Stations from './pages/Stations';
import Trains from './pages/Trains';
import { useUser } from './context/UserContext';

function App() {
  const { user } = useUser();
  const isAdmin = (user?.role || '').toUpperCase() === 'ADMIN';

  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Navigate to="/search-trains" replace />} />
        <Route path="/login" element={user ? <Navigate to="/search-trains" replace /> : <Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/search-trains" element={<SearchTrains />} />
        <Route path="/stations" element={<Stations />} />
        <Route path="/trains" element={<Trains />} />
        <Route path="/bookings" element={<Bookings />} />
        <Route path="/my-bookings" element={user && !isAdmin ? <MyBookings /> : <Navigate to="/search-trains" replace />} />
      </Routes>
    </>
  );
}

export default App;
