// Admin Panel - Dynamic User Management
class AdminPanel {
    constructor() {
        this.currentUserId = null;
        this.init();
    }

    async init() {
        await this.loadUsers();
    }

    async loadUsers() {
        try {
            const response = await fetch('/auth/api/users');
            const data = await response.json();
            
            this.currentUserId = data.current_user_id;
            this.renderUsers(data.users);
            this.updateStats(data.users);
        } catch (error) {
            console.error('Error loading users:', error);
            this.showError('Failed to load users');
        }
    }

    renderUsers(users) {
        const container = document.getElementById('users-container');
        
        if (users.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-users-slash"></i>
                    <p>No users found</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="user-table">
                <div class="table-header">
                    <div class="col-id">ID</div>
                    <div class="col-username">Username</div>
                    <div class="col-role">Role</div>
                    <div class="col-actions">Actions</div>
                </div>
                ${users.map(user => this.renderUserRow(user)).join('')}
            </div>
        `;
    }

    renderUserRow(user) {
        const isCurrentUser = user.id === this.currentUserId;
        const roleBadge = user.is_admin 
            ? '<span class="badge badge-admin"><i class="fas fa-shield-alt"></i> Admin</span>'
            : '<span class="badge badge-user"><i class="fas fa-user"></i> User</span>';
        
        const actionButton = isCurrentUser 
            ? '<span class="text-muted" title="You cannot delete yourself"><i class="fas fa-lock"></i></span>'
            : `<button class="btn-delete" onclick="adminPanel.deleteUser(${user.id}, '${user.username}')" title="Delete User">
                <i class="fas fa-trash"></i>
              </button>`;

        return `
            <div class="table-row" data-user-id="${user.id}">
                <div class="col-id">#${user.id}</div>
                <div class="col-username">
                    <i class="fas fa-user"></i> ${user.username}
                </div>
                <div class="col-role">${roleBadge}</div>
                <div class="col-actions">${actionButton}</div>
            </div>
        `;
    }

    updateStats(users) {
        const totalUsers = users.length;
        const totalAdmins = users.filter(u => u.is_admin).length;
        
        document.getElementById('total-users').textContent = totalUsers;
        document.getElementById('total-admins').textContent = totalAdmins;
    }

    async deleteUser(userId, username) {
        if (!confirm(`Are you sure you want to delete user ${username}?`)) {
            return;
        }

        try {
            const response = await fetch(`/auth/api/users/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (data.success) {
                this.showSuccess(data.message);
                this.removeUserRow(userId);
                await this.loadUsers(); // Reload to update stats
            } else {
                this.showError(data.error);
            }
        } catch (error) {
            console.error('Error deleting user:', error);
            this.showError('Failed to delete user');
        }
    }

    removeUserRow(userId) {
        const row = document.querySelector(`[data-user-id="${userId}"]`);
        if (row) {
            row.style.opacity = '0';
            row.style.transform = 'translateX(-20px)';
            setTimeout(() => row.remove(), 300);
        }
    }

    showFlashMessage(message, category) {
        const container = document.getElementById('flash-messages');
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${category}`;
        alertDiv.textContent = message;
        
        container.appendChild(alertDiv);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            alertDiv.style.opacity = '0';
            alertDiv.style.transform = 'translateY(-20px)';
            setTimeout(() => alertDiv.remove(), 400);
        }, 5000);
    }

    showSuccess(message) {
        this.showFlashMessage(message, 'success');
    }

    showError(message) {
        this.showFlashMessage(message, 'error');
    }
}

// Initialize admin panel
const adminPanel = new AdminPanel();
