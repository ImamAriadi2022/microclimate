import { useState } from "react";
import { Button, ButtonGroup, Col, Modal, Row } from "react-bootstrap";
import {
    CartesianGrid,
    Legend,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

// Field config harus sama urutan & key-nya dengan Station1.js
const FIELD_CONFIG = [
  { key: 'humidity', label: 'Humidity (%)' },
  { key: 'temperature', label: 'Temperature (°C)' },
  { key: 'airPressure', label: 'Air Pressure (hPa)' },
  { key: 'windspeed', label: 'Windspeed (km/h)' },
  { key: 'rainfall', label: 'Rainfall (mm)' },
  { key: 'windDirection', label: 'Wind Direction (°)' },
  { key: 'waterTemperature', label: 'Water Temperature (°C)' },
];

// Fungsi parsing tanggal custom (format: DD-MM-YY HH:mm:ss)
function parseCustomDate(str) {
  if (!str) return NaN;
  const [datePart, timePart] = str.split(' ');
  if (!datePart || !timePart) return NaN;
  const [day, month, year] = datePart.split('-');
  if (!day || !month || !year) return NaN;
  const fullYear = Number(year) < 100 ? 2000 + Number(year) : Number(year);
  const mm = month.padStart(2, '0');
  const dd = day.padStart(2, '0');
  return new Date(`${fullYear}-${mm}-${dd}T${timePart}`).getTime();
}

const TrendChart = ({ data, filter = '1d' }) => {
  const [showDetail, setShowDetail] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState(FIELD_CONFIG[0].key);
  const [interval, setInterval] = useState(15);

  // Pastikan hanya data dengan timestamp valid yang diproses
  const parsedData = data
    .map((item) => {
      const t = typeof item.timestamp === "number" ? item.timestamp : parseCustomDate(item.timestamp);
      if (isNaN(t)) return null;
      return { ...item, timestamp: t };
    })
    .filter(Boolean);

  console.log("TrendChart received data:", data);
  console.log("TrendChart parsedData:", parsedData);

  // Filter data sesuai filter dari props
  const filterDataByRange = () => {
    if (!parsedData.length) return [];
    const now = Date.now();
    let start = now;
    if (filter === '1d') {
      const d = new Date(now);
      d.setHours(0, 0, 0, 0);
      start = d.getTime();
    } else if (filter === '7d') {
      start = now - 7 * 24 * 60 * 60 * 1000;
    } else if (filter === '1m') {
      const d = new Date(now);
      d.setMonth(d.getMonth() - 1);
      start = d.getTime();
    }
    const filtered = parsedData.filter(item => item.timestamp >= start && item.timestamp <= now);
    console.log(`TrendChart mainChartData for filter "${filter}":`, filtered);
    return filtered;
  };

  // Data untuk chart utama (sesuai filter)
  const mainChartData = filterDataByRange();

  // Untuk modal detail, gunakan interval
  const filterDataByInterval = (intervalMinutes) => {
    const filtered = [];
    let last = null;
    for (let i = 0; i < mainChartData.length; i++) {
      const now = mainChartData[i].timestamp;
      if (!now || isNaN(now)) continue;
      if (!last || now - last >= intervalMinutes * 60 * 1000) {
        filtered.push(mainChartData[i]);
        last = now;
      }
    }
    // Jika hasil kosong, tampilkan minimal 1 data
    if (filtered.length === 0 && mainChartData.length > 0) {
      filtered.push(mainChartData[0]);
    }
    console.log(`TrendChart filterDataByInterval (${intervalMinutes} min):`, filtered);
    return filtered;
  };

  // Hitung domain waktu X
  const getXAxisDomain = (filtered) => {
    if (filtered.length < 2) return ["auto", "auto"];
    const times = filtered.map((d) => d.timestamp).filter((t) => t && !isNaN(t));
    if (!times.length) return ["auto", "auto"];
    const min = Math.min(...times);
    const max = Math.max(...times);
    return [min, max];
  };

  return (
    <>
      <Row>
        {FIELD_CONFIG.map((field) => (
          <Col md={4} key={field.key} className="mb-4">
            <div
              style={{
                backgroundColor: "#fff",
                padding: "20px",
                borderRadius: "10px",
                boxShadow: "0 0 10px rgba(0,0,0,0.1)",
                cursor: "pointer",
              }}
              onClick={() => {
                setSelectedMetric(field.key);
                setShowDetail(true);
              }}
            >
              <h6 className="text-center" style={{ color: "#007bff" }}>
                {field.label}
              </h6>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart
                  data={mainChartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="timestamp"
                    type="number"
                    domain={getXAxisDomain(mainChartData)}
                    tickFormatter={(tick) =>
                      !tick || isNaN(tick)
                        ? ""
                        : new Date(tick).toLocaleDateString("id-ID", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                    }
                  />
                  <YAxis 
                    domain={['dataMin - 5', 'dataMax + 10']}
                    tickCount={6}
                  />
                  <Tooltip
                    labelFormatter={(label) =>
                      !label || isNaN(label)
                        ? ""
                        : new Date(label).toLocaleString("id-ID")
                    }
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey={field.key}
                    stroke="#007bff"
                    activeDot={{ r: 6 }}
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Col>
        ))}
      </Row>

      {/* Modal Detail Chart */}
      <Modal show={showDetail} onHide={() => setShowDetail(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>
            {FIELD_CONFIG.find(f => f.key === selectedMetric)?.label || "Detail"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <ButtonGroup className="mb-3">
            <Button
              variant={interval === 15 ? "primary" : "outline-primary"}
              onClick={() => setInterval(15)}
            >
              15 Minutes
            </Button>
            <Button
              variant={interval === 30 ? "primary" : "outline-primary"}
              onClick={() => setInterval(30)}
            >
              30 Minutes
            </Button>
          </ButtonGroup>

          <ResponsiveContainer width="100%" height={500}>
            <LineChart
              data={filterDataByInterval(interval)}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="timestamp"
                type="number"
                domain={getXAxisDomain(filterDataByInterval(interval))}
                tickFormatter={(tick) =>
                  !tick || isNaN(tick)
                    ? ""
                    : new Date(tick).toLocaleTimeString("id-ID", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                }
              />
              <YAxis
                domain={['dataMin - 5', 'dataMax + 10']}
                tickCount={8}
              />
              <Tooltip
                labelFormatter={(label) =>
                  !label || isNaN(label)
                    ? ""
                    : new Date(label).toLocaleString("id-ID")
                }
              />
              <Legend />
              <Line
                type="monotone"
                dataKey={selectedMetric}
                stroke="#007bff"
                activeDot={{ r: 6 }}
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetail(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default TrendChart;