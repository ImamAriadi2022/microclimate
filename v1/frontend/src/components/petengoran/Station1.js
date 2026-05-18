import { useEffect, useRef, useState } from 'react';
import { Button, ButtonGroup, Col, Container, Form, Row, Table } from 'react-bootstrap';
import {
  PETENGORAN_DAILY_STATION1_URL,
  PETENGORAN_RESAMPLE15M_STATION1_URL,
  PETENGORAN_TOPIC4_URL,
} from '../../config/apiEndpoints';
import TrendChart, { resampleTimeSeriesWithMeanFill } from "./chart";
import AirPressureGauge from './status/AirPressure';
import HumidityGauge from './status/HumidityGauge';
import IrradiationGauge from './status/Irradiation';
import RainfallGauge from './status/Rainfall';
import TemperatureGauge from './status/TemperaturGauge';
import WaterTemperatureGauge from './status/WaterTemperature';
import WindDirectionGauge from './status/WindDirection';
import WindSpeedGauge from './status/WindSpeed';

// Helper
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
    'Utara Barat Laut': 'North-Northwest',
    'Utara Timur Laut': 'North-Northeast',
  };
  return map[dir] || dir;
};

const formatUserFriendlyTimestamp = (timestamp) => {
  if (!timestamp || timestamp === 'error' || timestamp === 'alat rusak') {
    return timestamp;
  }
  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) {
      return timestamp;
    }
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
  } catch (error) {
    return timestamp;
  }
};

const isValidValue = (val) =>
  val !== null && val !== undefined && val !== 'error' && val !== 'alat rusak' && !isNaN(Number(val));

const EMPTY_GAUGE_DATA = {
  humidity: 0,
  temperature: 0,
  rainfall: 0,
  windspeed: 0,
  irradiation: 0,
  windDirection: '',
  angle: 0,
  bmptemperature: 0,
  airpressure: 0,
  suhuair: 0,
};

const hasAllActiveSensorValue = (item) => {
  if (!item || item.timestamp === 'error' || item.timestamp === 'alat rusak') return false;

  const requiredKeys = [
    'humidity',
    'temperature',
    'rainfall',
    'windspeed',
  ];

  // Jangan terlalu ketat: beberapa station bisa tidak memiliki semua sensor opsional.
  return requiredKeys.every((key) => typeof item[key] === 'number' && !isNaN(item[key]));
};


const parseCustomTimestamp = (ts) => {
  // Format: "28-07-25 06:30:00" => "2025-07-28T06:30:00"
  if (!ts || typeof ts !== 'string') return ts;
  const match = ts.match(/^(\d{2})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/);
  if (!match) return ts;
  const [, dd, mm, yy, h, m, s] = match;
  // Asumsi tahun 20xx
  return `20${yy}-${mm}-${dd}T${h}:${m}:${s}`;
};


