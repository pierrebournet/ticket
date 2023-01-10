// imports
const express = require('express');
require('dotenv').config() // permet de cacher les donnée dans un autrs fichier .env
const bodyParser = require('body-parser')
const { Client } = require('pg');
require('dotenv').config()
const fs = require('fs');
const { log } = require('console');

// declarations
const app = express();
const port = 8000;
const client = new Client({
    user: process.env.DB_USERNAME,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME, 
    password: process.env.DB_PASSWORD,
    port: 5432,
});

client.connect();



app.use(express.json())
app.use(function (req, res, next) {

    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});



// routes

app.get('/api/tickets/:id', async (req, res) => {
    console.log(req.params)
    const id = req.params.id;

    try {
        const data = await client.query('SELECT * FROM  tickets WHERE id = $1', [id]);
        if (data.rowCount == 0) {
            res.status(404).json(
                {
                    status: "FAIL",
                    message: 'Ticket Not Found',
                    data: undefined
                }
            );
        } else {
            res.status(200).json(
                {
                    status: "SUCCESS",
                    message: 'Ticket Find',
                    data: data.rows
                });
        }

    }
    catch (err) {
        console.log(err.stack);
        res.status(500).json({
            message: 'An error occurred while processing the request',
            data: undefined,
            status: 'fail'
        });

    }
})


app.get('/api/tickets', async (req, res) => {
    try {
        const data = await client.query('SELECT * FROM tickets ORDER BY id');

        res.status(200).json({
            message: 'list tickets',
            data: data.rows,
            status: 'success'
        });


    }
    catch (err) {
        console.log(err.stack);
        res.status(500).json({
            message: 'not ur business',
            data: undefined,
            status: 'fail'
        });

    }
})


app.post("/api/tickets", async (req, res) => {
    console.log(req.body);

    try {
        const message = req.body.message;

        const data = await client.query(
            "INSERT INTO tickets (message) VALUES ($1) RETURNING *", [message]
        );

        res.status(201).json({
            message: "created ticket",
            data: data.rows,
            status: "success",
        });
    } catch (err) {
        console.log(err.stack);

        res.status(400).json({
            message: "not valid",
            data: undefined,
            status: "fail",
        });
    }
})




app.delete("/api/tickets/:id", async (req, res) => {
    console.log(req.params);
    const id = req.params.id;

    const data = await client.query(
        "DELETE FROM ticket WHERE id = $1 RETURNING",
        [id]
    );
    console.log(data);
    if (data.rowCount === 1) {
        res.status(200).json({
            message: "deleted ticket",
            data: data.rows,
            status: "success",
        });
    } else {
        res.status(404).json({
            message: "ticket does not exists",
            data: null,
            status: "fail",
        });
    }
});



app.put('/api/tickets/', async (req, res) => {
    const id = parseInt(req.body.id);

    const { message, done } = req.body;

    if (isNaN(id)) {
        res.status(400).json({
            status: "FAIL",
            message: "id IT S NOT A INTEGER",
            data: null
        })

        return;
    }


    if (message === undefined || typeof message !== 'string') {
        res.status(400).json({
            status: "FAIL",
            message: "message must be a string",
            data: null
        });
        return;
    }
    if (typeof done !== 'boolean') {
        res.status(400).json({
            status: "FAIL",
            message: "done should be a boolean",
            data: null
        });
        return;
    }

    try {
        const result = await client.query('UPDATE tickets SET message = $2, done = $3 WHERE id = $1 RETURNING *', [id, message, done]);

        if (result.rowCount == 0) {
            res.status(404).json({
                status: "FAIL",
                message: "Ticket not found",
                data: null
            });

            return;
        }

        res.status(200).json({
            status: "SUCCESS",
            message: "Ticket updated",
            data: result.rows[0]
        });
    }
    catch (err) {
        console.log(err);
        res.status(500).json({
            status: "FAIL",
            message: "An error occurred while processing the request",
            data: null
        });
    }
})

// ecoute le port 8000
app.listen(port, () => {
    console.log(`Example app listening on port https://localhost:${port}`)
})