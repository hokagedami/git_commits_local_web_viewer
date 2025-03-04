// Enhanced Git Commit Viewer with Data & Analysis Features

let allCommits = [];
let filteredCommits = [];
let currentPage = 1;
const commitsPerPage = 20;
let currentView = 'list';
let branchColors = {};
let colorIndex = 0;

// DOM Elements
const fileInput = document.getElementById('fileInput');
const searchInput = document.getElementById('searchInput');
const regexToggle = document.getElementById('regexToggle');
const authorFilterInput = document.getElementById('authorFilterInput');
const authorDropdown = document.getElementById('authorDropdown');
const authorOptions = document.getElementById('authorOptions');
const selectAllAuthors = document.getElementById('selectAllAuthors');
const authorCount = document.getElementById('authorCount');
const branchFilter = document.getElementById('branchFilter');
const dateFilter = document.getElementById('dateFilter');
const dateRangePicker = document.getElementById('dateRangePicker');
const startDate = document.getElementById('startDate');
const endDate = document.getElementById('endDate');
const clearDateRange = document.getElementById('clearDateRange');
const applyDateRange = document.getElementById('applyDateRange');
const filePathFilter = document.getElementById('filePathFilter');
const fileFilterDropdown = document.getElementById('fileFilterDropdown');
const fileFilterOptions = document.getElementById('fileFilterOptions');
const messageLengthFilter = document.getElementById('messageLengthFilter');
const lengthRangePicker = document.getElementById('lengthRangePicker');
const minLength = document.getElementById('minLength');
const maxLength = document.getElementById('maxLength');
const clearLengthRange = document.getElementById('clearLengthRange');
const applyLengthRange = document.getElementById('applyLengthRange');
const tagFilter = document.getElementById('tagFilter');
const tagFilterDropdown = document.getElementById('tagFilterDropdown');
const tagFilterOptions = document.getElementById('tagFilterOptions');
const commitsList = document.getElementById('commitsList');
const commitGraph = document.getElementById('commitGraph');
const activityHeatmap = document.getElementById('activityHeatmap');
const frequencyCharts = document.getElementById('frequencyCharts');
const pagination = document.getElementById('pagination');
const error = document.getElementById('error');
const stats = document.getElementById('stats');
const commitModal = document.getElementById('commitModal');

// View buttons
const listViewBtn = document.getElementById('listViewBtn');
const graphViewBtn = document.getElementById('graphViewBtn');
const heatmapViewBtn = document.getElementById('heatmapViewBtn');
const chartsViewBtn = document.getElementById('chartsViewBtn');
const closeModal = document.getElementById('closeModal');

// Color palette for branches
const branchColorPalette = [
    '#58a6ff', '#7c3aed', '#06b6d4', '#10b981', '#f59e0b',
    '#ef4444', '#8b5cf6', '#14b8a6', '#f97316', '#ec4899',
    '#84cc16', '#6366f1', '#22c55e', '#f43f5e', '#a855f7'
];

// Global variables for multi-select, date range, file filtering, message length, and tag filtering
let selectedAuthors = new Set();
let customDateRange = { start: null, end: null };
let selectedFilePath = '';
let allFilePaths = new Set();
let customLengthRange = { min: null, max: null };
let selectedTag = '';
let allTags = new Set();

// Event Listeners
fileInput.addEventListener('change', handleFileUpload);
searchInput.addEventListener('input', filterCommits);
regexToggle.addEventListener('change', filterCommits);
authorFilterInput.addEventListener('click', toggleAuthorDropdown);
selectAllAuthors.addEventListener('change', handleSelectAllAuthors);
branchFilter.addEventListener('change', filterCommits);
dateFilter.addEventListener('change', handleDateFilterChange);
clearDateRange.addEventListener('click', handleClearDateRange);
applyDateRange.addEventListener('click', handleApplyDateRange);
startDate.addEventListener('change', validateDateRange);
endDate.addEventListener('change', validateDateRange);
filePathFilter.addEventListener('input', handleFilePathInput);
filePathFilter.addEventListener('focus', showFilePathDropdown);
filePathFilter.addEventListener('blur', () => setTimeout(hideFilePathDropdown, 200));
messageLengthFilter.addEventListener('change', handleMessageLengthFilterChange);
clearLengthRange.addEventListener('click', handleClearLengthRange);
applyLengthRange.addEventListener('click', handleApplyLengthRange);
minLength.addEventListener('change', validateLengthRange);
maxLength.addEventListener('change', validateLengthRange);
tagFilter.addEventListener('input', handleTagInput);
tagFilter.addEventListener('focus', showTagDropdown);
tagFilter.addEventListener('blur', () => setTimeout(hideTagDropdown, 200));

// Close dropdowns when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.multi-select-container')) {
        closeAuthorDropdown();
    }
    if (!e.target.closest('.date-filter-container')) {
        closeDateRangePicker();
    }
    if (!e.target.closest('.file-filter-container')) {
        hideFilePathDropdown();
    }
    if (!e.target.closest('.message-length-container')) {
        closeLengthRangePicker();
    }
    if (!e.target.closest('.tag-filter-container')) {
        hideTagDropdown();
    }
});

