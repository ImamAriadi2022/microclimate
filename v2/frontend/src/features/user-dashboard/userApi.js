import { USER_API_BASE_URL } from '../../config/apiEndpoints';

const TOKEN_KEY = 'mc_v2_auth_token';

const getAuthToken = () => localStorage.getItem(TOKEN_KEY) || '';

const storeUser = (user = {}) => {
  if (!user) return;
  localStorage.setItem('mc_v2_login_email', user.email || '');
  localStorage.setItem('mc_v2_username', user.username || '');
  localStorage.setItem('mc_v2_display_name', user.fullName || user.username || '');
  localStorage.setItem('mc_v2_profile_photo', user.profilePhoto || '');
};

const storeAuthSession = ({ token, user }) => {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  }
  storeUser(user);
};

const clearAuthSession = () => {
  localStorage.removeItem(TOKEN_KEY);
};

const apiRequest = async (path, options = {}) => {
  const headers = {
    Accept: 'application/json',
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(options.auth !== false && getAuthToken()
      ? { Authorization: `Bearer ${getAuthToken()}` }
      : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(`${USER_API_BASE_URL}${path}`, {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (response.status === 204) {
    return null;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || `HTTP ${response.status}`);
    error.status = response.status;
    throw error;
  }

  return data;
};

const registerAccount = (payload) =>
  apiRequest('/auth/register', { method: 'POST', body: payload, auth: false });

const loginAccount = (payload) =>
  apiRequest('/auth/login', { method: 'POST', body: payload, auth: false });

const saveProfile = (payload) =>
  apiRequest('/me/profile', { method: 'PATCH', body: payload });

const saveEmail = (payload) =>
  apiRequest('/me/email', { method: 'PATCH', body: payload });

const savePassword = (payload) =>
  apiRequest('/me/password', { method: 'PATCH', body: payload });

const listEndpointConfigs = () => apiRequest('/user/configs');

const saveEndpointConfig = (payload) =>
  apiRequest('/user/configs', { method: 'POST', body: payload });

const activateEndpointConfig = (id) =>
  apiRequest(`/user/configs/${encodeURIComponent(id)}/active`, { method: 'PATCH' });

const deleteEndpointConfig = (id) =>
  apiRequest(`/user/configs/${encodeURIComponent(id)}`, { method: 'DELETE' });

const listDashboardLinks = () => apiRequest('/user/dashboard-links');

const saveDashboardLink = (payload) =>
  apiRequest('/user/dashboard-links', { method: 'POST', body: payload });

const publishDashboardLink = (id) =>
  apiRequest(`/user/dashboard-links/${encodeURIComponent(id)}/publish`, { method: 'PATCH' });

const deleteDashboardLink = (id) =>
  apiRequest(`/user/dashboard-links/${encodeURIComponent(id)}`, { method: 'DELETE' });

const fetchPublicDashboardLink = (template, slug) =>
  apiRequest(`/public/dashboard-links/${encodeURIComponent(template)}/${encodeURIComponent(slug)}`, {
    auth: false,
  });

export {
  TOKEN_KEY,
  activateEndpointConfig,
  clearAuthSession,
  deleteDashboardLink,
  deleteEndpointConfig,
  fetchPublicDashboardLink,
  getAuthToken,
  listDashboardLinks,
  listEndpointConfigs,
  loginAccount,
  publishDashboardLink,
  registerAccount,
  saveDashboardLink,
  saveEmail,
  saveEndpointConfig,
  savePassword,
  saveProfile,
  storeAuthSession,
  storeUser,
};
