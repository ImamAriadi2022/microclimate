import { useEffect, useRef, useState } from 'react';
import { Button, ButtonGroup, Col, Container, Row, Table } from 'react-bootstrap';
import { PETENGORAN_TOPIC5_URL } from '../../config/apiEndpoints';
import {
  STATION_MODES,
  filterDataByModeRange,
  findLatestActiveRecord,
  generateSimulatedRawRecords,
  parseFlexibleDate,
  parseFlexibleTimestamp,
  toGaugePayload,
} from '../../utils/stationModeUtils';
import TrendChart from "./chart";

import AirPressureGauge from './status/AirPressure';
import HumidityGauge from './status/HumidityGauge';
import IrradiationGauge from './status/Irradiation';
import RainfallGauge from './status/Rainfall';
import TemperatureGauge from './status/TemperaturGauge';
import WindDirectionGauge from './status/WindDirection';
import WindSpeedGauge from './status/WindSpeed';

const API_URL = PETENGORAN_TOPIC5_URL;
const LOCAL_STORAGE_KEY = "station2_data";

const EMPTY_GAUGE_DATA = {
  humidity: 0,
  temperature: 0,
  airPressure: 0,
  windspeed: 0,
  rainfall: 0,
  irradiation: 0,
  windDirection: 0,
  temperature2: 0,
};

const PRIMARY_SENSOR_KEYS = ['humidity', 'temperature', 'rainfall', 'windspeed'];
const ALL_SENSOR_KEYS = [
  'humidity',
  'temperature',
  'airPressure',
  'windspeed',
  'rainfall',
  'irradiation',
  'windDirection',
  'temperature2',
];

const isValidValue = (val) =>
  val !== null &&
  val !== undefined &&
  val !== '' &&
  val !== 'error' &&
  val !== 'alat rusak' &&
  val !== 'server sedang eror' &&
  !isNaN(Number(val));

function mapApiData(item) {
  if (!item) return null;
  const ts = parseFlexibleTimestamp(item.timestamp);
  if (!ts) return null;
  return {
    timestamp: ts,
    humidity: isValidValue(item.humidity) ? Number(item.humidity) : null,
    temperature: isValidValue(item.temperature) ? Number(item.temperature) : null,
    airPressure: isValidValue(item.AirPressure ?? item.airPressure)
      ? Number(item.AirPressure ?? item.airPressure)
      : null,
    windspeed: isValidValue(item.windSpeed ?? item.windspeed)
      ? Number(item.windSpeed ?? item.windspeed)
      : null,
    rainfall: isValidValue(item.rainfall) ? Number(item.rainfall) : null,
    irradiation: isValidValue(item.pyrano ?? item.irradiation)
      ? Number(item.pyrano ?? item.irradiation)
      : null,
    windDirection: isValidValue(item.angle ?? item.windDirection)
      ? Number(item.angle ?? item.windDirection)
      : 0,
    temperature2: isValidValue(item.bmpTemperature ?? item.waterTemperature ?? item.temperature2)
      ? Number(item.bmpTemperature ?? item.waterTemperature ?? item.temperature2)
      : null,
  };
}

const formatUserFriendlyTimestamp = (timestamp) => {
  const date = parseFlexibleDate(timestamp);
  if (!date) return timestamp || '-';
  return date.toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'Asia/Jakarta',
  });
};

