import { saveAs } from 'file-saver';
import { useEffect, useState } from 'react';
import { Button, Col, Container, Form, Modal, Row } from 'react-bootstrap';
import {
    PETENGORAN_DAILY_STATION1_URL,
    PETENGORAN_DAILY_STATION2_URL,
    PETENGORAN_RESAMPLE15M_STATION1_URL,
    PETENGORAN_RESAMPLE15M_STATION2_URL,
    PETENGORAN_TOPIC4_URL,
    PETENGORAN_TOPIC5_URL,
} from '../../config/apiEndpoints';

// Endpoint mengikuti Station1.js dan Station2.js
const API_STATION1 =
  PETENGORAN_DAILY_STATION1_URL ||
  PETENGORAN_RESAMPLE15M_STATION1_URL ||
  PETENGORAN_TOPIC4_URL;

const API_STATION2 =
  PETENGORAN_DAILY_STATION2_URL ||
  PETENGORAN_RESAMPLE15M_STATION2_URL ||
  PETENGORAN_TOPIC5_URL;

// Fungsi parsing timestamp agar bisa dibandingkan dengan filter tanggal
const parseTimestamp = (ts) => {
  if (!ts) return ts;
  if (typeof ts === 'string' && ts.includes('T')) return ts;
  if (typeof ts !== 'string') return ts;
  const [date, time] = ts.split(' ');
  if (!date || !time) return ts;
  const [day, month, year] = date.split('-');
  if (!day || !month || !year) return ts;
  const fullYear = year.length === 2 ? '20' + year : year;
  return `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${time}`;
};

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

const toNumberOrZero = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
};

const parseApiRows = (payload) => {
  if (Array.isArray(payload?.result)) return payload.result;
  if (Array.isArray(payload?.data?.result)) return payload.data.result;
  if (Array.isArray(payload)) return payload;
  return [];
};

const fetchMappedData = async (url, mapper) => {
  if (!url) return [];

  const response = await fetch(url);
  if (!response.ok) return [];

  const json = await response.json();
  return parseApiRows(json).map(mapper);
};

// Mapping untuk Station 1
const mapStation1 = (item) => {
  if (!item) return {};
  if (!item.timestamp || item.timestamp === 'Invalid date' || item.timestamp === 'alat rusak') {
    return { ...item, invalid: true };
  }
  const ts = item.timestamp;
  const parsedTs = parseTimestamp(ts);
  return {
    timestamp: parsedTs,
    userFriendlyDate: formatUserFriendlyDate(parsedTs),
    humidity: toNumberOrZero(item.humidity ?? item.hum_dht22),
    temperature: toNumberOrZero(item.temperature ?? item.temp_dht22),
    rainfall: toNumberOrZero(item.rainfall),
    windspeed: toNumberOrZero(item.windSpeed ?? item.windspeed ?? item.wind_speed),
    irradiation: toNumberOrZero(item.irradiation ?? item.pyrano),
    windDirection: windDirectionToEnglish(item.direction ?? ''),
    angle: toNumberOrZero(item.angle),
    bmptemperature: toNumberOrZero(item.bmpTemperature ?? item.bmptemperature ?? item.bmp_temperature),
    airpressure: toNumberOrZero(item.AirPressure ?? item.airPressure ?? item.airpressure),
    suhuair: toNumberOrZero(item.suhuAir ?? item.suhuair ?? item.waterTemperature ?? item.water_temperature),
    invalid: false,
  };
};

// Mapping untuk Station 2
const mapStation2 = (item) => {
  if (!item) return {};
  if (!item.timestamp || item.timestamp === 'Invalid date' || item.timestamp === 'alat rusak') {
    return { ...item, invalid: true };
  }
  const ts = item.timestamp;
  const parsedTs = parseTimestamp(ts);
  return {
    timestamp: parsedTs,
    userFriendlyDate: formatUserFriendlyDate(parsedTs),
    humidity: toNumberOrZero(item.humidity),
    temperature: toNumberOrZero(item.temperature),
    rainfall: toNumberOrZero(item.rainfall),
    windspeed: toNumberOrZero(item.windSpeed ?? item.windspeed ?? item.wind_speed),
    irradiation: toNumberOrZero(item.pyrano ?? item.irradiation),
    windDirection: windDirectionToEnglish(item.direction ?? ''),
    angle: toNumberOrZero(item.angle),
    bmptemperature: toNumberOrZero(item.bmpTemperature ?? item.bmptemperature ?? item.bmp_temperature),
    airpressure: toNumberOrZero(item.AirPressure ?? item.airPressure ?? item.airpressure),
    suhuair: toNumberOrZero(item.suhuAir ?? item.suhuair ?? item.waterTemperature ?? item.water_temperature),
    invalid: false,
  };
};

