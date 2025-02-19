const express = require('express');
const path = require('path');
const app = express();

// Serve static files from the root directory
app.use(express.static(__dirname));

// Serve index.html for the root path
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Handle all other routes by looking in the pages directory
app.get('/:page', (req, res) => {
    const page = req.params.page;
    const filePath = path.join(__dirname, 'pages', `${page}.html`);
    res.sendFile(filePath);
});

// Handle nested routes (e.g., /french/activities)
app.get('/:section/:page', (req, res) => {
    const { section, page } = req.params;
    const filePath = path.join(__dirname, 'pages', section, `${page}.html`);
    res.sendFile(filePath);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
}); 