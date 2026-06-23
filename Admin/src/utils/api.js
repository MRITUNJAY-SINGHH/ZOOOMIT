const API_BASE_URL = 'http://localhost:5000/api';

export const fetchApi = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  // If uploading a file/FormData, we must remove the explicit Content-Type 
  // so the browser can automatically generate the multipart/form-data boundary
  if (options.body instanceof FormData || headers['Content-Type'] === 'multipart/form-data') {
    delete headers['Content-Type'];
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401 && data.message === 'Not authorized, token failed') {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        window.location.href = '/auth/sign-in';
      }
      const error = new Error(data.message || 'Something went wrong');
      error.response = { data };
      throw error;
    }

    return data;
  } catch (error) {
    console.error(`API Error: ${error.message}`);
    throw error;
  }
};

const api = {
  get: async (endpoint, options = {}) => {
    const data = await fetchApi(endpoint, { ...options, method: 'GET' });
    return { data };
  },
  post: async (endpoint, bodyData, options = {}) => {
    // Determine content type handling if it's FormData vs JSON
    const isFormData = bodyData instanceof FormData;
    const body = isFormData ? bodyData : JSON.stringify(bodyData);
    
    // If FormData, let browser set Content-Type header by removing it
    const fetchOptions = { ...options, method: 'POST', body };
    if (isFormData) {
      fetchOptions.headers = { ...options.headers };
      // Note: fetchApi already sets 'Content-Type': 'application/json' by default, 
      // we need to override it if FormData.
    }
    const data = await fetchApi(endpoint, fetchOptions);
    return { data };
  },
  put: async (endpoint, bodyData, options = {}) => {
    const data = await fetchApi(endpoint, { ...options, method: 'PUT', body: JSON.stringify(bodyData) });
    return { data };
  },
  delete: async (endpoint, options = {}) => {
    const data = await fetchApi(endpoint, { ...options, method: 'DELETE' });
    return { data };
  },
};

export default api;