listViewBtn.addEventListener('click', () => switchView('list'));
graphViewBtn.addEventListener('click', () => switchView('graph'));
heatmapViewBtn.addEventListener('click', () => switchView('heatmap'));
chartsViewBtn.addEventListener('click', () => switchView('charts'));
closeModal.addEventListener('click', () => commitModal.style.display = 'none');

// Close modal when clicking outside
commitModal.addEventListener('click', (e) => {
    if (e.target === commitModal) {
        commitModal.style.display = 'none';
    }
});

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
    allCommits = [];
    let currentCommit = null;
    let fileStats = {};
    let diffContent = [];
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Check if line is a commit header
        if (line.includes('|') && !line.startsWith(' ') && !line.startsWith('+') && !line.startsWith('-') && !line.startsWith('@@')) {
            // Save previous commit if exists
            if (currentCommit) {
                currentCommit.fileStats = fileStats;
                currentCommit.diff = diffContent.join('\n');
                allCommits.push(currentCommit);
            }
            
            // Parse new commit
            const parts = line.split('|');
            if (parts.length >= 5) {
                const [hash, author, email, date, message, branches] = parts;
                const branchData = parseBranchesAndTags(branches || '');
                currentCommit = {
                    hash: hash.trim(),
                    author: author.trim(),
                    email: email.trim(),
                    date: new Date(date.trim()),
                    message: message.trim(),
                    branches: branchData.branches,
                    tags: branchData.tags,
                    fileStats: {},
                    diff: ''
                };
                fileStats = {};
                diffContent = [];
            }
        }
        // Parse file statistics (numstat format)
        else if (line.match(/^\d+\s+\d+\s+/) || line.match(/^-\s+-\s+/)) {
            const statsParts = line.split('\t');
            if (statsParts.length >= 3) {
                const [additions, deletions, filename] = statsParts;
                fileStats[filename] = {
                    additions: additions === '-' ? 0 : parseInt(additions),
                    deletions: deletions === '-' ? 0 : parseInt(deletions)
                };
            }
        }
        // Parse diff content
        else if (line.startsWith('diff --git') || line.startsWith('@@') || 
                 line.startsWith('+') || line.startsWith('-') || line.startsWith(' ')) {
            diffContent.push(line);
        }
    }
    
    // Don't forget the last commit
    if (currentCommit) {
        currentCommit.fileStats = fileStats;
        currentCommit.diff = diffContent.join('\n');
        allCommits.push(currentCommit);
    }

    // Collect all file paths and tags
    allFilePaths.clear();
    allTags.clear();
    allCommits.forEach(commit => {
        Object.keys(commit.fileStats).forEach(filePath => {
            allFilePaths.add(filePath);
        });
        
        // Extract tags from branch references
        if (commit.tags && commit.tags.length > 0) {
            commit.tags.forEach(tag => {
                allTags.add(tag);
            });
        }
    });

    assignBranchColors();
    updateStats();
    populateFilters();
    filterCommits();
    
    // Initialize with current view
    switchView(currentView);
}

function parseBranchesAndTags(branchString) {
    if (!branchString) return { branches: ['main'], tags: [] };
    
    const branches = [];
    const tags = [];
    
    // Parse tag references (tags usually appear as 'tag: v1.0.0')
    const tagMatches = branchString.match(/tag:\s*([^,\s)]+)/g);
    if (tagMatches) {
        tagMatches.forEach(match => {
            const tag = match.replace('tag:', '').trim();
            if (!tags.includes(tag)) {
                tags.push(tag);
            }
        });
    }
    
    // Parse branch references from git log output
    const branchMatches = branchString.match(/origin\/([^,\s)]+)/g);
    if (branchMatches) {
        branchMatches.forEach(match => {
            const branch = match.replace('origin/', '');
            if (!branches.includes(branch) && !tags.includes(branch)) {
                branches.push(branch);
            }
        });
    }
    
    // Also check for local branch references
    const localMatches = branchString.match(/\b([^,\s)]+)\b/g);
    if (localMatches) {
        localMatches.forEach(match => {
            if (match !== 'HEAD' && match !== 'origin' && match !== 'tag' && 
                !branches.includes(match) && !tags.includes(match) &&
                !match.startsWith('v') && !match.includes('.')) {
                branches.push(match);
            }
        });
    }
    
    return { 
        branches: branches.length > 0 ? branches : ['main'], 
        tags: tags 
    };
}

function assignBranchColors() {
    const allBranches = new Set();
    allCommits.forEach(commit => {
        commit.branches.forEach(branch => allBranches.add(branch));
    });
    
    colorIndex = 0;
    allBranches.forEach(branch => {
        if (!branchColors[branch]) {
            branchColors[branch] = branchColorPalette[colorIndex % branchColorPalette.length];
            colorIndex++;
        }
    });
}

