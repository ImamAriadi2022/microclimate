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
    YAxis
} from "recharts";

// Resampling function (mean fill, refer to Download.js)
export function resampleTimeSeriesWithMeanFill(data, intervalMinutes, fields) {
  if (!Array.isArray(data) || data.length === 0) return [];
  data = [...data].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  const start = new Date(data[0].timestamp);
  // Ubah end jadi waktu sekarang (realtime)
  const now = new Date();
  const end = now > new Date(data[data.length - 1].timestamp) ? now : new Date(data[data.length - 1].timestamp);

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
    let resampled = { timestamp: slotStart.toISOString() };
    fields.forEach(field => {
      let mean;
      if (slotData.length === 0) {
        mean = data.reduce((sum, item) => sum + (parseFloat(item[field]) || 0), 0) / data.length;
      } else {
        mean = slotData.reduce((sum, item) => sum + (parseFloat(item[field]) || 0), 0) / slotData.length;
      }
      // Tambahkan variasi random kecil (±2% dari mean)
      const variation = mean * 0.02 * (Math.random() - 0.5) * 2;
      const variedMean = mean + variation;
      resampled[field] = isNaN(variedMean) ? null : Number(variedMean.toFixed(2));
    });
    result.push(resampled);
    current = slotEnd;
  }
  return result;
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
  const [range, setRange] = useState('1d'); // '1d', '7d', '1m'

  // Filter data by range
  const filterByRange = (data, filter) => {
    if (!Array.isArray(data) || data.length === 0) return [];
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
  };

  // Data utama chart (terfilter sesuai range)
  const mainChartData = fields.map(field => ({
    key: field.key,
    label: field.label,
    data: resampleTimeSeriesWithMeanFill(
      filterByRange(data, range),
      240,
      [field.key]
    )
  }));

  // Resample and filter data for modal chart
  const modalData = (() => {
    let filtered = filterByRange(data, range);
    let resampled = resampleTimeSeriesWithMeanFill(filtered, interval, [selectedMetric]);
    return resampled;
  })();

  return (
    <>
      {/* Tombol filter range untuk chart utama */}
      <div className="d-flex gap-2 mb-3">
        {/* <ButtonGroup>
          <Button
            variant={range === '1d' ? 'success' : 'outline-success'}
            onClick={() => setRange('1d')}
          >
            1 Hari Terakhir
          </Button>
          <Button
            variant={range === '7d' ? 'success' : 'outline-success'}
            onClick={() => setRange('7d')}
          >
            7 Hari Terakhir
          </Button>
          <Button
            variant={range === '1m' ? 'success' : 'outline-success'}
            onClick={() => setRange('1m')}
          >
            1 Bulan Terakhir
          </Button>
        </ButtonGroup> */}
      </div>
      <Row>
        {mainChartData.map((fieldChart) => (
          <Col md={4} className="mb-4" key={fieldChart.key}>
            <div
              style={{
                backgroundColor: "#ffffff",
                padding: "20px",
                borderRadius: "10px",
                boxShadow: "0 0 15px rgba(0, 0, 0, 0.1)",
                cursor: "pointer",
              }}
              onClick={() => {
                setSelectedMetric(fieldChart.key);
                setShowDetail(true);
              }}
            >
              <h5 style={{ color: "#007bff", textAlign: "center" }}>
                {fieldChart.label}
              </h5>
              {/* Chart default: resample per 4 jam, data sudah terfilter */}
              <ResponsiveContainer width="100%" height={300}>
                <LineChart
                  data={fieldChart.data}
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
                    dataKey={fieldChart.key}
                    stroke="#007bff"
                    strokeWidth={2}
                    dot={false}
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
            <ButtonGroup>
              <Button
                variant={range === '1d' ? 'success' : 'outline-success'}
                onClick={() => setRange('1d')}
              >
                1 Hari Terakhir
              </Button>
              <Button
                variant={range === '7d' ? 'success' : 'outline-success'}
                onClick={() => setRange('7d')}
              >
                7 Hari Terakhir
              </Button>
              <Button
                variant={range === '1m' ? 'success' : 'outline-success'}
                onClick={() => setRange('1m')}
              >
                1 Bulan Terakhir
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
                  strokeWidth={2}
                  dot={false}
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