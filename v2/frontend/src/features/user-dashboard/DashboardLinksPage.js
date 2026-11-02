import DashboardLinksPanel from '../dashboard-links/DashboardLinksPanel';

const DashboardLinksPage = () => {
  return (
    <section className="user-dashboard__page">
      <div className="user-dashboard__page-header">
        <h2>Halaman & Link Dashboard</h2>
        <p>Buat tautan halaman dashboard untuk stasiun Anda dan bagikan akses pantauannya ke publik.</p>
      </div>
      <DashboardLinksPanel />
    </section>
  );
};

export default DashboardLinksPage;
