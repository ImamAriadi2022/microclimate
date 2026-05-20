import { FiGrid, FiHome, FiLink2, FiSettings } from 'react-icons/fi';
import { NavLink } from 'react-router-dom';

const UserSidebar = ({ basePath, isOpen }) => {
  const navItems = [
    {
      label: 'Ringkasan',
      to: basePath,
      icon: FiHome,
      end: true,
    },
    {
      label: 'Konfigurasi Endpoint',
      to: `${basePath}/endpoint`,
      icon: FiSettings,
    },
    {
      label: 'Dashboard Link',
      to: `${basePath}/links`,
      icon: FiLink2,
    },
    {
      label: 'Template Station2',
      to: `${basePath}/templates`,
      icon: FiGrid,
    },
  ];

  return (
    <aside className={`user-sidebar ${isOpen ? '' : 'is-collapsed'}`}>
      <div className="user-sidebar__title">Menu Fitur</div>
      <nav>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `user-sidebar__link ${isActive ? 'is-active' : ''}`
              }
            >
              <Icon size={18} />
              <span className="user-sidebar__label">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
      <div className="user-sidebar__note">
        Mode simulasi aktif. Data disimpan lokal di browser.
      </div>
    </aside>
  );
};

export default UserSidebar;
