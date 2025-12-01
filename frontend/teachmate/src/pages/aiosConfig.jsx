import axios from "axios";

const instance = axios.create({
  baseURL: `http://${process.env.BASE_URL}:8000`, // Base URL for your backend
});

// Add a request interceptor to include the token
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token"); // Retrieve the token from localStorage
    if (token) {
      config.headers.Authorization = `Bearer ${token}`; // Add the token to the Authorization header
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default instance;
