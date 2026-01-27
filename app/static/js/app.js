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

// Dashboard Context & Statistics
const updateDashboardContext = () => {
    const now = new Date();

    // Time-based greeting
    const hour = now.getHours();
    let greeting = 'Good Evening';
    if (hour < 12) {
        greeting = 'Good Morning';
    } else if (hour < 18) {
        greeting = 'Good Afternoon';
    }

    const greetingElement = document.getElementById('greeting-time');
    if (greetingElement) {
        greetingElement.textContent = greeting + ',';
    }

    // Current date (e.g., "Tuesday, Jan 14")
    const dateOptions = { weekday: 'long', month: 'short', day: 'numeric' };
    const formattedDate = now.toLocaleDateString('en-US', dateOptions);

    const dateElement = document.getElementById('current-date');
    if (dateElement) {
        dateElement.textContent = formattedDate;
    }

    // Week number calculation
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const pastDaysOfYear = (now - startOfYear) / 86400000;
    const weekNumber = Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);

    const weekElement = document.getElementById('week-number');
    if (weekElement) {
        weekElement.textContent = `Week ${weekNumber}`;
    }
};

const updateQuickStats = () => {
    // Current date in local timezone
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // All Tasks
    const allTasks = tasks.length;

    // Open tasks
    const openTasks = tasks.filter(task => task.status !== 'done').length;

    // ToDo tasks
    const todoTasks = tasks.filter(task => task.status === 'todo').length;

    // In progress tasks
    const inProgress = tasks.filter(task => task.status === 'in_progress').length;

    // Tasks due today
    const dueToday = tasks.filter(task => {
        if (!task.due_date || task.status === 'done') return false;
        const taskDate = new Date(task.due_date);
        return taskDate.toDateString() === now.toDateString();
    }).length;

    // Overdue tasks
    const overdue = tasks.filter(task => {
        if (!task.due_date || task.status === 'done') return false;
        const taskDate = new Date(task.due_date);
        return taskDate < today;
    }).length;

    // Tasks completed today
    const completedToday = tasks.filter(task => {
        if (task.status !== 'done' || !task.updated_at) return false;
        const updatedDate = new Date(task.updated_at);
        return updatedDate.toDateString() === now.toDateString();
    }).length;

    // Today's workload: all tasks worked on today (todo + in_progress + completed today)
    const todaysWorkload = openTasks + completedToday;


    // Update numbers in the UI
    const todoEl = document.getElementById('open-count');
    const dueTodayEl = document.getElementById('due-today-count');
    const overdueEl = document.getElementById('overdue-count');
    const inProgressEl = document.getElementById('in-progress-count');
    const completedTodayEl = document.getElementById('completed-today-count');

    if (todoEl) todoEl.textContent = todoTasks;
    if (inProgressEl) inProgressEl.textContent = inProgress;
    if (completedTodayEl) completedTodayEl.textContent = completedToday;

    // Bottom stats show as ratio (e.g., "3 / 10")
    if (dueTodayEl) dueTodayEl.textContent = `${dueToday} / ${openTasks}`;
    if (overdueEl) overdueEl.textContent = `${overdue} / ${openTasks}`;
    if (completedTodayEl) completedTodayEl.textContent = `${completedToday} / ${todaysWorkload}`;

    // Scale progress bars based on total open tasks
    const totalForScaling = openTasks || 1;

    // Update progress bars for bottom stat cards
    const dueTodayBar = document.getElementById('due-today-bar');
    const overdueBar = document.getElementById('overdue-bar');
    const completedTodayBar = document.getElementById('completed-today-bar');

    if (dueTodayBar) {
        dueTodayBar.style.width = `${(dueToday / totalForScaling) * 100}%`;
    }

    if (overdueBar) {
        overdueBar.style.width = `${(overdue / totalForScaling) * 100}%`;
    }

    if (completedTodayBar) {
        const workloadForScaling = todaysWorkload || 1;
        completedTodayBar.style.width = `${(completedToday / workloadForScaling) * 100}%`;
    }
};

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
let mobileStatusFilter = null;

