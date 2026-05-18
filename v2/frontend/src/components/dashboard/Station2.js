import { useEffect, useRef, useState } from 'react';
import { Button, ButtonGroup, Col, Container, Row, Table } from 'react-bootstrap';
import { PETENGORAN_TOPIC5_URL } from '../../config/apiEndpoints';
import TrendChart from "./chart";

// Import komponen status environment (gauge)
import HumidityGauge from './status/HumidityGauge';
import IrradiationGauge from './status/Irradiation';
import RainfallGauge from './status/Rainfall';
import TemperatureGauge from './status/TemperaturGauge';
import WindDirectionGauge from './status/WindDirection';
import WindSpeedGauge from './status/WindSpeed';

const API_URL = PETENGORAN_TOPIC5_URL;
const LOCAL_STORAGE_KEY = "station2_data";

// Mapping function mirip Station1 Sebesi
function mapApiData(item) {
  return {
    timestamp: item.timestamp || 'alat rusak',
    humidity: item.humidity == null ? 'server sedang eror' : item.humidity,
    temperature: item.temperature == null ? 'server sedang eror' : item.temperature,
    airPressure: item.AirPressure == null ? 'server sedang eror' : item.AirPressure,
    windspeed: item.windSpeed == null ? 'server sedang eror' : item.windSpeed,
    rainfall: item.rainfall == null ? 'server sedang eror' : item.rainfall,
    irradiation: item.pyrano == null ? 'server sedang eror' : item.pyrano,
    windDirection: (item.direction ?? item.angle) == null ? 'server sedang eror' : (item.direction ?? item.angle),
    temperature2: (item.bmpTemperature ?? item.waterTemperature) == null ? 'server sedang eror' : (item.bmpTemperature ?? item.waterTemperature),
  };
}

function parseCustomDate(str) {
  if (!str) return new Date('Invalid');
  const [datePart, timePart] = str.split(' ');
  if (!datePart || !timePart) return new Date('Invalid');
  const [day, month, year] = datePart.split('-');
  if (!day || !month || !year) return new Date('Invalid');
  const fullYear = Number(year) < 100 ? 2000 + Number(year) : Number(year);
  const mm = month.padStart(2, '0');
  const dd = day.padStart(2, '0');
  return new Date(`${fullYear}-${mm}-${dd}T${timePart}`);
}

