// TaskTracker App - JavaScript Frontend

// Utility Functions
const showAlert = (message, type = 'error') => {
    const container = document.getElementById('alert-container');
    if (!container) return;
    
    container.innerHTML = `
        <div class="alert alert-${type}">
            ${message}
        </div>
    `;
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        container.innerHTML = '';
    }, 5000);
};

const apiRequest = async (url, options = {}) => {
    try {
        const response = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Request failed');
        }
        
        return data;
    } catch (error) {
        throw error;
    }
};

// Auth Page Handlers
const initLoginPage = () => {
    const form = document.getElementById('login-form');
    if (!form) return;
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        try {
            const data = await apiRequest('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ username, password })
            });
            
            if (data.success) {
                window.location.href = '/';
            }
        } catch (error) {
            showAlert(error.message, 'error');
        }
    });
};

const initRegisterPage = () => {
    const form = document.getElementById('register-form');
    if (!form) return;
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        try {
            const data = await apiRequest('/auth/register', {
                method: 'POST',
                body: JSON.stringify({ username, password })
            });
            
            if (data.success) {
                showAlert(data.message, 'success');
                setTimeout(() => {
                    window.location.href = '/auth/login';
                }, 1500);
            }
        } catch (error) {
            showAlert(error.message, 'error');
        }
    });
};

// Dashboard Functionality
let currentUser = null;

const loadCurrentUser = async () => {
    try {
        const data = await apiRequest('/auth/api/me');
        currentUser = data;
        
        // Update UI with user info
        const nameElement = document.getElementById('user-display-name');
        if (nameElement) {
            nameElement.textContent = currentUser.username;
        }
        
        // Show admin button if user is admin
        const adminBtn = document.getElementById('admin-btn');
        if (adminBtn && currentUser.is_admin) {
            adminBtn.style.display = 'block';
            adminBtn.addEventListener('click', () => {
                window.location.href = '/auth/admin/users';
            });
        }
        
        return currentUser;
    } catch (error) {
        console.error('Failed to load user:', error);
        // Redirect to login if not authenticated
        window.location.href = '/auth/login';
    }
};

const initDashboard = async () => {
    // Load user info
    await loadCurrentUser();
    
    // Setup logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            try {
                await apiRequest('/auth/logout', { method: 'POST' });
                window.location.href = '/auth/login';
            } catch (error) {
                console.error('Logout failed:', error);
                window.location.href = '/auth/login';
            }
        });
    }
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    // Check which page we're on and initialize accordingly
    if (document.getElementById('login-form')) {
        initLoginPage();
    } else if (document.getElementById('register-form')) {
        initRegisterPage();
    } else if (document.getElementById('dashboard-section')) {
        initDashboard();
    }
});
