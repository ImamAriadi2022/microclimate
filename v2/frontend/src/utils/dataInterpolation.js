/**
 * Data Interpolation Utility
 * Mengisi gap data dengan interpolasi linear untuk membuat data terlihat lebih lengkap
 */

/**
 * Linear interpolation antara dua nilai
 */
const linearInterpolate = (x0, y0, x1, y1, x) => {
  if (x1 === x0) return y0;
  return y0 + (y1 - y0) * ((x - x0) / (x1 - x0));
};

/**
 * Interpolasi data untuk field numerik
 */
const interpolateNumericValue = (prevValue, nextValue, ratio) => {
  if (prevValue === null || nextValue === null || 
      isNaN(prevValue) || isNaN(nextValue)) {
    return prevValue !== null ? prevValue : nextValue;
  }
  return parseFloat(linearInterpolate(0, prevValue, 1, nextValue, ratio).toFixed(2));
};

/**
 * Interpolasi data untuk field string (seperti windDirection)
 */
const interpolateStringValue = (prevValue, nextValue, ratio) => {
  // Untuk string, gunakan nilai terdekat
  return ratio < 0.5 ? prevValue : nextValue;
};

/**
 * Format tanggal yang user-friendly (konsisten dengan Download.js)
 */
const formatUserFriendlyDate = (timestamp) => {
  if (!timestamp) return 'Invalid Date';
  
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

/**
 * Mengisi gap data dengan interpolasi
 * @param {Array} data - Data array yang sudah diurutkan berdasarkan timestamp
 * @param {number} maxGapMinutes - Maksimal gap dalam menit yang akan diisi
 * @param {number} intervalMinutes - Interval interpolasi dalam menit
 * @returns {Array} Data dengan gap yang sudah diisi
 */
export const fillDataGaps = (data, maxGapMinutes = 120, intervalMinutes = 5) => {
  if (!data || data.length === 0) return [];

  // Sort data berdasarkan timestamp
  const sortedData = [...data].sort((a, b) => 
    new Date(a.timestamp) - new Date(b.timestamp)
  );

  const filledData = [];
  const intervalMs = intervalMinutes * 60 * 1000;
  const maxGapMs = maxGapMinutes * 60 * 1000;

  // Definisikan field yang akan diinterpolasi
  const numericFields = ['humidity', 'temperature', 'rainfall', 'windspeed', 'irradiation', 'angle'];
  const stringFields = ['windDirection'];

  for (let i = 0; i < sortedData.length; i++) {
    const currentItem = sortedData[i];
    filledData.push(currentItem);

    // Cek gap ke item berikutnya
    if (i < sortedData.length - 1) {
      const nextItem = sortedData[i + 1];
      const currentTime = new Date(currentItem.timestamp).getTime();
      const nextTime = new Date(nextItem.timestamp).getTime();
      const timeDiff = nextTime - currentTime;

      // Jika gap lebih besar dari interval dan tidak terlalu besar
      if (timeDiff > intervalMs && timeDiff <= maxGapMs) {
        const gapCount = Math.floor(timeDiff / intervalMs) - 1;
        
        // Buat data interpolasi untuk mengisi gap
        for (let j = 1; j <= gapCount; j++) {
          const interpolatedTime = currentTime + (j * intervalMs);
          const ratio = j / (gapCount + 1);
          
          const interpolatedItem = {
            timestamp: new Date(interpolatedTime).toISOString(),
            userFriendlyDate: formatUserFriendlyDate(new Date(interpolatedTime).toISOString()),
            interpolated: true, // Flag untuk menandai data interpolasi
            invalid: false
          };

          // Interpolasi field numerik
          numericFields.forEach(field => {
            if (currentItem[field] !== undefined && nextItem[field] !== undefined) {
              interpolatedItem[field] = interpolateNumericValue(
                currentItem[field], 
                nextItem[field], 
                ratio
              );
            } else {
              interpolatedItem[field] = currentItem[field] ?? nextItem[field] ?? 0;
            }
          });

          // Interpolasi field string
          stringFields.forEach(field => {
            if (currentItem[field] !== undefined && nextItem[field] !== undefined) {
              interpolatedItem[field] = interpolateStringValue(
                currentItem[field], 
                nextItem[field], 
                ratio
              );
            } else {
              interpolatedItem[field] = currentItem[field] ?? nextItem[field] ?? '';
            }
          });

          filledData.push(interpolatedItem);
        }
      }
    }
  }

  return filledData.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
};

/**
 * Smooth data dengan moving average
 * @param {Array} data - Data array
 * @param {number} windowSize - Ukuran window untuk moving average
 * @returns {Array} Data yang sudah di-smooth
 */
export const smoothData = (data, windowSize = 3) => {
  if (!data || data.length === 0 || windowSize <= 1) return data;

  const numericFields = ['humidity', 'temperature', 'rainfall', 'windspeed', 'irradiation', 'angle'];
  
  return data.map((item, index) => {
    const smoothedItem = { ...item };
    
    numericFields.forEach(field => {
      if (item[field] !== undefined && !isNaN(item[field])) {
        const start = Math.max(0, index - Math.floor(windowSize / 2));
        const end = Math.min(data.length, index + Math.ceil(windowSize / 2));
        
        const values = [];
        for (let i = start; i < end; i++) {
          if (data[i][field] !== undefined && !isNaN(data[i][field])) {
            values.push(data[i][field]);
          }
        }
        
        if (values.length > 0) {
          const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
          smoothedItem[field] = parseFloat(avg.toFixed(2));
        }
      }
    });
    
    // Update userFriendlyDate jika ada perubahan
    if (smoothedItem.timestamp) {
      smoothedItem.userFriendlyDate = formatUserFriendlyDate(smoothedItem.timestamp);
    }
    
    return smoothedItem;
  });
};

/**
 * Generate data dengan interval konsisten
 * @param {Array} data - Data original
 * @param {number} intervalMinutes - Interval dalam menit
 * @param {Date} startDate - Tanggal mulai
 * @param {Date} endDate - Tanggal akhir
 * @returns {Array} Data dengan interval konsisten
 */
export const generateConsistentIntervalData = (data, intervalMinutes = 5, startDate, endDate) => {
  if (!data || data.length === 0) return [];
  
  const intervalMs = intervalMinutes * 60 * 1000;
  const start = startDate ? new Date(startDate).getTime() : new Date(data[0].timestamp).getTime();
  const end = endDate ? new Date(endDate).getTime() : new Date(data[data.length - 1].timestamp).getTime();
  
  const consistentData = [];
  const dataMap = new Map();
  
  // Buat map dari data yang ada
  data.forEach(item => {
    const time = new Date(item.timestamp).getTime();
    const roundedTime = Math.round(time / intervalMs) * intervalMs;
    if (!dataMap.has(roundedTime) || !dataMap.get(roundedTime).interpolated) {
      dataMap.set(roundedTime, item);
    }
  });
  
  // Generate data dengan interval konsisten
  for (let time = start; time <= end; time += intervalMs) {
    if (dataMap.has(time)) {
      consistentData.push(dataMap.get(time));
    } else {
      // Cari data terdekat untuk interpolasi
      const nearestBefore = findNearestDataPoint(dataMap, time, -1, intervalMs * 6); // 30 menit sebelum
      const nearestAfter = findNearestDataPoint(dataMap, time, 1, intervalMs * 6); // 30 menit sesudah
      
      if (nearestBefore && nearestAfter) {
        const interpolated = interpolateDataPoint(nearestBefore, nearestAfter, time);
        consistentData.push(interpolated);
      } else if (nearestBefore) {
        const estimated = { ...nearestBefore, 
          timestamp: new Date(time).toISOString(),
          userFriendlyDate: formatUserFriendlyDate(new Date(time).toISOString()),
          interpolated: true 
        };
        consistentData.push(estimated);
      } else if (nearestAfter) {
        const estimated = { ...nearestAfter, 
          timestamp: new Date(time).toISOString(),
          userFriendlyDate: formatUserFriendlyDate(new Date(time).toISOString()),
          interpolated: true 
        };
        consistentData.push(estimated);
      }
    }
  }
  
  return consistentData;
};

// Helper functions
const findNearestDataPoint = (dataMap, targetTime, direction, maxDistance) => {
  let bestPoint = null;
  let bestDistance = Infinity;
  
  for (const [time, point] of dataMap.entries()) {
    const distance = Math.abs(time - targetTime);
    const correctDirection = direction > 0 ? time > targetTime : time < targetTime;
    
    if (correctDirection && distance < bestDistance && distance <= maxDistance) {
      bestDistance = distance;
      bestPoint = point;
    }
  }
  
  return bestPoint;
};

const interpolateDataPoint = (pointBefore, pointAfter, targetTime) => {
  const timeBefore = new Date(pointBefore.timestamp).getTime();
  const timeAfter = new Date(pointAfter.timestamp).getTime();
  const ratio = (targetTime - timeBefore) / (timeAfter - timeBefore);
  
  const interpolated = {
    timestamp: new Date(targetTime).toISOString(),
    userFriendlyDate: formatUserFriendlyDate(new Date(targetTime).toISOString()),
    interpolated: true,
    invalid: false
  };
  
  const numericFields = ['humidity', 'temperature', 'rainfall', 'windspeed', 'irradiation', 'angle'];
  const stringFields = ['windDirection'];
  
  numericFields.forEach(field => {
    interpolated[field] = interpolateNumericValue(
      pointBefore[field], 
      pointAfter[field], 
      ratio
    );
  });
  
  stringFields.forEach(field => {
    interpolated[field] = interpolateStringValue(
      pointBefore[field], 
      pointAfter[field], 
      ratio
    );
  });
  
  return interpolated;
};
