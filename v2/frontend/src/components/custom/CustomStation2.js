import { useEffect, useRef, useState } from 'react';
import { Button, ButtonGroup, Col, Container, Form, Row, Table } from 'react-bootstrap';
import {
    PETENGORAN_DAILY_STATION2_URL,
    PETENGORAN_RESAMPLE15M_STATION2_URL,
} from '../../config/apiEndpoints';
import {
    STATION_MODES,
    extractArrayFromApiResponse,
    extractSensorField,
    extractTimestampField,
    filterDataByModeRange,
    findLatestActiveRecord,
    hasAnySensorValue,
    parseFlexibleDate,
    toGaugePayload,
} from '../../utils/stationModeUtils';
import DataDownloadModal from '../DataDownloadModal';
import TrendChart, { resampleTimeSeriesWithMeanFill } from "../petengoran/chart";
import AirPressureGauge from '../petengoran/status/AirPressure';
import HumidityGauge from '../petengoran/status/HumidityGauge';
import IrradiationGauge from '../petengoran/status/Irradiation';
import RainfallGauge from '../petengoran/status/Rainfall';
import TemperatureGauge from '../petengoran/status/TemperaturGauge';
import WindDirectionGauge from '../petengoran/status/WindDirection';
import WindSpeedGauge from '../petengoran/status/WindSpeed';

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

const readNumericSensor = (item, specKey) => {
  const match = extractSensorField(item, specKey);
  if (!match) return 'alat rusak';
  return isValidValue(match.value) ? Number(match.value) : 'alat rusak';
};

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
  const tsField = extractTimestampField(item);
  const ts = tsField ? tsField.timestamp : '';
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
  const dirField = extractSensorField(item, 'direction');
  return {
    timestamp: ts,
    humidity: readNumericSensor(item, 'humidity'),
    temperature: readNumericSensor(item, 'temperature'),
    rainfall: readNumericSensor(item, 'rainfall'),
    windspeed: readNumericSensor(item, 'windSpeed'),
    irradiation: readNumericSensor(item, 'irradiation'),
    windDirection: windDirectionToEnglish(dirField ? String(dirField.value ?? '') : ''),
    angle: readNumericSensor(item, 'angle'),
    bmptemperature: readNumericSensor(item, 'bmpTemperature'),
    airpressure: readNumericSensor(item, 'airPressure'),
  };
};

const DEFAULT_UI = {
  gauges: true,
  gaugeItems: {
    humidity: true,
    temperature: true,
    rainfall: true,
    windspeed: true,
    irradiation: true,
    windDirection: true,
    airPressure: true,
    bmpTemperature: true,
  },
  tableColumns: {
    status: true,
    timestamp: true,
    humidity: true,
    temperature: true,
    rainfall: true,
    windspeed: true,
    irradiation: true,
    windDirection: true,
    airPressure: true,
    bmpTemperature: true,
  },
  chart: true,
  map: true,
  table: true,
  filterButtons: true,
  downloadButton: true,
};

