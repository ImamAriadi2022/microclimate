import { saveAs } from 'file-saver';
import { useState } from 'react';
import { Button, Col, Container, Form, Modal, Row } from 'react-bootstrap';
import * as XLSX from 'xlsx';
import { resampleTimeSeries } from '../../utils/timeSeriesResampler';

// Ambil data dari localStorage kedua station
function getStationData(station) {
  let key = '';
  if (station === 'Station 1') key = 'station1_data';
  if (station === 'Station 2') key = 'station2_data';
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

// Helper validasi tanggal (format ISO atau DD-MM-YY HH:mm:ss)
function parseDate(str) {
  if (!str) return null;
  // ISO
  const iso = new Date(str);
  if (!isNaN(iso)) return iso;
  // DD-MM-YY HH:mm:ss
  const [datePart, timePart] = str.split(' ');
  if (!datePart || !timePart) return null;
  const [day, month, year] = datePart.split('-');
  if (!day || !month || !year) return null;
  const fullYear = Number(year) < 100 ? 2000 + Number(year) : Number(year);
  const mm = month.padStart(2, '0');
  const dd = day.padStart(2, '0');
  return new Date(`${fullYear}-${mm}-${dd}T${timePart}`);
}

const Download = () => {
  const [selectedStation, setSelectedStation] = useState('Station 1');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [fileFormat, setFileFormat] = useState('json');
  const [showRusak, setShowRusak] = useState(false);
  
  // Opsi resampling
  const [enableResampling, setEnableResampling] = useState(false);
  const [resampleInterval, setResampleInterval] = useState(15);
  const [resampleMethod, setResampleMethod] = useState('mean');

  const handleDownload = () => {
    // Validasi tanggal
    if (!startDate || !endDate) {
      setShowRusak(true);
      return;
    }
    const data = getStationData(selectedStation);
    if (!data.length) {
      setShowRusak(true);
      return;
    }
    
    // Filter data by date
    const start = new Date(startDate);
    const end = new Date(endDate);
    let filtered = data.filter(item => {
      const d = parseDate(item.timestamp);
      return d && d >= start && d <= end;
    });
    
    // Jika ada data yang timestamp-nya null/invalid, atau hasil filter kosong, tampilkan alat rusak
    if (filtered.length === 0) {
      setShowRusak(true);
      return;
    }

    // Apply resampling jika diaktifkan
    if (enableResampling) {
      try {
        // Tentukan fields yang akan di-resample
        const fields = ['humidity', 'temperature', 'airPressure', 'windspeed', 'rainfall', 'windDirection', 'waterTemperature'];
        filtered = resampleTimeSeries(filtered, resampleInterval, resampleMethod, fields);
        
        if (filtered.length === 0) {
          setShowRusak(true);
          return;
        }
      } catch (error) {
        console.error('Resampling error:', error);
        alert('Error during resampling: ' + error.message);
        return;
      }
    }
    
    // Generate filename with resampling info
    const resampleSuffix = enableResampling ? `_resampled_${resampleInterval}min_${resampleMethod}` : '';
    const baseFilename = `${selectedStation.replace(' ', '_').toLowerCase()}_data${resampleSuffix}`;
    
    // Download
    if (fileFormat === 'json') {
      const blob = new Blob([JSON.stringify(filtered, null, 2)], { type: 'application/json' });
      saveAs(blob, `${baseFilename}.json`);
    } else if (fileFormat === 'csv') {
      const worksheet = XLSX.utils.json_to_sheet(filtered);
      const csv = XLSX.utils.sheet_to_csv(worksheet);
      const blob = new Blob([csv], { type: 'text/csv' });
      saveAs(blob, `${baseFilename}.csv`);
    }
  };

  return (
    <Container style={{ marginTop: '20px' }}>
      <Row>
        <Col>
          <h3 className="text-center fw-bold text-primary">Download Data</h3>
        </Col>
      </Row>

      <Row className="mt-4 d-flex justify-content-center">
        <Col md={6} className="text-center">
          <Button
            variant={selectedStation === 'Station 1' ? 'primary' : 'outline-primary'}
            onClick={() => setSelectedStation('Station 1')}
            className="me-3 px-4 py-2 fw-bold shadow-sm"
          >
            Station 1
          </Button>
          <Button
            variant={selectedStation === 'Station 2' ? 'primary' : 'outline-primary'}
            onClick={() => setSelectedStation('Station 2')}
            className="px-4 py-2 fw-bold shadow-sm"
          >
            Station 2
          </Button>
        </Col>
      </Row>

      <Row className="mt-4">
        <Col md={6}>
          <Form.Group controlId="startDate">
            <Form.Label className="fw-bold">Start Date</Form.Label>
            <Form.Control
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="shadow-sm"
            />
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group controlId="endDate">
            <Form.Label className="fw-bold">End Date</Form.Label>
            <Form.Control
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="shadow-sm"
            />
          </Form.Group>
        </Col>
      </Row>

      <Row className="mt-4">
        <Col>
          <Form.Group controlId="fileFormat">
            <Form.Label className="fw-bold">Select File Format</Form.Label>
            <Form.Check
              type="radio"
              label="JSON"
              name="fileFormat"
              value="json"
              checked={fileFormat === 'json'}
              onChange={(e) => setFileFormat(e.target.value)}
              className="fw-semibold"
            />
            <Form.Check
              type="radio"
              label="CSV"
              name="fileFormat"
              value="csv"
              checked={fileFormat === 'csv'}
              onChange={(e) => setFileFormat(e.target.value)}
              className="fw-semibold"
            />
          </Form.Group>
        </Col>
      </Row>

      {/* Resampling Options */}
      <Row className="mt-4">
        <Col>
          <Form.Group>
            <Form.Check
              type="checkbox"
              label="Enable Data Resampling"
              checked={enableResampling}
              onChange={(e) => setEnableResampling(e.target.checked)}
              className="fw-bold"
            />
            <Form.Text className="text-muted">
              Resample data ke interval waktu tertentu (berguna untuk dataset besar)
            </Form.Text>
          </Form.Group>
        </Col>
      </Row>

      {enableResampling && (
        <>
          <Row className="mt-3">
            <Col md={6}>
              <Form.Group controlId="resampleInterval">
                <Form.Label className="fw-bold">Interval (minutes)</Form.Label>
                <Form.Select
                  value={resampleInterval}
                  onChange={(e) => setResampleInterval(parseInt(e.target.value))}
                  className="shadow-sm"
                >
                  <option value={5}>5 minutes</option>
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={60}>1 hour</option>
                  <option value={360}>6 hours</option>
                  <option value={720}>12 hours</option>
                  <option value={1440}>1 day</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group controlId="resampleMethod">
                <Form.Label className="fw-bold">Aggregation Method</Form.Label>
                <Form.Select
                  value={resampleMethod}
                  onChange={(e) => setResampleMethod(e.target.value)}
                  className="shadow-sm"
                >
                  <option value="mean">Average (Mean)</option>
                  <option value="first">First Value</option>
                  <option value="last">Last Value</option>
                  <option value="max">Maximum</option>
                  <option value="min">Minimum</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
        </>
      )}

      <Row className="mt-4">
        <Col className="text-center">
          <Button
            variant="success"
            onClick={handleDownload}
            className="px-5 py-2 fw-bold shadow-lg"
          >
            Download Data
          </Button>
        </Col>
      </Row>

      {/* Modal Alat Rusak */}
      <Modal show={showRusak} onHide={() => setShowRusak(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Alat Rusak</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="text-center" style={{ color: 'red', fontWeight: 'bold', fontSize: '1.2em' }}>
            Data tidak tersedia atau tanggal tidak valid!
          </div>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default Download;