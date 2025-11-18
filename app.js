/* global fetch */

const fallbackBudgetData = [
    { id: 1, category: 'Personnel Services (Salaries)', allocated: 3200000, spent: 2800000, status: 'Ongoing' },
    { id: 2, category: 'Maintenance and Operating Expenses (MOOE)', allocated: 4500000, spent: 2100000, status: 'Ongoing' },
    { id: 3, category: '20% Development Fund (Infrastructure)', allocated: 2000000, spent: 1500000, status: 'Completed' },
    { id: 4, category: 'Calamity Fund (5%)', allocated: 600000, spent: 0, status: 'Initial' },
    { id: 5, category: 'SK Fund (Youth Programs)', allocated: 800000, spent: 300000, status: 'Pending' },
    { id: 6, category: 'Gender and Development (GAD)', allocated: 900000, spent: 450000, status: 'Ongoing' },
];

const fallbackPosts = [
    {
        id: 1,
        title: 'Road Rehabilitation Update',
        body: 'Nightly works continue along the main thoroughfare to minimize traffic during peak hours. Expect partial lane closures.',
        image_url: null,
        created_at: new Date().toISOString(),
    },
    {
        id: 2,
        title: 'Health Center Expansion',
        body: 'The barangay health center is adding two consultation rooms and a dedicated vaccination bay. Construction kicks off next week.',
        image_url: null,
        created_at: new Date().toISOString(),
    },
];

let budgetData = [...fallbackBudgetData];
let posts = [...fallbackPosts];
let concernsList = [];
let selectedItemId = null;
let isAdminAuthenticated = false;

async function loadBudgetData() {
    try {
        const response = await fetch('api/get_budget.php', { cache: 'no-store' });
        if (!response.ok) throw new Error('Unable to reach the budget API.');
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
            budgetData = data.map((item, index) => ({
                id: Number(item.id ?? index + 1),
                category: item.category,
                allocated: Number(item.allocated),
                spent: Number(item.spent),
                status: item.status,
            }));
        } else {
            console.warn('Budget API returned no rows. Using fallback data.');
            budgetData = [...fallbackBudgetData];
        }
    } catch (error) {
        console.warn('Budget API unavailable, reverting to fallback seed.', error);
        budgetData = [...fallbackBudgetData];
    }
}

async function loadPosts() {
    try {
        const response = await fetch('api/get_posts.php', { cache: 'no-store' });
        if (!response.ok) throw new Error('Unable to reach the posts API.');
        const data = await response.json();
        posts = Array.isArray(data) ? data : [];
    } catch (error) {
        console.warn('Posts API unavailable, reverting to fallback announcements.', error);
        posts = [...fallbackPosts];
    } finally {
        renderPublicPosts();
    }
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        minimumFractionDigits: 2,
    }).format(amount);
}

function renderBudget() {
    const tableBody = document.querySelector('#budgetTable tbody');
    const summaryCards = document.getElementById('summary-cards');
    if (!tableBody || !summaryCards) return;

    tableBody.innerHTML = '';
    summaryCards.innerHTML = '';

    let totalBudget = 0;
    let totalSpent = 0;

    budgetData.forEach((item) => {
        totalBudget += item.allocated;
        totalSpent += item.spent;

        const remaining = item.allocated - item.spent;
        const percentageSpent = item.allocated === 0 ? 0 : (item.spent / item.allocated) * 100;
        const sanitizedProgress = Math.max(0, Math.min(percentageSpent, 100));

        const row = document.createElement('tr');
        row.className = 'allocation-row';

        const categoryCell = document.createElement('td');
        categoryCell.className = 'px-6 py-4 align-top';
        categoryCell.innerHTML = `
            <div class="allocation-category">
                <span class="allocation-category-title">${item.category}</span>
                <span class="allocation-category-remaining">Remaining: ${formatCurrency(remaining)}</span>
                <div class="allocation-progress-track mt-2">
                    <div class="allocation-progress-bar" style="--progress: ${sanitizedProgress}%"></div>
                </div>
            </div>
        `;

        const allocatedCell = document.createElement('td');
        allocatedCell.className = 'px-6 py-4 text-sm text-gray-700 font-semibold';
        allocatedCell.textContent = formatCurrency(item.allocated);

        const spentCell = document.createElement('td');
        spentCell.className = 'px-6 py-4 text-sm text-gray-700 font-semibold';
        spentCell.innerHTML = `
            <div>
                <p>${formatCurrency(item.spent)}</p>
                <p class="text-xs text-gray-500">${sanitizedProgress.toFixed(1)}% spent</p>
            </div>
        `;

        const statusCell = document.createElement('td');
        statusCell.className = 'px-6 py-4';
        statusCell.innerHTML = `<span class="status-badge status-${item.status.toLowerCase()}">${item.status}</span>`;

        row.append(categoryCell, allocatedCell, spentCell, statusCell);
        tableBody.appendChild(row);
    });

    const totalRemaining = totalBudget - totalSpent;
    const summaryData = [
        { title: 'Total Annual Budget', value: formatCurrency(totalBudget), accent: 'from-blue-500 to-blue-700' },
        { title: 'Total Funds Spent', value: formatCurrency(totalSpent), accent: 'from-rose-500 to-rose-700' },
        { title: 'Remaining Balance', value: formatCurrency(totalRemaining), accent: 'from-emerald-500 to-emerald-700' },
    ];

    summaryData.forEach((data) => {
        const card = document.createElement('div');
        card.className = 'summary-card bg-white p-6 rounded-xl shadow-lg border border-gray-100';
        card.innerHTML = `
            <p class="text-sm uppercase tracking-wide text-gray-400">${data.title}</p>
            <p class="mt-2 text-3xl font-extrabold bg-gradient-to-r ${data.accent} text-transparent bg-clip-text">${data.value}</p>
        `;
        summaryCards.appendChild(card);
    });
}