const Station2 = ({ customConfig, customTitle, uiSettings = DEFAULT_UI }) => {
  const activeUi = {
    ...DEFAULT_UI,
    ...uiSettings,
    gaugeItems: {
      ...DEFAULT_UI.gaugeItems,
      ...(uiSettings.gaugeItems || {}),
    },
    tableColumns: {
      ...DEFAULT_UI.tableColumns,
      ...(uiSettings.tableColumns || {}),
    },
  };
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
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const latestRequestRef = useRef(0);
  const cachedRealDataRef = useRef([]);

  const joinEndpointUrl = (baseUrl, customPath, fallbackPath) => {
    const cleanBase = String(baseUrl || '').trim().replace(/\/$/, '');
    const trimmedCustom = String(customPath || '').trim();
    if (!trimmedCustom) {
      try {
        const parsedBase = new URL(cleanBase);
        if (parsedBase.pathname && parsedBase.pathname !== '/') {
          return cleanBase;
        }
      } catch (_e) {
        // Ignore URL parse error and use fallback
      }
    }
    const rawPath = trimmedCustom || String(fallbackPath || '').trim();
    if (!rawPath) return cleanBase;
    const cleanPath = rawPath.startsWith('/') ? rawPath : `/${rawPath}`;
    return `${cleanBase}${cleanPath}`;
  };

  const getApiUrl = (filterType) => {
    if (customConfig && customConfig.type === 'backend' && customConfig.baseUrl) {
      const map = customConfig.endpointMap || {};

      if (customConfig.useSingleEndpoint) {
        return joinEndpointUrl(
          customConfig.baseUrl,
          map.topic5History,
          '/petengoran/topic5/history'
        );
      }

      if (filterType === '1d' || filterType === '7d') {
        return joinEndpointUrl(
          customConfig.baseUrl,
          map.station2Daily || map['Daily data'] || map.topic5History,
          '/petengoran/station2/history'
        );
      }
      if (filterType === '1m') {
        return joinEndpointUrl(
          customConfig.baseUrl,
          map.station2Resample15m || map.Resample15m || map.topic5History,
          '/petengoran/station2/history'
        );
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

  const fetchPagedResult = async (baseUrl, _sourceMode, filterType, startTime = null, endTime = null) => {
    const pageLimit = 500;
    const targetCount = getTargetRecordCount(filterType);
    const maxPages = 12;
    const rows = [];
    let foundLivePrimary = false;
    let prevFirstSignature = null;

    for (let page = 0; page < maxPages; page += 1) {
      if (rows.length >= targetCount && (foundLivePrimary || page >= 6)) {
        break;
      }
      const offset = page * pageLimit;
      const pagedUrl = buildPagedUrl(baseUrl, pageLimit, offset, startTime, endTime);
      const pageData = await fetchJsonOrThrow(pagedUrl);

      const chunk = extractArrayFromApiResponse(pageData) || [];

      if (chunk.length === 0) break;

      const currentFirstSignature = JSON.stringify(chunk[0]);
      if (prevFirstSignature && currentFirstSignature === prevFirstSignature) {
        break;
      }
      prevFirstSignature = currentFirstSignature;

      rows.push(...chunk);

      if (!foundLivePrimary) {
        foundLivePrimary = chunk.some(
          (item) => {
            const hum = extractSensorField(item, 'humidity');
            const temp = extractSensorField(item, 'temperature');
            return Number(hum?.value) > 0 || Number(temp?.value) > 0;
          }
        );
      }

      if (chunk.length < pageLimit) break;
    }

    return rows;
  };

  const fetchData = async (
    _targetMode = activeMode,
    filterType = filter,
    selectedStartTime = startDateTime,
    selectedEndTime = endDateTime
  ) => {
    const requestId = latestRequestRef.current + 1;
    latestRequestRef.current = requestId;

    setError(null);

    try {
      const startTime = selectedStartTime
        ? new Date(selectedStartTime).toISOString()
        : null;
      const endTime = selectedEndTime
        ? new Date(selectedEndTime).toISOString()
        : null;

      const url = getApiUrl(filterType);
      if (!url) throw new Error(`No API URL configured for filter: ${filterType}`);
      const rawRows = await fetchPagedResult(url, STATION_MODES.REALTIME, filterType, startTime, endTime);

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

      cachedRealDataRef.current = mapped;
      const latestActive = findLatestActiveRecord(mapped, PRIMARY_SENSOR_KEYS, ALL_SENSOR_KEYS);
      if (latestActive || (!selectedStartTime && !selectedEndTime)) {
        setLastActiveTimestamp(latestActive ? latestActive.timestamp : null);
        setLastActiveGaugeData(
          latestActive ? toGaugePayload(latestActive, EMPTY_GAUGE_DATA) : null
        );
      }

      setAllData(mapped);
    } catch (err) {
      if (requestId !== latestRequestRef.current) {
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
  }, [filter, startDateTime, endDateTime, customConfig]);

  const handleModeChange = (nextMode) => {
    if (nextMode === activeMode) {
      return;
    }

    setActiveMode(nextMode);

    if (cachedRealDataRef.current.length > 0) {
      setError(null);
      setAllData(cachedRealDataRef.current);
      return;
    }

    fetchData(nextMode, filter, startDateTime, endDateTime);
  };

  useEffect(() => {
    const filtered = filterDataByModeRange(allData, {
      filter,
      startDateTime,
      endDateTime,
      mode: activeMode,
      lastActiveTimestamp,
    });

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

    let chartData = filtered;
    if (customConfig && customConfig.clientResample && customConfig.clientResample !== 'none') {
      const intervalMinutes = parseInt(customConfig.clientResample, 10) || 15;
      chartData = resampleTimeSeriesWithMeanFill(filtered, intervalMinutes, fields);
    }
    setFilteredData(chartData);

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
  }, [allData, filter, startDateTime, endDateTime, customConfig, activeMode, lastActiveTimestamp]);

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
    activeMode === STATION_MODES.LAST_ACTIVE
      ? 'Terakhir Aktif'
      : 'Realtime';

  const modeBadgeMod =
    activeMode === STATION_MODES.LAST_ACTIVE
      ? 'mc-mode-badge--last-active'
      : 'mc-mode-badge--realtime';

  return (
    <section className="mc-custom-station">
      <Container>
        <div className="mc-station-header mb-4">
          <div>
            <span className="mc-station-header__eyebrow">Dashboard Stasiun Pemantauan</span>
            <h2 className="mc-station-header__title">
              {customTitle ? customTitle : 'Environment Status — Station 2'}
            </h2>
            <p className="mc-station-header__subtitle mb-0">
              {customTitle
                ? `Pemantauan parameter iklim mikro pada ${customTitle}`
                : 'Pemantauan parameter iklim mikro dari Station 2 (Petengoran)'}
            </p>
          </div>

          <div className="mc-station-header__meta">
            <div className="mc-status-chip">
              <span className="text-muted">Update terakhir:</span>{' '}
              <strong>
                {lastActiveTimestamp ? formatUserFriendlyTimestamp(lastActiveTimestamp) : 'Belum ada data aktif'}
              </strong>
            </div>
            <div className="mc-status-chip">
              <span className="text-muted">Mode sumber:</span>{' '}
              <span className={`mc-mode-badge ${modeBadgeMod}`}>
                {modeLabel}
              </span>
            </div>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger mb-4" role="alert">
            <strong>Gagal memuat data sensor:</strong> {error}
          </div>
        )}

        <div className="mc-station-toolbar mb-4">
          <div className="mc-mode-group" role="group" aria-label="Pilih mode tampilan">
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
          </div>
          {activeUi.downloadButton && (
            <button
              type="button"
              className="btn btn-sm btn-primary fw-semibold px-3"
              onClick={() => setShowDownloadModal(true)}
            >
              Download Data
            </button>
          )}
        </div>

        {activeUi.gauges && (
          <Row className="g-3 mb-4">
            {activeUi.gaugeItems.humidity && (
              <Col xs={12} sm={6} md={3}>
                <div className="mc-sensor-card">
                  <div className="mc-sensor-card__header">
                    <h5 className="mc-sensor-card__title">Humidity</h5>
                    <span className="mc-sensor-card__unit-tag">%</span>
                  </div>
                  <HumidityGauge humidity={typeof gaugeData.humidity === 'number' ? gaugeData.humidity : 0} />
                  <p className="mc-sensor-card__value">{typeof gaugeData.humidity === 'number' ? `${gaugeData.humidity}%` : gaugeData.humidity}</p>
                </div>
              </Col>
            )}
            {activeUi.gaugeItems.temperature && (
              <Col xs={12} sm={6} md={3}>
                <div className="mc-sensor-card">
                  <div className="mc-sensor-card__header">
                    <h5 className="mc-sensor-card__title">Temperature</h5>
                    <span className="mc-sensor-card__unit-tag">°C</span>
                  </div>
                  <TemperatureGauge temperature={typeof gaugeData.temperature === 'number' ? gaugeData.temperature : 0} />
                  <p className="mc-sensor-card__value">{typeof gaugeData.temperature === 'number' ? `${gaugeData.temperature}°C` : gaugeData.temperature}</p>
                </div>
              </Col>
            )}
            {activeUi.gaugeItems.rainfall && (
              <Col xs={12} sm={6} md={3}>
                <div className="mc-sensor-card">
                  <div className="mc-sensor-card__header">
                    <h5 className="mc-sensor-card__title">Rainfall</h5>
                    <span className="mc-sensor-card__unit-tag">mm</span>
                  </div>
                  <RainfallGauge rainfall={typeof gaugeData.rainfall === 'number' ? gaugeData.rainfall : 0} />
                  <p className="mc-sensor-card__value">{typeof gaugeData.rainfall === 'number' ? `${gaugeData.rainfall} mm` : gaugeData.rainfall}</p>
                </div>
              </Col>
            )}
            {activeUi.gaugeItems.windspeed && (
              <Col xs={12} sm={6} md={3}>
                <div className="mc-sensor-card">
                  <div className="mc-sensor-card__header">
                    <h5 className="mc-sensor-card__title">Wind Speed</h5>
                    <span className="mc-sensor-card__unit-tag">km/h</span>
                  </div>
                  <WindSpeedGauge windspeed={typeof gaugeData.windspeed === 'number' ? gaugeData.windspeed : 0} />
                  <p className="mc-sensor-card__value">{typeof gaugeData.windspeed === 'number' ? `${gaugeData.windspeed} km/h` : gaugeData.windspeed}</p>
                </div>
              </Col>
            )}
            {activeUi.gaugeItems.irradiation && (
              <Col xs={12} sm={6} md={3}>
                <div className="mc-sensor-card">
                  <div className="mc-sensor-card__header">
                    <h5 className="mc-sensor-card__title">Irradiation</h5>
                    <span className="mc-sensor-card__unit-tag">W/m²</span>
                  </div>
                  <IrradiationGauge irradiation={typeof gaugeData.irradiation === 'number' ? gaugeData.irradiation : 0} />
                  <p className="mc-sensor-card__value">{typeof gaugeData.irradiation === 'number' ? `${gaugeData.irradiation} W/m²` : gaugeData.irradiation}</p>
                </div>
              </Col>
            )}
            {activeUi.gaugeItems.windDirection && (
              <Col xs={12} sm={6} md={3}>
                <div className="mc-sensor-card">
                  <div className="mc-sensor-card__header">
                    <h5 className="mc-sensor-card__title">Wind Direction</h5>
                    <span className="mc-sensor-card__unit-tag">°</span>
                  </div>
                  <WindDirectionGauge windDirection={gaugeData.angle} />
                  <p className="mc-sensor-card__value">
                    {gaugeData.windDirection
                      ? `${gaugeData.windDirection} (${gaugeData.angle}°)`
                      : gaugeData.angle}
                  </p>
                </div>
              </Col>
            )}
            {activeUi.gaugeItems.airPressure && (
              <Col xs={12} sm={6} md={3}>
                <div className="mc-sensor-card">
                  <div className="mc-sensor-card__header">
                    <h5 className="mc-sensor-card__title">Air Pressure</h5>
                    <span className="mc-sensor-card__unit-tag">hPa</span>
                  </div>
                  <AirPressureGauge airPressure={typeof gaugeData.airpressure === 'number' ? gaugeData.airpressure : 0} />
                  <p className="mc-sensor-card__value">{typeof gaugeData.airpressure === 'number' ? `${gaugeData.airpressure} hPa` : gaugeData.airpressure}</p>
                </div>
              </Col>
            )}
            {activeUi.gaugeItems.bmpTemperature && (
              <Col xs={12} sm={6} md={3}>
                <div className="mc-sensor-card">
                  <div className="mc-sensor-card__header">
                    <h5 className="mc-sensor-card__title">BMP Temperature</h5>
                    <span className="mc-sensor-card__unit-tag">°C</span>
                  </div>
                  <TemperatureGauge temperature={typeof gaugeData.bmptemperature === 'number' ? gaugeData.bmptemperature : 0} />
                  <p className="mc-sensor-card__value">{typeof gaugeData.bmptemperature === 'number' ? `${gaugeData.bmptemperature}°C` : gaugeData.bmptemperature}</p>
                </div>
              </Col>
            )}
          </Row>
        )}
        {activeUi.filterButtons && (
          <div className="mc-section-card mb-4">
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
              <div className="d-flex flex-wrap align-items-center gap-2">
                <span className="fw-semibold small text-muted me-1">Rentang Waktu:</span>
                <Form.Control
                  type="datetime-local"
                  size="sm"
                  style={{ maxWidth: '210px' }}
                  value={startDateTime}
                  onChange={(e) => setStartDateTime(e.target.value)}
                  placeholder="Mulai"
                />
                <span className="text-muted small">s/d</span>
                <Form.Control
                  type="datetime-local"
                  size="sm"
                  style={{ maxWidth: '210px' }}
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
                  Reset
                </Button>
              </div>
              <ButtonGroup size="sm">
                <Button
                  variant={filter === '1d' ? 'primary' : 'outline-primary'}
                  onClick={() => setFilter('1d')}
                >
                  1 Hari
                </Button>
                <Button
                  variant={filter === '7d' ? 'primary' : 'outline-primary'}
                  onClick={() => setFilter('7d')}
                >
                  7 Hari
                </Button>
                <Button
                  variant={filter === '1m' ? 'primary' : 'outline-primary'}
                  onClick={() => setFilter('1m')}
                >
                  1 Bulan
                </Button>
              </ButtonGroup>
            </div>
          </div>
        )}
        {activeUi.chart && (
          <div className="mc-section-card mb-4">
            <div className="mc-section-card__header">
              <div>
                <h4 className="mc-section-card__title">Grafik Tren Parameter</h4>
                <p className="mc-section-card__subtitle">
                  Tren perubahan parameter lingkungan berdasarkan rentang waktu terpilih
                </p>
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
        )}

        {activeUi.table && (
          <div className="mc-section-card mb-4">
            <div className="mc-section-card__header">
              <div>
                <h4 className="mc-section-card__title">Riwayat Pembacaan Sensor</h4>
                <p className="mc-section-card__subtitle">
                  10 rekaman pembacaan terbaru pada rentang waktu yang dipilih
                </p>
              </div>
            </div>
            <div style={{ overflowX: 'auto' }}>
              {tableData.length > 0 ? (
                <Table hover responsive className="mc-data-table mb-0 align-middle">
                  <thead>
                    <tr>
                      {activeUi.tableColumns.status && <th>Status</th>}
                      {activeUi.tableColumns.timestamp && <th>Timestamp</th>}
                      {activeUi.tableColumns.humidity && <th>Humidity (%)</th>}
                      {activeUi.tableColumns.temperature && <th>Temperature (°C)</th>}
                      {activeUi.tableColumns.rainfall && <th>Rainfall (mm)</th>}
                      {activeUi.tableColumns.windspeed && <th>Wind Speed (km/h)</th>}
                      {activeUi.tableColumns.irradiation && <th>Irradiation (W/m²)</th>}
                      {activeUi.tableColumns.windDirection && <th>Wind Direction</th>}
                      {activeUi.tableColumns.airPressure && <th>Air Pressure (hPa)</th>}
                      {activeUi.tableColumns.bmpTemperature && <th>BMP Temperature (°C)</th>}
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
                          {activeUi.tableColumns.status && (
                            <td>
                              <div className="d-flex flex-column gap-1">
                                {isLatest && <span className="badge bg-primary">Latest</span>}
                                {isUsedInGauge && <span className="badge bg-success">Used in Gauge</span>}
                              </div>
                            </td>
                          )}
                          {activeUi.tableColumns.timestamp && (
                            <td>{formatUserFriendlyTimestamp(item.timestamp)}</td>
                          )}
                          {activeUi.tableColumns.humidity && <td>{item.humidity ?? '-'}</td>}
                          {activeUi.tableColumns.temperature && <td>{item.temperature ?? '-'}</td>}
                          {activeUi.tableColumns.rainfall && <td>{item.rainfall ?? '-'}</td>}
                          {activeUi.tableColumns.windspeed && <td>{item.windspeed ?? '-'}</td>}
                          {activeUi.tableColumns.irradiation && <td>{item.irradiation ?? '-'}</td>}
                          {activeUi.tableColumns.windDirection && <td>{item.windDirection || '-'}</td>}
                          {activeUi.tableColumns.airPressure && <td>{item.airpressure ?? '-'}</td>}
                          {activeUi.tableColumns.bmpTemperature && <td>{item.bmptemperature ?? '-'}</td>}
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              ) : (
                <div className="mc-empty-state">
                  {loading ? 'Memuat data...' : 'Belum ada data untuk rentang waktu yang dipilih.'}
                </div>
              )}
            </div>
          </div>
        )}
      </Container>
      {activeUi.downloadButton && (
        <DataDownloadModal
          show={showDownloadModal}
          onHide={() => setShowDownloadModal(false)}
          data={filteredData}
          stationName={customTitle || 'Station 2'}
          availableFields={[
            'humidity',
            'temperature',
            'rainfall',
            'windspeed',
            'irradiation',
            'windDirection',
            'angle',
            'bmptemperature',
            'airpressure',
          ]}
        />
      )}
    </section>
  );
};

export default Station2;
