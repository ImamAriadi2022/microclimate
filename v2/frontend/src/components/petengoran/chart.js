import { useState } from "react";
import { Button, ButtonGroup, Col, Modal, Row } from "react-bootstrap";
import {
    Brush,
    CartesianGrid,
    Legend,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from "recharts";
import { parseFlexibleDate } from "../../utils/stationModeUtils";

export function resampleTimeSeriesWithMeanFill(data, intervalMinutes, fields) {
  if (!Array.isArray(data) || data.length === 0) return [];

  const sorted = [...data]
    .filter((item) => item?.timestamp)
    .map((item) => ({ ...item, _date: parseFlexibleDate(item.timestamp) }))
    .filter((item) => item._date !== null)
    .sort((a, b) => a._date - b._date);

  if (sorted.length === 0) return [];

  const intervalMs = intervalMinutes * 60 * 1000;
  const buckets = new Map();

  sorted.forEach((item) => {
    const bucketTs = Math.floor(item._date.getTime() / intervalMs) * intervalMs;
    if (!buckets.has(bucketTs)) {
      buckets.set(bucketTs, []);
    }
    buckets.get(bucketTs).push(item);
  });

  return Array.from(buckets.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([bucketTs, items]) => {
      const resampled = { timestamp: new Date(bucketTs).toISOString() };

      const latestWithDirection = [...items]
        .reverse()
        .find(
          (it) =>
            typeof it.windDirection === "string" &&
            it.windDirection.trim() !== "" &&
            it.windDirection !== "error" &&
            it.windDirection !== "alat rusak"
        );
      if (latestWithDirection) {
        resampled.windDirection = latestWithDirection.windDirection;
      }

      fields.forEach((field) => {
        if (field === "windDirection") {
          const strVal = [...items]
            .reverse()
            .map((it) => it.windDirection)
            .find(
              (val) =>
                typeof val === "string" &&
                val.trim() !== "" &&
                val !== "error" &&
                val !== "alat rusak"
            );
          if (strVal !== undefined) {
            resampled.windDirection = strVal;
            return;
          }
        }

        const numericValues = items
          .map((it) =>
            typeof it[field] === "number"
              ? it[field]
              : it[field] !== null &&
                  it[field] !== undefined &&
                  it[field] !== "" &&
                  it[field] !== "error" &&
                  it[field] !== "alat rusak"
                ? Number(it[field])
                : NaN
          )
          .filter((val) => Number.isFinite(val));

        if (numericValues.length === 0) {
          resampled[field] = null;
          return;
        }

        const mean = numericValues.reduce((sum, val) => sum + val, 0) / numericValues.length;
        resampled[field] = Number(mean.toFixed(2));
      });

      return resampled;
    });
}

const formatXAxis = (tick) => {
  if (!tick) return '';
  const d = new Date(tick);
  return `${d.getDate()}/${d.getMonth() + 1} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
};

const TrendChart = ({ data, fields }) => {
  const [showDetail, setShowDetail] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState(null);
  const [interval, setInterval] = useState(15); // 15 or 30

  const modalData = (() => {
    if (!selectedMetric) return [];
    return resampleTimeSeriesWithMeanFill(data, interval, [selectedMetric]);
  })();

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
              <h5 className="mc-chart-item-card__title">
                {field.label}
              </h5>
              {/* Chart default: resample per 4 jam */}
              <ResponsiveContainer width="100%" height={260}>
                <LineChart
                  data={resampleTimeSeriesWithMeanFill(data, 240, [field.key])}
                  margin={{ top: 12, right: 18, left: 4, bottom: 16 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e9eff2" />
                  <XAxis
                    dataKey="timestamp"
                    tickFormatter={(tick) => {
                      const d = new Date(tick);
                      return `${d.getDate()}/${d.getMonth() + 1} ${d.getHours()}:00`;
                    }}
                    interval="preserveStartEnd"
                    tickCount={6}
                    angle={-20}
                    textAnchor="end"
                    height={40}
                    tick={{ fontSize: 11, fill: '#5a7066' }}
                  />
                  <YAxis
                    domain={['dataMin - 5', 'dataMax + 10']}
                    tickCount={6}
                    tick={{ fontSize: 11, fill: '#5a7066' }}
                  />
                  <Tooltip labelFormatter={formatXAxis} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Line
                    type="monotone"
                    dataKey={field.key}
                    stroke="#0f9b63"
                    dot={false}
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Col>
        ))}
      </Row>

      {/* Modal untuk Detail Chart */}
      <Modal
        show={showDetail}
        onHide={() => setShowDetail(false)}
        size="xl"
        centered
        scrollable
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {selectedMetric
              ? fields.find((f) => f.key === selectedMetric)?.label
              : "Detail Chart"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="d-flex flex-wrap gap-2 mb-3">
            <ButtonGroup>
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
          </div>
          <div style={{ width: "100%", overflowX: "auto" }}>
            <ResponsiveContainer width={900} height={400}>
              <LineChart data={modalData} margin={{ top: 20, right: 20, left: 10, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={(tick) => {
                    const d = new Date(tick);
                    return `${d.getDate()}/${d.getMonth() + 1}\n${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
                  }}
                  interval="preserveStartEnd"
                  tickCount={7}
                  angle={0}
                  textAnchor="middle"
                  height={40}
                  style={{ fontSize: 12 }}
                />
                <YAxis
                  domain={['auto', 'auto']}
                  tickCount={6}
                  allowDecimals={true}
                  style={{ fontSize: 12 }}
                />
                <Tooltip labelFormatter={formatXAxis} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey={selectedMetric}
                  stroke="#007bff"
                  dot={false}
                  strokeWidth={2}
                />
                <Brush
                  dataKey="timestamp"
                  height={25}
                  stroke="#007bff"
                  travellerWidth={8}
                  tickFormatter={(tick) => {
                    const d = new Date(tick);
                    return `${d.getDate()}/${d.getMonth() + 1}`;
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
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