function renderPublicPosts() {
    const postsContainer = document.getElementById('public-posts');
    if (!postsContainer) return;

    postsContainer.innerHTML = '';

    if (!posts.length) {
        postsContainer.innerHTML = '<p class="text-gray-500">No announcements yet. Check back soon!</p>';
        return;
    }

    posts.forEach((post) => {
        const card = document.createElement('article');
        card.className = 'post-card bg-white p-5 rounded-xl shadow-md border border-gray-100 flex flex-col gap-3';
        card.innerHTML = `
            <div>
                <p class="text-xs uppercase tracking-wider text-gray-400">${new Date(post.created_at).toLocaleDateString()}</p>
                <h4 class="text-xl font-bold text-brgy-primary mt-1">${post.title}</h4>
            </div>
            <p class="text-gray-700">${post.body}</p>
            ${post.image_url ? `<img src="${post.image_url}" alt="${post.title}">` : ''}
        `;
        postsContainer.appendChild(card);
    });
}

async function attemptLogin(event) {
    if (event) event.preventDefault();

    const usernameInput = document.getElementById('admin-username');
    const passwordInput = document.getElementById('admin-pass');
    const loginMessage = document.getElementById('login-message');
    loginMessage.classList.add('hidden');

    const username = usernameInput.value.trim();
    const password = passwordInput.value;

    if (!username || !password) {
        loginMessage.textContent = 'Please enter both username and password.';
        loginMessage.classList.remove('hidden');
        return;
    }

    try {
        const response = await fetch('api/login.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ username, password }),
        });

        if (!response.ok) throw new Error('Invalid credentials. Please try again.');

        const result = await response.json();
        if (result.success) {
            isAdminAuthenticated = true;
            document.getElementById('login-form').classList.add('hidden');
            document.getElementById('admin-dashboard').classList.remove('hidden');
            const navLink = document.getElementById('nav-admin-link');
            navLink.textContent = 'Admin Logged In';
            navLink.classList.remove('bg-brgy-secondary');
            navLink.classList.add('bg-green-500');
            enablePostForm(true);

            populateAdminSelect();
            renderConcerns();
        }
    } catch (error) {
        loginMessage.textContent = error.message;
        loginMessage.classList.remove('hidden');
    }
}

function enablePostForm(enabled) {
    const postForm = document.getElementById('admin-post-form');
    if (!postForm) return;
    if (enabled) {
        postForm.classList.remove('opacity-50', 'pointer-events-none');
    } else {
        postForm.classList.add('opacity-50', 'pointer-events-none');
    }
}

function populateAdminSelect() {
    const select = document.getElementById('budget-item-select');
    if (!select) return;
    select.innerHTML = '<option value="">-- Select Category --</option>';

    budgetData.forEach((item) => {
        const option = document.createElement('option');
        option.value = item.id;
        option.textContent = item.category;
        select.appendChild(option);
    });
}

