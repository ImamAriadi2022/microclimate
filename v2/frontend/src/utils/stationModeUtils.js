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

export const TIMESTAMP_CANDIDATE_KEYS = [
  'timestamp',
  'recorded_at',
  'recordedAt',
  'created_at',
  'createdAt',
  'datetime',
  'date_time',
  'dateTime',
  'time',
  'date',
  'updated_at',
  'updatedAt',
  'reading_time',
  'readingTime',
  'measured_at',
  'measuredAt',
  'waktu',
  'tanggal',
  'ts',
];

export const SENSOR_FIELD_SPECS = [
  {
    key: 'timestamp',
    label: 'Waktu Pencatatan (Timestamp)',
    possibleKeys: TIMESTAMP_CANDIDATE_KEYS,
    required: true,
  },
  {
    key: 'humidity',
    label: 'Kelembaban Udara',
    possibleKeys: ['humidity', 'hum', 'hum_dht22', 'kelembaban', 'rh', 'relative_humidity', 'relativeHumidity'],
  },
  {
    key: 'temperature',
    label: 'Suhu Udara',
    possibleKeys: ['temperature', 'temp', 'temp_dht22', 'suhu', 'suhu_udara', 'air_temperature', 'airTemperature'],
  },
  {
    key: 'rainfall',
    label: 'Curah Hujan',
    possibleKeys: ['rainfall', 'rain', 'curah_hujan', 'precipitation', 'rain_rate', 'rainRate'],
  },
  {
    key: 'windSpeed',
    label: 'Kecepatan Angin',
    possibleKeys: ['windSpeed', 'windspeed', 'wind_speed', 'kecepatan_angin', 'wind', 'ws'],
  },
  {
    key: 'irradiation',
    label: 'Radiasi Matahari',
    possibleKeys: ['pyrano', 'irradiation', 'radiasi', 'solar', 'solar_radiation', 'solarRadiation', 'irradiance', 'light', 'lux'],
  },
  {
    key: 'direction',
    label: 'Arah Mata Angin (Teks)',
    possibleKeys: ['direction', 'windDirection', 'wind_direction', 'arah_angin', 'wind_dir', 'windDir'],
  },
  {
    key: 'angle',
    label: 'Sudut Arah Angin (°)',
    possibleKeys: ['angle', 'windAngle', 'wind_angle', 'sudut_angin', 'wind_deg', 'windDeg', 'wd'],
  },
  {
    key: 'airPressure',
    label: 'Tekanan Udara',
    possibleKeys: ['AirPressure', 'airPressure', 'airpressure', 'air_pressure', 'tekanan_udara', 'pressure', 'barometric_pressure'],
  },
  {
    key: 'bmpTemperature',
    label: 'Suhu Alat / Cadangan',
    possibleKeys: ['bmpTemperature', 'bmptemperature', 'bmp_temperature', 'suhuAir', 'waterTemperature', 'water_temperature', 'temp2', 'temperature2'],
  },
];

/**
 * Mengonversi berbagai format timestamp (termasuk "YYYY-MM-DD HH:mm:ss", "DD-MM-YY HH:mm:ss",
 * Unix epoch detik/milidetik, atau ISO string) menjadi string yang dapat di-parse oleh `new Date()`.
 */
