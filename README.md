# Git Commit Viewer

A comprehensive web-based tool for visualizing and analyzing Git commit history with advanced data analysis features, multiple visualization modes, and detailed commit inspection capabilities.

## Features

### Core Features
- **File Upload**: Import Git commit logs with various levels of detail
- **Search & Filter**: Search commits by message, hash, or author name
- **Multi-dimensional Filtering**: Filter by author, branch, and date range
- **Statistics Dashboard**: View total commits, contributors, branches, and files changed
- **Pagination**: Navigate through large commit histories efficiently
- **Dark Theme**: GitHub-inspired dark UI design
- **Responsive Layout**: Works on desktop and mobile devices

### Data & Analysis Features
- **Branch Visualization**: Show commits from different branches with color coding
- **Commit Diff Viewer**: Display file changes for each commit with syntax highlighting
- **File Change Statistics**: Show files modified, lines added/deleted per commit
- **Commit Graph/Timeline**: Visual timeline with branching and commit flow
- **Author Activity Heatmap**: Calendar-style contribution visualization (365-day view)
- **Code Frequency Charts**: Graphs showing commit activity over time and by contributor
- **Detailed Commit Modal**: Click any commit to see full details, diffs, and file statistics

### Visualization Modes
- **List View**: Traditional commit list with enhanced statistics
- **Graph View**: Timeline visualization showing commit flow
- **Activity Heatmap**: GitHub-style contribution calendar
- **Frequency Charts**: Bar charts for contributor activity and commit patterns

## Getting Started

### 1. Generate a Commit Log File

The application supports different levels of commit data detail. Choose the appropriate command based on your needs:

#### Basic Commit Data (Recommended for large repositories)
```bash
git log --pretty=format:'%H|%an|%ae|%ad|%s|%D' --date=iso --all > commits.txt
```

#### With File Statistics (Shows files changed, additions/deletions)
```bash
git log --pretty=format:'%H|%an|%ae|%ad|%s|%D' --date=iso --all --numstat > commits-detailed.txt
```

#### With Full Diff Content (Large files - includes complete diffs)
```bash
git log --pretty=format:'%H|%an|%ae|%ad|%s|%D' --date=iso --all -p > commits-full.txt
```

**Format explanation:**
- `%H` - Full commit hash
- `%an` - Author name  
- `%ae` - Author email
- `%ad` - Author date
- `%s` - Commit subject/message
- `%D` - Branch references
- `--all` - Include all branches
- `--numstat` - Add file change statistics
- `-p` - Include full patch/diff content

### 2. Open the Application

Open `index.html` in your web browser. You can:
- Double-click the file to open it locally
- Serve it using a local web server
- Host it on any web server

### 3. Upload and Explore

1. Click the file input button and select your generated commit file
2. Use the enhanced filtering options:
   - **Search**: Find commits by message, hash, or author
   - **Author Filter**: Show commits from specific contributors
   - **Branch Filter**: Filter by specific branches
   - **Date Filter**: Focus on recent activity (today, week, month, year)
3. Switch between visualization modes:
   - **List View**: Enhanced commit list with file statistics
   - **Graph View**: Timeline visualization of commit history
   - **Activity Heatmap**: Calendar-style contribution visualization
   - **Frequency Charts**: Statistical analysis of commit patterns
4. Click on any commit to see detailed information including:
   - Full commit details (author, date, branches, hash)
   - File change statistics (additions, deletions, files modified)
   - Complete diff content with syntax highlighting

## File Structure

```
git_tool/
├── index.html      # Main HTML structure
├── script.js       # Application logic and functionality
├── styles.css      # Styling and layout
└── README.md       # This file
```

## Browser Compatibility

This application uses modern JavaScript features and should work in:
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Advanced Usage

### Data Analysis Features

#### Branch Visualization
- Each commit displays a colored indicator showing its primary branch
- Branch filter allows focusing on specific branches
- Color-coded timeline in Graph View shows branch relationships

#### File Change Analysis
- View files modified, lines added/deleted for each commit
- Click commits to see detailed file statistics
- Diff viewer shows exact changes with added/removed line highlighting

#### Activity Patterns
- **Heatmap View**: 365-day contribution calendar similar to GitHub
- **Frequency Charts**: Analyze commit patterns by:
  - Top contributors with commit counts
  - Commits by hour of day to identify work patterns

#### Timeline Visualization
- **Graph View**: Visual commit timeline with branch indicators
- Chronological flow of development
- Easy identification of merge patterns and branch activity

### Filtering and Search

#### Multi-dimensional Filtering
- **Search**: Text search across commit messages, hashes, and authors
- **Author Filter**: Focus on specific contributors
- **Branch Filter**: Analyze specific branch activity  
- **Date Filter**: Time-based analysis (today, week, month, year)

#### Interactive Exploration
- Click any commit for detailed modal with:
  - Complete commit metadata
  - File-by-file change statistics
  - Full diff content with syntax highlighting
- Seamless switching between visualization modes
- Responsive design works on all device sizes

## Development

This is a client-side only application built with vanilla HTML, CSS, and JavaScript. No build process or dependencies are required.

To modify:
1. Edit the HTML structure in `index.html`
2. Update styles in `styles.css`
3. Modify functionality in `script.js`

## License

This project is open source and available under the MIT License.