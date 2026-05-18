import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useState } from 'react';
import { Button, Col, Container, Form, Row } from 'react-bootstrap';
import * as XLSX from 'xlsx';

const Download = () => {
  // Hanya Station 1 yang digunakan
  const selectedStation = 'Station 1';
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [fileFormat, setFileFormat] = useState('excel');
  const [isAuthenticated, setIsAuthenticated] = useState(false); // State untuk autentikasi
  const [showLoginPopup, setShowLoginPopup] = useState(false); // State untuk menampilkan pop-up login
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = () => {
    if (username === 'admin' && password === 'admin123') {
      setIsAuthenticated(true);
      setShowLoginPopup(false); // Tutup pop-up setelah login berhasil
    } else {
      setError('Invalid username or password');
    }
  };

  const handleDownloadClick = () => {
    if (!isAuthenticated) {
      setShowLoginPopup(true); // Tampilkan pop-up login jika belum login
    } else {
      handleDownload(); // Lanjutkan ke proses download jika sudah login
    }
  };

  const handleDownload = () => {
    if (!startDate || !endDate) {
      alert('Please select both start date and end date.');
      return;
    }

    const data = filterDataByDate(getStationData());

    if (data.length === 0) {
      alert('No data available for the selected date range.');
      return;
    }

    if (fileFormat === 'excel') {
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
      saveAs(blob, `${selectedStation}_data.xlsx`);
    } else if (fileFormat === 'pdf') {
      const doc = new jsPDF();
      doc.text(`${selectedStation} Data`, 10, 10);
      doc.autoTable({
        head: [Object.keys(data[0])],
        body: data.map((item) => Object.values(item)),
      });
      doc.save(`${selectedStation}_data.pdf`);
    }
  };

  const getStationData = () => {
    return station1Data;
  };

  const filterDataByDate = (data) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return data.filter((item) => {
      const itemDate = new Date(item.timestamp);
      return itemDate >= start && itemDate <= end;
    });
  };

  // Data untuk Station 1 saja
  const station1Data = [
    { timestamp: '2025-03-01', humidity: 65, temperature: 28, airPressure: 1012, irradiation: 500, oxygen: 21, rainfall: 10, windspeed: 15, windDirection: 'N' },
    // Tambahkan data lainnya...
  ];

  return (
    <Container style={{ marginTop: '20px' }}>
      {/* Pop-up Login */}
      {showLoginPopup && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: '#fff',
              padding: '20px',
              borderRadius: '10px',
              boxShadow: '0 0 15px rgba(0, 0, 0, 0.3)',
              width: '300px',
              textAlign: 'center',
            }}
          >
            <h3 style={{ marginBottom: '20px', color: '#007bff' }}>Login</h3>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                marginBottom: '10px',
                borderRadius: '5px',
                border: '1px solid #ccc',
              }}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                marginBottom: '10px',
                borderRadius: '5px',
                border: '1px solid #ccc',
              }}
            />
            {error && <p style={{ color: 'red', fontSize: '14px' }}>{error}</p>}
            <button
              onClick={handleLogin}
              style={{
                width: '100%',
                padding: '10px',
                backgroundColor: '#007bff',
                color: '#fff',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
              }}
            >
              Login
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <Row>
        <Col>
          <h3 className="text-center fw-bold text-primary">Download Data</h3>
        </Col>
      </Row>

      {/* Hapus tombol Station 2, hanya tampilkan judul Station 1 */}
      <Row className="mt-4 d-flex justify-content-center">
        <Col md={6} className="text-center">
          <h5 className="fw-bold text-primary">Station 1</h5>
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
              className="form-control-custom shadow-sm"
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
              className="form-control-custom shadow-sm"
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
              label="Excel"
              name="fileFormat"
              value="excel"
              checked={fileFormat === 'excel'}
              onChange={(e) => setFileFormat(e.target.value)}
              className="fw-semibold"
            />
            <Form.Check
              type="radio"
              label="PDF"
              name="fileFormat"
              value="pdf"
              checked={fileFormat === 'pdf'}
              onChange={(e) => setFileFormat(e.target.value)}
              className="fw-semibold"
            />
          </Form.Group>
        </Col>
      </Row>

      <Row className="mt-4">
        <Col className="text-center">
          <Button
            variant="success"
            onClick={handleDownloadClick} // Gunakan handleDownloadClick untuk memeriksa autentikasi
            className="px-5 py-2 fw-bold shadow-lg download-btn"
          >
            Download Data
          </Button>
        </Col>
      </Row>
    </Container>
  );
};

export default Download;