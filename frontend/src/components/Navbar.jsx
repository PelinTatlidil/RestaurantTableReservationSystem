import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';
  const isLoginPage = pathname === '/login';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const linkClass = ({ isActive }) =>
    `restaurant-nav-link ${isActive ? 'restaurant-nav-link-active' : ''}`;

  return (
    <nav className="restaurant-nav">
      <Link to="/" className="font-serif text-2xl font-semibold text-stone-950">
        Digi Meat Restaurant
      </Link>
      <div className="flex flex-wrap items-center justify-end gap-x-8 gap-y-3">
        {user ? (
          <>
            <NavLink to="/" className={linkClass}>
              Home
            </NavLink>
            {isAdmin ? (
              <>
                <NavLink to="/admin-dashboard" className={linkClass}>
                  Dashboard
                </NavLink>
                <NavLink to="/admin/reservations" className={linkClass}>
                  Reservations
                </NavLink>
                <NavLink to="/tasks" className={linkClass}>
                  Tables
                </NavLink>
                <NavLink to="/admin/time-slots" className={linkClass}>
                  Time Slots
                </NavLink>
                <NavLink to="/admin/users" className={linkClass}>
                  Users
                </NavLink>
                <NavLink to="/admin/restaurant-info" className={linkClass}>
                  Restaurant Info
                </NavLink>
              </>
            ) : (
              <>
                <NavLink to="/make-reservation" className={linkClass}>
                  Make Reservation
                </NavLink>
                <NavLink to="/my-reservations" className={linkClass}>
                  My Reservations
                </NavLink>
                <NavLink to="/profile" className={linkClass}>
                  Dashboard
                </NavLink>
              </>
            )}
            <span className="restaurant-nav-user">
              {user.name || user.email}
            </span>
            <button
              onClick={handleLogout}
              className="restaurant-nav-link"
            >
              Logout
            </button>
          </>
        ) : !isLoginPage ? (
          <>
            <NavLink to="/login" className="restaurant-button restaurant-nav-button h-[49px] px-6">
              Login
            </NavLink>
            <NavLink to="/register" className="restaurant-button restaurant-nav-button h-[49px] px-6">
              Register
            </NavLink>
          </>
        ) : null}
      </div>
    </nav>
  );
};

export default Navbar;
