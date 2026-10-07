const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://zooomit-backend.onrender.com/api';

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

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        window.location.href = '/auth/sign-in';
      }
      
      // Try to parse error as JSON, fallback to text
      let data;
      try {
        data = await response.json();
      } catch (e) {
        data = { message: await response.text() };
      }
      
      const error = new Error(data.message || 'Something went wrong');
      error.response = { data };
      throw error;
    }

    if (options.responseType === 'blob') {
      return await response.blob();
    }

    return await response.json();
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
