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

// Task Management
let tasks = [];
let editingTaskId = null;

const loadTasks = async () => {
    try {
        const data = await apiRequest('/api/tasks');
        tasks = data.tasks;
        renderTasks();
    } catch (error) {
        console.error('Failed to load tasks:', error);
        showAlert('Failed to load tasks', 'error');
    }
};

const renderTasks = (taskList = tasks) => {
    const todoContainer = document.getElementById('todo-tasks');
    const inProgressContainer = document.getElementById('in-progress-tasks');
    const doneContainer = document.getElementById('done-tasks');

    if (!todoContainer || !inProgressContainer || !doneContainer) return;

    // Group tasks by status
    const todoTasks = taskList.filter(task => task.status === 'todo');
    const inProgressTasks = taskList.filter(task => task.status === 'in_progress');
    const doneTasks = taskList.filter(task => task.status === 'done');

    // Update task counts
    document.getElementById('todo-count').textContent = todoTasks.length;
    document.getElementById('in-progress-count').textContent = inProgressTasks.length;
    document.getElementById('done-count').textContent = doneTasks.length;

    // Helper function to render task HTML
    const renderTaskCard = (task) => {
        // Determine checkbox state and class
        let checkboxChecked = '';
        let checkboxClass = '';

        if (task.status === 'in_progress') {
            checkboxClass = 'in-progress';
        } else if (task.status === 'done') {
            checkboxChecked = 'checked';
            checkboxClass = 'done';
        }

        return `
        <div class="task-card glass-panel ${task.status === 'done' ? 'completed' : ''}
                                        ${isOverdue(task) ? 'overdue' : ''}">
            <div class="task-checkbox-wrapper">
                <input type="checkbox" class="task-checkbox ${checkboxClass}" ${checkboxChecked}
                       onchange="toggleTaskStatus(${task.id})"
                       title="Change status">
            </div>
            <div class="task-content">
                <div class="task-main">
                    <h3 class="task-title">${escapeHtml(task.title)}</h3>
                    <span class="task-priority" style="background: ${getPriorityColor(task.priority)}">
                        ${task.priority}
                    </span>
                    ${isOverdue(task) ? `
                    <span class="task-overdue-badge">
                        <i class="fas fa-exclamation-circle"></i> Overdue
                    </span>` : ''}
                </div>
                ${task.description ? `<p class="task-description">${escapeHtml(task.description)}</p>` : ''}
                <div class="task-meta">
                    ${task.due_date ? `<span class="${isOverdue(task) ? 'overdue-date' : ''}">
                        <i class="fas fa-calendar"></i> ${task.due_date}
                    </span>` : ''}
                    ${task.tags ? `<span><i class="fas fa-tags"></i> ${task.tags}</span>` : ''}
                </div>
            </div>
            <div class="task-actions">
                <button class="icon-btn" onclick="editTask(${task.id})" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="icon-btn" onclick="deleteTask(${task.id})" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `;
    };

    // Render tasks in respective columns
    if (todoTasks.length === 0) {
        todoContainer.innerHTML = '<div class="empty-state"><p>No tasks</p></div>';
    } else {
        todoContainer.innerHTML = todoTasks.map(renderTaskCard).join('');
    }

    if (inProgressTasks.length === 0) {
        inProgressContainer.innerHTML = '<div class="empty-state"><p>No tasks</p></div>';
    } else {
        inProgressContainer.innerHTML = inProgressTasks.map(renderTaskCard).join('');
    }

    if (doneTasks.length === 0) {
        doneContainer.innerHTML = '<div class="empty-state"><p>No tasks</p></div>';
    } else {
        doneContainer.innerHTML = doneTasks.map(renderTaskCard).join('');
    }
};

const applyFilters = () => {
    const filterValue = document.getElementById('filter-select').value;
    const sortValue = document.getElementById('sort-select').value;
    const searchQuery = document.getElementById('search-input').value.toLowerCase();

    let filteredTasks = [...tasks];

    filteredTasks = filteredTasks.filter(task => {
        switch (filterValue) {
            case 'open':
                return task.status !== 'done';

            case 'done':
                return task.status === 'done';

            case 'high_priority':
                return task.priority === 'high';

            case 'overdue':
                if (!task.due_date) return false;
                return new Date(task.due_date) < new Date() && task.status !== 'done';

            default:
                return true;
        }
    });

    filteredTasks.sort((a, b) => {
        switch (sortValue) {
            case 'due_date':
                return new Date(a.due_date) - new Date(b.due_date);

            case 'priority':
                const priorityOrder = { high: 1, medium: 2, low: 3 };
                return priorityOrder[a.priority] - priorityOrder[b.priority];

            case 'created_at':
            default:
                return new Date(b.created_at) - new Date(a.created_at);
        }
    });

    if (searchQuery) {
        filteredTasks = filteredTasks.filter(task =>
            task.title.toLowerCase().includes(searchQuery) ||
            task.description && task.description.toLowerCase().includes(searchQuery) || /*TO-DO maybe remove searching for desc?*/ 
            task.tags && task.tags.toLowerCase().includes(searchQuery)
        );
    }
    renderTasks(filteredTasks);
};

