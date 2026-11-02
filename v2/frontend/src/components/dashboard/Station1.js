import { useEffect, useRef, useState } from 'react';
import { Button, ButtonGroup, Col, Container, Row, Table } from 'react-bootstrap';
import { PETENGORAN_TOPIC4_URL } from '../../config/apiEndpoints';
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
import RainfallGauge from './status/Rainfall';
import TemperatureGauge from './status/TemperaturGauge';
import WaterTemperatureGauge from './status/WaterTemperature';
import WindDirectionGauge from './status/WindDirection';
import WindSpeedGauge from './status/WindSpeed';

const FIELD_CONFIG = [
  { key: 'humidity', label: 'Humidity', unit: '%', gauge: HumidityGauge },
  { key: 'temperature', label: 'Temperature', unit: '°C', gauge: TemperatureGauge },
  { key: 'airPressure', label: 'Air Pressure', unit: 'hPa', gauge: AirPressureGauge },
  { key: 'windspeed', label: 'Windspeed', unit: 'km/h', gauge: WindSpeedGauge },
  { key: 'rainfall', label: 'Rainfall', unit: 'mm', gauge: RainfallGauge },
  { key: 'windDirection', label: 'Wind Direction', unit: '°', gauge: WindDirectionGauge },
  { key: 'waterTemperature', label: 'Water Temperature', unit: '°C', gauge: WaterTemperatureGauge },
];

const EMPTY_GAUGE_DATA = {
  humidity: 0,
  temperature: 0,
  airPressure: 0,
  windspeed: 0,
  rainfall: 0,
  windDirection: 0,
  waterTemperature: 0,
};

const PRIMARY_SENSOR_KEYS = ['humidity', 'temperature', 'rainfall', 'windspeed'];
const ALL_SENSOR_KEYS = FIELD_CONFIG.map((f) => f.key);

const API_URL = PETENGORAN_TOPIC4_URL;
const LOCAL_STORAGE_KEY = "station1_data";

const isValidValue = (val) =>
  val !== null && val !== undefined && val !== '' && val !== 'error' && val !== 'alat rusak' && !isNaN(Number(val));

