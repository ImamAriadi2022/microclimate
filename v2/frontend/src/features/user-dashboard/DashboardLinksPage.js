import DashboardLinksPanel from '../dashboard-links/DashboardLinksPanel';

const DashboardLinksPage = () => {
  return (
    <section className="user-dashboard__page">
      <div className="user-dashboard__page-header">
        <h2>Dashboard Link</h2>
        <p>Buat dan kelola link dashboard custom berbasis template Station2.</p>
      </div>
      <DashboardLinksPanel />
    </section>
  );
};

export default DashboardLinksPage;