function updateStats() {
    stats.style.display = 'flex';

    document.getElementById('totalCommits').textContent = allCommits.length;

    const authors = new Set(allCommits.map(c => c.author));
    document.getElementById('totalAuthors').textContent = authors.size;
    
    const branches = new Set();
    allCommits.forEach(c => c.branches.forEach(b => branches.add(b)));
    document.getElementById('totalBranches').textContent = branches.size;

    const allFiles = new Set();
    allCommits.forEach(commit => {
        Object.keys(commit.fileStats).forEach(file => allFiles.add(file));
    });
    document.getElementById('totalFiles').textContent = allFiles.size;

    if (allCommits.length > 0) {
        const dates = allCommits.map(c => c.date);
        const minDate = new Date(Math.min(...dates));
        const maxDate = new Date(Math.max(...dates));
        const dateRange = `${minDate.toLocaleDateString()} - ${maxDate.toLocaleDateString()}`;
        document.getElementById('dateRange').textContent = dateRange;
    }
}

function populateFilters() {
    // Author multi-select filter
    const authors = [...new Set(allCommits.map(c => c.author))].sort();
    selectedAuthors.clear();
    authors.forEach(author => selectedAuthors.add(author));
    
    authorOptions.innerHTML = '';
    authors.forEach(author => {
        const label = document.createElement('label');
        label.className = 'multi-select-option';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = author;
        checkbox.checked = true;
        checkbox.addEventListener('change', handleAuthorSelection);
        
        const span = document.createElement('span');
        span.textContent = author;
        
        label.appendChild(checkbox);
        label.appendChild(span);
        authorOptions.appendChild(label);
    });
    
    updateAuthorDisplay();
    
    // Branch filter
    const branches = new Set();
    allCommits.forEach(c => c.branches.forEach(b => branches.add(b)));
    const sortedBranches = [...branches].sort();
    branchFilter.innerHTML = '<option value="">All Branches</option>';
    sortedBranches.forEach(branch => {
        const option = document.createElement('option');
        option.value = branch;
        option.textContent = branch;
        branchFilter.appendChild(option);
    });
}

function filterCommits() {
    const searchTerm = searchInput.value;
    const isRegexEnabled = regexToggle.checked;
    const selectedBranch = branchFilter.value;
    const selectedDateFilter = dateFilter.value;
    const now = new Date();

    // Clear any previous regex error
    clearRegexError();

    filteredCommits = allCommits.filter(commit => {
        // Search filter
        if (searchTerm) {
            let matchesSearch = false;
            
            if (isRegexEnabled) {
                try {
                    const regex = new RegExp(searchTerm, 'i');
                    matchesSearch = 
                        regex.test(commit.message) ||
                        regex.test(commit.hash) ||
                        regex.test(commit.author);
                } catch (error) {
                    // Invalid regex - show error and fall back to normal search
                    showRegexError('Invalid regex pattern: ' + error.message);
                    const lowerSearchTerm = searchTerm.toLowerCase();
                    matchesSearch =
                        commit.message.toLowerCase().includes(lowerSearchTerm) ||
                        commit.hash.toLowerCase().includes(lowerSearchTerm) ||
                        commit.author.toLowerCase().includes(lowerSearchTerm);
                }
            } else {
                const lowerSearchTerm = searchTerm.toLowerCase();
                matchesSearch =
                    commit.message.toLowerCase().includes(lowerSearchTerm) ||
                    commit.hash.toLowerCase().includes(lowerSearchTerm) ||
                    commit.author.toLowerCase().includes(lowerSearchTerm);
            }
            
            if (!matchesSearch) return false;
        }

        // Author filter (multiple selection)
        if (selectedAuthors.size > 0 && !selectedAuthors.has(commit.author)) {
            return false;
        }
        
        // Branch filter
        if (selectedBranch && !commit.branches.includes(selectedBranch)) {
            return false;
        }
        
        // File path filter
        if (selectedFilePath) {
            const commitFiles = Object.keys(commit.fileStats);
            const matchesFile = commitFiles.some(filePath => 
                filePath.toLowerCase().includes(selectedFilePath.toLowerCase())
            );
            if (!matchesFile) return false;
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
                case 'custom':
                    if (customDateRange.start && commitDate < customDateRange.start) return false;
                    if (customDateRange.end && commitDate > customDateRange.end) return false;
                    break;
            }
        }

        // Message length filter
        const selectedLengthFilter = messageLengthFilter.value;
        if (selectedLengthFilter) {
            const messageLength = commit.message.length;
            switch (selectedLengthFilter) {
                case 'short':
                    if (messageLength > 50) return false;
                    break;
                case 'medium':
                    if (messageLength <= 50 || messageLength > 100) return false;
                    break;
                case 'long':
                    if (messageLength <= 100 || messageLength > 200) return false;
                    break;
                case 'very-long':
                    if (messageLength <= 200) return false;
                    break;
                case 'custom':
                    if (customLengthRange.min !== null && messageLength < customLengthRange.min) return false;
                    if (customLengthRange.max !== null && messageLength > customLengthRange.max) return false;
                    break;
            }
        }

        // Tag filter
        if (selectedTag) {
            const commitTags = commit.tags || [];
            const matchesTag = commitTags.some(tag => 
                tag.toLowerCase().includes(selectedTag.toLowerCase())
            );
            if (!matchesTag) return false;
        }

        return true;
    });

    currentPage = 1;
    
    // Update display based on current view
    switch (currentView) {
        case 'list':
            displayCommits();
            break;
        case 'graph':
            displayCommitGraph();
            break;
        case 'heatmap':
            displayActivityHeatmap();
            break;
        case 'charts':
            displayFrequencyCharts();
            break;
    }
}

