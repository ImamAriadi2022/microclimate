import React, { useState } from 'react';
import {
    Alert,
    Button,
    ButtonGroup,
    Col,
    Form,
    Modal,
    Row,
    Spinner
} from 'react-bootstrap';
import {
    convertToCSV,
    downloadFile,
    formatTimestampForFilename,
    resampleTimeSeries
} from '../utils/timeSeriesResampler';

const DataDownloadModal = ({ 
  show, 
  onHide, 
  data = [], 
  stationName = 'Station',
  availableFields = []
}) => {
  const [downloadOptions, setDownloadOptions] = useState({
    format: 'csv', // csv, json
    resample: true,
    interval: 15, // minutes
    method: 'mean', // mean, first, last, max, min
    fields: [], // fields to include
    dateRange: 'all' // all, today, week, month
  });
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedData, setProcessedData] = useState(null);
  const [preview, setPreview] = useState('');

  // Default fields jika tidak diberikan
  const defaultFields = [
    'humidity', 'temperature', 'airPressure', 'windspeed', 
    'rainfall', 'windDirection', 'waterTemperature', 'irradiation', 'oxygen'
  ];

  const fieldsToUse = availableFields.length > 0 ? availableFields : defaultFields;

  // Initialize selected fields
  React.useEffect(() => {
    if (downloadOptions.fields.length === 0) {
      setDownloadOptions(prev => ({
        ...prev,
        fields: fieldsToUse.filter(field => 
          data.length > 0 && data[0].hasOwnProperty(field)
        )
      }));
    }
  }, [data, fieldsToUse, downloadOptions.fields.length]);

  // Filter data berdasarkan date range
  const filterDataByDateRange = (data, range) => {
    if (range === 'all') return data;
    
    const now = new Date();
    let startDate;
    
    switch (range) {
      case 'today':
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now);
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      default:
        return data;
    }

    return data.filter(item => {
      const itemDate = new Date(item.timestamp);
      return itemDate >= startDate && itemDate <= now;
    });
  };

  // Process data for download
  const processData = async () => {
    setIsProcessing(true);
    
    try {
      // Filter by date range
      let filteredData = filterDataByDateRange(data, downloadOptions.dateRange);
      
      // Apply resampling if enabled
      if (downloadOptions.resample && filteredData.length > 0) {
        filteredData = resampleTimeSeries(
          filteredData,
          downloadOptions.interval,
          downloadOptions.method,
          downloadOptions.fields
        );
      }

      // Select only requested fields
      const finalData = filteredData.map(item => {
        const result = { timestamp: item.timestamp };
        downloadOptions.fields.forEach(field => {
          if (item.hasOwnProperty(field)) {
            result[field] = item[field];
          }
        });
        return result;
      });

      setProcessedData(finalData);
      
      // Generate preview (first 5 rows)
      const previewData = finalData.slice(0, 5);
      if (downloadOptions.format === 'csv') {
        setPreview(convertToCSV(previewData));
      } else {
        setPreview(JSON.stringify(previewData, null, 2));
      }
      
    } catch (error) {
      console.error('Error processing data:', error);
      alert('Error processing data: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Download processed data
  const handleDownload = () => {
    if (!processedData || processedData.length === 0) {
      alert('No data to download');
      return;
    }

    const timestamp = formatTimestampForFilename();
    const resampleSuffix = downloadOptions.resample ? `_${downloadOptions.interval}min_${downloadOptions.method}` : '_raw';
    const filename = `${stationName}_data_${timestamp}${resampleSuffix}.${downloadOptions.format}`;

    let content;
    let contentType;

    if (downloadOptions.format === 'csv') {
      content = convertToCSV(processedData);
      contentType = 'text/csv';
    } else {
      content = JSON.stringify(processedData, null, 2);
      contentType = 'application/json';
    }

    downloadFile(content, filename, contentType);
  };

  const handleOptionChange = (key, value) => {
    setDownloadOptions(prev => ({ ...prev, [key]: value }));
    setProcessedData(null);
    setPreview('');
  };

  const handleFieldToggle = (field) => {
    setDownloadOptions(prev => ({
      ...prev,
      fields: prev.fields.includes(field)
        ? prev.fields.filter(f => f !== field)
        : [...prev.fields, field]
    }));
    setProcessedData(null);
    setPreview('');
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Download Data - {stationName}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Row>
          <Col md={6}>
            <h6>Download Options</h6>
            
            {/* Format Selection */}
            <Form.Group className="mb-3">
              <Form.Label>Format</Form.Label>
              <ButtonGroup className="d-block">
                <Button
                  variant={downloadOptions.format === 'csv' ? 'primary' : 'outline-primary'}
                  onClick={() => handleOptionChange('format', 'csv')}
                >
                  CSV
                </Button>
                <Button
                  variant={downloadOptions.format === 'json' ? 'primary' : 'outline-primary'}
                  onClick={() => handleOptionChange('format', 'json')}
                >
                  JSON
                </Button>
              </ButtonGroup>
            </Form.Group>

            {/* Date Range */}
            <Form.Group className="mb-3">
              <Form.Label>Date Range</Form.Label>
              <Form.Select
                value={downloadOptions.dateRange}
                onChange={(e) => handleOptionChange('dateRange', e.target.value)}
              >
                <option value="all">All Data</option>
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last Month</option>
              </Form.Select>
            </Form.Group>

            {/* Resampling Options */}
            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="Enable Resampling"
                checked={downloadOptions.resample}
                onChange={(e) => handleOptionChange('resample', e.target.checked)}
              />
            </Form.Group>

            {downloadOptions.resample && (
              <>
                <Form.Group className="mb-3">
                  <Form.Label>Interval (minutes)</Form.Label>
                  <Form.Select
                    value={downloadOptions.interval}
                    onChange={(e) => handleOptionChange('interval', parseInt(e.target.value))}
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

                <Form.Group className="mb-3">
                  <Form.Label>Aggregation Method</Form.Label>
                  <Form.Select
                    value={downloadOptions.method}
                    onChange={(e) => handleOptionChange('method', e.target.value)}
                  >
                    <option value="mean">Average (Mean)</option>
                    <option value="first">First Value</option>
                    <option value="last">Last Value</option>
                    <option value="max">Maximum</option>
                    <option value="min">Minimum</option>
                  </Form.Select>
                </Form.Group>
              </>
            )}

            {/* Field Selection */}
            <Form.Group className="mb-3">
              <Form.Label>Fields to Include</Form.Label>
              <div style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid #ced4da', borderRadius: '0.375rem', padding: '0.5rem' }}>
                {fieldsToUse.map(field => (
                  <Form.Check
                    key={field}
                    type="checkbox"
                    label={field.charAt(0).toUpperCase() + field.slice(1)}
                    checked={downloadOptions.fields.includes(field)}
                    onChange={() => handleFieldToggle(field)}
                  />
                ))}
              </div>
            </Form.Group>
          </Col>

          <Col md={6}>
            <h6>Preview</h6>
            <div className="mb-3">
              <Button 
                variant="info" 
                onClick={processData}
                disabled={isProcessing || downloadOptions.fields.length === 0}
              >
                {isProcessing ? (
                  <>
                    <Spinner size="sm" className="me-2" />
                    Processing...
                  </>
                ) : (
                  'Generate Preview'
                )}
              </Button>
            </div>

            {processedData && (
              <Alert variant="success">
                Processed {processedData.length} records
                {downloadOptions.resample && (
                  <div className="small">
                    Resampled to {downloadOptions.interval} minutes using {downloadOptions.method} method
                  </div>
                )}
              </Alert>
            )}

            <Form.Group>
              <Form.Label>Data Preview (first 5 rows)</Form.Label>
              <Form.Control
                as="textarea"
                rows={10}
                value={preview}
                readOnly
                style={{ fontSize: '12px', fontFamily: 'monospace' }}
              />
            </Form.Group>
          </Col>
        </Row>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
        <Button 
          variant="primary" 
          onClick={handleDownload}
          disabled={!processedData || processedData.length === 0}
        >
          Download ({downloadOptions.format.toUpperCase()})
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default DataDownloadModal;
