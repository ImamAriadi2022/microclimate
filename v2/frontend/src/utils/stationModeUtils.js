export const STATION_MODES = {
  REALTIME: 'realtime',
  LAST_ACTIVE: 'last-active',
  SIMULATION: 'simulation',
};

const COMPASS_DIRECTIONS_ID = [
  'Utara',
  'Timur Laut',
  'Timur',
  'Tenggara',
  'Selatan',
  'Barat Daya',
  'Barat',
  'Barat Laut',
];

const COMPASS_DIRECTIONS_EN = [
  'North',
  'Northeast',
  'East',
  'Southeast',
  'South',
  'Southwest',
  'West',
  'Northwest',
];

/**
 * Mengonversi berbagai format timestamp (termasuk "DD-MM-YY HH:mm:ss" atau ISO string)
 * menjadi string yang dapat di-parse oleh `new Date()`.
 */
export function parseFlexibleTimestamp(ts) {
  if (ts === undefined || ts === null || ts === '') return '';
  if (ts instanceof Date) {
    return Number.isNaN(ts.getTime()) ? '' : ts.toISOString();
  }
  if (typeof ts === 'number') {
    const d = new Date(ts);
    return Number.isNaN(d.getTime()) ? '' : d.toISOString();
  }
  if (typeof ts !== 'string') return String(ts);

  const trimmed = ts.trim();
  if (!trimmed || trimmed === 'error' || trimmed === 'alat rusak') {
    return trimmed;
  }

  // Format: "28-07-25 06:30:00" atau "28-07-2025 06:30:00"
  const customMatch = trimmed.match(
    /^(\d{1,2})-(\d{1,2})-(\d{2,4})\s+(\d{1,2}):(\d{1,2}):(\d{1,2})$/
  );
  if (customMatch) {
    const [, ddRaw, mmRaw, yyRaw, hRaw, mRaw, sRaw] = customMatch;
    const dd = ddRaw.padStart(2, '0');
    const mm = mmRaw.padStart(2, '0');
    const yyyy = yyRaw.length === 2 ? `20${yyRaw}` : yyRaw;
    const hh = hRaw.padStart(2, '0');
    const mi = mRaw.padStart(2, '0');
    const ss = sRaw.padStart(2, '0');
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}:${ss}`;
  }

  return trimmed;
}

/**
 * Mengonversi nilai timestamp ke objek Date yang valid, atau null jika tidak valid.
 */
export function parseFlexibleDate(ts) {
  const normalized = parseFlexibleTimestamp(ts);
  if (!normalized || normalized === 'error' || normalized === 'alat rusak') {
    return null;
  }
  const d = new Date(normalized);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Mengecek apakah sebuah baris data memiliki nilai numerik valid pada seluruh key utama.
 */
export function hasCompleteSensorValues(item, requiredKeys = []) {
  if (!item || !parseFlexibleDate(item.timestamp)) return false;
  if (!Array.isArray(requiredKeys) || requiredKeys.length === 0) return true;

  return requiredKeys.every(
    (key) => typeof item[key] === 'number' && Number.isFinite(item[key])
  );
}

/**
 * Mengecek apakah sebuah baris data memiliki minimal satu nilai sensor numerik yang valid.
 */
export function hasAnySensorValue(item, sensorKeys = []) {
  if (!item || !parseFlexibleDate(item.timestamp)) return false;
  if (!Array.isArray(sensorKeys) || sensorKeys.length === 0) return false;

  return sensorKeys.some(
    (key) => typeof item[key] === 'number' && Number.isFinite(item[key])
  );
}

/**
 * Mencari baris data aktif terakhir dari array data yang sudah diurutkan terbaru di atas.
 * Prioritas 1: Semua sensor utama (`primaryKeys`) bernilai numerik valid.
 * Prioritas 2 (Fallback): Minimal 1 sensor (`allSensorKeys`) bernilai numerik valid.
 */
export function findLatestActiveRecord(
  rows,
  primaryKeys = ['humidity', 'temperature', 'rainfall', 'windspeed'],
  allSensorKeys = primaryKeys
) {
  if (!Array.isArray(rows) || rows.length === 0) return null;

  const sorted = [...rows]
    .filter((row) => parseFlexibleDate(row?.timestamp) !== null)
    .sort((a, b) => parseFlexibleDate(b.timestamp) - parseFlexibleDate(a.timestamp));

  if (sorted.length === 0) return null;

  return (
    sorted.find((row) => hasCompleteSensorValues(row, primaryKeys)) ||
    sorted.find((row) => hasAnySensorValue(row, allSensorKeys)) ||
    null
  );
}

/**
 * Membentuk objek data untuk komponen Gauge dengan fallback aman ke nilai default (`0` / `''`)
 * apabila ada sebagian sensor opsional yang bernilai null / 'alat rusak'.
 */
export function toGaugePayload(record, emptyTemplate) {
  if (!record) return { ...emptyTemplate };

  const payload = { ...emptyTemplate };
  Object.keys(emptyTemplate).forEach((key) => {
    const val = record[key];
    if (typeof emptyTemplate[key] === 'string') {
      payload[key] =
        typeof val === 'string' &&
        val !== 'error' &&
        val !== 'alat rusak' &&
        val !== 'server sedang eror'
          ? val
          : emptyTemplate[key];
    } else if (typeof val === 'number' && Number.isFinite(val)) {
      payload[key] = val;
    } else if (
      val !== undefined &&
      val !== null &&
      val !== '' &&
      val !== 'error' &&
      val !== 'alat rusak' &&
      val !== 'server sedang eror' &&
      !Number.isNaN(Number(val))
    ) {
      payload[key] = Number(val);
    } else {
      payload[key] = emptyTemplate[key];
    }
  });

  if (record.timestamp) {
    payload.timestamp = record.timestamp;
  }

  return payload;
}

/**
 * Memfilter data berdasarkan rentang waktu (`1d`, `7d`, `1m` atau `startDateTime`/`endDateTime`)
 * dan mode tampilan (`realtime`, `last-active`, `simulation`).
 *
 * - Pada mode `realtime`: jendela waktu mengacu pada waktu saat ini (`now`).
 * - Pada mode `last-active`: jendela waktu mengacu pada `lastActiveTimestamp` (data terakhir saat alat aktif),
 *   sehingga grafik dan tabel menampilkan histori pada periode terakhir alat aktif (tidak kosong).
 * - Pada mode `simulation`: jendela waktu mengacu pada titik waktu simulasi terbaru.
 */
export function filterDataByModeRange(
  data,
  {
    filter = '1d',
    startDateTime = '',
    endDateTime = '',
    mode = STATION_MODES.REALTIME,
    lastActiveTimestamp = null,
    now = null,
  } = {}
) {
  if (!Array.isArray(data) || data.length === 0) return [];

  const startDate = startDateTime ? parseFlexibleDate(startDateTime) : null;
  const endDate = endDateTime ? parseFlexibleDate(endDateTime) : null;

  if (startDate || endDate) {
    return data.filter((d) => {
      const t = parseFlexibleDate(d?.timestamp);
      if (!t) return false;
      if (startDate && t < startDate) return false;
      if (endDate && t > endDate) return false;
      return true;
    });
  }

  let anchorDate = now ? new Date(now) : new Date();

  if (mode === STATION_MODES.LAST_ACTIVE) {
    const parsedLastActive = parseFlexibleDate(lastActiveTimestamp);
    if (parsedLastActive) {
      anchorDate = parsedLastActive;
    } else {
      const validDates = data
        .map((d) => parseFlexibleDate(d?.timestamp))
        .filter(Boolean);
      if (validDates.length > 0) {
        anchorDate = new Date(Math.max(...validDates.map((d) => d.getTime())));
      }
    }
  } else if (mode === STATION_MODES.SIMULATION) {
    const validDates = data
      .map((d) => parseFlexibleDate(d?.timestamp))
      .filter(Boolean);
    if (validDates.length > 0) {
      anchorDate = new Date(Math.max(...validDates.map((d) => d.getTime())));
    }
  }

  let durationMs = null;
  if (filter === '1d') durationMs = 24 * 60 * 60 * 1000;
  else if (filter === '7d') durationMs = 7 * 24 * 60 * 60 * 1000;
  else if (filter === '1m') durationMs = 30 * 24 * 60 * 60 * 1000;

  if (!durationMs) return data;

  const minTime = anchorDate.getTime() - durationMs;
  // Beri toleransi 60 detik ke depan untuk menghindari selisih jam tipis pada data realtime
  const maxTime = anchorDate.getTime() + 60 * 1000;

  return data.filter((d) => {
    const t = parseFlexibleDate(d?.timestamp);
    if (!t) return false;
    const ms = t.getTime();
    return ms >= minTime && ms <= maxTime;
  });
}

/**
 * Menghasilkan data simulasi realistis untuk seluruh rentang waktu (`1d`, `7d`, `1m`, atau custom range)
 * lengkap dengan semua field sensor yang dibutuhkan Station 1, Station 2, Kalimantan, dan Custom Dashboard.
 */
export function generateSimulatedRawRecords({
  filter = '1d',
  startDateTime = '',
  endDateTime = '',
  stationSeed = 1,
  now = null,
} = {}) {
  const referenceNow = now ? new Date(now) : new Date();
  const parsedStart = startDateTime ? parseFlexibleDate(startDateTime) : null;
  const parsedEnd = endDateTime ? parseFlexibleDate(endDateTime) : null;

  let endTimeMs = parsedEnd ? parsedEnd.getTime() : referenceNow.getTime();
  let startTimeMs;
  let stepMinutes;

  if (parsedStart) {
    startTimeMs = parsedStart.getTime();
    if (endTimeMs <= startTimeMs) {
      endTimeMs = startTimeMs + 24 * 60 * 60 * 1000;
    }
    const spanMinutes = Math.max(60, Math.round((endTimeMs - startTimeMs) / (60 * 1000)));
    stepMinutes = Math.max(15, Math.round(spanMinutes / 96));
  } else if (filter === '7d') {
    startTimeMs = endTimeMs - 7 * 24 * 60 * 60 * 1000;
    stepMinutes = 30; // 336 titik data selama 7 hari
  } else if (filter === '1m') {
    startTimeMs = endTimeMs - 30 * 24 * 60 * 60 * 1000;
    stepMinutes = 60; // 720 titik data selama 30 hari
  } else {
    startTimeMs = endTimeMs - 24 * 60 * 60 * 1000;
    stepMinutes = 15; // 96 titik data selama 24 jam
  }

  const stepMs = stepMinutes * 60 * 1000;
  const records = [];
  let index = 0;

  for (let ts = endTimeMs; ts >= startTimeMs; ts -= stepMs) {
    const d = new Date(ts);
    const hourFloat = d.getHours() + d.getMinutes() / 60;
    // Siklus harian (puncak siang sekitar pukul 13:00)
    const diurnalWave = Math.sin(((hourFloat - 7) / 24) * 2 * Math.PI);
    const secondaryWave = Math.cos((index + stationSeed * 3) * 0.35);

    const temperature = Number(
      (27.5 + stationSeed * 0.4 + diurnalWave * 3.8 + secondaryWave * 0.6).toFixed(1)
    );
    const humidity = Number(
      Math.min(
        98,
        Math.max(48, 78 - stationSeed * 1.5 - diurnalWave * 14 + secondaryWave * 2.5)
      ).toFixed(1)
    );
    const isDaytime = hourFloat >= 6 && hourFloat <= 18;
    const irradiation = isDaytime
      ? Number(
          Math.max(
            20,
            680 * Math.sin(((hourFloat - 6) / 12) * Math.PI) + secondaryWave * 45
          ).toFixed(1)
        )
      : 0;
    const windSpeed = Number(
      Math.max(0.5, 4.2 + stationSeed * 0.5 + diurnalWave * 2.1 + secondaryWave * 1.1).toFixed(1)
    );
    const rainfall =
      (index + stationSeed) % 11 === 0
        ? Number((1.2 + ((index % 5) * 0.6)).toFixed(1))
        : 0;
    const dirIdx = (index + stationSeed) % COMPASS_DIRECTIONS_ID.length;
    const angle = (dirIdx * 45 + ((index * 7) % 25)) % 360;
    const airPressure = Number(
      (1009.5 + stationSeed * 0.3 + Math.sin(index * 0.2) * 2.2).toFixed(1)
    );
    const bmpTemperature = Number((temperature - 0.3).toFixed(1));
    const waterTemperature = Number((temperature - 1.4).toFixed(1));

    records.push({
      timestamp: d.toISOString(),
      humidity,
      temperature,
      rainfall,
      windSpeed,
      windspeed: windSpeed,
      irradiation,
      pyrano: irradiation,
      direction: COMPASS_DIRECTIONS_ID[dirIdx],
      windDirection: COMPASS_DIRECTIONS_EN[dirIdx],
      angle,
      bmpTemperature,
      bmptemperature: bmpTemperature,
      AirPressure: airPressure,
      airPressure,
      airpressure: airPressure,
      suhuAir: waterTemperature,
      suhuair: waterTemperature,
      waterTemperature,
      temperature2: waterTemperature,
    });

    index += 1;
  }

  return records;
}
