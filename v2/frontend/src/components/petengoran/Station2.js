import { useEffect, useRef, useState } from 'react';
import { Button, ButtonGroup, Col, Container, Form, Row, Table } from 'react-bootstrap';
import {
    PETENGORAN_DAILY_STATION2_URL,
    PETENGORAN_RESAMPLE15M_STATION2_URL,
} from '../../config/apiEndpoints';
import {
    STATION_MODES,
    filterDataByModeRange,
    findLatestActiveRecord,
    generateSimulatedRawRecords,
    hasAnySensorValue,
    parseFlexibleDate,
    parseFlexibleTimestamp,
    toGaugePayload,
} from '../../utils/stationModeUtils';
import TrendChart, { resampleTimeSeriesWithMeanFill } from "./chart";
import AirPressureGauge from './status/AirPressure';
import HumidityGauge from './status/HumidityGauge';
import IrradiationGauge from './status/Irradiation';
import RainfallGauge from './status/Rainfall';
import TemperatureGauge from './status/TemperaturGauge';
import WindDirectionGauge from './status/WindDirection';
import WindSpeedGauge from './status/WindSpeed';

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

const formatUserFriendlyTimestamp = (timestamp) => {
  if (!timestamp || timestamp === 'error' || timestamp === 'alat rusak') {
    return timestamp;
  }
  try {
    const date = parseFlexibleDate(timestamp);
    if (!date) {
      return timestamp;
    }
    const options = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'Asia/Jakarta',
    };
    return date.toLocaleDateString('id-ID', options);
  } catch (_error) {
    return timestamp;
  }
};

const isValidValue = (val) =>
  val !== null && val !== undefined && val !== '' && val !== 'error' && val !== 'alat rusak' && !isNaN(Number(val));

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
};

const PRIMARY_SENSOR_KEYS = ['humidity', 'temperature', 'rainfall', 'windspeed'];
const ALL_SENSOR_KEYS = [
  'humidity',
  'temperature',
  'rainfall',
  'windspeed',
  'irradiation',
  'angle',
  'bmptemperature',
  'airpressure',
];

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
    };
  }
  const ts = parseFlexibleTimestamp(item.timestamp);
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
    };
  }
  return {
    timestamp: ts,
    humidity: isValidValue(item.humidity) ? Number(item.humidity) : 'alat rusak',
    temperature: isValidValue(item.temperature) ? Number(item.temperature) : 'alat rusak',
    rainfall: isValidValue(item.rainfall) ? Number(item.rainfall) : 'alat rusak',
    windspeed: isValidValue(item.windSpeed ?? item.windspeed ?? item.wind_speed)
      ? Number(item.windSpeed ?? item.windspeed ?? item.wind_speed)
      : 'alat rusak',
    irradiation: isValidValue(item.pyrano)
      ? Number(item.pyrano)
      : isValidValue(item.irradiation)
        ? Number(item.irradiation)
        : 'alat rusak',
    windDirection: windDirectionToEnglish(item.direction ?? item.windDirection ?? ''),
    angle: isValidValue(item.angle) ? Number(item.angle) : 'alat rusak',
    bmptemperature: isValidValue(item.bmpTemperature ?? item.bmptemperature)
      ? Number(item.bmpTemperature ?? item.bmptemperature)
      : 'alat rusak',
    airpressure: isValidValue(item.AirPressure ?? item.airPressure ?? item.airpressure)
      ? Number(item.AirPressure ?? item.airPressure ?? item.airpressure)
      : 'alat rusak',
  };
};

