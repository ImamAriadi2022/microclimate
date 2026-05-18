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



export function resampleTimeSeriesWithMeanFill(data, intervalMinutes, fields) {
  if (!Array.isArray(data) || data.length === 0) return [];

  const sorted = [...data]
    .filter((item) => item?.timestamp)
    .map((item) => ({ ...item, _date: new Date(item.timestamp) }))
    .filter((item) => !isNaN(item._date.getTime()))
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

      fields.forEach((field) => {
        const numericValues = items
          .map((it) => Number(it[field]))
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
  return `${d.getDate()}/${d.getMonth()+1} ${d.getHours()}:${String(d.getMinutes()).padStart(2,'0')}`;
};

const TrendChart = ({ data, fields }) => {
  const [showDetail, setShowDetail] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState(null);
  const [interval, setInterval] = useState(15); // 15 or 30


    // Resample and filter data for modal chart
    const modalData = (() => {
      if (!selectedMetric) return [];
      let resampled = resampleTimeSeriesWithMeanFill(data, interval, [selectedMetric]);
      return resampled;
    })();


  return (
    <>
      <Row>
        {fields.map((field) => (
          <Col md={4} className="mb-4" key={field.key}>
            <div
              style={{
                backgroundColor: "#ffffff",
                padding: "20px",
                borderRadius: "10px",
                boxShadow: "0 0 15px rgba(0, 0, 0, 0.1)",
                cursor: "pointer",
              }}
              onClick={() => {
                setSelectedMetric(field.key);
                setShowDetail(true);
              }}
            >
              <h5 style={{ color: "#007bff", textAlign: "center" }}>
                {field.label}
              </h5>
              {/* Chart default: resample per 4 jam */}
              <ResponsiveContainer width="100%" height={300}>
                <LineChart
                  data={resampleTimeSeriesWithMeanFill(data, 240, [field.key])}
                  margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="timestamp"
                    tickFormatter={tick => {
                      const d = new Date(tick);
                      return `${d.getDate()}/${d.getMonth()+1} ${d.getHours()}:00`;
                    }}
                    interval="preserveStartEnd"
                    tickCount={6}
                    angle={-20}
                    textAnchor="end"
                    height={40}
                  />
                  <YAxis domain={['dataMin - 5', 'dataMax + 10']} tickCount={6} />
                  <Tooltip labelFormatter={formatXAxis} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey={field.key}
                    stroke="#007bff"
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
                          tickFormatter={tick => {
                            const d = new Date(tick);
                            return `${d.getDate()}/${d.getMonth()+1}\n${d.getHours()}:${String(d.getMinutes()).padStart(2,'0')}`;
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
                          tickFormatter={tick => {
                            const d = new Date(tick);
                            return `${d.getDate()}/${d.getMonth()+1}`;
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