const formatDataForCSV = (data, stationType) => {
  if (!Array.isArray(data) || data.length === 0) return [];
  return data.map((item, index) => {
    const formattedData = {
      'No': index + 1,
      'Tanggal & Waktu': formatUserFriendlyDate(item.timestamp),
      'Status': item.interpolated ? 'Estimasi' : 'Aktual',
      'Kelembapan (%)': parseFloat(item.humidity || 0).toFixed(1),
      'Suhu (°C)': parseFloat(item.temperature || 0).toFixed(1),
      'Curah Hujan (mm)': parseFloat(item.rainfall || 0).toFixed(1),
      'Kecepatan Angin (m/s)': parseFloat(item.windspeed || 0).toFixed(1),
      'Radiasi Matahari (W/m²)': parseFloat(item.irradiation || 0).toFixed(0),
      'Arah Angin': item.windDirection || '',
      'Sudut Angin (°)': parseFloat(item.angle || 0).toFixed(0),
      'BMP Temperature (°C)': parseFloat(item.bmptemperature || 0).toFixed(1),
      'Air Pressure (hPa)': parseFloat(item.airpressure || 0).toFixed(2),
    };
    // Selalu tambahkan Water Temperature untuk kedua station
    formattedData['Water Temperature (°C)'] = parseFloat(item.suhuair || 0).toFixed(1);
    return formattedData;
  });
};

const createFormattedCSV = (data, stationType) => {
  if (!data || data.length === 0) return '';
  const csvData = formatDataForCSV(data, stationType);
  const headers = Object.keys(csvData[0]);
  const headerRow = headers.map(header => `"${header}"`).join(',');
  const dataRows = csvData.map(row =>
    headers.map(header => `"${row[header]}"`).join(',')
  );
  const metadata = [
    `"=== DATA MONITORING STATION ${stationType.toUpperCase()} ==="`,
    `"Diekspor pada: ${formatUserFriendlyDate(new Date().toISOString())}"`,
    `"Total Records: ${data.length}"`,
    `"Status: Aktual = Data asli dari sensor, Estimasi = Data hasil interpolasi"`,
    '""',
    headerRow
  ];
  return [...metadata, ...dataRows].join('\n');
};