const Station2 = ({ customConfig }) => {
  const [filter, setFilter] = useState('1d');
  const [activeMode, setActiveMode] = useState(STATION_MODES.REALTIME);
  const [allData, setAllData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [loading] = useState(false);
  const [error, setError] = useState(null);
  const [lastActiveTimestamp, setLastActiveTimestamp] = useState(null);
  const [lastActiveGaugeData, setLastActiveGaugeData] = useState(null);
  const [realtimeGaugeData, setRealtimeGaugeData] = useState(EMPTY_GAUGE_DATA);
  const [gaugeData, setGaugeData] = useState(EMPTY_GAUGE_DATA);
  const [startDateTime, setStartDateTime] = useState('');
  const [endDateTime, setEndDateTime] = useState('');
  const latestRequestRef = useRef(0);
  const cachedRealDataRef = useRef([]);

  const getApiUrl = (filterType) => {
    if (customConfig && customConfig.type === 'backend') {
      const base = customConfig.baseUrl.replace(/\/$/, '');
      if (filterType === '1d' || filterType === '7d') {
        return `${base}${customConfig.endpointMap?.station2Daily || '/petengoran/station2/history'}`;
      }
      if (filterType === '1m') {
        return `${base}${customConfig.endpointMap?.station2Resample15m || '/petengoran/station2/history'}`;
      }
    }

    switch (filterType) {
      case '1d':
      case '7d':
        return PETENGORAN_DAILY_STATION2_URL;
      case '1m':
        return PETENGORAN_RESAMPLE15M_STATION2_URL;
      default:
        return PETENGORAN_DAILY_STATION2_URL;
    }
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

  const getSimulationApiUrl = () => {
    const primaryUrl = getApiUrl(filter);
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

      throw new Error(
        backendMessage
          ? `HTTP error! status: ${response.status} - ${backendMessage}`
          : `HTTP error! status: ${response.status}`
      );
    }

    return response.json();
  };

  const fetchPagedResult = async (baseUrl, sourceMode, filterType, startTime = null, endTime = null) => {
    const pageLimit = sourceMode === STATION_MODES.SIMULATION ? 200 : 500;
    const targetCount = getTargetRecordCount(filterType);
    const maxPages = sourceMode === STATION_MODES.SIMULATION ? 8 : 12;
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
    targetMode = activeMode,
    filterType = filter,
    selectedStartTime = startDateTime,
    selectedEndTime = endDateTime
  ) => {
    const requestId = latestRequestRef.current + 1;
    latestRequestRef.current = requestId;

    setError(null);
    const isSimulation = targetMode === STATION_MODES.SIMULATION;

    try {
      const startTime = !isSimulation && selectedStartTime
        ? new Date(selectedStartTime).toISOString()
        : null;
      const endTime = !isSimulation && selectedEndTime
        ? new Date(selectedEndTime).toISOString()
        : null;

      let rawRows = [];

      if (isSimulation) {
        const simUrl = !customConfig ? getSimulationApiUrl() : null;
        if (simUrl && !selectedStartTime && !selectedEndTime && filterType === '1d') {
          try {
            rawRows = await fetchPagedResult(simUrl, STATION_MODES.SIMULATION, filterType, null, null);
          } catch (_simErr) {
            rawRows = [];
          }
        }
        if (!Array.isArray(rawRows) || rawRows.length === 0) {
          rawRows = generateSimulatedRawRecords({
            filter: filterType,
            startDateTime: selectedStartTime,
            endDateTime: selectedEndTime,
            stationSeed: 2,
          });
        }
      } else {
        const url = getApiUrl(filterType);
        if (!url) throw new Error(`No API URL configured for filter: ${filterType}`);
        rawRows = await fetchPagedResult(url, STATION_MODES.REALTIME, filterType, startTime, endTime);
      }

      if (requestId !== latestRequestRef.current) {
        return;
      }

      const mapped = rawRows
        .map(mapApiData)
        .filter((row) => {
          const rowTime = parseFlexibleDate(row.timestamp);
          if (!rowTime) return false;
          if (startTime && rowTime < new Date(startTime)) return false;
          if (endTime && rowTime > new Date(endTime)) return false;
          return true;
        })
        .sort((a, b) => parseFlexibleDate(b.timestamp) - parseFlexibleDate(a.timestamp));

      if (!isSimulation) {
        cachedRealDataRef.current = mapped;
        const latestActive = findLatestActiveRecord(mapped, PRIMARY_SENSOR_KEYS, ALL_SENSOR_KEYS);
        if (latestActive || (!selectedStartTime && !selectedEndTime)) {
          setLastActiveTimestamp(latestActive ? latestActive.timestamp : null);
          setLastActiveGaugeData(
            latestActive ? toGaugePayload(latestActive, EMPTY_GAUGE_DATA) : null
          );
        }
      }

      setAllData(mapped);
    } catch (err) {
      if (requestId !== latestRequestRef.current) {
        return;
      }

      if (isSimulation) {
        const fallbackSim = generateSimulatedRawRecords({
          filter: filterType,
          startDateTime: selectedStartTime,
          endDateTime: selectedEndTime,
          stationSeed: 2,
        }).map(mapApiData);
        setAllData(fallbackSim);
        return;
      }

      setError(`Failed to fetch data: ${err.message}`);
      setAllData([]);
      if (!selectedStartTime && !selectedEndTime) {
        setLastActiveTimestamp(null);
        setLastActiveGaugeData(null);
      }
    }
  };

  useEffect(() => {
    fetchData(activeMode, filter, startDateTime, endDateTime);
    // eslint-disable-next-line
  }, [filter, startDateTime, endDateTime]);

  const handleModeChange = (nextMode) => {
    if (nextMode === activeMode && nextMode !== STATION_MODES.SIMULATION) {
      return;
    }
    const resolvedMode =
      nextMode === STATION_MODES.SIMULATION && activeMode === STATION_MODES.SIMULATION
        ? STATION_MODES.REALTIME
        : nextMode;

    setActiveMode(resolvedMode);

    if (
      resolvedMode !== STATION_MODES.SIMULATION &&
      activeMode !== STATION_MODES.SIMULATION &&
      cachedRealDataRef.current.length > 0
    ) {
      setError(null);
      setAllData(cachedRealDataRef.current);
      return;
    }

    fetchData(resolvedMode, filter, startDateTime, endDateTime);
  };

  useEffect(() => {
    const filtered = filterDataByModeRange(allData, {
      filter,
      startDateTime,
      endDateTime,
      mode: activeMode,
      lastActiveTimestamp,
    });
    setFilteredData(filtered);

    const fields = [
      'humidity',
      'temperature',
      'rainfall',
      'windspeed',
      'irradiation',
      'windDirection',
      'angle',
      'bmptemperature',
      'airpressure',
    ];

    const resampledTableData = resampleTimeSeriesWithMeanFill(filtered, 15, fields);
    const sortedResampled = [...resampledTableData].sort(
      (a, b) => parseFlexibleDate(b.timestamp) - parseFlexibleDate(a.timestamp)
    );
    setTableData(sortedResampled);

    const latestWindowRecord =
      findLatestActiveRecord(sortedResampled, PRIMARY_SENSOR_KEYS, ALL_SENSOR_KEYS) ||
      findLatestActiveRecord(filtered, PRIMARY_SENSOR_KEYS, ALL_SENSOR_KEYS);

    const windowGauge = latestWindowRecord
      ? toGaugePayload(latestWindowRecord, EMPTY_GAUGE_DATA)
      : EMPTY_GAUGE_DATA;

    setRealtimeGaugeData(windowGauge);
  }, [allData, filter, startDateTime, endDateTime, activeMode, lastActiveTimestamp]);

  useEffect(() => {
    if (activeMode === STATION_MODES.LAST_ACTIVE) {
      if ((startDateTime || endDateTime) && hasAnySensorValue(realtimeGaugeData, ALL_SENSOR_KEYS)) {
        setGaugeData(realtimeGaugeData);
        return;
      }
      setGaugeData(lastActiveGaugeData || realtimeGaugeData);
      return;
    }

    setGaugeData(realtimeGaugeData);
  }, [activeMode, lastActiveGaugeData, realtimeGaugeData, startDateTime, endDateTime]);

  const modeLabel =
    activeMode === STATION_MODES.SIMULATION
      ? 'Simulasi'
      : activeMode === STATION_MODES.LAST_ACTIVE
        ? 'Terakhir Aktif'
        : 'Realtime';

  const modeBadgeClass =
    activeMode === STATION_MODES.SIMULATION
      ? 'mc-mode-badge--simulation'
      : activeMode === STATION_MODES.LAST_ACTIVE
        ? 'mc-mode-badge--last-active'
        : 'mc-mode-badge--realtime';

  return (
    <section className="mc-station-page">
      <Container className="mc-station-container">
        <div className="mc-station-header mb-3">
          <div>
            <span className="mc-station-header__eyebrow">Stasiun Pemantauan Iklim Mikro</span>
            <h2 className="mc-station-header__title">Environment Status</h2>
            <p className="mc-station-header__subtitle">Data collected from Station 2 (Petengoran)</p>
          </div>
          <div className="mc-station-header__meta">
            <div className="mc-status-chip">
              <span className="mc-status-chip__label">Terakhir data alat aktif:</span>
              <span className="mc-status-chip__value">
                {lastActiveTimestamp ? formatUserFriendlyTimestamp(lastActiveTimestamp) : 'Belum ada data aktif'}
              </span>
            </div>
            <div className="mc-status-chip">
              <span className="mc-status-chip__label">Sumber data:</span>
              <span className={`mc-mode-badge ${modeBadgeClass}`}>
                {modeLabel}
              </span>
            </div>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger mb-3" role="alert">
            <strong>Error:</strong> {error}
          </div>
        )}

        <div className="mc-station-toolbar mb-4">
          <span className="mc-station-toolbar__label">Mode Tampilan Data</span>
          <div className="mc-mode-group">
            <button
              type="button"
              className={`btn btn-sm ${activeMode === STATION_MODES.REALTIME ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => handleModeChange(STATION_MODES.REALTIME)}
            >
              Mode Realtime
            </button>
            <button
              type="button"
              className={`btn btn-sm ${activeMode === STATION_MODES.LAST_ACTIVE ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => handleModeChange(STATION_MODES.LAST_ACTIVE)}
              disabled={!lastActiveGaugeData}
            >
              Mode Terakhir Aktif
            </button>
            <button
              type="button"
              className={`btn btn-sm ${activeMode === STATION_MODES.SIMULATION ? 'btn-warning' : 'btn-outline-warning'}`}
              onClick={() => handleModeChange(STATION_MODES.SIMULATION)}
            >
              Mode Simulasi {activeMode === STATION_MODES.SIMULATION ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>

        <Row className="g-3 mb-4">
          <Col xs={12} sm={6} md={4} lg={3}>
            <div className="mc-sensor-card">
              <div className="mc-sensor-card__header">
                <h5 className="mc-sensor-card__title">Humidity</h5>
                <span className="mc-sensor-card__unit-tag">% RH</span>
              </div>
              <HumidityGauge humidity={typeof gaugeData.humidity === 'number' ? gaugeData.humidity : 0} />
              <p className="mc-sensor-card__value">{typeof gaugeData.humidity === 'number' ? `${gaugeData.humidity}%` : gaugeData.humidity}</p>
            </div>
          </Col>
          <Col xs={12} sm={6} md={4} lg={3}>
            <div className="mc-sensor-card">
              <div className="mc-sensor-card__header">
                <h5 className="mc-sensor-card__title">Temperature</h5>
                <span className="mc-sensor-card__unit-tag">°C</span>
              </div>
              <TemperatureGauge temperature={typeof gaugeData.temperature === 'number' ? gaugeData.temperature : 0} />
              <p className="mc-sensor-card__value">{typeof gaugeData.temperature === 'number' ? `${gaugeData.temperature}°C` : gaugeData.temperature}</p>
            </div>
          </Col>
          <Col xs={12} sm={6} md={4} lg={3}>
            <div className="mc-sensor-card">
              <div className="mc-sensor-card__header">
                <h5 className="mc-sensor-card__title">Rainfall</h5>
                <span className="mc-sensor-card__unit-tag">mm</span>
              </div>
              <RainfallGauge rainfall={typeof gaugeData.rainfall === 'number' ? gaugeData.rainfall : 0} />
              <p className="mc-sensor-card__value">{typeof gaugeData.rainfall === 'number' ? `${gaugeData.rainfall} mm` : gaugeData.rainfall}</p>
            </div>
          </Col>
          <Col xs={12} sm={6} md={4} lg={3}>
            <div className="mc-sensor-card">
              <div className="mc-sensor-card__header">
                <h5 className="mc-sensor-card__title">Wind Speed</h5>
                <span className="mc-sensor-card__unit-tag">km/h</span>
              </div>
              <WindSpeedGauge windspeed={typeof gaugeData.windspeed === 'number' ? gaugeData.windspeed : 0} />
              <p className="mc-sensor-card__value">{typeof gaugeData.windspeed === 'number' ? `${gaugeData.windspeed} km/h` : gaugeData.windspeed}</p>
            </div>
          </Col>
          <Col xs={12} sm={6} md={4} lg={3}>
            <div className="mc-sensor-card">
              <div className="mc-sensor-card__header">
                <h5 className="mc-sensor-card__title">Irradiation</h5>
                <span className="mc-sensor-card__unit-tag">W/m²</span>
              </div>
              <IrradiationGauge irradiation={typeof gaugeData.irradiation === 'number' ? gaugeData.irradiation : 0} />
              <p className="mc-sensor-card__value">{typeof gaugeData.irradiation === 'number' ? `${gaugeData.irradiation} W/m²` : gaugeData.irradiation}</p>
            </div>
          </Col>
          <Col xs={12} sm={6} md={4} lg={3}>
            <div className="mc-sensor-card">
              <div className="mc-sensor-card__header">
                <h5 className="mc-sensor-card__title">Wind Direction</h5>
                <span className="mc-sensor-card__unit-tag">Kompas</span>
              </div>
              <WindDirectionGauge windDirection={gaugeData.angle} />
              <p className="mc-sensor-card__value">
                {gaugeData.windDirection
                  ? `${gaugeData.windDirection} (${gaugeData.angle}°)`
                  : `${gaugeData.angle}°`}
              </p>
            </div>
          </Col>
          <Col xs={12} sm={6} md={4} lg={3}>
            <div className="mc-sensor-card">
              <div className="mc-sensor-card__header">
                <h5 className="mc-sensor-card__title">Air Pressure</h5>
                <span className="mc-sensor-card__unit-tag">hPa</span>
              </div>
              <AirPressureGauge airPressure={typeof gaugeData.airpressure === 'number' ? gaugeData.airpressure : 0} />
              <p className="mc-sensor-card__value">{typeof gaugeData.airpressure === 'number' ? `${gaugeData.airpressure} hPa` : gaugeData.airpressure}</p>
            </div>
          </Col>
          <Col xs={12} sm={6} md={4} lg={3}>
            <div className="mc-sensor-card">
              <div className="mc-sensor-card__header">
                <h5 className="mc-sensor-card__title">BMP Temperature</h5>
                <span className="mc-sensor-card__unit-tag">°C</span>
              </div>
              <TemperatureGauge temperature={typeof gaugeData.bmptemperature === 'number' ? gaugeData.bmptemperature : 0} />
              <p className="mc-sensor-card__value">{typeof gaugeData.bmptemperature === 'number' ? `${gaugeData.bmptemperature}°C` : gaugeData.bmptemperature}</p>
            </div>
          </Col>
        </Row>

        <div className="mc-section-card mb-4">
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
            <div className="d-flex flex-wrap align-items-center gap-2">
              <Form.Label className="mb-0 fw-semibold small text-muted me-1">Pilih Rentang Waktu (opsional):</Form.Label>
              <Form.Control
                type="datetime-local"
                size="sm"
                style={{ maxWidth: '215px' }}
                value={startDateTime}
                onChange={(e) => setStartDateTime(e.target.value)}
                placeholder="Mulai"
              />
              <span className="text-muted small">s/d</span>
              <Form.Control
                type="datetime-local"
                size="sm"
                style={{ maxWidth: '215px' }}
                value={endDateTime}
                onChange={(e) => setEndDateTime(e.target.value)}
                placeholder="Selesai"
              />
              <Button
                size="sm"
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
            <ButtonGroup size="sm">
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
          </div>
        </div>

        <div className="mc-section-card mb-4">
          <div className="mc-section-card__header">
            <div>
              <h2 className="mc-section-card__title">Chart Status</h2>
              <p className="mc-section-card__subtitle">Klik salah satu grafik parameter untuk melihat detail resolusi 15/30 menit</p>
            </div>
          </div>
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
            ]}
          />
        </div>

        <div className="mc-section-card">
          <div className="mc-section-card__header">
            <div>
              <h2 className="mc-section-card__title">Table Status</h2>
              <p className="mc-section-card__subtitle">10 data pembacaan terbaru dari hasil resampling 15 menit</p>
            </div>
            {tableData.length > 0 && (
              <div className="d-flex flex-wrap align-items-center gap-3 small text-muted">
                <span>
                  <span className="badge bg-primary me-1">Latest</span>
                  Most recent data entry
                </span>
                <span>
                  <span className="badge bg-success me-1">Used in Gauge</span>
                  Data currently displayed in gauges above
                </span>
              </div>
            )}
          </div>
          <div style={{ overflowX: 'auto' }}>
            {tableData.length > 0 ? (
              <Table striped bordered hover variant="light" className="mc-data-table">
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
                  </tr>
                </thead>
                <tbody>
                  {tableData.slice(0, 10).map((item, index) => {
                    const isLatest = index === 0;
                    const isUsedInGauge =
                      (item.humidity === gaugeData.humidity &&
                        item.temperature === gaugeData.temperature &&
                        item.rainfall === gaugeData.rainfall &&
                        item.windspeed === gaugeData.windspeed) ||
                      (isLatest && hasAnySensorValue(gaugeData, ALL_SENSOR_KEYS));
                    return (
                      <tr key={index}>
                        <td>
                          <div className="d-flex flex-column gap-1">
                            {isLatest && <span className="badge bg-primary">Latest</span>}
                            {isUsedInGauge && <span className="badge bg-success">Used in Gauge</span>}
                          </div>
                        </td>
                        <td>{formatUserFriendlyTimestamp(item.timestamp)}</td>
                        <td>{item.humidity ?? '-'}</td>
                        <td>{item.temperature ?? '-'}</td>
                        <td>{item.rainfall ?? '-'}</td>
                        <td>{item.windspeed ?? '-'}</td>
                        <td>{item.irradiation ?? '-'}</td>
                        <td>{item.windDirection || '-'}</td>
                        <td>{item.airpressure ?? '-'}</td>
                        <td>{item.bmptemperature ?? '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            ) : (
              <div className="mc-empty-state">
                {loading ? 'Loading data...' : 'No data available for the selected filter'}
              </div>
            )}
          </div>
        </div>
      </Container>
    </section>
  );
};

export default Station2;
