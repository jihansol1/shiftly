// set up axios to communicate with backend.
// configure the base URL, automatically attatch JWT token to requests, provide functions for all API calls

import axios from 'axios';

// Create axios instance with base URL
const api = axios.create({
  baseURL: 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor: Attach token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ============ Auth ============
export const register = (userData) => {
  return api.post('/auth/register', userData);
};

export const login = (credentials) => {
  return api.post('/auth/login', credentials);
};

// ============ Offices ============
export const createOffice = (name) => {
  return api.post('/offices', { name });
};

export const getMyOffices = () => {
  return api.get('/offices');
};

export const joinOffice = (inviteCode) => {
  return api.post('/offices/join', { invite_code: inviteCode });
};

export const getOfficeMembers = (officeId) => {
  return api.get(`/offices/${officeId}/members`);
};

// ============ Availability ============
export const submitAvailability = (officeId, availabilities) => {
  return api.put(`/offices/${officeId}/availability`, { availabilities });
};

export const getMyAvailability = (officeId) => {
  return api.get(`/offices/${officeId}/availability/me`);
};

export const getAllAvailability = (officeId) => {
  return api.get(`/offices/${officeId}/availability/all`);
};

// ============ Schedules ============
export const generateSchedule = (officeId, weekStartDate, shiftsNeeded) => {
  return api.post(`/offices/${officeId}/schedule/generate`, {
    week_start_date: weekStartDate,
    shifts_needed: shiftsNeeded,
  });
};

export const getSchedule = (officeId, weekStart) => {
  return api.get(`/offices/${officeId}/schedule`, {
    params: { week_start: weekStart },
  });
};

export const createShift = (officeId, shiftData) => {
  return api.post(`/offices/${officeId}/shifts`, shiftData);
};

export const deleteShift = (shiftId) => {
  return api.delete(`/shifts/${shiftId}`);
};

export default api;