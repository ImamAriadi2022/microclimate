import { FaDownload, FaHome, FaMapMarkerAlt, FaTachometerAlt } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const Sidebar = ({ isOpen }) => {
  return (
    <div
      className={`sidebar ${isOpen ? '' : 'sidebar--closed'}`}
    >
      {/* Logo */}
      {isOpen && (
        <div className="sidebar-logo">
          <img
            src="/img/logo.png" // Ganti dengan path logo Anda
            alt="Logo"
          />
          <hr />
        </div>
      )}

      {/* Menu Items */}
      {isOpen && (
        <nav>
          <ul className="sidebar-nav">
            <li>
              <Link
                to="/"
                className="sidebar-link"
              >
                <FaHome />
                Go Home
              </Link>
            </li>
            <li>
              <Link
                to="/dashboard/"
                className="sidebar-link"
              >
                <FaTachometerAlt />
                Dashboard
              </Link>
            </li>
            <li>
              <Link
                to="/dashboard/station1"
                className="sidebar-link"
              >
                <FaMapMarkerAlt />
                Station 1
              </Link>
            </li>
            <li>
              <Link
                to="/dashboard/station2"
                className="sidebar-link"
              >
                <FaMapMarkerAlt />
                Station 2
              </Link>
            </li>
            <li>
              <Link
                to="/dashboard/download"
                className="sidebar-link"
              >
                <FaDownload />
                Download Data
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </div>
  );
};

export default Sidebar;