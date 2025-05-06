const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

// Serve static files from multiple directories
app.use(express.static(__dirname));
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/js', express.static(path.join(__dirname, 'js')));
app.use('/pics', express.static(path.join(__dirname, 'pics')));

// Handle SVG MIME type
express.static.mime.define({'image/svg+xml': ['svg']});

// Main route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});