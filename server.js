const express = require('express');
const bodyParser = require('body-parser');
const db = require('./db'); // Import the database connection
const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: true })); // To handle form data
app.use(bodyParser.json()); // To handle JSON data

// Home route with input forms for adding schools and listing schools
app.get('/', (req, res) => {
    const html = `
        <h1>Welcome to the Schools API</h1>
        <h2>Select an Option:</h2>
        <button onclick="showAddSchoolForm()">Add School</button>
        <button onclick="showListSchoolsForm()">List Schools</button>

        <div id="form-container" style="margin-top: 20px;">
            <!-- Add School Form -->
            <form id="addSchoolForm" action="/addSchool" method="POST" style="display: none;">
                <h3>Add School</h3>
                <label for="name">Name:</label>
                <input type="text" id="name" name="name" required><br>
                <label for="address">Address:</label>
                <input type="text" id="address" name="address" required><br>
                <label for="latitude">Latitude:</label>
                <input type="number" step="any" id="latitude" name="latitude" required><br>
                <label for="longitude">Longitude:</label>
                <input type="number" step="any" id="longitude" name="longitude" required><br>
                <button type="submit">Add School</button>
            </form>

            <!-- List Schools Form -->
            <form id="listSchoolsForm" action="/listSchools" method="GET" style="display: none;">
                <h3>List Schools</h3>
                <label for="latitude">Your Latitude:</label>
                <input type="number" step="any" id="latitude" name="latitude" required><br>
                <label for="longitude">Your Longitude:</label>
                <input type="number" step="any" id="longitude" name="longitude" required><br>
                <button type="submit">Get Schools</button>
            </form>
        </div>

        <script>
            function showAddSchoolForm() {
                document.getElementById('addSchoolForm').style.display = 'block';
                document.getElementById('listSchoolsForm').style.display = 'none';
            }
            function showListSchoolsForm() {
                document.getElementById('addSchoolForm').style.display = 'none';
                document.getElementById('listSchoolsForm').style.display = 'block';
            }
        </script>
    `;
    res.send(html);
});

// Add School API
app.post('/addSchool', async (req, res) => {
    const { name, address, latitude, longitude } = req.body;

    if (!name || !address || !latitude || !longitude) {
        return res.status(400).send('<h1>Error: All fields are required.</h1><br><a href="/">Go Back</a>');
    }

    try {
        const query = `INSERT INTO schools (name, address, latitude, longitude) VALUES (?, ?, ?, ?)`;
        await db.execute(query, [name, address, latitude, longitude]);
        res.status(201).send('<h1>School added successfully!</h1><br><a href="/">Go Back</a>');
    } catch (error) {
        console.error(error);
        res.status(500).send('<h1>Error: Could not add school due to a database error.</h1><br><a href="/">Go Back</a>');
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

        // Helper function to calculate the distance in kilometers using Haversine formula
        function haversineDistance(lat1, lon1, lat2, lon2) {
            const R = 6371; // Radius of Earth in kilometers
            const dLat = (lat2 - lat1) * (Math.PI / 180);
            const dLon = (lon2 - lon1) * (Math.PI / 180);
            const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
                      Math.sin(dLon / 2) * Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            return R * c; // Distance in kilometers
        }

        // Calculate distances and sort schools
        const sortedSchools = schools.map(school => {
            const schoolLat = parseFloat(school.latitude);
            const schoolLng = parseFloat(school.longitude);
            const distance = haversineDistance(userLat, userLng, schoolLat, schoolLng);
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
                        <th>Distance (km)</th>
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
