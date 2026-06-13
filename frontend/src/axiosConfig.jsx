import axios from 'axios';

const defaultBaseURL =
  process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5001';

const axiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || defaultBaseURL,
  headers: { 'Content-Type': 'application/json' },
});

export default axiosInstance;