const isOverdue = (task) => {
    if (!task.due_date) return false;
    if (task.status === 'done') return false;

    return new Date(task.due_date) < new Date();
};

const getPriorityColor = (priority) => {
    const colors = {
        high: 'linear-gradient(135deg, #ff4b1f, #ff1744)',
        medium: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
        low: 'linear-gradient(135deg, #10b981, #059669)'
    };
    return colors[priority] || colors.medium;
};

const escapeHtml = (text) => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
};

const showTaskModal = (task = null) => {
    editingTaskId = task ? task.id : null;
    const modal = document.getElementById('task-modal');
    const modalTitle = document.getElementById('modal-title');
    const taskIdField = document.getElementById('task-id');
    const submitBtn = document.getElementById('submit-btn');

    // Update modal title
    modalTitle.textContent = task ? 'Edit Task' : 'Add New Task';
    submitBtn.textContent = task ? 'Update Task' : 'Add Task';

    // Populate form fields
    if (task) {
        taskIdField.value = task.id;
        document.getElementById('task-title').value = task.title;
        document.getElementById('task-desc').value = task.description || '';
        document.getElementById('task-priority').value = task.priority || 'medium';
        document.getElementById('task-due').value = task.due_date || '';
        document.getElementById('task-tags').value = task.tags || '';
    } else {
        taskIdField.value = '';
        document.getElementById('task-title').value = '';
        document.getElementById('task-desc').value = '';
        document.getElementById('task-priority').value = 'medium';
        document.getElementById('task-due').value = '';
        document.getElementById('task-tags').value = '';
    }

    // Show modal
    modal.classList.remove('hidden');
};

const closeModal = () => {
    const modal = document.getElementById('task-modal');
    if (modal) modal.classList.add('hidden');
    editingTaskId = null;
};

const saveTask = async () => {
    const taskData = {
        title: document.getElementById('task-title').value,
        description: document.getElementById('task-desc').value,
        priority: document.getElementById('task-priority').value,
        due_date: document.getElementById('task-due').value,
        tags: document.getElementById('task-tags').value
    };

    try {
        if (editingTaskId) {
            await apiRequest(`/api/tasks/${editingTaskId}`, {
                method: 'PUT',
                body: JSON.stringify(taskData)
            });
            showAlert('Task updated successfully', 'success');
        } else {
            await apiRequest('/api/tasks', {
                method: 'POST',
                body: JSON.stringify(taskData)
            });
            showAlert('Task created successfully', 'success');
        }

        closeModal();
        await loadTasks();
    } catch (error) {
        showAlert(error.message, 'error');
    }
};

const editTask = (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) showTaskModal(task);
};

const deleteTask = async (taskId) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
        await apiRequest(`/api/tasks/${taskId}`, { method: 'DELETE' });
        showAlert('Task deleted successfully', 'success');
        await loadTasks();
    } catch (error) {
        showAlert(error.message, 'error');
    }
};

const toggleTaskStatus = async (taskId) => {
    try {
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;

        // Linear progression: todo -> in_progress -> done -> todo (restart)
        let newStatus = 'in_progress';
        if (task.status === 'todo') {
            newStatus = 'in_progress';
        } else if (task.status === 'in_progress') {
            newStatus = 'done';
        } else {
            // If done, restart to todo
            newStatus = 'todo';
        }

        await apiRequest(`/api/tasks/${taskId}`, {
            method: 'PUT',
            body: JSON.stringify({ status: newStatus })
        });
        await loadTasks();
    } catch (error) {
        showAlert(error.message, 'error');
    }
};

// Make functions global
window.showTaskModal = showTaskModal;
window.closeModal = closeModal;
window.editTask = editTask;
window.deleteTask = deleteTask;
window.toggleTaskStatus = toggleTaskStatus;

const initDashboard = async () => {
    // Load user info
    await loadCurrentUser();

    // Load tasks
    await loadTasks();

    // Setup add task button
    const addTaskBtn = document.getElementById('add-task-btn');
    if (addTaskBtn) {
        addTaskBtn.addEventListener('click', () => showTaskModal());
    }

    // Setup close modal button
    const closeModalBtn = document.getElementById('close-modal');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeModal);
    }

    // Setup task form submission
    const taskForm = document.getElementById('task-form');
    if (taskForm) {
        taskForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await saveTask();
        });
    }

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
    
    document.getElementById('filter-select').addEventListener('change', applyFilters);
    document.getElementById('sort-select').addEventListener('change', applyFilters);
    document.getElementById('search-input').addEventListener('input', applyFilters);
});
