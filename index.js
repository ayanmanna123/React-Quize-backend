const connectToMongo = require('./db');
const express = require('express');
const cors = require('cors');

connectToMongo();
const app = express();
const port = 5000;

// Middleware to parse JSON
app.use(express.json());

// CORS configuration to allow frontend access (both local and deployed)
const corsOptions = {
  origin: [
    "http://localhost:3000",
    "https://react-quize-frontend-git-main-ayan-mannas-projects.vercel.app"
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
app.use(cors(corsOptions));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/report', require('./routes/store'));

// Start the server
app.listen(port, () => {
  console.log(`Quiz backend listening at http://localhost:${port}`);
});