function loadItemForEdit() {
    const select = document.getElementById('budget-item-select');
    selectedItemId = Number(select.value);
    const updateMessage = document.getElementById('update-message');
    updateMessage.classList.add('hidden');
    updateMessage.textContent = '';

    if (selectedItemId) {
        const item = budgetData.find((d) => d.id === selectedItemId);
        document.getElementById('edit-allocated').value = item.allocated;
        document.getElementById('edit-spent').value = item.spent;
        document.getElementById('edit-status').value = item.status;
    } else {
        document.getElementById('edit-allocated').value = '';
        document.getElementById('edit-spent').value = '';
        document.getElementById('edit-status').value = 'Initial';
    }
}

async function saveBudgetUpdate() {
    const updateMessage = document.getElementById('update-message');

    if (!selectedItemId) {
        updateMessage.textContent = 'Please select a category to update.';
        updateMessage.classList.remove('hidden', 'text-green-600');
        updateMessage.classList.add('text-red-600');
        return;
    }

    const allocated = parseFloat(document.getElementById('edit-allocated').value);
    const spent = parseFloat(document.getElementById('edit-spent').value);
    const status = document.getElementById('edit-status').value;

    if (Number.isNaN(allocated) || Number.isNaN(spent) || allocated < spent) {
        updateMessage.textContent = 'Invalid amounts. Allocated must be greater than or equal to Spent.';
        updateMessage.classList.remove('hidden', 'text-green-600');
        updateMessage.classList.add('text-red-600');
        return;
    }

    const payload = { id: selectedItemId, allocated, spent, status };
    let updateSucceeded = false;

    try {
        const response = await fetch('api/update_budget.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(payload),
        });

        if (!response.ok) throw new Error('Unable to reach the server.');

        const result = await response.json();
        if (!result.success) throw new Error(result.message || 'Update failed.');

        updateSucceeded = true;
        if (result.updatedItem) {
            const { id, allocated: alloc, spent: sp, status: stat } = result.updatedItem;
            const localIndex = budgetData.findIndex((entry) => entry.id === Number(id));
            if (localIndex > -1) {
                budgetData[localIndex] = {
                    ...budgetData[localIndex],
                    allocated: Number(alloc),
                    spent: Number(sp),
                    status: stat,
                };
            }
        }
    } catch (error) {
        console.error('Server update failed:', error);
        updateMessage.textContent = `Update failed: ${error.message}. Please ensure the PHP API is running.`;
        updateMessage.classList.remove('hidden', 'text-green-600');
        updateMessage.classList.add('text-red-600');
        return;
    }

    if (updateSucceeded) {
        renderBudget();
        populateAdminSelect();

        updateMessage.textContent = 'Budget category successfully updated!';
        updateMessage.classList.remove('hidden', 'text-red-600');
        updateMessage.classList.add('text-green-600');

        document.getElementById('budget-item-select').value = '';
        loadItemForEdit();
        selectedItemId = null;
    }
}

async function submitAdminPost(event) {
    event.preventDefault();
    if (!isAdminAuthenticated) {
        alert('Please log in as admin to post updates.');
        return;
    }

    const titleInput = document.getElementById('post-title');
    const bodyInput = document.getElementById('post-body');
    const imageInput = document.getElementById('post-image');
    const formMessage = document.getElementById('post-message');
    formMessage.classList.add('hidden');

    const payload = {
        title: titleInput.value.trim(),
        body: bodyInput.value.trim(),
        imageUrl: imageInput.value.trim() || null,
    };

    if (!payload.title || !payload.body) {
        formMessage.textContent = 'Title and message are required.';
        formMessage.classList.remove('hidden', 'text-green-600');
        formMessage.classList.add('text-red-600');
        return;
    }

    try {
        const response = await fetch('api/create_post.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorPayload = await response.json();
            throw new Error(errorPayload.message || 'Unable to publish post.');
        }

        const { post } = await response.json();
        posts.unshift(post);
        renderPublicPosts();

        formMessage.textContent = 'Announcement published!';
        formMessage.classList.remove('hidden', 'text-red-600');
        formMessage.classList.add('text-green-600');
        document.getElementById('admin-post-form').reset();
    } catch (error) {
        formMessage.textContent = error.message;
        formMessage.classList.remove('hidden', 'text-green-600');
        formMessage.classList.add('text-red-600');
    }
}

