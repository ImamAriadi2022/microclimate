import EndpointConfigPanel from '../endpoint-config/EndpointConfigPanel';

const EndpointConfigPage = () => {
  return (
    <section className="user-dashboard__page">
      <div className="user-dashboard__page-header">
        <h2>Sumber Data Sensor</h2>
        <p>Hubungkan API atau broker MQTT dari perangkat sensor Anda agar dapat ditampilkan di halaman dashboard.</p>
      </div>
      <EndpointConfigPanel />
    </section>
  );
};

export default EndpointConfigPage;
