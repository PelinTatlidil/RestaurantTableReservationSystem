import { BrowserRouter as Router, Navigate, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import { useAuth } from './context/AuthContext';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import Tasks from './pages/Tasks';
import MyReservations from './pages/MyReservations';
import MakeReservation from './pages/MakeReservation';
import ReservationConfirmation from './pages/ReservationConfirmation';
import CustomerPanel from './pages/CustomerPanel';

const RequireRole = ({ children, role }) => {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  if (user.role !== role) {
    return <Navigate to={user.role === 'customer' ? '/profile' : '/'} replace />;
  }

  return children;
};

const RequireAuth = ({ children }) => {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

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
          path="/tasks"
          element={
            <RequireRole role="admin">
              <Tasks />
            </RequireRole>
          }
        />

        <Route
          path="/my-reservations"
          element={
            <RequireAuth>
              <MyReservations />
            </RequireAuth>
          }
        />
        <Route
          path="/make-reservation"
          element={
            <RequireAuth>
              <MakeReservation />
            </RequireAuth>
          }
        />
        <Route
          path="/reservation-confirmation"
          element={
            <RequireAuth>
              <ReservationConfirmation />
            </RequireAuth>
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
