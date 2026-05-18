import { useEffect, useMemo, useState } from 'react';
import { Slide } from 'react-awesome-reveal';
import { Badge, Card, Col, Container, Form, Row, Spinner } from 'react-bootstrap';
import { API_BASE_URL } from '../../config/apiEndpoints';

const MONTH_NAMES = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

const DAY_LABELS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

const parseDateKey = (dateKey) => {
  const parsed = new Date(`${dateKey}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const toDateKey = (date) => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const buildActivityUrl = (station, from, to) => {
  const endpoint = station === 'station2'
    ? '/petengoran/station2/activity-calendar'
    : '/petengoran/station1/activity-calendar';

  const parsed = new URL(`${API_BASE_URL}${endpoint}`);
  parsed.searchParams.set('from', from);
  parsed.searchParams.set('to', to);
  return parsed.toString();
};

const DashboardSect = () => {
  const [selectedStation, setSelectedStation] = useState('station1');
  const [activityMap, setActivityMap] = useState({ station1: {}, station2: {} });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().getMonth());
  const [selectedDateKey, setSelectedDateKey] = useState('');

  const yearOptions = useMemo(() => {
    const years = [];
    const currentYear = new Date().getFullYear();
    for (let year = currentYear; year >= 2023; year -= 1) {
      years.push(year);
    }
    return years;
  }, []);

  useEffect(() => {
    const fetchActivity = async () => {
      setLoading(true);
      setError('');

      try {
        const from = '2023-01-01T00:00:00.000Z';
        const to = new Date().toISOString();
        const station1Url = buildActivityUrl('station1', from, to);
        const station2Url = buildActivityUrl('station2', from, to);

        if (!station1Url || !station2Url) {
          throw new Error('URL API dashboard belum dikonfigurasi.');
        }

        const [station1Response, station2Response] = await Promise.all([
          fetch(station1Url),
          fetch(station2Url),
        ]);

        if (!station1Response.ok || !station2Response.ok) {
          throw new Error('Gagal mengambil data aktivitas alat dari server.');
        }

        const station1Json = await station1Response.json();
        const station2Json = await station2Response.json();

        const mapRows = (rows) => {
          const mapped = {};
          rows.forEach((row) => {
            if (!row?.date) return;
            mapped[row.date] = {
              totalRecords: row.totalRecords ?? 0,
              firstTimestamp: row.firstTimestamp || null,
              lastTimestamp: row.lastTimestamp || null,
            };
          });
          return mapped;
        };

        setActivityMap({
          station1: mapRows(Array.isArray(station1Json?.result) ? station1Json.result : []),
          station2: mapRows(Array.isArray(station2Json?.result) ? station2Json.result : []),
        });
      } catch (fetchError) {
        setError(fetchError.message || 'Terjadi kesalahan saat mengambil data aktivitas.');
      } finally {
        setLoading(false);
      }
    };

    fetchActivity();
  }, []);

  const activeDateMap = useMemo(() => activityMap[selectedStation] || {}, [activityMap, selectedStation]);

  const calendarCells = useMemo(() => {
    const firstDay = new Date(selectedYear, selectedMonth, 1);
    const lastDay = new Date(selectedYear, selectedMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const leadingEmpty = firstDay.getDay();

    const cells = [];
    for (let i = 0; i < leadingEmpty; i += 1) {
      cells.push({ type: 'empty', key: `empty-${i}` });
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const currentDate = new Date(selectedYear, selectedMonth, day);
      const dateKey = toDateKey(currentDate);
      const detail = activeDateMap[dateKey] || null;
      cells.push({
        type: 'day',
        key: dateKey,
        dateKey,
        day,
        active: Boolean(detail),
        detail,
      });
    }

    return cells;
  }, [selectedYear, selectedMonth, activeDateMap]);

  const selectedDetail = selectedDateKey ? activeDateMap[selectedDateKey] : null;
  const selectedDateObj = selectedDateKey ? parseDateKey(selectedDateKey) : null;

  const activeDaysInCurrentMonth = calendarCells.filter((cell) => cell.type === 'day' && cell.active).length;

  const renderDetailTime = (value) => {
    if (!value) return '-';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
  };

  return (
    <section
      className="dashboard-section py-5"
      style={{
        minHeight: '100vh',
        backgroundColor: '#f8f9fa',
      }}
    >
      <Container>
        <Slide direction="up" triggerOnce>
          <Row className="mb-4">
            <Col>
              <div style={{ textAlign: 'center' }}>
                <h1 className="fw-bold" style={{ color: '#007bff' }}>
                  Dashboard Kalender Aktivitas Alat
                </h1>
                <p style={{ fontSize: '18px', color: '#6c757d' }}>
                  Pemetaan tanggal alat aktif dari tahun 2023 sampai sekarang, lengkap dengan detail per tanggal.
                </p>
              </div>
            </Col>
          </Row>

          <Row className="g-3 align-items-end mb-4">
            <Col md={4}>
              <Form.Label className="fw-semibold">Pilih Station</Form.Label>
              <Form.Select value={selectedStation} onChange={(e) => {
                setSelectedStation(e.target.value);
                setSelectedDateKey('');
              }}>
                <option value="station1">Station 1</option>
                <option value="station2">Station 2</option>
              </Form.Select>
            </Col>
            <Col md={4}>
              <Form.Label className="fw-semibold">Tahun</Form.Label>
              <Form.Select value={selectedYear} onChange={(e) => {
                setSelectedYear(Number(e.target.value));
                setSelectedDateKey('');
              }}>
                {yearOptions.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </Form.Select>
            </Col>
            <Col md={4}>
              <Form.Label className="fw-semibold">Bulan</Form.Label>
              <Form.Select value={selectedMonth} onChange={(e) => {
                setSelectedMonth(Number(e.target.value));
                setSelectedDateKey('');
              }}>
                {MONTH_NAMES.map((monthName, index) => (
                  <option key={monthName} value={index}>{monthName}</option>
                ))}
              </Form.Select>
            </Col>
          </Row>

          {loading && (
            <div className="text-center mb-3">
              <Spinner animation="border" role="status" style={{ color: '#007bff' }} />
              <div className="mt-2">Mengambil data kalender aktivitas...</div>
            </div>
          )}

          {error && (
            <div className="alert alert-danger text-center" role="alert">
              {error}
            </div>
          )}

          <Row className="g-4">
            <Col lg={8}>
              <Card className="shadow-sm border-0">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="mb-0">{MONTH_NAMES[selectedMonth]} {selectedYear}</h5>
                    <Badge bg="success">Hari aktif bulan ini: {activeDaysInCurrentMonth}</Badge>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
                      gap: '8px',
                    }}
                  >
                    {DAY_LABELS.map((label) => (
                      <div key={label} className="text-center fw-semibold" style={{ color: '#6c757d' }}>
                        {label}
                      </div>
                    ))}

                    {calendarCells.map((cell) => {
                      if (cell.type === 'empty') {
                        return <div key={cell.key} />;
                      }

                      const isSelected = cell.dateKey === selectedDateKey;
                      const borderColor = isSelected ? '#0d6efd' : '#dee2e6';
                      const backgroundColor = cell.active ? '#d1e7dd' : '#f8f9fa';

                      return (
                        <button
                          key={cell.key}
                          type="button"
                          onClick={() => setSelectedDateKey(cell.dateKey)}
                          style={{
                            border: `2px solid ${borderColor}`,
                            borderRadius: '10px',
                            padding: '10px 6px',
                            minHeight: '62px',
                            backgroundColor,
                            cursor: 'pointer',
                            color: '#212529',
                          }}
                        >
                          <div style={{ fontWeight: 700 }}>{cell.day}</div>
                          <div style={{ fontSize: '0.72rem' }}>
                            {cell.active ? `${cell.detail.totalRecords} data` : 'Tidak aktif'}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col lg={4}>
              <Card className="shadow-sm border-0 h-100">
                <Card.Body>
                  <h5 className="mb-3">Detail Tanggal</h5>

                  {!selectedDateKey && (
                    <p className="text-muted mb-0">Klik salah satu tanggal di kalender untuk melihat detail aktivitas alat.</p>
                  )}

                  {selectedDateKey && !selectedDetail && (
                    <div>
                      <p className="mb-1 fw-semibold">
                        {selectedDateObj
                          ? selectedDateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
                          : selectedDateKey}
                      </p>
                      <p className="text-muted mb-0">Tidak ada aktivitas alat pada tanggal ini.</p>
                    </div>
                  )}

                  {selectedDateKey && selectedDetail && (
                    <div>
                      <p className="mb-1 fw-semibold">
                        {selectedDateObj
                          ? selectedDateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
                          : selectedDateKey}
                      </p>
                      <p className="mb-2">Status: <Badge bg="success">Aktif</Badge></p>
                      <ul className="mb-0" style={{ paddingLeft: '18px' }}>
                        <li>Total data terbaca: {selectedDetail.totalRecords}</li>
                        <li>Data pertama hari itu: {renderDetailTime(selectedDetail.firstTimestamp)}</li>
                        <li>Data terakhir hari itu: {renderDetailTime(selectedDetail.lastTimestamp)}</li>
                        <li>Keterangan: alat mengirim data pada tanggal ini.</li>
                      </ul>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Slide>
      </Container>
    </section>
  );
};

export default DashboardSect;