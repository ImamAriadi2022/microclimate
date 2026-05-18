import { useEffect, useState } from 'react';
import { Button, ButtonGroup, Col, Container, Row, Table } from 'react-bootstrap';

import { PETENGORAN_TOPIC4_URL } from '../../config/apiEndpoints';
import TrendChart from "./chart";

// Komponen Gauge
import AirPressureGauge from './status/AirPressure';
import HumidityGauge from './status/HumidityGauge';
import RainfallGauge from './status/Rainfall';
import TemperatureGauge from './status/TemperaturGauge';
import WaterTemperatureGauge from './status/WaterTemperature';
import WindDirectionGauge from './status/WindDirection';
import WindSpeedGauge from './status/WindSpeed';

// Daftar field yang ingin ditampilkan (dinamis, urutkan sesuai kebutuhan frontend)
const FIELD_CONFIG = [
  { key: 'humidity', label: 'Humidity', unit: '%', gauge: HumidityGauge },
  { key: 'temperature', label: 'Temperature', unit: '°C', gauge: TemperatureGauge },
  { key: 'airPressure', label: 'Air Pressure', unit: 'hPa', gauge: AirPressureGauge },
  { key: 'windspeed', label: 'Windspeed', unit: 'km/h', gauge: WindSpeedGauge },
  { key: 'rainfall', label: 'Rainfall', unit: 'mm', gauge: RainfallGauge },
  { key: 'windDirection', label: 'Wind Direction', unit: '°', gauge: WindDirectionGauge },
  { key: 'waterTemperature', label: 'Water Temperature', unit: '°C', gauge: WaterTemperatureGauge },
];

// API endpoint dari .env
const API_URL = PETENGORAN_TOPIC4_URL;

// Helper untuk mapping key dari API ke key frontend
function mapApiData(apiItem) {
  return {
    timestamp: apiItem.timestamp,
    humidity: apiItem.humidity,
    temperature: apiItem.temperature,
    airPressure: apiItem.AirPressure,
    windspeed: apiItem.windSpeed,
    rainfall: apiItem.rainfall,
    windDirection: apiItem.angle,
    waterTemperature: apiItem.suhuAir,
    // tambahkan mapping lain jika perlu
  };
}

// Helper untuk parsing tanggal dari format "DD-MM-YY HH:mm:ss"
function parseCustomDate(str) {
  if (!str) return new Date('Invalid');
  const [datePart, timePart] = str.split(' ');
  if (!datePart || !timePart) return new Date('Invalid');
  const [day, month, year] = datePart.split('-');
  if (!day || !month || !year) return new Date('Invalid');
  const fullYear = Number(year) < 100 ? 2000 + Number(year) : Number(year);
  // Pastikan bulan dan hari dua digit
  const mm = month.padStart(2, '0');
  const dd = day.padStart(2, '0');
  return new Date(`${fullYear}-${mm}-${dd}T${timePart}`);
}

const LOCAL_STORAGE_KEY = "station1_data";