function switchView(view) {
    currentView = view;
    
    // Update button states
    document.querySelectorAll('.view-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`${view}ViewBtn`).classList.add('active');
    
    // Hide all views
    commitsList.style.display = 'none';
    commitGraph.style.display = 'none';
    activityHeatmap.style.display = 'none';
    frequencyCharts.style.display = 'none';
    pagination.style.display = 'none';
    
    // Show selected view
    switch (view) {
        case 'list':
            commitsList.style.display = 'block';
            pagination.style.display = 'flex';
            displayCommits();
            break;
        case 'graph':
            commitGraph.style.display = 'block';
            displayCommitGraph();
            break;
        case 'heatmap':
            activityHeatmap.style.display = 'block';
            displayActivityHeatmap();
            break;
        case 'charts':
            frequencyCharts.style.display = 'block';
            displayFrequencyCharts();
            break;
    }
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

    commitsList.innerHTML = pageCommits.map(commit => {
        const primaryBranch = commit.branches[0];
        const branchColor = branchColors[primaryBranch] || '#58a6ff';
        
        const fileStatsArray = Object.entries(commit.fileStats);
        const totalAdditions = fileStatsArray.reduce((sum, [, stats]) => sum + stats.additions, 0);
        const totalDeletions = fileStatsArray.reduce((sum, [, stats]) => sum + stats.deletions, 0);
        const filesChanged = fileStatsArray.length;
        
        return `
            <div class="commit" onclick="showCommitDetails('${commit.hash}')">
                <div class="commit-header">
                    <div class="commit-message">
                        <span class="branch-indicator" style="background: ${branchColor};"></span>
                        ${escapeHtml(commit.message)}
                        <span class="commit-branch">${primaryBranch}</span>
                        ${commit.tags && commit.tags.length > 0 ? 
                            commit.tags.map(tag => `<span class="tag-indicator">${escapeHtml(tag)}</span>`).join('')
                            : ''
                        }
                    </div>
                    <div class="commit-hash">${commit.hash.substring(0, 7)}</div>
                </div>
                <div class="commit-meta">
                    <div class="commit-author">
                        <div class="avatar" style="background: ${getAvatarColor(commit.email)};"></div>
                        ${escapeHtml(commit.author)}
                    </div>
                    <div>${formatDate(commit.date)}</div>
                </div>
                ${filesChanged > 0 ? `
                    <div class="file-stats">
                        <div class="stat-item files-changed">
                            <span>📁</span>
                            <span>${filesChanged} files</span>
                        </div>
                        ${totalAdditions > 0 ? `
                            <div class="stat-item additions">
                                <span>+</span>
                                <span>${totalAdditions}</span>
                            </div>
                        ` : ''}
                        ${totalDeletions > 0 ? `
                            <div class="stat-item deletions">
                                <span>-</span>
                                <span>${totalDeletions}</span>
                            </div>
                        ` : ''}
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');

    displayPagination();
}

function displayCommitGraph() {
    const container = document.getElementById('graphContainer');
    
    if (filteredCommits.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <h2>No commits to display</h2>
                <p>Upload commits or adjust filters</p>
            </div>
        `;
        return;
    }
    
    const timelineItems = filteredCommits.map((commit, index) => {
        const primaryBranch = commit.branches[0];
        const branchColor = branchColors[primaryBranch] || '#58a6ff';
        
        return `
            <div class="timeline-item">
                ${index < filteredCommits.length - 1 ? '<div class="timeline-line"></div>' : ''}
                <div class="timeline-node" style="background: ${branchColor};"></div>
                <div class="timeline-content">
                    <div class="commit" onclick="showCommitDetails('${commit.hash}')">
                        <div class="commit-header">
                            <div class="commit-message">
                                ${escapeHtml(commit.message)}
                                <span class="commit-branch">${primaryBranch}</span>
                            </div>
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
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = timelineItems;
}

function displayActivityHeatmap() {
    const container = document.getElementById('heatmapContainer');
    
    if (filteredCommits.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <h2>No activity to display</h2>
                <p>Upload commits or adjust filters</p>
            </div>
        `;
        return;
    }
    
    // Create activity data by date
    const activityData = {};
    const now = new Date();
    const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    
    // Initialize all dates with 0 activity
    for (let d = new Date(oneYearAgo); d <= now; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        activityData[dateStr] = 0;
    }
    
    // Count commits per day
    filteredCommits.forEach(commit => {
        const dateStr = commit.date.toISOString().split('T')[0];
        if (activityData.hasOwnProperty(dateStr)) {
            activityData[dateStr]++;
        }
    });
    
    // Find max activity for scaling
    const maxActivity = Math.max(...Object.values(activityData));
    
    // Generate heatmap cells
    const cells = Object.entries(activityData).map(([date, count]) => {
        let level = 0;
        if (count > 0) {
            level = Math.min(4, Math.ceil((count / maxActivity) * 4));
        }
        
        return `
            <div class="heatmap-cell level-${level}" 
                 title="${date}: ${count} commits"
                 data-date="${date}" 
                 data-count="${count}">
            </div>
        `;
    }).join('');
    
    container.innerHTML = `
        <h3>Commit Activity (Last 365 Days)</h3>
        <div class="heatmap-grid">${cells}</div>
        <div class="heatmap-legend">
            <span>Less</span>
            <div class="legend-scale">
                <div class="heatmap-cell"></div>
                <div class="heatmap-cell level-1"></div>
                <div class="heatmap-cell level-2"></div>
                <div class="heatmap-cell level-3"></div>
                <div class="heatmap-cell level-4"></div>
            </div>
            <span>More</span>
        </div>
    `;
}

function displayFrequencyCharts() {
    const container = document.getElementById('chartsContainer');
    
    if (filteredCommits.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <h2>No data to display</h2>
                <p>Upload commits or adjust filters</p>
            </div>
        `;
        return;
    }
    
    // Author activity chart
    const authorActivity = {};
    filteredCommits.forEach(commit => {
        authorActivity[commit.author] = (authorActivity[commit.author] || 0) + 1;
    });
    
    const topAuthors = Object.entries(authorActivity)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10);
    
    const maxAuthorCommits = Math.max(...topAuthors.map(([,count]) => count));
    
    // Hour of day activity
    const hourActivity = {};
    for (let i = 0; i < 24; i++) hourActivity[i] = 0;
    
    filteredCommits.forEach(commit => {
        const hour = commit.date.getHours();
        hourActivity[hour]++;
    });
    
    const maxHourCommits = Math.max(...Object.values(hourActivity));
    
    container.innerHTML = `
        <div class="chart">
            <h3>Top Contributors</h3>
            ${topAuthors.map(([author, count]) => `
                <div class="chart-bar">
                    <div class="bar-label">${escapeHtml(author.split(' ')[0])}</div>
                    <div class="bar-visual">
                        <div class="bar-fill" style="width: ${(count / maxAuthorCommits) * 100}%"></div>
                    </div>
                    <div class="bar-value">${count}</div>
                </div>
            `).join('')}
        </div>
        
        <div class="chart">
            <h3>Commits by Hour</h3>
            ${Object.entries(hourActivity).map(([hour, count]) => `
                <div class="chart-bar">
                    <div class="bar-label">${hour.padStart(2, '0')}:00</div>
                    <div class="bar-visual">
                        <div class="bar-fill" style="width: ${maxHourCommits > 0 ? (count / maxHourCommits) * 100 : 0}%"></div>
                    </div>
                    <div class="bar-value">${count}</div>
                </div>
            `).join('')}
        </div>
    `;
}

function showCommitDetails(hash) {
    const commit = allCommits.find(c => c.hash === hash);
    if (!commit) return;
    
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    
    modalTitle.textContent = `${commit.hash.substring(0, 7)} - ${commit.message}`;
    
    // Generate file statistics
    const fileStatsHtml = Object.entries(commit.fileStats).length > 0 ? `
        <div class="diff-section">
            <h4>File Changes</h4>
            ${Object.entries(commit.fileStats).map(([file, stats]) => `
                <div class="diff-file">
                    <div class="diff-header">${escapeHtml(file)}</div>
                    <div style="padding: 10px 15px; font-size: 12px; color: #8b949e;">
                        <span class="additions">+${stats.additions}</span>
                        <span class="deletions" style="margin-left: 10px;">-${stats.deletions}</span>
                    </div>
                </div>
            `).join('')}
        </div>
    ` : '';
    
    // Generate diff display
    const diffHtml = commit.diff ? `
        <div class="diff-section">
            <h4>Diff</h4>
            <div class="diff-content">
                ${formatDiff(commit.diff)}
            </div>
        </div>
    ` : '';
    
    modalBody.innerHTML = `
        <div style="margin-bottom: 20px;">
            <p><strong>Author:</strong> ${escapeHtml(commit.author)} &lt;${escapeHtml(commit.email)}&gt;</p>
            <p><strong>Date:</strong> ${commit.date.toLocaleString()}</p>
            <p><strong>Branches:</strong> ${commit.branches.map(b => `<span class="commit-branch">${b}</span>`).join(' ')}</p>
            <p><strong>Hash:</strong> <code>${commit.hash}</code></p>
        </div>
        ${fileStatsHtml}
        ${diffHtml}
    `;
    
    commitModal.style.display = 'flex';
}

function formatDiff(diff) {
    if (!diff) return '';
    
    const lines = diff.split('\n');
    let html = '';
    let currentFile = '';
    
    lines.forEach(line => {
        if (line.startsWith('diff --git')) {
            const match = line.match(/diff --git a\/(.+) b\/(.+)/);
            if (match) {
                currentFile = match[1];
                html += `<div class="diff-file"><div class="diff-header">${escapeHtml(currentFile)}</div><div class="diff-content">`;
            }
        } else if (line.startsWith('@@')) {
            html += `<div class="diff-line context">${escapeHtml(line)}</div>`;
        } else if (line.startsWith('+') && !line.startsWith('+++')) {
            html += `<div class="diff-line added">${escapeHtml(line)}</div>`;
        } else if (line.startsWith('-') && !line.startsWith('---')) {
            html += `<div class="diff-line removed">${escapeHtml(line)}</div>`;
        } else if (line.startsWith(' ')) {
            html += `<div class="diff-line context">${escapeHtml(line)}</div>`;
        }
    });
    
    if (currentFile) {
        html += '</div></div>';
    }
    
    return html;
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

// Regex error handling functions
function showRegexError(message) {
    clearRegexError();
    
    const searchContainer = document.querySelector('.search-container');
    const errorDiv = document.createElement('div');
    errorDiv.className = 'regex-error';
    errorDiv.textContent = message;
    errorDiv.id = 'regexError';
    
    searchContainer.appendChild(errorDiv);
}

function clearRegexError() {
    const existingError = document.getElementById('regexError');
    if (existingError) {
        existingError.remove();
    }
}

// Multi-select author filter functions
function toggleAuthorDropdown() {
    const isOpen = authorDropdown.style.display === 'block';
    if (isOpen) {
        closeAuthorDropdown();
    } else {
        openAuthorDropdown();
    }
}

function openAuthorDropdown() {
    authorDropdown.style.display = 'block';
    authorFilterInput.classList.add('open');
}

function closeAuthorDropdown() {
    authorDropdown.style.display = 'none';
    authorFilterInput.classList.remove('open');
}

function handleAuthorSelection(event) {
    const author = event.target.value;
    const isChecked = event.target.checked;
    
    if (isChecked) {
        selectedAuthors.add(author);
    } else {
        selectedAuthors.delete(author);
    }
    
    updateSelectAllState();
    updateAuthorDisplay();
    filterCommits();
}

function handleSelectAllAuthors(event) {
    const isChecked = event.target.checked;
    const checkboxes = authorOptions.querySelectorAll('input[type="checkbox"]');
    
    selectedAuthors.clear();
    
    checkboxes.forEach(checkbox => {
        checkbox.checked = isChecked;
        if (isChecked) {
            selectedAuthors.add(checkbox.value);
        }
    });
    
    updateAuthorDisplay();
    filterCommits();
}

function updateSelectAllState() {
    const checkboxes = authorOptions.querySelectorAll('input[type="checkbox"]');
    const checkedCount = Array.from(checkboxes).filter(cb => cb.checked).length;
    
    selectAllAuthors.checked = checkedCount === checkboxes.length;
    selectAllAuthors.indeterminate = checkedCount > 0 && checkedCount < checkboxes.length;
}

function updateAuthorDisplay() {
    const totalAuthors = allCommits ? [...new Set(allCommits.map(c => c.author))].length : 0;
    const selectedCount = selectedAuthors.size;
    
    if (selectedCount === 0 || selectedCount === totalAuthors) {
        document.querySelector('.placeholder').style.display = 'block';
        authorCount.style.display = 'none';
        document.querySelector('.placeholder').textContent = 'All Authors';
    } else {
        document.querySelector('.placeholder').style.display = 'none';
        authorCount.style.display = 'block';
        authorCount.textContent = `${selectedCount} selected`;
    }
}

// Date range picker functions
function handleDateFilterChange() {
    const selectedValue = dateFilter.value;
    
    if (selectedValue === 'custom') {
        showDateRangePicker();
    } else {
        closeDateRangePicker();
        filterCommits();
    }
}

function showDateRangePicker() {
    dateRangePicker.style.display = 'block';
    
    // Set default values if not already set
    if (!startDate.value && !endDate.value && allCommits.length > 0) {
        const dates = allCommits.map(c => c.date).sort((a, b) => a - b);
        const minDate = dates[0];
        const maxDate = dates[dates.length - 1];
        
        startDate.value = minDate.toISOString().split('T')[0];
        endDate.value = maxDate.toISOString().split('T')[0];
    }
    
    validateDateRange();
}

function closeDateRangePicker() {
    dateRangePicker.style.display = 'none';
}

function handleClearDateRange() {
    startDate.value = '';
    endDate.value = '';
    customDateRange = { start: null, end: null };
    dateFilter.value = '';
    closeDateRangePicker();
    filterCommits();
}

function handleApplyDateRange() {
    const startValue = startDate.value;
    const endValue = endDate.value;
    
    if (!startValue && !endValue) {
        handleClearDateRange();
        return;
    }
    
    customDateRange.start = startValue ? new Date(startValue + 'T00:00:00') : null;
    customDateRange.end = endValue ? new Date(endValue + 'T23:59:59') : null;
    
    // Validate range
    if (customDateRange.start && customDateRange.end && customDateRange.start > customDateRange.end) {
        alert('Start date must be before end date');
        return;
    }
    
    closeDateRangePicker();
    updateDateRangeDisplay();
    filterCommits();
}

function validateDateRange() {
    const startValue = startDate.value;
    const endValue = endDate.value;
    const applyBtn = applyDateRange;
    
    let isValid = true;
    
    if (startValue && endValue) {
        const start = new Date(startValue);
        const end = new Date(endValue);
        isValid = start <= end;
    }
    
    applyBtn.disabled = !isValid;
    
    // Update input styling
    if (startValue && endValue && !isValid) {
        startDate.style.borderColor = '#da3633';
        endDate.style.borderColor = '#da3633';
    } else {
        startDate.style.borderColor = '#30363d';
        endDate.style.borderColor = '#30363d';
    }
}

function updateDateRangeDisplay() {
    const selectElement = dateFilter;
    const customOption = selectElement.querySelector('option[value="custom"]');
    
    if (customDateRange.start || customDateRange.end) {
        const startStr = customDateRange.start ? customDateRange.start.toLocaleDateString() : 'Beginning';
        const endStr = customDateRange.end ? customDateRange.end.toLocaleDateString() : 'End';
        customOption.textContent = `Custom Range (${startStr} - ${endStr})`;
    } else {
        customOption.textContent = 'Custom Range';
    }
}

// File path filtering functions
function handleFilePathInput() {
    const inputValue = filePathFilter.value.trim();
    selectedFilePath = inputValue;
    
    if (inputValue) {
        showFilePathSuggestions(inputValue);
        filePathFilter.classList.add('has-results');
    } else {
        hideFilePathDropdown();
        filePathFilter.classList.remove('has-results');
    }
    
    filterCommits();
}

function showFilePathDropdown() {
    if (filePathFilter.value.trim()) {
        showFilePathSuggestions(filePathFilter.value.trim());
    }
}

function hideFilePathDropdown() {
    fileFilterDropdown.style.display = 'none';
    filePathFilter.classList.remove('has-results');
}

function showFilePathSuggestions(query) {
    const matchingFiles = Array.from(allFilePaths)
        .filter(filePath => filePath.toLowerCase().includes(query.toLowerCase()))
        .sort()
        .slice(0, 20); // Limit to 20 suggestions
    
    if (matchingFiles.length === 0) {
        fileFilterOptions.innerHTML = '<div class="no-file-results">No matching files found</div>';
    } else {
        // Count commits for each file
        const fileCounts = {};
        allCommits.forEach(commit => {
            Object.keys(commit.fileStats).forEach(filePath => {
                if (matchingFiles.includes(filePath)) {
                    fileCounts[filePath] = (fileCounts[filePath] || 0) + 1;
                }
            });
        });
        
        fileFilterOptions.innerHTML = matchingFiles.map(filePath => {
            const highlightedPath = highlightFileMatch(filePath, query);
            const count = fileCounts[filePath] || 0;
            
            return `
                <div class="file-option" data-file-path="${escapeHtml(filePath)}">
                    <span class="file-path">${highlightedPath}</span>
                    <span class="file-count">${count}</span>
                </div>
            `;
        }).join('');
        
        // Add click handlers
        fileFilterOptions.querySelectorAll('.file-option').forEach(option => {
            option.addEventListener('click', () => {
                const filePath = option.dataset.filePath;
                filePathFilter.value = filePath;
                selectedFilePath = filePath;
                hideFilePathDropdown();
                filterCommits();
            });
        });
    }
    
    fileFilterDropdown.style.display = 'block';
}

function highlightFileMatch(filePath, query) {
    if (!query) return escapeHtml(filePath);
    
    const escapedPath = escapeHtml(filePath);
    const queryRegex = new RegExp(`(${escapeRegexChars(query)})`, 'gi');
    
    return escapedPath.replace(queryRegex, '<span class="file-match-highlight">$1</span>');
}

function escapeRegexChars(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Message length filter handlers
function handleMessageLengthFilterChange() {
    const selectedValue = messageLengthFilter.value;
    
    if (selectedValue === 'custom') {
        showLengthRangePicker();
    } else {
        closeLengthRangePicker();
        filterCommits();
    }
}

function showLengthRangePicker() {
    lengthRangePicker.style.display = 'block';
    
    // Set default values if not already set
    if (!minLength.value && !maxLength.value && allCommits.length > 0) {
        const lengths = allCommits.map(c => c.message.length).sort((a, b) => a - b);
        const minLen = lengths[0];
        const maxLen = lengths[lengths.length - 1];
        
        minLength.value = minLen;
        maxLength.value = maxLen;
    }
    
    validateLengthRange();
}

function closeLengthRangePicker() {
    lengthRangePicker.style.display = 'none';
}

function handleClearLengthRange() {
    minLength.value = '';
    maxLength.value = '';
    customLengthRange = { min: null, max: null };
    updateLengthRangeDisplay();
    filterCommits();
}

function handleApplyLengthRange() {
    const min = minLength.value ? parseInt(minLength.value) : null;
    const max = maxLength.value ? parseInt(maxLength.value) : null;
    
    customLengthRange = { min, max };
    updateLengthRangeDisplay();
    filterCommits();
}

function validateLengthRange() {
    const min = minLength.value ? parseInt(minLength.value) : null;
    const max = maxLength.value ? parseInt(maxLength.value) : null;
    
    const isValid = !min || !max || min <= max;
    const applyBtn = applyLengthRange;
    
    applyBtn.disabled = !isValid;
    
    if (!isValid) {
        minLength.style.borderColor = '#da3633';
        maxLength.style.borderColor = '#da3633';
    } else {
        minLength.style.borderColor = '#30363d';
        maxLength.style.borderColor = '#30363d';
    }
}

function updateLengthRangeDisplay() {
    const lengthOptions = messageLengthFilter.options;
    const customOption = Array.from(lengthOptions).find(opt => opt.value === 'custom');
    
    if (customLengthRange.min !== null || customLengthRange.max !== null) {
        const minText = customLengthRange.min !== null ? customLengthRange.min : '0';
        const maxText = customLengthRange.max !== null ? customLengthRange.max : '∞';
        customOption.textContent = `Custom Range (${minText}-${maxText} chars)`;
        
        // Add or update display below the select
        let display = messageLengthFilter.parentElement.querySelector('.length-range-display');
        if (!display) {
            display = document.createElement('div');
            display.className = 'length-range-display';
            messageLengthFilter.parentElement.appendChild(display);
        }
        display.textContent = `Range: ${minText} - ${maxText} characters`;
    } else {
        customOption.textContent = 'Custom Range';
        const display = messageLengthFilter.parentElement.querySelector('.length-range-display');
        if (display) {
            display.remove();
        }
    }
}

// Tag filter handlers
function handleTagInput() {
    const query = tagFilter.value.trim();
    
    if (query.length > 0) {
        showTagSuggestions(query);
    } else {
        selectedTag = '';
        hideTagDropdown();
        filterCommits();
    }
}

function showTagDropdown() {
    if (allTags.size === 0) return;
    
    const query = tagFilter.value.trim();
    if (query.length > 0) {
        showTagSuggestions(query);
    } else {
        showAllTags();
    }
}

function hideTagDropdown() {
    tagFilterDropdown.style.display = 'none';
    tagFilter.classList.remove('has-results');
}

function showAllTags() {
    const allTagsArray = Array.from(allTags).sort();
    
    if (allTagsArray.length === 0) {
        tagFilterOptions.innerHTML = '<div class="no-tag-results">No tags found in repository</div>';
    } else {
        // Count commits for each tag
        const tagCounts = {};
        allCommits.forEach(commit => {
            if (commit.tags) {
                commit.tags.forEach(tag => {
                    tagCounts[tag] = (tagCounts[tag] || 0) + 1;
                });
            }
        });
        
        tagFilterOptions.innerHTML = allTagsArray.map(tag => {
            const count = tagCounts[tag] || 0;
            
            return `
                <div class="tag-option" data-tag="${escapeHtml(tag)}">
                    <span class="tag-name">${escapeHtml(tag)}</span>
                    <span class="tag-count">${count}</span>
                </div>
            `;
        }).join('');
        
        // Add click handlers
        tagFilterOptions.querySelectorAll('.tag-option').forEach(option => {
            option.addEventListener('click', () => {
                const tag = option.dataset.tag;
                tagFilter.value = tag;
                selectedTag = tag;
                hideTagDropdown();
                filterCommits();
            });
        });
    }
    
    tagFilter.classList.add('has-results');
    tagFilterDropdown.style.display = 'block';
}

function showTagSuggestions(query) {
    const matchingTags = Array.from(allTags).filter(tag =>
        tag.toLowerCase().includes(query.toLowerCase())
    ).sort();
    
    if (matchingTags.length === 0) {
        tagFilterOptions.innerHTML = '<div class="no-tag-results">No matching tags found</div>';
    } else {
        // Count commits for each tag
        const tagCounts = {};
        allCommits.forEach(commit => {
            if (commit.tags) {
                commit.tags.forEach(tag => {
                    if (matchingTags.includes(tag)) {
                        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
                    }
                });
            }
        });
        
        tagFilterOptions.innerHTML = matchingTags.map(tag => {
            const highlightedTag = highlightTagMatch(tag, query);
            const count = tagCounts[tag] || 0;
            
            return `
                <div class="tag-option" data-tag="${escapeHtml(tag)}">
                    <span class="tag-name">${highlightedTag}</span>
                    <span class="tag-count">${count}</span>
                </div>
            `;
        }).join('');
        
        // Add click handlers
        tagFilterOptions.querySelectorAll('.tag-option').forEach(option => {
            option.addEventListener('click', () => {
                const tag = option.dataset.tag;
                tagFilter.value = tag;
                selectedTag = tag;
                hideTagDropdown();
                filterCommits();
            });
        });
    }
    
    tagFilter.classList.add('has-results');
    tagFilterDropdown.style.display = 'block';
}

function highlightTagMatch(tag, query) {
    if (!query) return escapeHtml(tag);
    
    const escapedTag = escapeHtml(tag);
    const queryRegex = new RegExp(`(${escapeRegexChars(query)})`, 'gi');
    
    return escapedTag.replace(queryRegex, '<span class="tag-match-highlight">$1</span>');
}