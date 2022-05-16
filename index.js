const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.db_User}:${process.env.db_Password}@cluster0.r7rar.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


async function run() {
    try {
        await client.connect();
        const workCollection = client.db('positiveWorks').collection('events');
        const placeCollection = client.db('positiveWorks').collection('place');
        const bookingCollection = client.db('positiveWorks').collection('bookings');

        // GET Events
        app.get('/events', async (req, res) => {
            const query = {};
            const cursor = workCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        })

        // GET Place
        app.get('/place', async (req, res) => {
            const query = {};
            const cursor = placeCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        })

        // POST Booking 
        app.post('/booking', async (req, res) => {
            const booking = req.body;
            const query = { slot: booking.slot, email: booking.email, date: booking.date }
            const exists = await bookingCollection.findOne(query);
            if(exists){
                return res.send({success: false , booking: exists})
            }
            const result = await bookingCollection.insertOne(booking);
            res.send(result);
        })

        // GET by ID 
        app.get('/events/:id', async (req, res) => {
            const id = req.params.id;
            // console.log(id);
            const query = { _id: ObjectId(id) }
            const result = await workCollection.findOne(query);
            res.send(result);
        })

        // DELETE
        app.get('/events/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const result = await workCollection.deleteOne(query);
            res.send(result);
        })
    }
    finally {

    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Positivity Squad is Coming to you...')
})

app.listen(port, () => {
    console.log('Listening to Port', port);
})