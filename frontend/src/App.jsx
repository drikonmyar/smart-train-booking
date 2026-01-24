

import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';


import Login from './pages/Login';
import Register from './pages/Register';
import SearchTrains from './pages/SearchTrains';

function Home() {
  return <h2 className="mt-4">Welcome to Smart Train Booking</h2>;
}







function Stations() {
  return <h2 className="mt-4">Stations Management Page</h2>;
}

function Trains() {
  return <h2 className="mt-4">Trains Management Page</h2>;
}

function Bookings() {
  return <h2 className="mt-4">Bookings Page</h2>;
}

function MyBookings() {
  return <h2 className="mt-4">My Bookings Page</h2>;
}

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/search-trains" element={<SearchTrains />} />
        <Route path="/stations" element={<Stations />} />
        <Route path="/trains" element={<Trains />} />
        <Route path="/bookings" element={<Bookings />} />
        <Route path="/my-bookings" element={<MyBookings />} />
      </Routes>
    </>
  );
}

export default App;
