import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import Tasks from './pages/Tasks';
import MyReservations from './pages/MyReservations';
import MakeReservation from './pages/MakeReservation';
import ReservationConfirmation from './pages/ReservationConfirmation';

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/profile" element={<AdminDashboard />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/my-reservations" element={<MyReservations />} />
        <Route path="/make-reservation" element={<MakeReservation />} />
        <Route path="/reservation-confirmation" element={<ReservationConfirmation />} />
      </Routes>
      <footer className="restaurant-footer">&copy; 2026 Restaurant Table Reservation System</footer>
    </Router>
  );
}

export default App;
