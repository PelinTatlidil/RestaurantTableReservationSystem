import { BrowserRouter as Router, Navigate, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import { useAuth } from './context/AuthContext';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import Tables from './pages/Tables';
import MyReservations from './pages/MyReservations';
import MakeReservation from './pages/MakeReservation';
import ReservationConfirmation from './pages/ReservationConfirmation';
import CustomerPanel from './pages/CustomerPanel';
import ManageTimeSlots from './pages/ManageTimeSlots';
import AdminReservations from './pages/AdminReservations';
import AdminUsers from './pages/AdminUsers';
import AdminRestaurantInfo from './pages/AdminRestaurantInfo';

const RequireRole = ({ children, role }) => {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  if (user.role !== role) {
    return <Navigate to={user.role === 'customer' ? '/profile' : '/'} replace />;
  }

  return children;
};

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/profile"
          element={
            <RequireRole role="customer">
              <Profile />
            </RequireRole>
          }
        />

        <Route
          path="/admin-dashboard"
          element={
            <RequireRole role="admin">
              <AdminDashboard />
            </RequireRole>
          }
        />

        <Route
          path="/tables"
          element={
            <RequireRole role="admin">
              <Tables />
            </RequireRole>
          }
        />
        <Route path="/tasks" element={<Navigate to="/tables" replace />} />
        <Route
          path="/admin/reservations"
          element={
            <RequireRole role="admin">
              <AdminReservations />
            </RequireRole>
          }
        />
        <Route
          path="/admin/users"
          element={
            <RequireRole role="admin">
              <AdminUsers />
            </RequireRole>
          }
        />
        <Route
          path="/admin/time-slots"
          element={
            <RequireRole role="admin">
              <ManageTimeSlots />
            </RequireRole>
          }
        />
        <Route
          path="/admin/restaurant-info"
          element={
            <RequireRole role="admin">
              <AdminRestaurantInfo />
            </RequireRole>
          }
        />

        <Route
          path="/my-reservations"
          element={
            <RequireRole role="customer">
              <MyReservations />
            </RequireRole>
          }
        />
        <Route
          path="/make-reservation"
          element={
            <RequireRole role="customer">
              <MakeReservation />
            </RequireRole>
          }
        />
        <Route
          path="/reservation-confirmation"
          element={
            <RequireRole role="customer">
              <ReservationConfirmation />
            </RequireRole>
          }
        />
        <Route
          path="/customer-panel"
          element={
            <RequireRole role="customer">
              <CustomerPanel />
            </RequireRole>
          }
        />
      </Routes>

      <footer className="restaurant-footer">
        &copy; 2026 Restaurant Table Reservation System
      </footer>
    </Router>
  );
}

export default App;
