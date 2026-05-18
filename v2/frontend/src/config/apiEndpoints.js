const DEFAULT_API_BASE_URL = 'https://full-climate-tawny.vercel.app';

const normalizeBaseUrl = (value) => (value || DEFAULT_API_BASE_URL).replace(/\/$/, '');

export const API_BASE_URL = normalizeBaseUrl(process.env.REACT_APP_API_BASE_URL);

const buildEndpoint = (envValue, fallbackPath) =>
  envValue || `${API_BASE_URL}${fallbackPath}`;

export const PETENGORAN_DAILY_STATION1_URL = buildEndpoint(
  process.env.REACT_APP_API_PETENGORAN_DAILY_STATION1,
  '/petengoran/station1/history'
);

export const PETENGORAN_RESAMPLE15M_STATION1_URL = buildEndpoint(
  process.env.REACT_APP_API_PETENGORAN_RESAMPLE15M_STATION1,
  '/petengoran/station1/history?limit=500'
);

export const PETENGORAN_TOPIC4_URL = buildEndpoint(
  process.env.REACT_APP_API_PETENGORAN_GET_TOPIC4,
  '/petengoran/topic4/history'
);

export const PETENGORAN_DAILY_STATION2_URL = buildEndpoint(
  process.env.REACT_APP_API_PETENGORAN_DAILY_STATION2,
  '/petengoran/station2/history'
);

export const PETENGORAN_RESAMPLE15M_STATION2_URL = buildEndpoint(
  process.env.REACT_APP_API_PETENGORAN_RESAMPLE15M_STATION2,
  '/petengoran/station2/history'
);

export const PETENGORAN_TOPIC5_URL = buildEndpoint(
  process.env.REACT_APP_API_PETENGORAN_GET_TOPIC5,
  '/petengoran/topic5/history'
);

export const KALIMANTAN_ONEDAY_TOPIC1_URL = buildEndpoint(
  process.env.REACT_APP_API_KALIMANTAN_ONEDAY_TOPIC1,
  '/dashboard/topic4/history?limit=200'
);

export const KALIMANTAN_SEVENDAYS_TOPIC1_URL = buildEndpoint(
  process.env.REACT_APP_API_KALIMANTAN_SEVENDAYS_TOPIC1,
  '/dashboard/topic4/history?limit=500'
);

export const KALIMANTAN_ONEMONTH_TOPIC1_URL = buildEndpoint(
  process.env.REACT_APP_API_KALIMANTAN_ONEMONTH_TOPIC1,
  '/dashboard/topic4/history?limit=1000'
);
