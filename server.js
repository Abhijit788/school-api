const express = require('express');
const bodyParser = require('body-parser');
const db = require('./db'); // Import the database connection
require('dotenv').config();

const app = express();
const PORT = 3000; // Set your desired port number

app.use(bodyParser.json());

// Add School API
app.post('/addSchool', async (req, res) => {
    const { name, address, latitude, longitude } = req.body;

    // Input Validation
    if (!name || !address || !latitude || !longitude) {
        return res.status(400).json({ error: 'All fields are required.' });
    }

    try {
        const query = `INSERT INTO schools (name, address, latitude, longitude) VALUES (?, ?, ?, ?)`;
        await db.execute(query, [name, address, latitude, longitude]);
        res.status(201).json({ message: 'School added successfully!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Database error' });
    }
});

// List Schools API
app.get('/listSchools', async (req, res) => {
    const { latitude, longitude } = req.query;

    // Input Validation
    if (!latitude || !longitude) {
        return res.status(400).json({ error: 'Latitude and longitude are required.' });
    }

    try {
        const [schools] = await db.execute(`SELECT * FROM schools`);
        const userLat = parseFloat(latitude);
        const userLng = parseFloat(longitude);

        // Calculate distances and sort
        const sortedSchools = schools.map(school => {
            const schoolLat = parseFloat(school.latitude);
            const schoolLng = parseFloat(school.longitude);
            const distance = Math.sqrt(
                Math.pow(schoolLat - userLat, 2) + Math.pow(schoolLng - userLng, 2)
            );
            return { ...school, distance };
        }).sort((a, b) => a.distance - b.distance);

        res.status(200).json(sortedSchools);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Database error' });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