const Station2 = () => {
  const [filter, setFilter] = useState('1d');
  const [activeMode, setActiveMode] = useState(STATION_MODES.REALTIME);
  const [allData, setAllData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [serverError, setServerError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lastActiveTimestamp, setLastActiveTimestamp] = useState(null);
  const [lastActiveGaugeData, setLastActiveGaugeData] = useState(null);
  const [realtimeGaugeData, setRealtimeGaugeData] = useState(EMPTY_GAUGE_DATA);
  const [gaugeData, setGaugeData] = useState(EMPTY_GAUGE_DATA);
  const intervalRef = useRef(null);
  const cachedRealDataRef = useRef([]);

  const applyRealDataset = (rows) => {
    const validRows = (Array.isArray(rows) ? rows : [])
      .map(mapApiData)
      .filter((r) => r && parseFlexibleDate(r.timestamp) !== null)
      .sort((a, b) => parseFlexibleDate(b.timestamp) - parseFlexibleDate(a.timestamp));

    cachedRealDataRef.current = validRows;
    const latestActive = findLatestActiveRecord(validRows, PRIMARY_SENSOR_KEYS, ALL_SENSOR_KEYS);
    setLastActiveTimestamp(latestActive ? latestActive.timestamp : null);
    setLastActiveGaugeData(
      latestActive ? toGaugePayload(latestActive, EMPTY_GAUGE_DATA) : null
    );
    return validRows;
  };

  useEffect(() => {
    const local = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (local) {
      try {
        const parsed = JSON.parse(local);
        const validRows = applyRealDataset(parsed);
        setAllData(validRows);
        setServerError(false);
      } catch (_e) {
        setAllData([]);
      }
    }
    // eslint-disable-next-line
  }, []);

  const fetchRealData = async () => {
    setLoading(true);
    try {
      if (!API_URL) throw new Error('No API URL');
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const json = await response.json();
      const result = Array.isArray(json)
        ? json
        : Array.isArray(json?.result)
          ? json.result
          : [];
      const validRows = applyRealDataset(result);

      if (validRows.length > 0) {
        setAllData(validRows);
        setServerError(false);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(validRows));
      } else if (cachedRealDataRef.current.length === 0) {
        setAllData([]);
        setServerError(true);
      }
      setLoading(false);
    } catch (_error) {
      setLoading(false);
      if (cachedRealDataRef.current.length === 0) {
        setServerError(true);
      }
    }
  };

  useEffect(() => {
    if (activeMode === STATION_MODES.SIMULATION) {
      setServerError(false);
      setLoading(false);
      const simRows = generateSimulatedRawRecords({ filter, stationSeed: 2 })
        .map(mapApiData)
        .filter(Boolean);
      setAllData(simRows);
      return undefined;
    }

    fetchRealData();
    intervalRef.current = setInterval(fetchRealData, 10000);
    return () => clearInterval(intervalRef.current);
    // eslint-disable-next-line
  }, [activeMode, filter]);

  const handleModeChange = (nextMode) => {
    const resolvedMode =
      nextMode === STATION_MODES.SIMULATION && activeMode === STATION_MODES.SIMULATION
        ? STATION_MODES.REALTIME
        : nextMode;

    setActiveMode(resolvedMode);

    if (resolvedMode === STATION_MODES.SIMULATION) {
      setServerError(false);
      const simRows = generateSimulatedRawRecords({ filter, stationSeed: 2 })
        .map(mapApiData)
        .filter(Boolean);
      setAllData(simRows);
    } else if (cachedRealDataRef.current.length > 0) {
      setServerError(false);
      setAllData(cachedRealDataRef.current);
    }
  };

  useEffect(() => {
    if (serverError && activeMode !== STATION_MODES.SIMULATION) {
      setFilteredData([]);
      setRealtimeGaugeData(EMPTY_GAUGE_DATA);
      return;
    }

    const filtered = filterDataByModeRange(allData, {
      filter,
      mode: activeMode,
      lastActiveTimestamp,
    });
    const sorted = [...filtered].sort(
      (a, b) => parseFlexibleDate(b.timestamp) - parseFlexibleDate(a.timestamp)
    );
    setFilteredData(sorted);

    const latestWindowRecord = findLatestActiveRecord(sorted, PRIMARY_SENSOR_KEYS, ALL_SENSOR_KEYS);
    const windowGauge = latestWindowRecord
      ? toGaugePayload(latestWindowRecord, EMPTY_GAUGE_DATA)
      : EMPTY_GAUGE_DATA;
    setRealtimeGaugeData(windowGauge);
  }, [allData, filter, serverError, activeMode, lastActiveTimestamp]);

  useEffect(() => {
    if (activeMode === STATION_MODES.LAST_ACTIVE && lastActiveGaugeData) {
      setGaugeData(lastActiveGaugeData);
      return;
    }
    setGaugeData(realtimeGaugeData);
  }, [activeMode, lastActiveGaugeData, realtimeGaugeData]);

  const modeLabel =
    activeMode === STATION_MODES.SIMULATION
      ? 'Simulasi'
      : activeMode === STATION_MODES.LAST_ACTIVE
        ? 'Terakhir Aktif'
        : 'Realtime';

  const modeBadgeMod =
    activeMode === STATION_MODES.SIMULATION
      ? 'mc-mode-badge--simulation'
      : activeMode === STATION_MODES.LAST_ACTIVE
        ? 'mc-mode-badge--last-active'
        : 'mc-mode-badge--realtime';

  return (
    <section className="mc-station-page">
      <Container>
        <div className="mc-station-header mb-4">
          <div>
            <span className="mc-station-header__eyebrow">Dashboard Stasiun Pemantauan</span>
            <h2 className="mc-station-header__title">Environment Status Station 2</h2>
            <p className="mc-station-header__subtitle">
              Data collected from Station 2 (Topic 5)
            </p>
          </div>

          <div className="mc-station-header__meta">
            <div className="mc-status-chip">
              <span className="text-muted">Terakhir data alat aktif:</span>{' '}
              <strong>
                {lastActiveTimestamp ? formatUserFriendlyTimestamp(lastActiveTimestamp) : 'Belum ada data aktif'}
              </strong>
            </div>
            <div className="mc-status-chip">
              <span className="text-muted">Sumber data:</span>{' '}
              <span className={`mc-mode-badge ${modeBadgeMod}`}>{modeLabel}</span>
            </div>
          </div>
        </div>

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
            <button
              type="button"
              className={`btn btn-sm ${activeMode === STATION_MODES.SIMULATION ? 'btn-warning' : 'btn-outline-warning'}`}
              onClick={() => handleModeChange(STATION_MODES.SIMULATION)}
            >
              Mode Simulasi {activeMode === STATION_MODES.SIMULATION ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>

        {loading && activeMode !== STATION_MODES.SIMULATION && (
          <div className="alert alert-info py-2 px-3 mb-4 small fw-semibold">
            Loading data dari API...
          </div>
        )}

        <Row className="g-3 mb-4">
          <Col xs={12} sm={6} lg={3}>
            <div className="mc-sensor-card">
              <div className="mc-sensor-card__header">
                <h5 className="mc-sensor-card__title">Humidity</h5>
                <span className="mc-sensor-card__unit-tag">%</span>
              </div>
              <HumidityGauge humidity={typeof gaugeData.humidity === 'number' ? gaugeData.humidity : 0} />
              <p className="mc-sensor-card__value">{typeof gaugeData.humidity === 'number' ? `${gaugeData.humidity}%` : '-'}</p>
            </div>
          </Col>
          <Col xs={12} sm={6} lg={3}>
            <div className="mc-sensor-card">
              <div className="mc-sensor-card__header">
                <h5 className="mc-sensor-card__title">Temperature</h5>
                <span className="mc-sensor-card__unit-tag">°C</span>
              </div>
              <TemperatureGauge temperature={typeof gaugeData.temperature === 'number' ? gaugeData.temperature : 0} />
              <p className="mc-sensor-card__value">{typeof gaugeData.temperature === 'number' ? `${gaugeData.temperature}°C` : '-'}</p>
            </div>
          </Col>
          <Col xs={12} sm={6} lg={3}>
            <div className="mc-sensor-card">
              <div className="mc-sensor-card__header">
                <h5 className="mc-sensor-card__title">Air Pressure</h5>
                <span className="mc-sensor-card__unit-tag">hPa</span>
              </div>
              <AirPressureGauge airPressure={typeof gaugeData.airPressure === 'number' ? gaugeData.airPressure : 0} />
              <p className="mc-sensor-card__value">{typeof gaugeData.airPressure === 'number' ? `${gaugeData.airPressure} hPa` : '-'}</p>
            </div>
          </Col>
          <Col xs={12} sm={6} lg={3}>
            <div className="mc-sensor-card">
              <div className="mc-sensor-card__header">
                <h5 className="mc-sensor-card__title">Windspeed</h5>
                <span className="mc-sensor-card__unit-tag">km/h</span>
              </div>
              <WindSpeedGauge windspeed={typeof gaugeData.windspeed === 'number' ? gaugeData.windspeed : 0} />
              <p className="mc-sensor-card__value">{typeof gaugeData.windspeed === 'number' ? `${gaugeData.windspeed} km/h` : '-'}</p>
            </div>
          </Col>
          <Col xs={12} sm={6} lg={3}>
            <div className="mc-sensor-card">
              <div className="mc-sensor-card__header">
                <h5 className="mc-sensor-card__title">Rainfall</h5>
                <span className="mc-sensor-card__unit-tag">mm</span>
              </div>
              <RainfallGauge rainfall={typeof gaugeData.rainfall === 'number' ? gaugeData.rainfall : 0} />
              <p className="mc-sensor-card__value">{typeof gaugeData.rainfall === 'number' ? `${gaugeData.rainfall} mm` : '-'}</p>
            </div>
          </Col>
          <Col xs={12} sm={6} lg={3}>
            <div className="mc-sensor-card">
              <div className="mc-sensor-card__header">
                <h5 className="mc-sensor-card__title">Irradiation</h5>
                <span className="mc-sensor-card__unit-tag">W/m²</span>
              </div>
              <IrradiationGauge irradiation={typeof gaugeData.irradiation === 'number' ? gaugeData.irradiation : 0} />
              <p className="mc-sensor-card__value">{typeof gaugeData.irradiation === 'number' ? `${gaugeData.irradiation} W/m²` : '-'}</p>
            </div>
          </Col>
          <Col xs={12} sm={6} lg={3}>
            <div className="mc-sensor-card">
              <div className="mc-sensor-card__header">
                <h5 className="mc-sensor-card__title">Wind Direction</h5>
                <span className="mc-sensor-card__unit-tag">°</span>
              </div>
              <WindDirectionGauge windDirection={typeof gaugeData.windDirection === 'number' ? gaugeData.windDirection : 0} />
              <p className="mc-sensor-card__value">{typeof gaugeData.windDirection === 'number' ? `${gaugeData.windDirection}°` : '-'}</p>
            </div>
          </Col>
          <Col xs={12} sm={6} lg={3}>
            <div className="mc-sensor-card">
              <div className="mc-sensor-card__header">
                <h5 className="mc-sensor-card__title">Water Temperature</h5>
                <span className="mc-sensor-card__unit-tag">°C</span>
              </div>
              <TemperatureGauge temperature={typeof gaugeData.temperature2 === 'number' ? gaugeData.temperature2 : 0} />
              <p className="mc-sensor-card__value">{typeof gaugeData.temperature2 === 'number' ? `${gaugeData.temperature2}°C` : '-'}</p>
            </div>
          </Col>
        </Row>

        <div className="mc-section-card mb-4">
          <div className="mc-section-card__header">
            <div>
              <h4 className="mc-section-card__title">Chart Status</h4>
              <p className="mc-section-card__subtitle">
                Tren perubahan parameter lingkungan berdasarkan rentang waktu
              </p>
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
          {serverError && activeMode !== STATION_MODES.SIMULATION ? (
            <div className="mc-empty-state text-danger">
              Server sedang eror
            </div>
          ) : filteredData.length === 0 ? (
            <div className="mc-empty-state">
              Tidak ada data untuk filter ini
            </div>
          ) : (
            <TrendChart
              data={filteredData}
              fields={[
                { key: 'humidity', label: 'Humidity (%)' },
                { key: 'temperature', label: 'Temperature (°C)' },
                { key: 'airPressure', label: 'Air Pressure (hPa)' },
                { key: 'windspeed', label: 'Windspeed (km/h)' },
                { key: 'rainfall', label: 'Rainfall (mm)' },
                { key: 'irradiation', label: 'Irradiation (W/m²)' },
                { key: 'windDirection', label: 'Wind Direction (°)' },
                { key: 'temperature2', label: 'Water Temperature (°C)' },
              ]}
            />
          )}
        </div>

        <div className="mc-section-card">
          <div className="mc-section-card__header">
            <div>
              <h4 className="mc-section-card__title">Table Status</h4>
              <p className="mc-section-card__subtitle">10 rekaman pembacaan terbaru pada rentang terpilih</p>
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            {serverError && activeMode !== STATION_MODES.SIMULATION ? (
              <div className="mc-empty-state text-danger">
                Server sedang eror
              </div>
            ) : filteredData.length > 0 ? (
              <Table hover responsive className="mc-data-table mb-0">
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
                  {filteredData.slice(0, 10).map((item, index) => (
                    <tr key={index}>
                      <td>{formatUserFriendlyTimestamp(item.timestamp)}</td>
                      <td>{item.humidity ?? '-'}</td>
                      <td>{item.temperature ?? '-'}</td>
                      <td>{item.airPressure ?? '-'}</td>
                      <td>{item.rainfall ?? '-'}</td>
                      <td>{item.irradiation ?? '-'}</td>
                      <td>{item.windspeed ?? '-'}</td>
                      <td>{item.windDirection ?? '-'}</td>
                      <td>{item.temperature2 ?? '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            ) : (
              <div className="mc-empty-state">No data available for the selected filter</div>
            )}
          </div>
        </div>
      </Container>
    </section>
  );
};

export default Station2;
