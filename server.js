const express = require('express');
const bodyParser = require('body-parser');
const db = require('./db'); // Import the database connection
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON
app.use(bodyParser.json());

// Home Route
app.get('/', (req, res) => {
    res.send(`
        <h1>Welcome to the Schools API</h1>
        <p>Available Endpoints:</p>
        <ul>
            <li><strong>POST /addSchool</strong>: Add a new school (JSON payload: name, address, latitude, longitude).</li>
            <li><strong>GET /listSchools</strong>: List all schools sorted by proximity (Query parameters: latitude, longitude).</li>
        </ul>
        <h2>Fetch Nearby Schools</h2>
        <form action="/listSchools" method="get">
            <label for="latitude">Latitude:</label>
            <input type="number" step="any" name="latitude" id="latitude" required>
            <br>
            <label for="longitude">Longitude:</label>
            <input type="number" step="any" name="longitude" id="longitude" required>
            <br><br>
            <button type="submit">Get Schools</button>
        </form>
    `);
});

// Add School API
app.post('/addSchool', async (req, res) => {
    const { name, address, latitude, longitude } = req.body;

    if (!name || !address || !latitude || !longitude) {
        return res.status(400).send('<h1>Error: All fields (name, address, latitude, longitude) are required.</h1>');
    }

    try {
        const query = `INSERT INTO schools (name, address, latitude, longitude) VALUES (?, ?, ?, ?)`;
        await db.execute(query, [name, address, latitude, longitude]);
        res.status(201).send('<h1>School added successfully!</h1>');
    } catch (error) {
        console.error(error);
        res.status(500).send('<h1>Error: Database error occurred while adding school.</h1>');
    }
});

// List Schools API
app.get('/listSchools', async (req, res) => {
    const { latitude, longitude } = req.query;

    if (!latitude || !longitude) {
        return res.status(400).send('<h1>Error: Both latitude and longitude query parameters are required.</h1>');
    }

    try {
        const [schools] = await db.execute(`SELECT * FROM schools`);
        const userLat = parseFloat(latitude);
        const userLng = parseFloat(longitude);

        // Calculate distances and sort schools
        const sortedSchools = schools.map(school => {
            const schoolLat = parseFloat(school.latitude);
            const schoolLng = parseFloat(school.longitude);
            const distance = Math.sqrt(
                Math.pow(schoolLat - userLat, 2) + Math.pow(schoolLng - userLng, 2)
            );
            return { ...school, distance };
        }).sort((a, b) => a.distance - b.distance);

        // Generate an HTML table
        let html = `
            <h1>List of Schools</h1>
            <table border="1" cellpadding="10" cellspacing="0">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Address</th>
                        <th>Latitude</th>
                        <th>Longitude</th>
                        <th>Distance</th>
                    </tr>
                </thead>
                <tbody>
        `;

        sortedSchools.forEach(school => {
            html += `
                <tr>
                    <td>${school.id}</td>
                    <td>${school.name}</td>
                    <td>${school.address}</td>
                    <td>${school.latitude}</td>
                    <td>${school.longitude}</td>
                    <td>${school.distance.toFixed(2)}</td>
                </tr>
            `;
        });

        html += `
                </tbody>
            </table>
            <br>
            <a href="/">Go Back</a>
        `;

        res.send(html);
    } catch (error) {
        console.error(error);
        res.status(500).send('<h1>Error: Could not fetch schools due to a database error.</h1>');
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