function mapApiData(apiItem) {
  if (!apiItem) return null;
  const ts = parseFlexibleTimestamp(apiItem.timestamp);
  if (!ts) return null;
  return {
    timestamp: ts,
    humidity: isValidValue(apiItem.humidity) ? Number(apiItem.humidity) : null,
    temperature: isValidValue(apiItem.temperature) ? Number(apiItem.temperature) : null,
    airPressure: isValidValue(apiItem.AirPressure ?? apiItem.airPressure)
      ? Number(apiItem.AirPressure ?? apiItem.airPressure)
      : null,
    windspeed: isValidValue(apiItem.windSpeed ?? apiItem.windspeed)
      ? Number(apiItem.windSpeed ?? apiItem.windspeed)
      : null,
    rainfall: isValidValue(apiItem.rainfall) ? Number(apiItem.rainfall) : null,
    windDirection: isValidValue(apiItem.angle ?? apiItem.windDirection)
      ? Number(apiItem.angle ?? apiItem.windDirection)
      : 0,
    waterTemperature: isValidValue(apiItem.suhuAir ?? apiItem.waterTemperature)
      ? Number(apiItem.suhuAir ?? apiItem.waterTemperature)
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

const Station1 = () => {
  const [filter, setFilter] = useState('1d');
  const [activeMode, setActiveMode] = useState(STATION_MODES.REALTIME);
  const [allData, setAllData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [lastActiveTimestamp, setLastActiveTimestamp] = useState(null);
  const [lastActiveGaugeData, setLastActiveGaugeData] = useState(null);
  const [realtimeGaugeData, setRealtimeGaugeData] = useState(EMPTY_GAUGE_DATA);
  const [gaugeData, setGaugeData] = useState(EMPTY_GAUGE_DATA);
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
      } catch (_e) {
        setAllData([]);
      }
    }
    // eslint-disable-next-line
  }, []);

  const fetchRealData = async () => {
    try {
      if (!API_URL) return;
      const response = await fetch(API_URL);
      if (!response.ok) return;
      const json = await response.json();
      const result = Array.isArray(json)
        ? json
        : Array.isArray(json?.result)
          ? json.result
          : [];

      let local = [];
      try {
        local = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY)) || [];
      } catch (_e) {
        local = [];
      }

      const timestamps = new Set(local.map((item) => item.timestamp));
      const combined = [...local];
      result.forEach((item) => {
        const mappedItem = mapApiData(item);
        if (mappedItem && !timestamps.has(mappedItem.timestamp)) {
          combined.push(mappedItem);
          timestamps.add(mappedItem.timestamp);
        }
      });

      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(combined));
      const validRows = applyRealDataset(combined);
      setAllData((prev) => (activeMode === STATION_MODES.SIMULATION ? prev : validRows));
    } catch (_error) {
      // Keep local data if network fails
    }
  };

  useEffect(() => {
    if (activeMode === STATION_MODES.SIMULATION) {
      const simRows = generateSimulatedRawRecords({ filter, stationSeed: 1 })
        .map(mapApiData)
        .filter(Boolean);
      setAllData(simRows);
      return undefined;
    }

    fetchRealData();
    const interval = setInterval(fetchRealData, 10000);
    return () => clearInterval(interval);
    // eslint-disable-next-line
  }, [activeMode, filter]);

  const handleModeChange = (nextMode) => {
    const resolvedMode =
      nextMode === STATION_MODES.SIMULATION && activeMode === STATION_MODES.SIMULATION
        ? STATION_MODES.REALTIME
        : nextMode;

    setActiveMode(resolvedMode);

    if (resolvedMode === STATION_MODES.SIMULATION) {
      const simRows = generateSimulatedRawRecords({ filter, stationSeed: 1 })
        .map(mapApiData)
        .filter(Boolean);
      setAllData(simRows);
    } else if (cachedRealDataRef.current.length > 0) {
      setAllData(cachedRealDataRef.current);
    }
  };

  useEffect(() => {
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
  }, [allData, filter, activeMode, lastActiveTimestamp]);

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
            <h2 className="mc-station-header__title">Environment Status</h2>
            <p className="mc-station-header__subtitle">
              Data collected from Station 1
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

        <Row className="g-3 mb-4">
          {FIELD_CONFIG.map((field) => {
            const GaugeComponent = field.gauge;
            const value = typeof gaugeData[field.key] === 'number' ? gaugeData[field.key] : 0;
            return (
              <Col xs={12} sm={6} lg={3} key={field.key}>
                <div className="mc-sensor-card">
                  <div className="mc-sensor-card__header">
                    <h5 className="mc-sensor-card__title">{field.label}</h5>
                    <span className="mc-sensor-card__unit-tag">{field.unit}</span>
                  </div>
                  <GaugeComponent {...{ [field.key]: value }} />
                  <p className="mc-sensor-card__value">{`${value}${field.unit}`}</p>
                </div>
              </Col>
            );
          })}
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
          <TrendChart data={filteredData} />
        </div>

        <div className="mc-section-card mb-4">
          <div className="mc-section-card__header">
            <div>
              <h4 className="mc-section-card__title">Location</h4>
              <p className="mc-section-card__subtitle">Lokasi geografis penempatan sensor Station 1</p>
            </div>
          </div>
          <iframe
            title="Location map of Station 1"
            src="https://www.google.com/maps/embed?pb=!4v1742927582633!6m8!1m7!1semWwMLjxPNBvkFSf0-d_fQ!2m2!1d-5.570831564383814!2d105.240617222604!3f101.32!4f28.680000000000007!5f0.42518105702959824"
            className="station-map"
            allowFullScreen=""
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>

        <div className="mc-section-card">
          <div className="mc-section-card__header">
            <div>
              <h4 className="mc-section-card__title">Table Status</h4>
              <p className="mc-section-card__subtitle">10 rekaman pembacaan terbaru pada rentang terpilih</p>
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            {filteredData.length > 0 ? (
              <Table hover responsive className="mc-data-table mb-0">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    {FIELD_CONFIG.map((field) => (
                      <th key={field.key}>{field.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredData.slice(0, 10).map((item, index) => (
                    <tr key={index}>
                      <td>{formatUserFriendlyTimestamp(item.timestamp)}</td>
                      {FIELD_CONFIG.map((field) => (
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
              <div className="mc-empty-state">No data available for the selected filter</div>
            )}
          </div>
        </div>
      </Container>
    </section>
  );
};

export default Station1;