const Download = () => {
  const [selectedStation, setSelectedStation] = useState('Station 1');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [fileFormat, setFileFormat] = useState('json');
  const [showLogin, setShowLogin] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [station1Data, setStation1Data] = useState([]);
  const [station2Data, setStation2Data] = useState([]);
  const [dataSourceMode, setDataSourceMode] = useState('realtime');
  const [dataReady, setDataReady] = useState(false);

  // Hanya fitur resampling
  const [enableResampling, setEnableResampling] = useState(false);
  const [resampleInterval, setResampleInterval] = useState(15);

  const getSimulationApiUrl = (primaryUrl, stationType = 'station1') => {
    if (!primaryUrl) return null;

    try {
      const parsed = new URL(primaryUrl);
      const topic = stationType === 'station2' ? 'topic5' : 'topic4';
      return `${parsed.origin}/simulate/petengoran/${topic}/history?limit=500`;
    } catch (_error) {
      return null;
    }
  };

  const appendAtTimeParam = (url, atTimeValue) => {
    if (!url || !atTimeValue) return url;

    try {
      const parsed = new URL(url);
      parsed.searchParams.set('atTime', new Date(atTimeValue).toISOString());
      return parsed.toString();
    } catch (_error) {
      return url;
    }
  };

  // Fetch data dari API saat komponen mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setDataReady(false);

        const station1Url = dataSourceMode === 'simulation'
          ? getSimulationApiUrl(API_STATION1, 'station1')
          : appendAtTimeParam(API_STATION1, endDate);
        const station2Url = dataSourceMode === 'simulation'
          ? getSimulationApiUrl(API_STATION2, 'station2')
          : appendAtTimeParam(API_STATION2, endDate);

        // Fetch Station 1
        const station1Data = await fetchMappedData(station1Url, mapStation1);
        setStation1Data(station1Data);

        // Fetch Station 2
        const station2Data = await fetchMappedData(station2Url, mapStation2);
        setStation2Data(station2Data);

        setDataReady(station1Data.length > 0 || station2Data.length > 0);
      } catch (error) {
        setStation1Data([]);
        setStation2Data([]);
        setDataReady(false);
      }
    };
    fetchData();
  }, [dataSourceMode, startDate, endDate]);

  const handleSimulationToggle = () => {
    setDataSourceMode((prev) => (prev === 'simulation' ? 'realtime' : 'simulation'));
  };

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

    const startTime = new Date(startDate).getTime();
    const endTime = new Date(endDate).getTime();
    if (Number.isNaN(startTime) || Number.isNaN(endTime)) {
      alert('Rentang waktu tidak valid.');
      return;
    }

    if (startTime > endTime) {
      alert('Start Date & Time tidak boleh lebih besar dari End Date & Time.');
      return;
    }

    const rawData = getStationData();
    let data = filterDataByDate(rawData);

    // Cek jika ada data invalid
    const hasInvalid = data.some(
      (item) =>
        item.invalid ||
        item.timestamp === 'Invalid date' ||
        item.timestamp === 'alat rusak'
    );
    if (hasInvalid) {
      alert('Data tidak bisa di-download karena respon dari server tertulis alat rusak atau Invalid date.');
      return;
    }
    if (data.length === 0) {
      alert('No data available for the selected date & time range.');
      return;
    }

    // Resampling dengan mean untuk mengisi gap data kosong
    if (enableResampling) {
      try {
        let fields = [
          'humidity', 'temperature', 'rainfall', 'windspeed', 'irradiation',
          'windDirection', 'angle', 'bmptemperature', 'airpressure', 'suhuair'
        ];
        // Ambil data valid
        let validData = data.filter(item => item.timestamp && item.timestamp !== 'Invalid date' && item.timestamp !== 'alat rusak');
        // Resampling: jika ada slot waktu kosong, isi dengan mean dari data yang ada di slot itu
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
  const safeStart = startDate.replace(/[:]/g, '-').replace('T', '_');
  const safeEnd = endDate.replace(/[:]/g, '-').replace('T', '_');
  let filename = `${selectedStation.replace(' ', '_')}_${safeStart}_to_${safeEnd}`;
    if (enableResampling) {
      filename += `_resample${resampleInterval}m`;
    }

    if (fileFormat === 'json') {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      saveAs(blob, `${filename}.json`);
    } else if (fileFormat === 'csv') {
      const csv = createFormattedCSV(data, selectedStation);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      saveAs(blob, `${filename}.csv`);
    }
  };

  // Fungsi resampling dengan mean fill untuk gap data
  function resampleTimeSeriesWithMeanFill(data, intervalMinutes, fields) {
    if (!Array.isArray(data) || data.length === 0) return [];
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
      result.push(resampled);
      current = slotEnd;
    }
    return result;
  }

  const handleLoginSubmit = () => {
    if (username === 'admin' && password === 'admin123') {
      setShowLogin(false);
      processDownload();
    } else {
      alert('Invalid credentials!');
    }
  };

  const getStationData = () => {
    return selectedStation === 'Station 1' ? station1Data : station2Data;
  };

  const filterDataByDate = (data) => {
    if (!startDate || !endDate) return [];

    const startTime = new Date(startDate).getTime();
    const endTime = new Date(endDate).getTime();
    if (Number.isNaN(startTime) || Number.isNaN(endTime)) return [];

    return data.filter((item) => {
      if (!item.timestamp) return false;
      const itemTime = new Date(item.timestamp).getTime();
      if (Number.isNaN(itemTime)) return false;
      return itemTime >= startTime && itemTime <= endTime;
    });
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
          <Form.Group className="mb-3">
            <Form.Label className="fw-bold">Pilih Station</Form.Label>
            <Form.Select
              value={selectedStation}
              onChange={e => setSelectedStation(e.target.value)}
              className="shadow-sm"
            >
              <option value="Station 1">Station 1</option>
              <option value="Station 2">Station 2</option>
            </Form.Select>
          </Form.Group>
          <div className="mt-2">
            <Button
              type="button"
              size="sm"
              variant={dataSourceMode === 'simulation' ? 'warning' : 'outline-warning'}
              onClick={handleSimulationToggle}
            >
              Simulasi {dataSourceMode === 'simulation' ? 'ON' : 'OFF'}
            </Button>
            <div className="mt-2 text-muted" style={{ fontSize: '0.9rem' }}>
              Sumber data: {dataSourceMode === 'simulation' ? 'Simulasi' : 'Realtime'}
            </div>
          </div>
        </Col>
      </Row>

      <Row className="mt-4">
        <Col md={6}>
          <Form.Group controlId="startDate">
            <Form.Label className="fw-bold">Start Date & Time</Form.Label>
            <Form.Control
              type="datetime-local"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="shadow-sm"
            />
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group controlId="endDate">
            <Form.Label className="fw-bold">End Date & Time</Form.Label>
            <Form.Control
              type="datetime-local"
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

      {/* Hapus fitur interpolasi, hanya resampling */}
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

      {/* Pilihan timeframe seperti gambar */}
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
                Petengoran {selectedStation}: {getStationData().length} records
                <br />
                {enableResampling && (
                  <><strong>Resampling:</strong> {resampleInterval} menit (mean)<br /></>
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

      {/* Modal Login */}
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
