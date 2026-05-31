// Authentication removed: provide no-op stubs so frontend API callers continue to work.

export const login = async ({ username, password }) => {
    // Pretend login succeeded and return a lightweight user object
    try { localStorage.removeItem('token'); localStorage.removeItem('user'); } catch (e) { }
    const user = { user: { username: username || 'local' } };
    return user;
};

export const register = async ({ username, password, role }) => {
    // No-op register; return success
    return { message: 'Registered (no-op)' };
};

export const getAuthHeader = () => {
    // No authentication headers required
    return {};
};

export const isTokenValid = () => true;