const Station1 = () => {
  const [filter, setFilter] = useState('1d');
  const [allData, setAllData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);

  // Load data dari localStorage saat pertama kali mount
  useEffect(() => {
    const local = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (local) {
      try {
        const parsed = JSON.parse(local);
        setAllData(parsed);
      } catch (e) {
        setAllData([]);
      }
    }
  }, []);

  // Fetch data dari API setiap 10 detik
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(API_URL);
        const json = await response.json();
        console.log("API Response:", JSON.stringify(json, null, 2)); // Log response API

        // Perbaikan: jika response langsung array
        const result = Array.isArray(json) ? json : (Array.isArray(json.result) ? json.result : []);
        const mapped = result.map(mapApiData);

        let local = [];
        try {
          local = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY)) || [];
        } catch (e) {
          local = [];
        }

        const timestamps = new Set(local.map(item => item.timestamp));
        const combined = [...local];
        mapped.forEach(item => {
          if (!timestamps.has(item.timestamp)) {
            combined.push(item);
            timestamps.add(item.timestamp);
            console.log("New data added to localStorage:", item);
          }
        });

        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(combined));
        setAllData(combined);
      } catch (error) {
        console.error("Fetch error:", error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 10000); // 10 detik
    return () => clearInterval(interval);
  }, []);

  // Log perubahan allData
  useEffect(() => {
    console.log("allData state updated:", allData);
  }, [allData]);

  // Fungsi untuk memfilter data berdasarkan waktu
  const handleFilterChange = (filterType) => {
    setFilter(filterType);

    const now = new Date();
    let filtered = [];

    // Hanya proses data dengan timestamp valid
    const validData = allData.filter(item => {
      const d = parseCustomDate(item.timestamp);
      return d instanceof Date && !isNaN(d);
    });

    if (filterType === '1d') {
      filtered = validData.filter((item) => {
        const itemDate = parseCustomDate(item.timestamp);
        return (
          itemDate.getFullYear() === now.getFullYear() &&
          itemDate.getMonth() === now.getMonth() &&
          itemDate.getDate() === now.getDate() &&
          itemDate <= now
        );
      });
    } else if (filterType === '7d') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(now.getDate() - 7);
      filtered = validData.filter((item) => {
        const itemDate = parseCustomDate(item.timestamp);
        return itemDate >= sevenDaysAgo && itemDate <= now;
      });
    } else if (filterType === '1m') {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(now.getMonth() - 1);
      filtered = validData.filter((item) => {
        const itemDate = parseCustomDate(item.timestamp);
        return itemDate >= oneMonthAgo && itemDate <= now;
      });
    }

    filtered.sort((a, b) => parseCustomDate(a.timestamp) - parseCustomDate(b.timestamp));
    setFilteredData(filtered);
  };

  // Log perubahan filter
  useEffect(() => {
    console.log("filter state updated:", filter);
  }, [filter]);

  // Jalankan filter default (1 hari terakhir) saat komponen pertama kali dimuat atau data berubah
  useEffect(() => {
    handleFilterChange(filter);
    // eslint-disable-next-line
  }, [allData]);

  // Log perubahan filteredData
  useEffect(() => {
    console.log("filteredData state updated:", filteredData);
  }, [filteredData]);

  // Ambil data terbaru (last item)
  const latest = filteredData.length > 0 ? filteredData[filteredData.length - 1] : {};

  // Filter data valid untuk chart (hindari error TrendChart)
  const validChartData = filteredData.filter(item => {
    const d = parseCustomDate(item.timestamp);
    return d instanceof Date && !isNaN(d);
  });

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
            <h2 className="text-center" style={{ color: '#007bff' }}>Environment Status</h2>
            <p className="text-center">Data collected from the station 1</p>
          </Col>
        </Row>
        
        <Row className="g-4">
          {FIELD_CONFIG.map((field, idx) => {
            const GaugeComponent = field.gauge;
            return (
              <Col md={4} className="text-center" key={field.key}>
                <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '10px', boxShadow: '0 0 15px rgba(0, 0, 0, 0.1)' }}>
                  <GaugeComponent {...{ [field.key]: latest[field.key] ?? 0 }} />
                  <h5>{field.label}</h5>
                  <p>
                    {latest[field.key] !== undefined && latest[field.key] !== null
                      ? `${latest[field.key]}${field.unit}`
                      : 'N/A'}
                  </p>
                </div>
              </Col>
            );
          })}
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
              onClick={() => handleFilterChange('1d')}
            >
              1 Day
            </Button>
            <Button
              variant={filter === '7d' ? 'primary' : 'outline-primary'}
              onClick={() => handleFilterChange('7d')}
            >
              7 Days
            </Button>
            <Button
              variant={filter === '1m' ? 'primary' : 'outline-primary'}
              onClick={() => handleFilterChange('1m')}
            >
              1 Month
            </Button>
          </ButtonGroup>
          <Col md={12}>
            <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '10px', boxShadow: '0 0 15px rgba(0, 0, 0, 0.1)' }}>
              <TrendChart data={validChartData} />
            </div>
          </Col>

          {/* ini buat maps */}
          <Col md={12}>
            <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '10px', boxShadow: '0 0 15px rgba(0, 0, 0, 0.1)' }}>
              <h4 style={{ color: '#007bff' }}>Location</h4>
              <iframe
                title="Location map of Station 1"
                src="https://www.google.com/maps/embed?pb=!4v1742927582633!6m8!1m7!1semWwMLjxPNBvkFSf0-d_fQ!2m2!1d-5.570831564383814!2d105.240617222604!3f101.32!4f28.680000000000007!5f0.42518105702959824"
                style={{ width: '100%', height: '300px', border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </Col>
          {/* ini buat maps */}
        </Row>

        <Row className="mt-5">
          <Col>
            <h2 className="text-center" style={{ color: '#007bff' }}>Table Status</h2>
          </Col>
        </Row>
        <Row>
          <Col>
            <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '10px', boxShadow: '0 0 15px rgba(0, 0, 0, 0.1)', overflowX: 'auto' }}>
              {filteredData.length > 0 ? (
                <Table striped bordered hover variant="light" style={{ marginBottom: 0 }}>
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      {FIELD_CONFIG.map(field => (
                        <th key={field.key}>{field.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.map((item, index) => (
                      <tr key={index}>
                        <td>{item.timestamp}</td>
                        {FIELD_CONFIG.map(field => (
                          <td key={field.key}>
                            {item[field.key] !== undefined && item[field.key] !== null
                              ? `${item[field.key]}${field.unit}`
                              : 'N/A'}
                          </td>
                        ))}
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

export default Station1;