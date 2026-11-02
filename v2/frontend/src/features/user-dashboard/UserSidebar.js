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
      label: 'Sumber Data Sensor',
      to: `${basePath}/endpoint`,
      icon: FiSettings,
    },
    {
      label: 'Link Dashboard',
      to: `${basePath}/links`,
      icon: FiLink2,
    },
    {
      label: 'Atur Tampilan',
      to: `${basePath}/templates`,
      icon: FiGrid,
    },
  ];

  return (
    <aside className={`user-sidebar ${isOpen ? '' : 'is-collapsed'}`}>
      <div className="user-sidebar__title">Menu Ruang Kerja</div>
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
    </aside>
  );
};

export default UserSidebar;
