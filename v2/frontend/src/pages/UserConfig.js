import { useEffect, useState } from 'react';
import { Container } from 'react-bootstrap';
import { Navigate, Route, Routes, useParams } from 'react-router-dom';
import ChangeEmailPage from '../features/user-dashboard/ChangeEmailPage';
import ChangePasswordPage from '../features/user-dashboard/ChangePasswordPage';
import DashboardLinksPage from '../features/user-dashboard/DashboardLinksPage';
import EndpointConfigPage from '../features/user-dashboard/EndpointConfigPage';
import OverviewPage from '../features/user-dashboard/OverviewPage';
import ProfilePage from '../features/user-dashboard/ProfilePage';
import TemplatePage from '../features/user-dashboard/TemplatePage';
import UserNavbar from '../features/user-dashboard/UserNavbar';
import UserSidebar from '../features/user-dashboard/UserSidebar';
import '../features/user-dashboard/userDashboard.css';

const UserConfig = () => {
  const { username } = useParams();
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window === 'undefined') return true;
    return window.innerWidth >= 992;
  });
  const [displayName, setDisplayName] = useState(
    localStorage.getItem('mc_v2_display_name') ||
      username ||
      localStorage.getItem('mc_v2_username') ||
      'user'
  );
  const activeUsername = localStorage.getItem('mc_v2_username') || username || 'user';
  const basePath = `/${activeUsername}/dashboard`;

  useEffect(() => {
    setDisplayName(
      localStorage.getItem('mc_v2_display_name') ||
        localStorage.getItem('mc_v2_username') ||
        username ||
        'user'
    );
  }, [username]);

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
              <Route index element={<OverviewPage basePath={basePath} displayName={displayName} />} />
              <Route path="endpoint" element={<EndpointConfigPage />} />
              <Route path="links" element={<DashboardLinksPage />} />
              <Route path="templates" element={<TemplatePage />} />
              <Route path="profile" element={<ProfilePage onProfileChange={setDisplayName} />} />
              <Route path="email" element={<ChangeEmailPage />} />
              <Route path="password" element={<ChangePasswordPage />} />
              <Route path="*" element={<Navigate to="." replace />} />
            </Routes>
          </Container>
        </main>
      </div>
    </div>
  );
};

export default UserConfig;
