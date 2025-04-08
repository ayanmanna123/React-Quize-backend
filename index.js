const connectToMongo = require('./db');
const express = require('express')
var cors = require('cors') 

connectToMongo();
const app = express()
const port = 5000
app.use(express.json())

const corsOptions = {
  origin: process.env.NEXT_PUBLIC_HOST, // Allow specific origin
  methods: ["GET", "POST", "PUT", "DELETE"], // Allowed methods
  allowedHeaders: ["Content-Type", "Authorization"], // Allowed headers
};
app.use(cors(corsOptions));

 
app.use(express.json())

// Available Routes
app.use('/api/auth', require('./routes/auth'))
app.use('/api/report', require('./routes/store')); 


app.listen(port, () => {
  console.log(`iNotebook backend listening at http://localhost:${port}`)
})