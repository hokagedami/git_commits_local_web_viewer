let allCommits = [];
let filteredCommits = [];
let currentPage = 1;
const commitsPerPage = 20;

const fileInput = document.getElementById('fileInput');
const searchInput = document.getElementById('searchInput');
const authorFilter = document.getElementById('authorFilter');
const dateFilter = document.getElementById('dateFilter');
const commitsList = document.getElementById('commitsList');
const pagination = document.getElementById('pagination');
const error = document.getElementById('error');
const stats = document.getElementById('stats');

fileInput.addEventListener('change', handleFileUpload);
searchInput.addEventListener('input', filterCommits);
authorFilter.addEventListener('change', filterCommits);
dateFilter.addEventListener('change', filterCommits);

function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
        try {
            parseCommits(event.target.result);
            showError(null);
        } catch (err) {
            showError('Failed to parse commit file. Please check the format.');
            console.error(err);
        }
    };
    reader.readAsText(file);
}

function parseCommits(content) {
    const lines = content.trim().split('\n');
    allCommits = lines.map(line => {
        const [hash, author, email, date, ...messageParts] = line.split('|');
        return {
            hash: hash.trim(),
            author: author.trim(),
            email: email.trim(),
            date: new Date(date.trim()),
            message: messageParts.join('|').trim()
        };
    });

    updateStats();
    populateAuthorFilter();
    filterCommits();
}

function updateStats() {
    stats.style.display = 'flex';

    document.getElementById('totalCommits').textContent = allCommits.length;

    const authors = new Set(allCommits.map(c => c.author));
    document.getElementById('totalAuthors').textContent = authors.size;

    if (allCommits.length > 0) {
        const dates = allCommits.map(c => c.date);
        const minDate = new Date(Math.min(...dates));
        const maxDate = new Date(Math.max(...dates));
        document.getElementById('dateRange').textContent = `${minDate.toLocaleDateString()} - ${maxDate.toLocaleDateString()}`;
    }
}

function populateAuthorFilter() {
    const authors = [...new Set(allCommits.map(c => c.author))].sort();
    authorFilter.innerHTML = '<option value="">All Authors</option>';
    authors.forEach(author => {
        const option = document.createElement('option');
        option.value = author;
        option.textContent = author;
        authorFilter.appendChild(option);
    });
}

function filterCommits() {
    const searchTerm = searchInput.value.toLowerCase();
    const selectedAuthor = authorFilter.value;
    const selectedDateFilter = dateFilter.value;
    const now = new Date();

    filteredCommits = allCommits.filter(commit => {
        // Search filter
        if (searchTerm) {
            const matchesSearch =
                commit.message.toLowerCase().includes(searchTerm) ||
                commit.hash.toLowerCase().includes(searchTerm) ||
                commit.author.toLowerCase().includes(searchTerm);
            if (!matchesSearch) return false;
        }

        // Author filter
        if (selectedAuthor && commit.author !== selectedAuthor) {
            return false;
        }

        // Date filter
        if (selectedDateFilter) {
            const commitDate = commit.date;
            switch (selectedDateFilter) {
                case 'today':
                    if (commitDate.toDateString() !== now.toDateString()) return false;
                    break;
                case 'week':
                    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    if (commitDate < weekAgo) return false;
                    break;
                case 'month':
                    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                    if (commitDate < monthAgo) return false;
                    break;
                case 'year':
                    const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
                    if (commitDate < yearAgo) return false;
                    break;
            }
        }

        return true;
    });

    currentPage = 1;
    displayCommits();
}

function displayCommits() {
    if (filteredCommits.length === 0 && allCommits.length === 0) {
        commitsList.innerHTML = `
                <div class="empty-state">
                    <h2>No commits loaded</h2>
                    <p>Upload a commit log file to get started</p>
                </div>
            `;
        pagination.innerHTML = '';
        return;
    }

    if (filteredCommits.length === 0) {
        commitsList.innerHTML = `
                <div class="empty-state">
                    <h2>No commits found</h2>
                    <p>Try adjusting your filters</p>
                </div>
            `;
        pagination.innerHTML = '';
        return;
    }

    const startIndex = (currentPage - 1) * commitsPerPage;
    const endIndex = startIndex + commitsPerPage;
    const pageCommits = filteredCommits.slice(startIndex, endIndex);

    commitsList.innerHTML = pageCommits.map(commit => `
            <div class="commit">
                <div class="commit-header">
                    <div class="commit-message">${escapeHtml(commit.message)}</div>
                    <div class="commit-hash">${commit.hash.substring(0, 7)}</div>
                </div>
                <div class="commit-meta">
                    <div class="commit-author">
                        <div class="avatar" style="background: ${getAvatarColor(commit.email)};"></div>
                        ${escapeHtml(commit.author)}
                    </div>
                    <div>${formatDate(commit.date)}</div>
                </div>
            </div>
        `).join('');

    displayPagination();
}

function displayPagination() {
    const totalPages = Math.ceil(filteredCommits.length / commitsPerPage);
    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }

    let paginationHTML = '';

    // Previous button
    paginationHTML += `<button class="page-btn" onclick="goToPage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>Previous</button>`;

    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
            paginationHTML += `<button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
        } else if (i === currentPage - 3 || i === currentPage + 3) {
            paginationHTML += `<span>...</span>`;
        }
    }

    // Next button
    paginationHTML += `<button class="page-btn" onclick="goToPage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>Next</button>`;

    pagination.innerHTML = paginationHTML;
}

function goToPage(page) {
    const totalPages = Math.ceil(filteredCommits.length / commitsPerPage);
    if (page < 1 || page > totalPages) return;

    currentPage = page;
    displayCommits();
    window.scrollTo(0, 0);
}

function formatDate(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        if (diffHours === 0) {
            const diffMinutes = Math.floor(diffMs / (1000 * 60));
            return `${diffMinutes} minutes ago`;
        }
        return `${diffHours} hours ago`;
    } else if (diffDays === 1) {
        return 'yesterday';
    } else if (diffDays < 7) {
        return `${diffDays} days ago`;
    } else if (diffDays < 30) {
        const weeks = Math.floor(diffDays / 7);
        return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
    } else if (diffDays < 365) {
        const months = Math.floor(diffDays / 30);
        return `${months} month${months > 1 ? 's' : ''} ago`;
    } else {
        return date.toLocaleDateString();
    }
}

function getAvatarColor(email) {
    let hash = 0;
    for (let i = 0; i < email.length; i++) {
        hash = email.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = hash % 360;
    return `hsl(${hue}, 70%, 50%)`;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showError(message) {
    if (message) {
        error.textContent = message;
        error.style.display = 'block';
    } else {
        error.style.display = 'none';
    }
}