function showAdminTab(tabName) {
    ['update', 'concerns'].forEach((tab) => {
        document.getElementById(`admin-tab-${tab}`).classList.add('hidden');
        document.getElementById(`tab-${tab}`).classList.remove('active');
    });

    document.getElementById(`admin-tab-${tabName}`).classList.remove('hidden');
    document.getElementById(`tab-${tabName}`).classList.add('active');
}

function renderConcerns() {
    const listContainer = document.getElementById('concerns-list');
    const counter = document.getElementById('concern-count');
    listContainer.innerHTML = '';
    counter.textContent = concernsList.length;

    if (concernsList.length === 0) {
        listContainer.innerHTML = '<p class="text-gray-500" id="no-concerns">No new concerns or recommendations.</p>';
        return;
    }

    concernsList.forEach((concern, index) => {
        const concernDiv = document.createElement('div');
        concernDiv.className = 'p-4 bg-white border border-gray-100 rounded-lg shadow-sm';
        concernDiv.innerHTML = `
            <p class="text-sm font-bold text-brgy-primary">Concern #${index + 1} (${concern.type}):</p>
            <p class="text-gray-700 mt-1">${concern.message}</p>
            <p class="text-xs text-gray-400 mt-2">Received: ${new Date(concern.timestamp).toLocaleTimeString()}</p>
        `;
        listContainer.appendChild(concernDiv);
    });
}

function toggleChatbot() {
    const container = document.getElementById('chatbot-container');
    container.classList.toggle('hidden');
    const input = document.getElementById('user-input');
    if (!container.classList.contains('hidden')) {
        input.focus();
    }
}

function handleUserMessage() {
    const inputField = document.getElementById('user-input');
    const userMessage = inputField.value.trim();

    if (!userMessage) return;

    addMessage(userMessage, 'user');
    inputField.value = '';
    simulateBotResponse(userMessage);
}

function addMessage(text, sender) {
    const chatbotMessages = document.getElementById('chatbot-messages');
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message-box', sender);
    messageDiv.textContent = text;
    chatbotMessages.appendChild(messageDiv);
    chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
}

function simulateBotResponse(userMessage) {
    const lowerCaseMsg = userMessage.toLowerCase();
    let botResponse = "I'm sorry, I couldn't find a direct answer. I'm a demo assistant for Barangay San Antonio 1. How can I direct your concern?";

    if (lowerCaseMsg.includes('total budget') || lowerCaseMsg.includes('allocated')) {
        const total = budgetData.reduce((sum, item) => sum + item.allocated, 0);
        botResponse = `The Total Annual Budget for Barangay San Antonio 1 is currently ${formatCurrency(total)}. You can view the full breakdown in the table above.`;
    } else if (lowerCaseMsg.includes('admin') || lowerCaseMsg.includes('update')) {
        botResponse = 'The Admin Login is for authorized barangay officials only. Once logged in, officials can update budget figures and broadcast announcements.';
    } else if (lowerCaseMsg.includes('concern') || lowerCaseMsg.includes('recommendation') || lowerCaseMsg.includes('suggest')) {
        concernsList.push({
            type: 'Concern/Recommendation',
            message: userMessage,
            timestamp: Date.now(),
        });
        renderConcerns();
        botResponse = 'Your concern has been formally logged and will be reviewed by the admin staff. Thank you for participating!';
    } else if (lowerCaseMsg.includes('contact') || lowerCaseMsg.includes('office')) {
        botResponse = 'You can contact the Barangay Hall at (049) 555-1234 or visit the office during business hours (M-F, 8am-5pm).';
    }

    setTimeout(() => {
        addMessage(botResponse, 'bot');
    }, 700);
}

async function initializeApp() {
    enablePostForm(false);

    await Promise.all([loadBudgetData(), loadPosts()]);
    renderBudget();

    const userInput = document.getElementById('user-input');
    userInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            handleUserMessage();
        }
    });

    const adminPostForm = document.getElementById('admin-post-form');
    if (adminPostForm) {
        adminPostForm.addEventListener('submit', submitAdminPost);
    }
}

document.addEventListener('DOMContentLoaded', initializeApp);

window.toggleChatbot = toggleChatbot;
window.handleUserMessage = handleUserMessage;
window.attemptLogin = attemptLogin;
window.loadItemForEdit = loadItemForEdit;
window.saveBudgetUpdate = saveBudgetUpdate;
window.showAdminTab = showAdminTab;
window.loadPosts = loadPosts;

