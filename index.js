const express = require("express");
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 8000;

//here is middleware
app.use(cors("*"));
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
    // await client.connect();

    const languageCollection = client.db('languageDB').collection('language')
    const vocabularyCollection = client.db('languageDB').collection('voca')
    const userCollection = client.db('languageDB').collection('users')



    // // jwt related api
    app.post('/jwt', async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '36h' });
      res.send({ token });
    })

    // middlewares 
    const verifyToken = (req, res, next) => {
      // console.log('inside verify token', req.headers.authorization);
      if (!req.headers.authorization) {
        return res.status(401).send({ message: 'unauthorized access' });
      }
      const token = req.headers.authorization.split(' ')[1];
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
          return res.status(401).send({ message: 'unauthorized access' })
        }
        req.decoded = decoded;
        next();
      })
    }

    // use verify admin after verifyToken

    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      const isAdmin = user?.role === 'admin';
      if (!isAdmin) {
        return res.status(403).send({ message: 'forbidden access' });
      }
      next();
    }

    //user related apies
    app.get('/users', verifyToken, verifyAdmin, async (req, res) => {
      console.log(req.headers)
      const result = await userCollection.find().toArray();
      res.send(result);
    });

    // for dashboard admin condition api
    app.get('/users/admin/:email', verifyToken, async (req, res) => {
      const email = req.params.email;

      if (email !== req.decoded.email) {
        return res.status(403).send({ message: 'forbidden access' })
      }

      const query = { email: email };
      const user = await userCollection.findOne(query);
      let admin = false;
      if (user) {
        admin = user?.role === 'admin';
      }
      res.send({ admin });
    })

    app.post('/users', async (req, res) => {
      const user = req.body;
      // insert email if user doesnt exists: 
      // you can do this many ways (1. email unique, 2. upsert 3. simple checking)
      const query = { email: user.email }
      const existingUser = await userCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: 'user already exists', insertedId: null })
      }
      const result = await userCollection.insertOne(user);
      res.send(result);
    });

    app.patch('/users/admin/:id', verifyToken, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          role: 'admin'
        }
      }
      const result = await userCollection.updateOne(filter, updatedDoc);
      res.send(result);
    })

    app.delete('/users/:id', verifyToken, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await userCollection.deleteOne(query);
      res.send(result);
    })


    /* end here */

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


    app.patch('/lesson/:id', verifyToken, verifyAdmin, async (req, res) => {
      const id = req.params.id;

      try {
        const filter = { _id: new ObjectId(id) };
        const updatedLesson = { $set: req.body };

        const result = await languageCollection.updateOne(filter, updatedLesson);

        if (result.matchedCount === 0) {
          return res.status(404).send({ message: 'Lesson not found' });
        }

        res.send({ message: 'Lesson updated successfully' });
      } catch (error) {
        console.error('Error updating lesson:', error);
        res.status(500).send({ message: 'An error occurred while updating the lesson' });
      }
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

    app.delete('/get-vocabulary/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await vocabularyCollection.deleteOne(query);
      res.send(result)
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