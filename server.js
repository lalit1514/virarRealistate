const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from current directory
app.use(express.static(path.join(__dirname)));

// Serve admin folder static files
app.use('/admin', express.static(path.join(__dirname, 'admin')));

// Serve index.html for root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Admin routes - serve admin files directly
// Redirect /admin to login page
app.get('/admin', (req, res) => {
    res.redirect('/admin/login.html');
});

app.get('/admin/login.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin', 'login.html'));
});

app.get('/admin/dashboard.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin', 'dashboard.html'));
});

// Handle all other routes (SPA fallback for main site)
app.get('*', (req, res) => {
    // Don't fallback admin routes to index.html
    if (req.path.startsWith('/admin')) {
        res.status(404).send('Admin page not found');
    } else {
        res.sendFile(path.join(__dirname, 'index.html'));
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🏠 Siddhivinayak Realtors website running on port ${PORT}`);
    console.log(`📊 Admin panel available at http://localhost:${PORT}/admin/login.html`);
});