// Fungsi mapping data dari API
const mapApiData = (item) => {
  if (!item) {
    return {
      timestamp: 'error',
      humidity: 'error',
      temperature: 'error',
      rainfall: 'error',
      windspeed: 'error',
      irradiation: 'error',
      windDirection: 'error',
      angle: 'error',
      bmptemperature: 'error',
      airpressure: 'error',
      suhuair: 'error',
    };
  }
  let ts = item.timestamp;
  if (ts === undefined || ts === null || ts === '') {
    return {
      timestamp: 'alat rusak',
      humidity: 'alat rusak',
      temperature: 'alat rusak',
      rainfall: 'alat rusak',
      windspeed: 'alat rusak',
      irradiation: 'alat rusak',
      windDirection: 'alat rusak',
      angle: 'alat rusak',
      bmptemperature: 'alat rusak',
      airpressure: 'alat rusak',
      suhuair: 'alat rusak',
    };
  }
  ts = parseCustomTimestamp(ts); // <-- parsing timestamp agar valid untuk JS Date

  const humidityRaw = item.humidity ?? item.hum_dht22;
  const temperatureRaw = item.temperature ?? item.temp_dht22;
  const rainfallRaw = item.rainfall;
  const windSpeedRaw = item.windSpeed ?? item.windspeed ?? item.wind_speed;
  const irradiationRaw = item.irradiation ?? item.pyrano;
  const angleRaw = item.angle ?? item.Angle;
  const bmpTemperatureRaw = item.bmpTemperature ?? item.bmptemperature ?? item.bmp_temperature;
  const airPressureRaw = item.AirPressure ?? item.airPressure ?? item.airpressure;
  const suhuAirRaw = item.suhuAir ?? item.suhuair ?? item.waterTemperature ?? item.water_temperature;

  return {
    timestamp: ts,
    humidity: isValidValue(humidityRaw) ? Number(humidityRaw) : 'alat rusak',
    temperature: isValidValue(temperatureRaw) ? Number(temperatureRaw) : 'alat rusak',
    rainfall: isValidValue(rainfallRaw) ? Number(rainfallRaw) : 'alat rusak',
    windspeed: isValidValue(windSpeedRaw) ? Number(windSpeedRaw) : 'alat rusak',
    irradiation: isValidValue(irradiationRaw) ? Number(irradiationRaw) : 'alat rusak',
    windDirection: windDirectionToEnglish(item.direction ?? item.windDirection ?? ''),
    angle: isValidValue(angleRaw) ? Number(angleRaw) : 'alat rusak',
    bmptemperature: isValidValue(bmpTemperatureRaw) ? Number(bmpTemperatureRaw) : 'alat rusak',
    airpressure: isValidValue(airPressureRaw) ? Number(airPressureRaw) : 'alat rusak',
    suhuair: isValidValue(suhuAirRaw) ? Number(suhuAirRaw) : 'alat rusak',
  };
};



function filterByRange(data, filter, startTimestamp, endTimestamp) {
  if (!Array.isArray(data) || data.length === 0) return [];

  const startDate = startTimestamp ? new Date(startTimestamp) : null;
  const endDate = endTimestamp ? new Date(endTimestamp) : null;
  const hasStart = startDate && !Number.isNaN(startDate.getTime());
  const hasEnd = endDate && !Number.isNaN(endDate.getTime());

  if (hasStart || hasEnd) {
    return data.filter((d) => {
      const t = new Date(d.timestamp);
      if (Number.isNaN(t.getTime())) return false;
      if (hasStart && t < startDate) return false;
      if (hasEnd && t > endDate) return false;
      return true;
    });
  }

  const now = new Date();
  let minDate;
  if (filter === '1d') minDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  else if (filter === '7d') minDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  else if (filter === '1m') minDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  else minDate = null;

  return minDate
    ? data.filter(d => {
        const t = new Date(d.timestamp);
        return t >= minDate && t <= now;
      })
    : data;
}