const Station2 = () => {
  const [filter, setFilter] = useState('1d');
  const [allData, setAllData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [serverError, setServerError] = useState(false);
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef(null);

  // Load data dari localStorage saat pertama kali mount
  useEffect(() => {
    const local = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (local) {
      try {
        const parsed = JSON.parse(local);
        setAllData(parsed);
        setServerError(false);
      } catch {
        setAllData([]);
      }
    }
  }, []);

  // Fetch data dari API setiap 10 detik
  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch(API_URL);
      const json = await response.json();
      const result = Array.isArray(json) ? json : (Array.isArray(json.result) ? json.result : []);
      const mapped = result.map(mapApiData);

      if (mapped.length > 0) {
        setAllData(mapped);
        setServerError(false);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(mapped));
      } else {
        setAllData([]);
        setServerError(true);
      }
      setLoading(false);
    } catch (error) {
      setLoading(false);
      setServerError(true);
    }
  };

  useEffect(() => {
    fetchData();
    intervalRef.current = setInterval(fetchData, 10000);
    return () => clearInterval(intervalRef.current);
  }, []);

  useEffect(() => {
    if (serverError) {
      setFilteredData([]);
      return;
    }
    let filtered = [];
    const now = new Date();
    if (filter === '1d') {
      const today = now;
      filtered = allData.filter(item => {
        const d = parseCustomDate(item.timestamp);
        return (
          d.getFullYear() === today.getFullYear() &&
          d.getMonth() === today.getMonth() &&
          d.getDate() === today.getDate() &&
          d <= today
        );
      });
    } else if (filter === '7d') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(now.getDate() - 7);
      filtered = allData.filter(item => {
        const d = parseCustomDate(item.timestamp);
        return d >= sevenDaysAgo && d <= now;
      });
    } else if (filter === '1m') {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(now.getMonth() - 1);
      filtered = allData.filter(item => {
        const d = parseCustomDate(item.timestamp);
        return d >= oneMonthAgo && d <= now;
      });
    } else {
      filtered = allData;
    }
    filtered.sort((a, b) => parseCustomDate(a.timestamp) - parseCustomDate(b.timestamp));
    setFilteredData(filtered);
  }, [allData, filter, serverError]);

  const latest = serverError
    ? {}
    : filteredData.length > 0
    ? filteredData[filteredData.length - 1]
    : {};

  return (
    <section
      style={{
        backgroundColor: '#f8f9fa',
        color: '#212529',
        minHeight: '100vh',
        padding: '20px 0',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      <Container>
        <Row className="mb-5">
          <Col>
            <h2 className="text-center" style={{ color: '#007bff' }}>Environment Status Station 2</h2>
            <p className="text-center">Data collected from the station 2 (Topic 5)</p>
          </Col>
        </Row>

        {loading && (
          <Row>
            <Col>
              <div className="text-center mb-4" style={{ color: '#007bff', fontWeight: 'bold' }}>
                Loading data dari API...
              </div>
            </Col>
          </Row>
        )}

        <Row className="g-4">
          <Col md={4} className="text-center">
            <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '10px', boxShadow: '0 0 15px rgba(0, 0, 0, 0.1)' }}>
              <HumidityGauge humidity={latest.humidity !== undefined && latest.humidity !== 'server sedang eror' ? latest.humidity : 0} />
              <h5>Humidity</h5>
              <p>{latest.humidity === 'server sedang eror' ? 'server sedang eror' : latest.humidity !== undefined ? latest.humidity : '-'}</p>
            </div>
          </Col>
          <Col md={4} className="text-center">
            <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '10px', boxShadow: '0 0 15px rgba(0, 0, 0, 0.1)' }}>
              <TemperatureGauge temperature={latest.temperature !== undefined && latest.temperature !== 'server sedang eror' ? latest.temperature : 0} />
              <h5>Temperature</h5>
              <p>{latest.temperature === 'server sedang eror' ? 'server sedang eror' : latest.temperature !== undefined ? latest.temperature : '-'}</p>
            </div>
          </Col>
          <Col md={4} className="text-center">
            <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '10px', boxShadow: '0 0 15px rgba(0, 0, 0, 0.1)' }}>
              <WindSpeedGauge windspeed={latest.windspeed !== undefined && latest.windspeed !== 'server sedang eror' ? latest.windspeed : 0} />
              <h5>Windspeed</h5>
              <p>{latest.windspeed === 'server sedang eror' ? 'server sedang eror' : latest.windspeed !== undefined ? latest.windspeed : '-'}</p>
            </div>
          </Col>
          <Col md={4} className="text-center">
            <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '10px', boxShadow: '0 0 15px rgba(0, 0, 0, 0.1)' }}>
              <RainfallGauge rainfall={latest.rainfall !== undefined && latest.rainfall !== 'server sedang eror' ? latest.rainfall : 0} />
              <h5>Rainfall</h5>
              <p>{latest.rainfall === 'server sedang eror' ? 'server sedang eror' : latest.rainfall !== undefined ? latest.rainfall : '-'}</p>
            </div>
          </Col>
          <Col md={4} className="text-center">
            <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '10px', boxShadow: '0 0 15px rgba(0, 0, 0, 0.1)' }}>
              <IrradiationGauge irradiation={latest.irradiation !== undefined && latest.irradiation !== 'server sedang eror' ? latest.irradiation : 0} />
              <h5>Irradiation</h5>
              <p>{latest.irradiation === 'server sedang eror' ? 'server sedang eror' : latest.irradiation !== undefined ? latest.irradiation : '-'}</p>
            </div>
          </Col>
          <Col md={4} className="text-center">
            <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '10px', boxShadow: '0 0 15px rgba(0, 0, 0, 0.1)' }}>
              <WindDirectionGauge windDirection={latest.windDirection !== undefined && latest.windDirection !== 'server sedang eror' ? latest.windDirection : 0} />
              <h5>Wind Direction</h5>
              <p>{latest.windDirection === 'server sedang eror' ? 'server sedang eror' : latest.windDirection !== undefined ? latest.windDirection : '-'}</p>
            </div>
          </Col>
          <Col md={4} className="text-center">
            <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '10px', boxShadow: '0 0 15px rgba(0, 0, 0, 0.1)' }}>
              <TemperatureGauge temperature={latest.temperature2 !== undefined && latest.temperature2 !== 'server sedang eror' ? latest.temperature2 : 0} />
              <h5>Water Temperature</h5>
              <p>{latest.temperature2 === 'server sedang eror' ? 'server sedang eror' : latest.temperature2 !== undefined ? latest.temperature2 : '-'}</p>
            </div>
          </Col>
        </Row>

        <Row className="mt-5">
          <Col>
            <h2 className="text-center" style={{ color: '#007bff' }}>Chart Status</h2>
          </Col>
        </Row>
        <Row>
          <ButtonGroup className="mb-3 d-flex justify-content-center">
            <Button
              variant={filter === '1d' ? 'primary' : 'outline-primary'}
              onClick={() => setFilter('1d')}
            >
              1 Day
            </Button>
            <Button
              variant={filter === '7d' ? 'primary' : 'outline-primary'}
              onClick={() => setFilter('7d')}
            >
              7 Days
            </Button>
            <Button
              variant={filter === '1m' ? 'primary' : 'outline-primary'}
              onClick={() => setFilter('1m')}
            >
              1 Month
            </Button>
          </ButtonGroup>
          <Col md={12}>
            <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '10px', boxShadow: '0 0 15px rgba(0, 0, 0, 0.1)' }}>
              {serverError ? (
                <div className="text-center" style={{ color: 'red', fontWeight: 'bold', fontSize: '1.2em' }}>
                  Server sedang eror
                </div>
              ) : filteredData.length === 0 ? (
                <div className="text-center" style={{ color: '#007bff' }}>
                  Tidak ada data untuk filter ini
                </div>
              ) : (
                <TrendChart data={filteredData} />
              )}
            </div>
          </Col>
        </Row>

        <Row className="mt-5">
          <Col>
            <h2 className="text-center" style={{ color: '#007bff' }}>Table Status</h2>
          </Col>
        </Row>
        <Row>
          <Col>
            <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '10px', boxShadow: '0 0 15px rgba(0, 0, 0, 0.1)', overflowX: 'auto' }}>
              {serverError ? (
                <div className="text-center" style={{ color: 'red', fontWeight: 'bold', fontSize: '1.2em' }}>
                  Server sedang eror
                </div>
              ) : filteredData.length > 0 ? (
                <Table striped bordered hover variant="light" style={{ marginBottom: 0 }}>
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>Humidity</th>
                      <th>Temperature</th>
                      <th>Air Pressure</th>
                      <th>Rainfall</th>
                      <th>Irradiation</th>
                      <th>Windspeed</th>
                      <th>Wind Direction</th>
                      <th>Water Temperature</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.map((item, index) => (
                      <tr key={index}>
                        <td>{item.timestamp}</td>
                        <td>{item.humidity === 'server sedang eror' ? 'server sedang eror' : item.humidity}</td>
                        <td>{item.temperature === 'server sedang eror' ? 'server sedang eror' : item.temperature}</td>
                        <td>{item.airPressure === 'server sedang eror' ? 'server sedang eror' : item.airPressure}</td>
                        <td>{item.rainfall === 'server sedang eror' ? 'server sedang eror' : item.rainfall}</td>
                        <td>{item.irradiation === 'server sedang eror' ? 'server sedang eror' : item.irradiation}</td>
                        <td>{item.windspeed === 'server sedang eror' ? 'server sedang eror' : item.windspeed}</td>
                        <td>{item.windDirection === 'server sedang eror' ? 'server sedang eror' : item.windDirection}</td>
                        <td>{item.temperature2 === 'server sedang eror' ? 'server sedang eror' : item.temperature2}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <p className="text-center" style={{ color: '#007bff' }}>No data available for the selected filter</p>
              )}
            </div>
          </Col>
        </Row>
      </Container>
    </section>
  );
};

export default Station2;