const express = require('express')
const app = express()
const cors = require('cors');
require('dotenv').config();
const { MongoClient } = require('mongodb');
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.p2nrx.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

// to check user and pass is correct
// console.log(uri);

async function run() {
    try {
        await client.connect();

        const database = client.db('doctors_portal');
        const appointmentsCollection = database.collection('appointments');
        const usersCollection = database.collection('users');

        app.get('/appointments', async (req, res) => {
            const email = req.query.email;
            const date = new Date(req.query.date).toLocaleDateString('en-US', { timeZone: 'UTC' });
            console.log(date);
            const query = { email: email, date: date };
            console.log(query)
            const cursor = appointmentsCollection.find(query);
            const appointments = await cursor.toArray();

            res.json(appointments);
        })

        app.post('/appointments', async (req, res) => {
            const appointment = req.body;
            const result = await appointmentsCollection.insertOne(appointment);
            res.json(result)
        })

        // for admin check
        app.get('/user/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            let isAdmin = false;
            if (user?.role === 'admin') {
                isAdmin = true;
            }
            res.json({ admin: isAdmin })
        })

        app.post('/users', async (req, res) => {
            const user = req.body;
            console.log(user);
            const result = await usersCollection.insertOne(user);
            // console.log(result);
            res.json(result);
        })


        app.put('/users', async (req, res) => {
            const user = req.body;
            const filter = { email: user.email };

            // this option instructs the method to create a document if no documents match the filter
            const options = { upsert: true };
            const updateDoc = { $set: user };
            const result = await usersCollection.updateOne(filter, updateDoc, options);
            res.json(result);

        })

        app.put('/users/admin', async (req, res) => {
            const user = req.body;

            console.log('put', req.body);
            const filter = { email: user.email };
            const updateDoc = { $set: { role: 'admin' } };
            const result = await usersCollection.updateOne(filter, updateDoc);
            res.json(result);
        })

    }
    finally {
        // await client.close();
    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Hello Doctors Portal!')
})

app.listen(port, () => {
    console.log(` listening at:${port}`)
})

// naming convention
// app.get('/users') --- read data to database (filter specific data / all data)
// app.post('/users')--- create data to database(one user create)
// app.get('/users/:id') --- read specific user
// app.put('/users/:id')---update specific user 
// app.delete('/users/:id')---delete specific user