const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.db_User}:${process.env.db_Password}@cluster0.r7rar.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: "Unauthorized Access" });
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.SECRET_TOKEN, (err, decoded) => {
        if (err) {
            return res.status(403).send({ message: "Forbidden Access" });
        }
        // console.log(decoded);
        req.decoded = decoded;
        next();
    })
    // console.log('Inside verifyJWT', authHeader);

}

async function run() {
    try {
        await client.connect();
        const workCollection = client.db('positiveWorks').collection('events');
        const placeCollection = client.db('positiveWorks').collection('place');
        const bookingCollection = client.db('positiveWorks').collection('bookings');
        const userCollection = client.db('positiveWorks').collection('users');

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

        // Upsert User 
        app.put('/user/:email', async (req, res) => {
            const email = req.params.email;
            const filter = { email: email };
            const user = req.body;
            const options = { upsert: true };
            const updatedUser = {
                $set: user
            }
            const result = await userCollection.updateOne(filter, updatedUser, options);
            const accessToken = jwt.sign(filter, process.env.SECRET_TOKEN,
                {
                    expiresIn: '1h'
                });
            res.send({result, accessToken});
        })

        // Get Bookings by email 
        app.get('/booking', verifyJWT, async (req, res) => {
            const email = req.query.email;
            const decodedEmail = req.decoded.email;
            console.log(decodedEmail)
            if (email === decodedEmail) {
                const query = { email: email }
                const result = await bookingCollection.find(query).toArray();
                res.send(result);
            }
            else {
                res.status(403).send({ message: "Forbidden Access" });
            }
        })

        // POST Booked Items
        app.post('/booking', async (req, res) => {
            const booking = req.body;
            const query = { slot: booking.slot, email: booking.email, date: booking.date }
            const exists = await bookingCollection.findOne(query);
            if (exists) {
                return res.send({ success: false, booking: exists })
            }
            const result = await bookingCollection.insertOne(booking);
            res.send(result);
        })

        // Delete slot from booking which slot was already booked 
        app.get('/available', async (req, res) => {
            const date = req.query.date || 'May 17, 2022';
            // Get all place 
            const places = await placeCollection.find().toArray();

            // Get the booking of that day 
            const query = { date: date };
            const bookings = await bookingCollection.find(query).toArray();

            // For each place find the bookings of that place
            places.forEach(place => {
                const placeBooking = bookings.filter(booking => booking.eventName === place.name)
                // console.log(placeBooking);

                const bookedSlot = placeBooking.map(p => p.slot);
                // console.log(bookedSlot);
                // place.bookedSlot = bookedSlot;
                const available = place.slots.filter(s => !bookedSlot.includes(s))
                // console.log(available);
                place.slots = available;

            })

            res.send(places);
        })

        // GET Events by ID 
        app.get('/events/:id', async (req, res) => {
            const id = req.params.id;
            // console.log(id);
            const query = { _id: ObjectId(id) }
            const result = await workCollection.findOne(query);
            res.send(result);
        })

        // DELETE Events
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