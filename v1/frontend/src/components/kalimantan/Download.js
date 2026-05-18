import { saveAs } from 'file-saver';
import { useEffect, useState } from 'react';
import { Button, Col, Container, Form, Modal, Row } from 'react-bootstrap';
import { KALIMANTAN_ONEMONTH_TOPIC1_URL } from '../../config/apiEndpoints';

// API endpoint untuk Station 1
const API_KALIMANTAN_TOPIC1 = KALIMANTAN_ONEMONTH_TOPIC1_URL;

// Helper: Wind direction mapping
const windDirectionToEnglish = (dir) => {
  if (!dir) return '';
  const map = {
    'Utara': 'North',
    'Timur Laut': 'Northeast',
    'Timur': 'East',
    'Timur Timur Laut': 'East-Northeast',
    'Barat Laut': 'Northwest',
    'Barat': 'West',
    'Barat Daya': 'Southwest',
    'Selatan': 'South',
    'Tenggara': 'Southeast',
    'Timur Selatan': 'East-Southeast',
    'Barat Barat Laut': 'West-Northwest',
    'Barat Barat Daya': 'West-Southwest',
    'Selatan Barat Daya': 'South-Southwest',
    'Selatan Tenggara': 'South-Southeast',
    'Timur Timur Selatan': 'East-Southeast',
    'Timur Tenggara': 'East-Southeast',
    'North': 'North',
    'South': 'South',
    'East': 'East',
    'West': 'West',
    'Northeast': 'Northeast',
    'Northwest': 'Northwest',
    'Southeast': 'Southeast',
    'Southwest': 'Southwest',
    'East-Northeast': 'East-Northeast',
    'East-Southeast': 'East-Southeast',
    'West-Northwest': 'West-Northwest',
    'West-Southwest': 'West-Southwest',
    'South-Southwest': 'South-Southwest',
    'South-Southeast': 'South-Southeast',
  };
  return map[dir] || dir;
};

// Helper: Parse timestamp (format: DD-MM-YY HH:mm:ss)
const parseTimestamp = (ts) => {
  if (!ts || typeof ts !== 'string') return ts;
  const match = ts.match(/^(\d{2})-(\d{2})-(\d{2}) (\d{2}:\d{2}:\d{2})$/);
  if (match) {
    // 20 = tanggal, 07 = bulan, 25 = tahun (2025)
    const day = match[1];
    const month = match[2];
    const year = 2000 + parseInt(match[3], 10); // 25 => 2025
    const time = match[4];
    return `${year}-${month}-${day}T${time}`;
  }
  // Jika sudah ISO, return as is
  if (ts.includes('T')) return ts;
  return ts;
};

// Helper: Format tanggal user-friendly
const formatUserFriendlyDate = (timestamp) => {
  if (!timestamp) return 'Invalid Date';
  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return 'Invalid Date';
    const options = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'Asia/Jakarta'
    };
    return date.toLocaleDateString('id-ID', options);
  } catch {
    return 'Invalid Date';
  }
};

// Helper: Map API data
const mapStation1 = (item) => {
  if (!item) return {};
  const ts = parseTimestamp(item.timestamp);
  return {
    timestamp: ts,
    userFriendlyDate: formatUserFriendlyDate(ts),
    humidity: item.humidity ?? item.hum_dht22 ?? 0,
    temperature: item.temperature ?? item.temp_dht22 ?? 0,
    rainfall: item.rainfall ?? 0,
    windspeed: item.windspeed ?? item.wind_speed ?? 0,
    irradiation: item.irradiation ?? 0,
    windDirection: windDirectionToEnglish(item.direction ?? ''),
    angle: item.angle ?? 0,
  };
};

// Helper: Format data for CSV
const formatDataForCSV = (data) => {
  if (!Array.isArray(data) || data.length === 0) return [];
  return data.map((item, index) => ({
    'No': index + 1,
    'Tanggal & Waktu': item.userFriendlyDate,
    'Kelembapan (%)': parseFloat(item.humidity || 0).toFixed(1),
    'Suhu (°C)': parseFloat(item.temperature || 0).toFixed(1),
    'Curah Hujan (mm)': parseFloat(item.rainfall || 0).toFixed(1),
    'Kecepatan Angin (km/h)': parseFloat(item.windspeed || 0).toFixed(1),
    'Radiasi Matahari (W/m²)': parseFloat(item.irradiation || 0).toFixed(0),
    'Arah Angin': item.windDirection || '',
    'Sudut Angin (°)': parseFloat(item.angle || 0).toFixed(0),
  }));
};

