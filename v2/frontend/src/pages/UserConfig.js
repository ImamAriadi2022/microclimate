import { useState } from 'react';
import { Container } from 'react-bootstrap';
import { Navigate, Route, Routes, useParams } from 'react-router-dom';
import DashboardLinksPage from '../features/user-dashboard/DashboardLinksPage';
import EndpointConfigPage from '../features/user-dashboard/EndpointConfigPage';
import TemplatePage from '../features/user-dashboard/TemplatePage';
import UserNavbar from '../features/user-dashboard/UserNavbar';
import UserSidebar from '../features/user-dashboard/UserSidebar';
import '../features/user-dashboard/userDashboard.css';

const UserConfig = () => {
  const { username } = useParams();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const displayName =
    localStorage.getItem('mc_v2_display_name') ||
    username ||
    localStorage.getItem('mc_v2_username') ||
    'user';
  const basePath = `/${username || 'user'}/dashboard`;

  const handleToggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  return (
    <div className="user-dashboard">
      <UserNavbar
        username={displayName}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={handleToggleSidebar}
      />
      <div className={`user-dashboard__body ${isSidebarOpen ? '' : 'is-collapsed'}`}>
        <UserSidebar basePath={basePath} isOpen={isSidebarOpen} />
        <main className="user-dashboard__content">
          <Container fluid>
            <Routes>
              <Route index element={<Navigate to="endpoint" replace />} />
              <Route path="endpoint" element={<EndpointConfigPage />} />
              <Route path="links" element={<DashboardLinksPage />} />
              <Route path="templates" element={<TemplatePage />} />
            </Routes>
          </Container>
        </main>
      </div>
    </div>
  );
};

export default UserConfig;