export function parseFlexibleTimestamp(ts) {
  if (ts === undefined || ts === null || ts === '') return '';
  if (ts instanceof Date) {
    return Number.isNaN(ts.getTime()) ? '' : ts.toISOString();
  }
  if (typeof ts === 'number') {
    const ms = ts >= 946684800 && ts < 10000000000 ? ts * 1000 : ts;
    const d = new Date(ms);
    return Number.isNaN(d.getTime()) ? '' : d.toISOString();
  }
  if (typeof ts !== 'string') return String(ts);

  const trimmed = ts.trim();
  if (!trimmed || trimmed === 'error' || trimmed === 'alat rusak') {
    return trimmed;
  }

  // Jika string murni angka Unix epoch (10 digit detik atau 13 digit milidetik)
  if (/^\d{10}(\d{3})?$/.test(trimmed)) {
    const num = Number(trimmed);
    const ms = trimmed.length === 10 ? num * 1000 : num;
    const d = new Date(ms);
    if (!Number.isNaN(d.getTime())) {
      return d.toISOString();
    }
  }

  // Format SQL / ISO dengan spasi atau garis miring: "2026-10-04 08:02:06" atau "2026/10/04 08:02"
  const ymdMatch = trimmed.match(
    /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})[T\s]+(\d{1,2}):(\d{1,2})(?::(\d{1,2})(?:\.(\d+))?)?(Z|[+-]\d{2}:?\d{2})?$/
  );
  if (ymdMatch) {
    const [, yyyy, mmRaw, ddRaw, hRaw, mRaw, sRaw = '00', msRaw = '', tzRaw = ''] = ymdMatch;
    const mm = mmRaw.padStart(2, '0');
    const dd = ddRaw.padStart(2, '0');
    const hh = hRaw.padStart(2, '0');
    const mi = mRaw.padStart(2, '0');
    const ss = sRaw.padStart(2, '0');
    const frac = msRaw ? `.${msRaw}` : '';
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}:${ss}${frac}${tzRaw}`;
  }

  // Format: "28-07-25 06:30:00" atau "28-07-2025 06:30:00" atau "28/07/2025 06:30:00"
  const customMatch = trimmed.match(
    /^(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})[T\s]+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?$/
  );
  if (customMatch) {
    const [, ddRaw, mmRaw, yyRaw, hRaw, mRaw, sRaw = '00'] = customMatch;
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
 * Mencari kolom waktu pada objek data API secara fleksibel (mencakup `timestamp`, `recorded_at`, `created_at`, dll.).
 */
export function extractTimestampField(item) {
  if (!item || typeof item !== 'object') return null;

  for (const key of TIMESTAMP_CANDIDATE_KEYS) {
    if (Object.prototype.hasOwnProperty.call(item, key)) {
      const rawVal = item[key];
      const normalized = parseFlexibleTimestamp(rawVal);
      if (normalized && (normalized === 'alat rusak' || parseFlexibleDate(normalized) !== null)) {
        return { key, rawValue: rawVal, timestamp: normalized };
      }
    }
  }

  // Fallback auto-detect: cari properti yang namanya mengandung kata waktu/tanggal (selain uptime)
  const fallbackKey = Object.keys(item).find((k) => {
    if (/uptime|status|state|id$/i.test(k)) return false;
    if (!/(time|date|_at$|At$|waktu|tanggal|tgl)/i.test(k)) return false;
    const val = item[k];
    if (typeof val !== 'string' && typeof val !== 'number') return false;
    return parseFlexibleDate(val) !== null;
  });

  if (fallbackKey) {
    const rawVal = item[fallbackKey];
    return {
      key: fallbackKey,
      rawValue: rawVal,
      timestamp: parseFlexibleTimestamp(rawVal),
    };
  }

  return null;
}

/**
 * Mencari nilai kolom sensor dari objek data API berdasarkan definisi `SENSOR_FIELD_SPECS`.
 */
export function extractSensorField(item, specKey) {
  if (!item || typeof item !== 'object') return null;
  if (specKey === 'timestamp') {
    const tsInfo = extractTimestampField(item);
    return tsInfo ? { key: tsInfo.key, value: tsInfo.rawValue, normalized: tsInfo.timestamp } : null;
  }

  const spec = SENSOR_FIELD_SPECS.find((s) => s.key === specKey);
  if (!spec) return null;

  const foundKey = spec.possibleKeys.find((k) => Object.prototype.hasOwnProperty.call(item, k));
  if (!foundKey) return null;

  return {
    key: foundKey,
    value: item[foundKey],
  };
}

/**
 * Mengekstrak array baris data dari berbagai variasi pembungkus JSON API.
 */
export function extractArrayFromApiResponse(payload) {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return null;

  const candidateArrays = [
    payload.result,
    payload.data?.result,
    payload.data?.rows,
    payload.data?.readings,
    payload.data?.items,
    payload.data,
    payload.readings,
    payload.rows,
    payload.items,
    payload.records,
  ];

  for (const candidate of candidateArrays) {
    if (Array.isArray(candidate)) {
      return candidate;
    }
  }

  return null;
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
 * Mengecek apakah baris data memiliki pembacaan sensor utama (suhu/kelembaban) yang benar-benar hidup (> 0),
 * untuk menghindari baris saat sensor sedang mati dan mengirim angka 0 semua.
 */
function hasNonZeroPrimaryReading(item) {
  if (!item) return false;
  const hum = typeof item.humidity === 'number' && Number.isFinite(item.humidity) ? item.humidity : 0;
  const temp = typeof item.temperature === 'number' && Number.isFinite(item.temperature) ? item.temperature : 0;
  return hum > 0 || temp > 0;
}

/**
 * Mencari baris data aktif terakhir dari array data yang sudah diurutkan terbaru di atas.
 * Prioritas 1: Semua sensor utama (`primaryKeys`) bernilai numerik valid DAN suhu/kelembaban > 0.
 * Prioritas 2: Minimal 1 sensor (`allSensorKeys`) bernilai numerik valid DAN suhu/kelembaban > 0.
 * Prioritas 3 (Fallback): Baris dengan nilai numerik valid meskipun bernilai 0.
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
    sorted.find((row) => hasCompleteSensorValues(row, primaryKeys) && hasNonZeroPrimaryReading(row)) ||
    sorted.find((row) => hasAnySensorValue(row, allSensorKeys) && hasNonZeroPrimaryReading(row)) ||
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
