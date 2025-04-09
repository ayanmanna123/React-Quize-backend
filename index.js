const connectToMongo = require('./db');
const express = require('express');
const cors = require('cors');

connectToMongo();
const app = express();
const port = 5000;

app.use(express.json());

// ✅ Updated CORS config
const corsOptions = {
  origin: [
    "http://localhost:3000",
    "https://react-quize-frontend-git-main-ayan-mannas-projects.vercel.app"
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization", "auth-token"],
};
app.use(cors(corsOptions));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/report', require('./routes/store'));

app.listen(port, () => {
  console.log(`iNotebook backend listening at http://localhost:${port}`);
});
