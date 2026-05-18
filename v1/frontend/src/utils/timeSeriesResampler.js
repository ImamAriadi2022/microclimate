/**
 * Time Series Resampling Utility
 * Melakukan resampling data time series ke interval waktu tertentu
 */

/**
 * Resample data time series ke interval waktu tertentu
 * @param {Array} data - Array data dengan field timestamp
 * @param {number} intervalMinutes - Interval dalam menit (15, 30, 60, dll)
 * @param {string} method - Metode aggregasi: 'mean', 'first', 'last', 'max', 'min'
 * @param {Array} fields - Field yang akan di-resample (selain timestamp)
 * @returns {Array} Data yang sudah di-resample
 */
export const resampleTimeSeries = (data, intervalMinutes = 15, method = 'mean', fields = null) => {
  if (!data || data.length === 0) return [];

  // Jika fields tidak diberikan, ambil semua field kecuali timestamp dan userFriendlyDate
  if (!fields) {
    const sampleItem = data[0];
    fields = Object.keys(sampleItem).filter(key => 
      key !== 'timestamp' && 
      key !== 'userFriendlyDate' &&
      key !== 'invalid' &&
      sampleItem[key] !== null &&
      sampleItem[key] !== undefined
    );
  }

  // Parse dan sort data berdasarkan timestamp
  const parsedData = data
    .map(item => ({
      ...item,
      timestamp: new Date(item.timestamp),
      originalTimestamp: item.timestamp
    }))
    .filter(item => !isNaN(item.timestamp.getTime()))
    .sort((a, b) => a.timestamp - b.timestamp);

  if (parsedData.length === 0) return [];

  // Tentukan interval dalam milliseconds
  const intervalMs = intervalMinutes * 60 * 1000;

  // Group data berdasarkan interval
  const groups = {};
  
  parsedData.forEach(item => {
    // Bulatkan timestamp ke interval terdekat
    const timestamp = item.timestamp.getTime();
    const intervalStart = Math.floor(timestamp / intervalMs) * intervalMs;
    const intervalKey = intervalStart.toString();

    if (!groups[intervalKey]) {
      groups[intervalKey] = [];
    }
    groups[intervalKey].push(item);
  });

  // Agregasi data untuk setiap group
  const resampledData = Object.keys(groups)
    .sort((a, b) => parseInt(a) - parseInt(b))
    .map(intervalKey => {
      const group = groups[intervalKey];
      const intervalStart = new Date(parseInt(intervalKey));
      
      // Format tanggal yang user-friendly
      const formatUserFriendlyDate = (timestamp) => {
        try {
          const date = new Date(timestamp);
          if (isNaN(date.getTime())) return 'Invalid Date';
          
          const options = {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            timeZone: 'Asia/Jakarta'
          };
          
          return date.toLocaleDateString('id-ID', options);
        } catch {
          return 'Invalid Date';
        }
      };
      
      const aggregatedItem = {
        timestamp: intervalStart.toISOString(),
        userFriendlyDate: formatUserFriendlyDate(intervalStart),
        count: group.length
      };

      // Agregasi setiap field
      fields.forEach(field => {
        const values = group
          .map(item => item[field])
          .filter(val => val !== null && val !== undefined);

        if (values.length > 0) {
          // Handle string fields (seperti windDirection)
          if (typeof values[0] === 'string') {
            switch (method) {
              case 'first':
                aggregatedItem[field] = values[0];
                break;
              case 'last':
                aggregatedItem[field] = values[values.length - 1];
                break;
              default:
                // Untuk string, gunakan nilai yang paling sering muncul
                const frequency = {};
                values.forEach(val => {
                  frequency[val] = (frequency[val] || 0) + 1;
                });
                aggregatedItem[field] = Object.keys(frequency).reduce((a, b) => 
                  frequency[a] > frequency[b] ? a : b
                );
            }
          } else {
            // Handle numeric fields
            const numericValues = values
              .map(val => parseFloat(val))
              .filter(val => !isNaN(val));
              
            if (numericValues.length > 0) {
              switch (method) {
                case 'mean':
                  aggregatedItem[field] = parseFloat((numericValues.reduce((a, b) => a + b, 0) / numericValues.length).toFixed(2));
                  break;
                case 'first':
                  aggregatedItem[field] = numericValues[0];
                  break;
                case 'last':
                  aggregatedItem[field] = numericValues[numericValues.length - 1];
                  break;
                case 'max':
                  aggregatedItem[field] = Math.max(...numericValues);
                  break;
                case 'min':
                  aggregatedItem[field] = Math.min(...numericValues);
                  break;
                default:
                  aggregatedItem[field] = parseFloat((numericValues.reduce((a, b) => a + b, 0) / numericValues.length).toFixed(2));
              }
            } else {
              aggregatedItem[field] = null;
            }
          }
        } else {
          aggregatedItem[field] = null;
        }
      });

      return aggregatedItem;
    });

  return resampledData;
};

/**
 * Convert data to CSV format
 * @param {Array} data - Data array
 * @param {Array} headers - Custom headers (optional)
 * @returns {string} CSV string
 */
export const convertToCSV = (data, headers = null) => {
  if (!data || data.length === 0) return '';

  // Gunakan headers yang diberikan atau ambil dari object pertama
  const csvHeaders = headers || Object.keys(data[0]);
  
  // Header row
  const headerRow = csvHeaders.join(',');
  
  // Data rows
  const dataRows = data.map(item => 
    csvHeaders.map(header => {
      const value = item[header];
      // Handle values yang mengandung comma atau newline
      if (typeof value === 'string' && (value.includes(',') || value.includes('\n'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value || '';
    }).join(',')
  );

  return [headerRow, ...dataRows].join('\n');
};

/**
 * Download data as file
 * @param {string} content - File content
 * @param {string} filename - File name
 * @param {string} contentType - MIME type
 */
export const downloadFile = (content, filename, contentType = 'text/csv') => {
  const blob = new Blob([content], { type: contentType });
  const url = window.URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  
  // Cleanup
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

/**
 * Format timestamp untuk filename
 * @param {Date} date - Date object
 * @returns {string} Formatted string
 */
export const formatTimestampForFilename = (date = new Date()) => {
  return date.toISOString()
    .replace(/:/g, '-')
    .replace(/\./g, '-')
    .slice(0, 19); // Remove milliseconds and timezone
};
