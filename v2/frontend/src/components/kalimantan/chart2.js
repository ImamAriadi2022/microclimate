import { useState } from "react";
import { Button, ButtonGroup, Col, Modal, Row } from "react-bootstrap";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const TrendChart = ({ data }) => {
  const [showDetail, setShowDetail] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState(null);
  const [interval, setInterval] = useState(15); // Default interval: 15 minutes

  // Hanya tampilkan humidity dan temperature
  const metricLabels = {
    humidity: "Humidity (%)",
    temperature: "Temperature (°C)",
  };

  // Pastikan data array, jika tidak, jadikan array kosong
  const safeData = Array.isArray(data) ? data : [];

  // Filter data untuk menampilkan data per hari
  const filterDataPerDay = (dataArr) => {
    const filtered = [];
    const seenDates = new Set();

    dataArr.forEach((item) => {
      if (!item || !item.timestamp || item.timestamp === 'alat rusak') return;
      const date = new Date(item.timestamp);
      if (isNaN(date.getTime())) return;
      const dateStr = date.toISOString().split("T")[0];
      if (!seenDates.has(dateStr)) {
        filtered.push(item);
        seenDates.add(dateStr);
      }
    });

    return filtered;
  };

  // Filter data berdasarkan interval (15 menit atau 30 menit)
  const filterDataByInterval = (dataArr, interval) => {
    const filtered = [];
    let lastTimestamp = null;

    dataArr.forEach((item) => {
      if (!item || !item.timestamp || item.timestamp === 'alat rusak') return;
      const currentTimestamp = new Date(item.timestamp).getTime();
      if (isNaN(currentTimestamp)) return;

      if (!lastTimestamp || currentTimestamp - lastTimestamp >= interval * 60 * 1000) {
        filtered.push(item);
        lastTimestamp = currentTimestamp;
      }
    });

    return filtered;
  };

  return (
    <>
      <Row>
        {Object.keys(metricLabels).map((metric) => (
          <Col md={6} className="mb-4" key={metric}>
            <div
              style={{
                backgroundColor: "#ffffff",
                padding: "20px",
                borderRadius: "10px",
                boxShadow: "0 0 15px rgba(0, 0, 0, 0.1)",
                cursor: "pointer",
              }}
              onClick={() => {
                setSelectedMetric(metric);
                setShowDetail(true);
              }}
            >
              <h5 style={{ color: "#007bff", textAlign: "center" }}>{metricLabels[metric]}</h5>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={filterDataPerDay(safeData)} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" />
                  <YAxis 
                    domain={['dataMin - 5', 'dataMax + 10']}
                    tickCount={6}
                  />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey={metric} stroke="#007bff" activeDot={{ r: 8 }} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Col>
        ))}
      </Row>

      {/* Modal untuk Detail Chart */}
      <Modal show={showDetail} onHide={() => setShowDetail(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>{selectedMetric ? metricLabels[selectedMetric] : "Detail Chart"}</Modal.Title>
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
            <LineChart data={filterDataByInterval(safeData, interval)} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" />
              <YAxis 
                domain={['dataMin - 5', 'dataMax + 10']}
                tickCount={8}
              />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey={selectedMetric} stroke="#007bff" activeDot={{ r: 8 }} strokeWidth={2} />
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