require('dotenv').config();

const express = require('express');
const app = express();
const cors = require('cors');
const { sql } = require('@vercel/postgres');
const { auth } = require('express-openid-connect');
const path = require('path');

const port = process.env.PORT || 3000;

app.options('*', cors());
app.use(cors());

app.use(express.json());

function getBaseUrl(hostname) {
    return hostname === 'localhost' ? `http://localhost:${port}` : `https://${hostname}`;
}

app.use((req, res, next) => {
    return auth({
        authRequired: true,
        auth0Logout: true,
        secret: process.env.AUTH_CLIENT_SECRET,
        baseURL: getBaseUrl(req.hostname),
        clientID: process.env.AUTH_CLIENT_ID,
        issuerBaseURL: process.env.AUTH_ISSUER_BASE_URL,
    })(req, res, next);
});

app.use(express.static(path.join(__dirname, "..", 'client')));

function getUserId(req) {
    return req.oidc.user.sid;
}

// GET: Retrieve all  list items
app.get('/api', async (req, res) => {
    try {
        const userId = getUserId(req);
        const result = await sql`SELECT * FROM "todo_items" WHERE "user_id" = ${userId};`;
        return res.json(result.rows);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: error.message });
    }
});

async function queryItem(id, userId) {
    const result = await sql`SELECT * FROM "todo_items" WHERE "id" = ${id} AND "user_id" = ${userId};`;
    if (result.rows.length === 0) {
        return undefined;
    }
    return result.rows[0];
}

// GET: Retrieve a single  list item by ID
app.get('/api/:id', async (req, res) => {
    const { id } = req.params;
    const userId = getUserId(req);
    try {
        const result = await queryItem(id,userId);
        if (!result) {
            return res.status(404).send({ error: 'Item not found' });
        }
        return res.json(result);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: error.message });
    }
});

// POST: Create a new  list item
app.post('/api', async (req, res) => {
    const { title, is_completed = false } = req.body;
    const userId = getUserId(req);
    try {
        const result = await sql`
            INSERT INTO "todo_items" ("title", "is_completed", "user_id")
            VALUES (${title}, ${is_completed}, ${userId})
            RETURNING *;
        `;
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// PUT: Update an existing  list item
app.put('/api/:id', async (req, res) => {
    const { id } = req.params;
    const { title, is_completed } = req.body;
    const userId = getUserId(req); 
    try {
        const result = await sql`
            UPDATE "todo_items"
            SET "title" = ${title}, "is_completed" = ${is_completed}
            WHERE "id" = ${id} AND "user_id" = ${userId}
            RETURNING *;
        `;
        if (result.rowCount === 0) {
            return res.status(404).send({ error: 'Item not found' });
        }
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// DELETE: Remove a  list item by ID
app.delete('/api/:id', async (req, res) => {
    const { id } = req.params;
    const userId = getUserId(req);
    try {
        const result = await sql`
            DELETE FROM "todo_items"
            WHERE "id" = ${id} AND "user_id" = ${userId};
        `;
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Item not found' });
        }
        res.status(200).json({ message: 'Item deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

if (require.main === module) {
    app.listen(port, () => console.log(`Server ready on port ${port}.`));
}

module.exports = app;