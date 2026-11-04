export async function parseJsonResponse(response) {
  // Read response as text first to safely handle non-JSON responses (like HTML)
  const text = await response.text();
  // Try to parse JSON, otherwise fall back to raw text
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch (err) {
    // not JSON
    data = null;
  }

  if (!response.ok) {
    if (response.status === 401) {
      // Token expired or invalidated (e.g. password changed)
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login'; // Auto-redirect to login
      throw new Error('Session expired. Please log in again.');
    }
    
    if (response.status === 402) {
      // Overdue Shop -> Read-only mode
      const msg = data && (data.message || data.error) ? (data.message || data.error) : 'Account Overdue. You are in Read-Only Mode.';
      alert(msg); // Optional: Simple alert to notify user why action failed
      throw new Error(msg);
    }

    // Prefer structured message if available
    const msg = data && (data.message || data.error) ? (data.message || data.error) : (text ? text : `Request failed with status ${response.status}`);
    throw new Error(msg);
  }

  // If parsing succeeded, return the object; otherwise return the raw text
  return data !== null ? data : text;
}

/**
 * Enhanced fetch with browser offline check and configurable timeout
 */
export async function safeFetch(url, options = {}, timeoutMs = 25000) {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    throw new Error('Network offline: Please check your internet connection and try again.');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('Connection timed out: The server took too long to respond. Please check your network and try again.');
    }
    if (err.message && (err.message.toLowerCase().includes('failed to fetch') || err.message.toLowerCase().includes('networkerror'))) {
      throw new Error('Network error: Unable to connect to the server. Please check your internet connection.');
    }
    throw err;
  }
}

export default { parseJsonResponse, safeFetch };
