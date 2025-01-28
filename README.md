# Git Commit Viewer

A web-based tool for visualizing and exploring Git commit history with an intuitive interface, filtering options, and pagination.

## Features

- **File Upload**: Import Git commit logs from text files
- **Search & Filter**: Search commits by message, hash, or author name
- **Author Filtering**: Filter commits by specific contributors
- **Date Filtering**: View commits from specific time periods (today, this week, month, year)
- **Statistics Dashboard**: View total commits, contributors, and date ranges
- **Pagination**: Navigate through large commit histories efficiently
- **Dark Theme**: GitHub-inspired dark UI design
- **Responsive Layout**: Works on desktop and mobile devices

## Getting Started

### 1. Generate a Commit Log File

In your Git repository, run the following command to generate a commit log file:

```bash
git log --pretty=format:'%H|%an|%ae|%ad|%s' --date=iso > commits.txt
```

This creates a pipe-separated file with:
- `%H` - Full commit hash
- `%an` - Author name
- `%ae` - Author email
- `%ad` - Author date
- `%s` - Commit subject/message

### 2. Open the Application

Open `index.html` in your web browser. You can:
- Double-click the file to open it locally
- Serve it using a local web server
- Host it on any web server

### 3. Upload and Explore

1. Click the file input button and select your `commits.txt` file
2. Use the search bar to find specific commits
3. Filter by author or date range
4. Navigate through pages using the pagination controls

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

## Usage Examples

### Basic Search
Type in the search box to find commits containing specific text in the message, hash, or author name.

### Author Filtering
Select an author from the dropdown to view only their commits.

### Date Filtering
Use the date filter dropdown to view commits from:
- Today
- This week
- This month  
- This year

### Pagination
Navigate through large commit histories using the Previous/Next buttons or click specific page numbers.

## Development

This is a client-side only application built with vanilla HTML, CSS, and JavaScript. No build process or dependencies are required.

To modify:
1. Edit the HTML structure in `index.html`
2. Update styles in `styles.css`
3. Modify functionality in `script.js`

## License

This project is open source and available under the MIT License.