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

export default { parseJsonResponse };