// Helper: Create CSV string
const createFormattedCSV = (data) => {
  if (!data || data.length === 0) return '';
  const csvData = formatDataForCSV(data);
  const headers = Object.keys(csvData[0]);
  const headerRow = headers.map(header => `"${header}"`).join(',');
  const dataRows = csvData.map(row =>
    headers.map(header => `"${row[header]}"`).join(',')
  );
  const metadata = [
    `"=== DATA MONITORING STATION 1 ==="`,
    `"Diekspor pada: ${formatUserFriendlyDate(new Date().toISOString())}"`,
    `"Total Records: ${data.length}"`,
    '""',
    headerRow
  ];
  return [...metadata, ...dataRows].join('\n');
};

// Helper: Filter data by date
const filterDataByDate = (data, startDate, endDate) => {
  if (!startDate || !endDate) return [];
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T23:59:59`);
  return data.filter(item => {
    if (!item.timestamp) return false;
    const itemDate = new Date(item.timestamp);
    return itemDate >= start && itemDate <= end;
  });
};

// Resample function (mean fill)
function resampleTimeSeriesWithMeanFill(data, intervalMinutes, fields) {
  if (!Array.isArray(data) || data.length === 0) return [];
  // Sort data by timestamp ascending
  data = [...data].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  const start = new Date(data[0].timestamp);
  const end = new Date(data[data.length - 1].timestamp);
  let result = [];
  let current = new Date(start);
  while (current <= end) {
    const slotStart = new Date(current);
    const slotEnd = new Date(current);
    slotEnd.setMinutes(slotEnd.getMinutes() + intervalMinutes);
    let slotData = data.filter(item => {
      let t = new Date(item.timestamp);
      return t >= slotStart && t < slotEnd;
    });
    let resampled = { timestamp: slotStart.toISOString(), userFriendlyDate: formatUserFriendlyDate(slotStart.toISOString()) };
    fields.forEach(field => {
      if (slotData.length === 0) {
        const mean = data.reduce((sum, item) => sum + (parseFloat(item[field]) || 0), 0) / data.length;
        resampled[field] = isNaN(mean) ? null : mean;
      } else {
        const mean = slotData.reduce((sum, item) => sum + (parseFloat(item[field]) || 0), 0) / slotData.length;
        resampled[field] = isNaN(mean) ? null : mean;
      }
    });
    // Wind direction: ambil yang paling sering muncul di slot
    if (fields.includes('windDirection')) {
      if (slotData.length === 0) {
        resampled['windDirection'] = '';
      } else {
        const freq = {};
        slotData.forEach(item => {
          const dir = item.windDirection || '';
          freq[dir] = (freq[dir] || 0) + 1;
        });
        const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);
        resampled['windDirection'] = sorted.length > 0 ? sorted[0][0] : '';
      }
    }
    result.push(resampled);
    current = slotEnd;
  }
  return result;
}

const Download = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [fileFormat, setFileFormat] = useState('json');
  const [showLogin, setShowLogin] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [station1Data, setStation1Data] = useState([]);
  const [dataReady, setDataReady] = useState(false);

  // Resampling state
  const [enableResampling, setEnableResampling] = useState(false);
  const [resampleInterval, setResampleInterval] = useState(15);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Hapus setLoading(true) untuk menghilangkan delay visual
        setDataReady(false);
        const res = await fetch(API_KALIMANTAN_TOPIC1);
        if (!res.ok) throw new Error('Failed to fetch data');
        const json = await res.json();
        const mapped = Array.isArray(json.result) ? json.result.map(mapStation1) : [];
        setStation1Data(mapped);
        setDataReady(true);
      } catch (error) {
        setStation1Data([]);
        setDataReady(false);
      }
      // Hapus finally block setLoading(false)
    };
    fetchData();
  }, []);

  const handleDownload = () => {
    setShowLogin(true);
  };

  const processDownload = () => {
    if (!dataReady) {
      alert('Data is still loading. Please wait...');
      return;
    }
    if (!startDate || !endDate) {
      alert('Please select both start date and end date.');
      return;
    }
    const rawData = station1Data;
    let data = filterDataByDate(rawData, startDate, endDate);
    if (data.length === 0) {
      alert('No data available for the selected date range.');
      return;
    }

    // Resampling
    if (enableResampling) {
      try {
        let fields = [
          'humidity', 'temperature', 'rainfall', 'windspeed', 'irradiation',
          'windDirection', 'angle'
        ];
        let validData = data.filter(item => item.timestamp);
        data = resampleTimeSeriesWithMeanFill(validData, resampleInterval, fields);
        if (data.length === 0) {
          alert('No data available after resampling.');
          return;
        }
      } catch (error) {
        alert('Error during resampling: ' + error.message);
        return;
      }
    }

    let filename = `Station_1_${startDate}_to_${endDate}`;
    if (enableResampling) {
      filename += `_resample${resampleInterval}m`;
    }

    if (fileFormat === 'json') {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      saveAs(blob, `${filename}.json`);
    } else if (fileFormat === 'csv') {
      const csv = createFormattedCSV(data);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      saveAs(blob, `${filename}.csv`);
    }
  };

  const handleLoginSubmit = () => {
    if (username === 'admin' && password === 'admin123') {
      setShowLogin(false);
      processDownload();
    } else {
      alert('Invalid credentials!');
    }
  };

  return (
    <Container style={{ marginTop: '20px' }}>
      <Row>
        <Col>
          <h3 className="text-center fw-bold text-primary">Download Data</h3>
        </Col>
      </Row>
      <Row className="mt-4 d-flex justify-content-center">
        <Col md={6} className="text-center">
          <Button variant="primary" className="px-4 py-2 fw-bold shadow-sm" disabled>
            Station 1
          </Button>
        </Col>
      </Row>
      <Row className="mt-4">
        <Col md={6}>
          <Form.Group controlId="startDate">
            <Form.Label className="fw-bold">Start Date</Form.Label>
            <Form.Control
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="shadow-sm"
            />
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group controlId="endDate">
            <Form.Label className="fw-bold">End Date</Form.Label>
            <Form.Control
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="shadow-sm"
            />
          </Form.Group>
        </Col>
      </Row>
      <Row className="mt-4">
        <Col>
          <Form.Group controlId="fileFormat">
            <Form.Label className="fw-bold">Select File Format</Form.Label>
            <Form.Check
              type="radio"
              label="JSON"
              name="fileFormat"
              value="json"
              checked={fileFormat === 'json'}
              onChange={(e) => setFileFormat(e.target.value)}
              className="fw-semibold"
            />
            <Form.Check
              type="radio"
              label="CSV"
              name="fileFormat"
              value="csv"
              checked={fileFormat === 'csv'}
              onChange={(e) => setFileFormat(e.target.value)}
              className="fw-semibold"
            />
          </Form.Group>
        </Col>
      </Row>
      {/* Resampling UI */}
      <Row className="mt-4">
        <Col>
          <Form.Group>
            <Form.Check
              type="checkbox"
              label="Enable Data Resampling (Agregasi Data)"
              checked={enableResampling}
              onChange={(e) => setEnableResampling(e.target.checked)}
              className="fw-bold"
            />
            <Form.Text className="text-muted">
              Menggabungkan data ke interval waktu yang lebih besar untuk analisis trend
            </Form.Text>
          </Form.Group>
        </Col>
      </Row>
      {enableResampling && (
        <Row className="mt-3">
          <Col md={6}>
            <Form.Group>
              <Form.Label className="fw-bold">Select timeframe</Form.Label>
              <div>
                <Form.Check
                  type="radio"
                  label="1menit"
                  name="timeframe"
                  value={1}
                  checked={resampleInterval === 1}
                  onChange={() => setResampleInterval(1)}
                  className="mb-2"
                />
                <Form.Check
                  type="radio"
                  label="15menit"
                  name="timeframe"
                  value={15}
                  checked={resampleInterval === 15}
                  onChange={() => setResampleInterval(15)}
                  className="mb-2"
                />
                <Form.Check
                  type="radio"
                  label="30menit"
                  name="timeframe"
                  value={30}
                  checked={resampleInterval === 30}
                  onChange={() => setResampleInterval(30)}
                  className="mb-2"
                />
              </div>
            </Form.Group>
          </Col>
        </Row>
      )}
      <Row className="mt-4">
        <Col className="text-center">
          {dataReady && (
            <div className="mb-3">
              <small className="text-muted">
                Station 1: {station1Data.length} records
                <br />
                {enableResampling && (
                  <><strong>Resampling:</strong> {resampleInterval} menit<br /></>
                )}
              </small>
            </div>
          )}
          <Button
            variant="success"
            onClick={handleDownload}
            className="px-5 py-2 fw-bold shadow-lg"
            disabled={!dataReady}
          >
            Download Data
          </Button>
        </Col>
      </Row>
      <Modal show={showLogin} onHide={() => setShowLogin(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Login Required</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group controlId="formUsername" className="mb-3">
              <Form.Label>Username</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </Form.Group>
            <Form.Group controlId="formPassword" className="mb-3">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Form.Group>
            <Button variant="primary" onClick={handleLoginSubmit}>
              Login
            </Button>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default Download;