import EndpointConfigPanel from '../endpoint-config/EndpointConfigPanel';

const EndpointConfigPage = () => {
  return (
    <section className="user-dashboard__page">
      <div className="user-dashboard__page-header">
        <h2>Konfigurasi Data Source</h2>
        <p>Kelola beberapa konfigurasi backend atau MQTT untuk dashboard custom.</p>
      </div>
      <EndpointConfigPanel />
    </section>
  );
};

export default EndpointConfigPage;