const Station1 = () => {
  const [filter, setFilter] = useState('1d');
  const [allData, setAllData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [loading] = useState(false);
  const [error, setError] = useState(null);
  const [lastActiveTimestamp, setLastActiveTimestamp] = useState(null);
  const [gaugeMode, setGaugeMode] = useState('realtime');
  const [dataSourceMode, setDataSourceMode] = useState('realtime');
  const [lastActiveGaugeData, setLastActiveGaugeData] = useState(null);
  const [realtimeGaugeData, setRealtimeGaugeData] = useState(EMPTY_GAUGE_DATA);
  const [gaugeData, setGaugeData] = useState(EMPTY_GAUGE_DATA);
  const [startDateTime, setStartDateTime] = useState('');
  const [endDateTime, setEndDateTime] = useState('');
  const latestRequestRef = useRef(0);

  const getApiUrl = (filterType) => {
    const dailyUrl = PETENGORAN_DAILY_STATION1_URL;
    const resampleUrl = PETENGORAN_RESAMPLE15M_STATION1_URL;
    const legacyUrl = PETENGORAN_TOPIC4_URL;

    if (filterType === '1m') return resampleUrl || dailyUrl || legacyUrl;
    return dailyUrl || resampleUrl || legacyUrl;
  };

  const getTargetRecordCount = (filterType) => {
    if (filterType === '1d') return 200;
    if (filterType === '7d') return 1200;
    if (filterType === '1m') return 3200;
    return 500;
  };

  const buildPagedUrl = (baseUrl, limit, offset, startTime = null, endTime = null) => {
    const parsed = new URL(baseUrl);
    parsed.searchParams.set('limit', String(limit));
    parsed.searchParams.set('offset', String(offset));
    if (startTime) {
      parsed.searchParams.set('startTime', startTime);
    }
    if (endTime) {
      parsed.searchParams.set('endTime', endTime);
    }
    return parsed.toString();
  };

  const getSimulationApiUrl = (primaryUrl) => {
    if (!primaryUrl) return null;

    try {
      const parsed = new URL(primaryUrl);
      return `${parsed.origin}/simulate/petengoran/topic4/history?limit=500`;
    } catch (_error) {
      return null;
    }
  };

  const fetchJsonOrThrow = async (url) => {
    const response = await fetch(url);
    if (!response.ok) {
      let backendMessage = "";
      try {
        const errorBody = await response.json();
        backendMessage = errorBody?.message || "";
      } catch (_error) {
        // Ignore JSON parse errors for non-JSON responses.
      }

      const error = new Error(
        backendMessage
          ? `HTTP error! status: ${response.status} - ${backendMessage}`
          : `HTTP error! status: ${response.status}`
      );
      error.status = response.status;
      throw error;
    }

    return response.json();
  };

  const fetchPagedResult = async (baseUrl, sourceMode, filterType, startTime = null, endTime = null) => {
    const pageLimit = sourceMode === 'simulation' ? 200 : 500;
    const targetCount = getTargetRecordCount(filterType);
    const maxPages = sourceMode === 'simulation' ? 8 : 12;
    const rows = [];

    for (let page = 0; page < maxPages && rows.length < targetCount; page += 1) {
      const offset = page * pageLimit;
      const pagedUrl = buildPagedUrl(baseUrl, pageLimit, offset, startTime, endTime);
      const pageData = await fetchJsonOrThrow(pagedUrl);

      const chunk = Array.isArray(pageData?.result)
        ? pageData.result
        : Array.isArray(pageData?.data?.result)
          ? pageData.data.result
          : Array.isArray(pageData)
            ? pageData
            : [];

      if (chunk.length === 0) break;
      rows.push(...chunk);

      if (chunk.length < pageLimit) break;
    }

    return rows;
  };


  const fetchData = async (
    sourceMode = 'realtime',
    filterType = filter,
    selectedStartTime = startDateTime,
    selectedEndTime = endDateTime
  ) => {
    const requestId = latestRequestRef.current + 1;
    latestRequestRef.current = requestId;

    // Hapus setLoading(true) agar tidak ada loading indicator visual
    setError(null);
    try {
      const realtimeUrl = getApiUrl(filterType);
      const url =
        sourceMode === 'simulation' ? getSimulationApiUrl(realtimeUrl) : realtimeUrl;
      if (!url) throw new Error(`No API URL configured`);
      const startTime = sourceMode === 'realtime' && selectedStartTime
        ? new Date(selectedStartTime).toISOString()
        : null;
      const endTime = sourceMode === 'realtime' && selectedEndTime
        ? new Date(selectedEndTime).toISOString()
        : null;
      const rawRows = await fetchPagedResult(url, sourceMode, filterType, startTime, endTime);

      if (requestId !== latestRequestRef.current) {
        return;
      }

      // Urutkan data dari yang terbaru
      const result = rawRows
        .map(mapApiData)
        .filter((row) => {
          const rowTime = new Date(row.timestamp);
          if (Number.isNaN(rowTime.getTime())) return false;
          if (startTime && rowTime < new Date(startTime)) return false;
          if (endTime && rowTime > new Date(endTime)) return false;
          return true;
        })
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)); // terbaru di atas

      const latestActive =
        result.find(hasAllActiveSensorValue) ||
        result.find((row) => row && row.timestamp && row.timestamp !== 'error' && row.timestamp !== 'alat rusak');
      setLastActiveTimestamp(latestActive ? latestActive.timestamp : null);
      setLastActiveGaugeData(latestActive ? latestActive : null);
      setDataSourceMode(sourceMode);

      setAllData(result);
    } catch (err) {
      if (requestId !== latestRequestRef.current) {
        return;
      }

      setDataSourceMode(sourceMode);
      setError(`Failed to fetch data: ${err.message}`);
      setAllData([]);
      setLastActiveTimestamp(null);
      setLastActiveGaugeData(null);
    }
    // Hapus finally block setLoading(false)
  };



  useEffect(() => {
    fetchData('realtime', '1d');
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    fetchData(dataSourceMode, filter, startDateTime, endDateTime);
    // eslint-disable-next-line
  }, [filter, startDateTime, endDateTime]);

  const handleSimulationToggle = () => {
    if (dataSourceMode === 'simulation') {
      fetchData('realtime', filter, startDateTime, endDateTime);
      return;
    }

    fetchData('simulation', filter, startDateTime, endDateTime);
  };

    useEffect(() => {
      const filtered = filterByRange(allData, filter, startDateTime, endDateTime);
      setFilteredData(filtered);
  
      // Konsistenkan data tabel per 15 menit
      const fields = [
        'humidity', 'temperature', 'rainfall', 'windspeed', 'irradiation',
        'angle', 'airpressure', 'bmptemperature', 'suhuair'
      ];
      const resampled = resampleTimeSeriesWithMeanFill(filtered, 15, fields);
  
      // Ambil 10 data terakhir (paling baru) dari hasil resampling
      const sorted = [...resampled].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      const last10 = sorted.slice(0, 10);
  
      setTableData(last10);
  
      // Mode realtime hanya pakai data yang semua sensornya valid (alat aktif penuh)
      const latestFullyActiveRealtime =
        last10.find(hasAllActiveSensorValue) ||
        last10.find((row) => row && row.timestamp && row.timestamp !== 'error' && row.timestamp !== 'alat rusak');
      if (latestFullyActiveRealtime) {
        setRealtimeGaugeData({
          humidity: latestFullyActiveRealtime.humidity,
          temperature: latestFullyActiveRealtime.temperature,
          rainfall: latestFullyActiveRealtime.rainfall,
          windspeed: latestFullyActiveRealtime.windspeed,
          irradiation: latestFullyActiveRealtime.irradiation,
          windDirection: latestFullyActiveRealtime.windDirection,
          angle: latestFullyActiveRealtime.angle,
          bmptemperature: latestFullyActiveRealtime.bmptemperature,
          airpressure: latestFullyActiveRealtime.airpressure,
          suhuair: latestFullyActiveRealtime.suhuair,
        });
      } else {
        setRealtimeGaugeData(EMPTY_GAUGE_DATA);
      }
  }, [allData, filter, startDateTime, endDateTime]);

  useEffect(() => {
    if (gaugeMode === 'last-active' && lastActiveGaugeData) {
      setGaugeData(lastActiveGaugeData);
      return;
    }

    setGaugeData(realtimeGaugeData);
  }, [gaugeMode, lastActiveGaugeData, realtimeGaugeData]);

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
            <p className="text-center">Data collected from Station 1 (Petengoran)</p>
            <div className="text-center mb-3">
              {error && (
                <div className="alert alert-danger" role="alert">
                  <strong>Error:</strong> {error}
                </div>
              )}
            </div>
          </Col>
        </Row>
                <Row className="mt-3 mb-2">
          <Col className="text-center">
            <div style={{ color: '#495057', fontWeight: 600 }}>
              Terakhir data alat aktif:{' '}
              <span style={{ color: '#0d6efd' }}>
                {lastActiveTimestamp ? formatUserFriendlyTimestamp(lastActiveTimestamp) : 'Belum ada data aktif'}
              </span>
            </div>
            <div style={{ color: '#495057', fontWeight: 600 }} className="mt-1">
              Sumber data:{' '}
              <span style={{ color: dataSourceMode === 'simulation' ? '#fd7e14' : '#0d6efd' }}>
                {dataSourceMode === 'simulation' ? 'Simulasi' : 'Realtime'}
              </span>
            </div>
            <div className="mt-2 d-inline-flex gap-2">
              <button
                type="button"
                className={`btn btn-sm ${gaugeMode === 'realtime' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => setGaugeMode('realtime')}
              >
                Mode Realtime
              </button>
              <button
                type="button"
                className={`btn btn-sm ${gaugeMode === 'last-active' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => setGaugeMode('last-active')}
                disabled={!lastActiveGaugeData}
              >
                Mode Terakhir Aktif
              </button>
              <button
                type="button"
                className={`btn btn-sm ${dataSourceMode === 'simulation' ? 'btn-warning' : 'btn-outline-warning'}`}
                onClick={handleSimulationToggle}
              >
                Simulasi {dataSourceMode === 'simulation' ? 'ON' : 'OFF'}
              </button>
            </div>
          </Col>
        </Row>
        <Row className="g-4">
          <Col md={3} className="text-center">
            <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '10px', boxShadow: '0 0 15px rgba(0, 0, 0, 0.1)' }}>
              <HumidityGauge humidity={typeof gaugeData.humidity === 'number' ? gaugeData.humidity : 0} />
              <h5>Humidity</h5>
              <p>{typeof gaugeData.humidity === 'number' ? `${gaugeData.humidity}%` : gaugeData.humidity}</p>
            </div>
          </Col>
          <Col md={3} className="text-center">
            <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '10px', boxShadow: '0 0 15px rgba(0, 0, 0, 0.1)' }}>
              <TemperatureGauge temperature={typeof gaugeData.temperature === 'number' ? gaugeData.temperature : 0} />
              <h5>Temperature</h5>
              <p>{typeof gaugeData.temperature === 'number' ? `${gaugeData.temperature}°C` : gaugeData.temperature}</p>
            </div>
          </Col>
          <Col md={3} className="text-center">
            <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '10px', boxShadow: '0 0 15px rgba(0, 0, 0, 0.1)' }}>
              <RainfallGauge rainfall={typeof gaugeData.rainfall === 'number' ? gaugeData.rainfall : 0} />
              <h5>Rainfall</h5>
              <p>{typeof gaugeData.rainfall === 'number' ? `${gaugeData.rainfall} mm` : gaugeData.rainfall}</p>
            </div>
          </Col>
          <Col md={3} className="text-center">
            <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '10px', boxShadow: '0 0 15px rgba(0, 0, 0, 0.1)' }}>
              <WindSpeedGauge windspeed={typeof gaugeData.windspeed === 'number' ? gaugeData.windspeed : 0} />
              <h5>Wind Speed</h5>
              <p>{typeof gaugeData.windspeed === 'number' ? `${gaugeData.windspeed} km/h` : gaugeData.windspeed}</p>
            </div>
          </Col>
          <Col md={3} className="text-center">
            <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '10px', boxShadow: '0 0 15px rgba(0, 0, 0, 0.1)' }}>
              <IrradiationGauge irradiation={typeof gaugeData.irradiation === 'number' ? gaugeData.irradiation : 0} />
              <h5>Irradiation</h5>
              <p>{typeof gaugeData.irradiation === 'number' ? `${gaugeData.irradiation} W/m²` : gaugeData.irradiation}</p>
            </div>
          </Col>
          <Col md={3} className="text-center">
            <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '10px', boxShadow: '0 0 15px rgba(0, 0, 0, 0.1)'}}>
              <WindDirectionGauge windDirection={gaugeData.angle} />
              <h5>Wind Direction</h5>
              <p>
                {gaugeData.windDirection 
                  ? `${gaugeData.windDirection} (${gaugeData.angle}°)`
                  : gaugeData.angle}
              </p>
            </div>
          </Col>
          <Col md={3} className="text-center">
            <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '10px', boxShadow: '0 0 15px rgba(0, 0, 0, 0.1)' }}>
              <AirPressureGauge airPressure={typeof gaugeData.airpressure === 'number' ? gaugeData.airpressure : 0} />
              <h5>Air Pressure</h5>
              <p>{typeof gaugeData.airpressure === 'number' ? `${gaugeData.airpressure} hPa` : gaugeData.airpressure}</p>
            </div>
          </Col>
          <Col md={3} className="text-center">
            <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '10px', boxShadow: '0 0 15px rgba(0, 0, 0, 0.1)' }}>
              <TemperatureGauge temperature={typeof gaugeData.bmptemperature === 'number' ? gaugeData.bmptemperature : 0} />
              <h5>BMP Temperature</h5>
              <p>{typeof gaugeData.bmptemperature === 'number' ? `${gaugeData.bmptemperature}°C` : gaugeData.bmptemperature}</p>
            </div>
          </Col>
          <Col md={3} className="text-center">
            <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '10px', boxShadow: '0 0 15px rgba(0, 0, 0, 0.1)' }}>
              <WaterTemperatureGauge waterTemperature={typeof gaugeData.suhuair === 'number' ? gaugeData.suhuair : 0} />
              <h5>Water Temperature</h5>
              <p>{typeof gaugeData.suhuair === 'number' ? `${gaugeData.suhuair}°C` : gaugeData.suhuair}</p>
            </div>
          </Col>
        </Row>

        <Row className="mt-5 mb-3">
          <Col className="text-center">
            <div className="d-flex flex-column align-items-center gap-2 mb-3">
              <Form.Label className="mb-0 fw-semibold">Pilih Rentang Waktu (opsional)</Form.Label>
              <div className="d-flex gap-2 flex-wrap justify-content-center">
                <Form.Control
                  type="datetime-local"
                  style={{ maxWidth: '280px' }}
                  value={startDateTime}
                  onChange={(e) => setStartDateTime(e.target.value)}
                  placeholder="Mulai"
                />
                <Form.Control
                  type="datetime-local"
                  style={{ maxWidth: '280px' }}
                  value={endDateTime}
                  onChange={(e) => setEndDateTime(e.target.value)}
                  placeholder="Selesai"
                />
                <Button
                  variant="outline-secondary"
                  onClick={() => {
                    setStartDateTime('');
                    setEndDateTime('');
                  }}
                  disabled={!startDateTime && !endDateTime}
                >
                  Reset Rentang
                </Button>
              </div>
            </div>
            <ButtonGroup>
              <Button
                variant={filter === '1d' ? 'primary' : 'outline-primary'}
                onClick={() => setFilter('1d')}
              >
                1 Hari Terakhir
              </Button>
              <Button
                variant={filter === '7d' ? 'primary' : 'outline-primary'}
                onClick={() => setFilter('7d')}
              >
                7 Hari Terakhir
              </Button>
              <Button
                variant={filter === '1m' ? 'primary' : 'outline-primary'}
                onClick={() => setFilter('1m')}
              >
                1 Bulan Terakhir
              </Button>
            </ButtonGroup>
          </Col>
        </Row>
        <Row>
          <Col>
            <h2 className="text-center" style={{ color: '#007bff' }}>Chart Status</h2>
          </Col>
        </Row>
        <Row>
          <Col>
            <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '10px', boxShadow: '0 0 15px rgba(0, 0, 0, 0.1)' }}>
                <TrendChart
                  data={filteredData}
                  fields={[
                    { key: 'humidity', label: 'Humidity (%)' },
                    { key: 'temperature', label: 'Temperature (°C)' },
                    { key: 'rainfall', label: 'Rainfall (mm)' },
                    { key: 'windspeed', label: 'Wind Speed (km/h)' },
                    { key: 'irradiation', label: 'Irradiation (W/m²)' },
                    { key: 'angle', label: 'Wind Direction (°)' },
                    { key: 'airpressure', label: 'Air Pressure (hPa)' },
                    { key: 'bmptemperature', label: 'BMP Temperature (°C)' },
                    { key: 'suhuair', label: 'Water Temperature (°C)' },
                  ]}
                />
            </div>
          </Col>
        </Row>
        <Row className="mt-5">
          <Col>
            <h2 className="text-center" style={{ color: '#007bff' }}>Table Status</h2>
            {tableData.length > 0 && (
              <div className="text-center mb-3">
                <small className="text-muted">
                  <span className="badge bg-primary me-2">Latest</span>
                  Most recent data entry
                  <span className="ms-3">
                    <span className="badge bg-success me-2">Used in Gauge</span>
                    Data currently displayed in gauges above
                  </span>
                </small>
              </div>
            )}
          </Col>
        </Row>
        <Row>
          <Col>
            <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '10px', boxShadow: '0 0 15px rgba(0, 0, 0, 0.1)', overflowX: 'auto' }}>
              {tableData.length > 0 ? (
                <Table striped bordered hover variant="light" style={{ marginBottom: 0 }}>
                  <thead>
                    <tr>
                      <th>Status</th>
                      <th>Timestamp</th>
                      <th>Humidity (%)</th>
                      <th>Temperature (°C)</th>
                      <th>Rainfall (mm)</th>
                      <th>Wind Speed (km/h)</th>
                      <th>Irradiation (W/m²)</th>
                      <th>Wind Direction</th>
                      <th>Air Pressure (hPa)</th>
                      <th>BMP Temperature (°C)</th>
                      <th>Water Temperature (°C)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableData.slice(0, 10).map((item, index) => {
                      const isLatest = index === 0;
                      const isUsedInGauge = (
                        item.humidity === gaugeData.humidity &&
                        item.temperature === gaugeData.temperature &&
                        item.rainfall === gaugeData.rainfall &&
                        item.windspeed === gaugeData.windspeed &&
                        item.irradiation === gaugeData.irradiation &&
                        item.angle === gaugeData.angle &&
                        item.airpressure === gaugeData.airpressure &&
                        item.bmptemperature === gaugeData.bmptemperature &&
                        item.suhuair === gaugeData.suhuair
                      );
                      return (
                        <tr key={index}>
                          <td>
                            <div className="d-flex flex-column gap-1">
                              {isLatest && <span className="badge bg-primary">Latest</span>}
                              {isUsedInGauge && <span className="badge bg-success">Used in Gauge</span>}
                            </div>
                          </td>
                          <td>{formatUserFriendlyTimestamp(item.timestamp)}</td>
                          <td>{item.humidity}</td>
                          <td>{item.temperature}</td>
                          <td>{item.rainfall}</td>
                          <td>{item.windspeed}</td>
                          <td>{item.irradiation}</td>
                          <td>{item.windDirection}</td>
                          <td>{item.airpressure}</td>
                          <td>{item.bmptemperature}</td>
                          <td>{item.suhuair}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              ) : (
                <p className="text-center" style={{ color: '#007bff' }}>
                  {loading ? 'Loading data...' : 'No data available for the selected filter'}
                </p>
              )}
            </div>
          </Col>
        </Row>
      </Container>
    </section>
  );
};

export default Station1;