const loadTasks = async () => {
    try {
        const data = await apiRequest('/api/tasks');
        tasks = data.tasks;

        renderTasks(tasks)
        applyFilters();
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

    // Calculate counts from the FULL task list (not filtered)
    const todoCountTotal = tasks.filter(task => task.status === 'todo').length;
    const inProgressCountTotal = tasks.filter(task => task.status === 'in_progress').length;
    const doneCountTotal = tasks.filter(task => task.status === 'done').length;

    // Update task counts (both column headers and mobile tabs) with FULL counts
    document.getElementById('todo-count').textContent = todoCountTotal;
    document.getElementById('in-progress-count').textContent = inProgressCountTotal;
    document.getElementById('in-progress-count-column').textContent = inProgressCountTotal;
    document.getElementById('done-count').textContent = doneCountTotal;

    // Update mobile tab counts with FULL counts
    const tabTodoCount = document.getElementById('tab-todo-count');
    const tabInProgressCount = document.getElementById('tab-in-progress-count');
    const tabDoneCount = document.getElementById('tab-done-count');

    if (tabTodoCount) tabTodoCount.textContent = todoCountTotal;
    if (tabInProgressCount) tabInProgressCount.textContent = inProgressCountTotal;
    if (tabDoneCount) tabDoneCount.textContent = doneCountTotal;

    // Group tasks by status from the FILTERED list for rendering
    const todoTasks = taskList.filter(task => task.status === 'todo');
    const inProgressTasks = taskList.filter(task => task.status === 'in_progress');
    const doneTasks = taskList.filter(task => task.status === 'done');

    // Helper function to render task HTML
    const renderTaskCard = (task) => {
        // Determine checkbox class based on status
        let checkboxClass = '';

        if (task.status === 'in_progress') {
            checkboxClass = 'in-progress';
        } else if (task.status === 'done') {
            checkboxClass = 'done';
        }

        return `
        <div class="task-card glass-panel ${task.status === 'done' ? 'completed' : ''}
                                        ${isOverdue(task) ? 'overdue' : ''}" 
             data-task-id="${task.id}" 
             onclick="handleTaskCardClick(event, ${task.id})">
            <div class="task-checkbox-wrapper">
                <input type="checkbox" class="task-checkbox ${checkboxClass}"
                       onchange="toggleTaskStatus(${task.id})"
                       title="Change status">
            </div>
            <div class="task-content">
                <div class="task-main">
                    <h3 class="task-title">${escapeHtml(task.title)}</h3>
                    <span class="task-priority" style="background: ${getPriorityColor(task.priority)}" title="${task.priority}">
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
                <button class="icon-btn" onclick="editTask(${task.id}); event.stopPropagation();" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="icon-btn" onclick="deleteTask(${task.id}); event.stopPropagation();" title="Delete">
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

    updateProgressBar(tasks);
    updateQuickStats();
};

const applyFilters = () => {
    const filterValue = document.getElementById('filter-select').value;
    const sortValue = document.getElementById('sort-select').value;
    const searchQuery = document.getElementById('search-input').value.toLowerCase();

    let filteredTasks = [...tasks];

    // Apply mobile status filter first (on mobile only)
    if (window.innerWidth < 768 && mobileStatusFilter !== null) {
        switch (mobileStatusFilter) {
            case 'todo':
                filteredTasks = filteredTasks.filter(task => task.status === 'todo');
                break;
            case 'in_progress':
                filteredTasks = filteredTasks.filter(task => task.status === 'in_progress');
                break;
            case 'done':
                filteredTasks = filteredTasks.filter(task => task.status === 'done');
                break;
        }
    }

    filteredTasks = filteredTasks.filter(task => {
        switch (filterValue) {
            case 'high_priority':
                return task.priority === 'high';

            case 'overdue':
                if (!task.due_date) return false;
                return new Date(task.due_date) < new Date().setHours(0, 0, 0, 0) && task.status !== 'done';

            case 'due_today':
                dueDate = new Date(task.due_date);
                if (!task.due_date) return false;
                return dueDate.getDate() === new Date().getDate() &&
                    dueDate.getMonth() === new Date().getMonth() &&
                    task.status !== 'done';

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
                aPriority = priorityOrder[a.priority];
                bPriority = priorityOrder[b.priority];

                /* sort overdue tasks first */
                if (aPriority === bPriority) {
                    return isOverdue(a) ? -1 : 1;
                } else {
                    return aPriority - bPriority;
                }

            case 'created_at':
                return new Date(b.created_at) - new Date(a.created_at);
        }
    });

    if (searchQuery) {
        filteredTasks = filteredTasks.filter(task =>
            task.title.toLowerCase().includes(searchQuery) ||
            task.tags && task.tags.toLowerCase().includes(searchQuery)
        );
    }
    renderTasks(filteredTasks);
};

const isOverdue = (task) => {
    if (!task.due_date) return false;
    if (task.status === 'done') return false;

    return new Date(task.due_date) < new Date().setHours(0, 0, 0, 0);
};

const updateProgressBar = (taskList = tasks) => {
    const totalTasks = taskList.length;
    const completedTasks = taskList.filter(task => task.status === 'done').length;

    const progress = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

    // Update text
    const progressText = document.getElementById('progress-text');
    if (progressText) {
        progressText.textContent = `${progress}%`;
    }

    // Update circular progress indicator
    const progressCircle = document.getElementById('progress-circle');
    if (progressCircle) {
        // Mobile-first: 44px radius for mobile, 70px for desktop
        const isDesktop = window.innerWidth >= 768;
        const radius = isDesktop ? 70 : 44;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - (progress / 100) * circumference;
        progressCircle.style.strokeDashoffset = offset;
    }
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
    const deleteBtn = document.getElementById('delete-task-btn');

    // Update modal title
    modalTitle.textContent = task ? 'Edit Task' : 'Add New Task';
    submitBtn.textContent = task ? 'Update Task' : 'Add Task';

    // Show/hide delete button
    if (task) {
        deleteBtn.classList.remove('hidden');
    } else {
        deleteBtn.classList.add('hidden');
    }

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

// Handle task card click (mobile: open edit, desktop: buttons handle it)
const handleTaskCardClick = (event, taskId) => {
    // Only enable click-to-edit in mobile view (< 768px)
    if (window.innerWidth >= 768) {
        return; // Desktop: use buttons instead
    }

    // Don't open modal if clicking on checkbox, buttons, or interactive elements
    const target = event.target;
    if (target.closest('.task-checkbox-wrapper') ||
        target.closest('.task-actions') ||
        target.tagName === 'BUTTON' ||
        target.tagName === 'INPUT') {
        return;
    }

    // Open edit modal
    editTask(taskId);
};


const toggleLightMode = () => {
    document.body.dataset.theme = document.body.dataset.theme === 'light' ? '' : 'light';
}


// Initialize mobile filter tabs
const initMobileFilterTabs = () => {
    const tabs = document.querySelectorAll('.status-tab');
    if (!tabs.length) return;

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const clickedStatus = tab.getAttribute('data-status');

            // Toggle behavior: if clicking the same tab, deactivate it and show all
            if (mobileStatusFilter === clickedStatus) {
                // Deactivate all tabs and show all tasks
                tabs.forEach(t => t.classList.remove('active'));
                mobileStatusFilter = null;
            } else {
                // Remove active class from all tabs
                tabs.forEach(t => t.classList.remove('active'));

                // Add active class to clicked tab
                tab.classList.add('active');

                // Update filter state
                mobileStatusFilter = clickedStatus;
            }

            // Re-apply filters
            applyFilters();
        });
    });
};

// Make functions global
window.showTaskModal = showTaskModal;
window.closeModal = closeModal;
window.editTask = editTask;
window.deleteTask = deleteTask;
window.toggleTaskStatus = toggleTaskStatus;
window.handleTaskCardClick = handleTaskCardClick;

const initDashboard = async () => {
    // Load user info
    await loadCurrentUser();

    // Update dashboard context (date, time, week)
    updateDashboardContext();

    // Load tasks
    await loadTasks();

    // Initialize mobile filter tabs
    initMobileFilterTabs();

    // Setup add task button
    const addTaskBtn = document.getElementById('add-task-btn');
    if (addTaskBtn) {
        addTaskBtn.addEventListener('click', () => showTaskModal());
    }

    // Setup LightMode button
    const lightModeButton = document.getElementById('lightMode-toggle')
    if (lightModeButton) {
        lightModeButton.addEventListener('click', () => toggleLightMode());
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

    // Setup delete button in modal
    const deleteTaskBtn = document.getElementById('delete-task-btn');
    if (deleteTaskBtn) {
        deleteTaskBtn.addEventListener('click', async () => {
            if (editingTaskId && confirm('Are you sure you want to delete this task?')) {
                await deleteTask(editingTaskId);
                closeModal();
            }
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

        // Dashboard-only event listeners
        const filterSelect = document.getElementById('filter-select');
        const sortSelect = document.getElementById('sort-select');
        const searchInput = document.getElementById('search-input');

        if (filterSelect) filterSelect.addEventListener('change', applyFilters);
        if (sortSelect) sortSelect.addEventListener('change', applyFilters);
        if (searchInput) searchInput.addEventListener('input', applyFilters);
    }
});
