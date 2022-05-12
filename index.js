const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());


const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.db_User}:${process.env.db_Password}@cluster0.r7rar.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


async function run (){
    try{
        await client.connect();
        const workCollection = client.db('positiveWorks').collection('events');

        app.post('/events', async(req, res) => {
            const query = {};
            const cursor = workCollection.find(query);
            const result = cursor.toArray();
            res.send(result);
        })
    }
    finally{

    }
}
run().catch(console.dir);


app.get('/',(req,res) => {
    res.send('Positivity Squad is Coming to you...')
})

app.listen(port, ()=>{
    console.log('Listening to Port', port);
})