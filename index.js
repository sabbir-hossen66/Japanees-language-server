const express = require("express");
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 8000;

//here is middleware
app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.neggqyg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;


// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const languageCollection = client.db('languageDB').collection('language')
    const vocabularyCollection = client.db('languageDB').collection('voca')

    app.get('/lesson', async (req, res) => {
      const cursor = languageCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    })


    // for update api
    app.get('/lesson/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await languageCollection.findOne(query);
      res.send(result)
    })

    // app.put('/lesson/:id', async (req, res) => {
    //   const id = req.params.id;
    //   const filter = { _id: new ObjectId(id) }
    //   const options = { upsert: true };
    //   const updatedLesson = req.body
    //   const lesson = {
    //     $set: {
    //       lessonName: updatedLesson.lessonName,
    //       lessonNumber: updatedLesson.lessonNumber
    //     }
    //   }
    //   const result = await languageCollection.updateOne(filter, lesson, options);
    //   res.send(result)
    // })

    app.put('/lesson/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedLesson = req.body;

      const options = { new: true }; // Return the updated document
      const result = await languageCollection.findOneAndUpdate(filter, updatedLesson, options);

      res.send(result);
    });

    app.post('/lesson', async (req, res) => {
      const newLesson = req.body;
      console.log(newLesson)
      const result = await languageCollection.insertOne(newLesson);
      res.send(result)
    })

    app.get('/get-vocabulary', async (req, res) => {
      const cursor = vocabularyCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    })


    app.post('/create-vocabulary', async (req, res) => {
      const newLesson = req.body;
      console.log(newLesson)
      const result = await vocabularyCollection.insertOne(newLesson);
      res.send(result)
    })

    app.delete('/lesson/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await languageCollection.deleteOne(query);
      res.send(result)
    })

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/', (req, res) => {
  res.send('japanees is running')
})

app.listen(port, () => {
  console.log(`japaness language is running:${port}`)
})