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
import { parseFlexibleDate } from "../../utils/stationModeUtils";

const DEFAULT_FIELD_CONFIG = [
  { key: 'humidity', label: 'Humidity (%)' },
  { key: 'temperature', label: 'Temperature (°C)' },
  { key: 'airPressure', label: 'Air Pressure (hPa)' },
  { key: 'windspeed', label: 'Windspeed (km/h)' },
  { key: 'rainfall', label: 'Rainfall (mm)' },
  { key: 'windDirection', label: 'Wind Direction (°)' },
  { key: 'waterTemperature', label: 'Water Temperature (°C)' },
];

const TrendChart = ({ data = [], fields = DEFAULT_FIELD_CONFIG }) => {
  const [showDetail, setShowDetail] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState(fields[0]?.key || 'humidity');
  const [interval, setInterval] = useState(15);

  const mainChartData = (Array.isArray(data) ? data : [])
    .map((item) => {
      const parsedDate = parseFlexibleDate(item?.timestamp);
      if (!parsedDate) return null;
      return { ...item, timestamp: parsedDate.getTime() };
    })
    .filter(Boolean)
    .sort((a, b) => a.timestamp - b.timestamp);

  const filterDataByInterval = (intervalMinutes) => {
    const filtered = [];
    let last = null;
    for (let i = 0; i < mainChartData.length; i += 1) {
      const currentTs = mainChartData[i].timestamp;
      if (!currentTs || Number.isNaN(currentTs)) continue;
      if (!last || currentTs - last >= intervalMinutes * 60 * 1000) {
        filtered.push(mainChartData[i]);
        last = currentTs;
      }
    }
    if (filtered.length === 0 && mainChartData.length > 0) {
      filtered.push(mainChartData[0]);
    }
    return filtered;
  };

  const getXAxisDomain = (filtered) => {
    if (filtered.length < 2) return ["auto", "auto"];
    const times = filtered.map((d) => d.timestamp).filter((t) => t && !Number.isNaN(t));
    if (!times.length) return ["auto", "auto"];
    return [Math.min(...times), Math.max(...times)];
  };

  return (
    <>
      <Row className="g-3">
        {fields.map((field) => (
          <Col md={4} key={field.key}>
            <div
              className="mc-chart-item-card"
              onClick={() => {
                setSelectedMetric(field.key);
                setShowDetail(true);
              }}
            >
              <h6 className="mc-chart-item-card__title">
                {field.label}
              </h6>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart
                  data={mainChartData}
                  margin={{ top: 12, right: 18, left: 4, bottom: 16 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e9eff2" />
                  <XAxis
                    dataKey="timestamp"
                    type="number"
                    domain={getXAxisDomain(mainChartData)}
                    tickFormatter={(tick) =>
                      !tick || Number.isNaN(tick)
                        ? ""
                        : new Date(tick).toLocaleDateString("id-ID", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                    }
                    tick={{ fontSize: 11, fill: '#5a7066' }}
                  />
                  <YAxis
                    domain={['dataMin - 5', 'dataMax + 10']}
                    tickCount={6}
                    tick={{ fontSize: 11, fill: '#5a7066' }}
                  />
                  <Tooltip
                    labelFormatter={(label) =>
                      !label || Number.isNaN(label)
                        ? ""
                        : new Date(label).toLocaleString("id-ID")
                    }
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Line
                    type="monotone"
                    dataKey={field.key}
                    stroke="#0f9b63"
                    dot={false}
                    activeDot={{ r: 5 }}
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Col>
        ))}
      </Row>

      <Modal show={showDetail} onHide={() => setShowDetail(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>
            {fields.find((f) => f.key === selectedMetric)?.label || "Detail"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <ButtonGroup className="mb-3">
            <Button
              variant={interval === 15 ? "primary" : "outline-primary"}
              onClick={() => setInterval(15)}
            >
              15 Menit
            </Button>
            <Button
              variant={interval === 30 ? "primary" : "outline-primary"}
              onClick={() => setInterval(30)}
            >
              30 Menit
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
                  !tick || Number.isNaN(tick)
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
                  !label || Number.isNaN(label)
                    ? ""
                    : new Date(label).toLocaleString("id-ID")
                }
              />
              <Legend />
              <Line
                type="monotone"
                dataKey={selectedMetric}
                stroke="#007bff"
                dot={false}
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
