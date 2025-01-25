require("dotenv").config();
const express = require("express");
const multer = require("multer");
const multerS3 = require("multer-s3");
const { S3Client } = require("@aws-sdk/client-s3");
const cors = require("cors");
const { MongoClient } = require("mongodb");

const app = express();
app.use(express.json());

// CORS configuration
app.use(
  cors({
    origin: "http://localhost:5173", // Or use '*' for development purposes
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Create an S3 client
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Configure multerS3 for file uploads
const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.BUCKET_NAME,
    key: (req, file, cb) => {
      const fileName = `uploads/${Date.now()}-${file.originalname}`;
      cb(null, fileName);
    },
    contentType: multerS3.AUTO_CONTENT_TYPE,
  }),
});

// MongoDB connection setup
let db;
const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017";

MongoClient.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then((client) => {
    db = client.db("test"); // Replace with your database name
    console.log("Connected to MongoDB");
  })
  .catch((error) => console.error("MongoDB connection error:", error));

// Route to fetch a specific job by title
app.get("/api/job/title/:title", async (req, res) => {
  try {
    if (!db) {
      return res.status(500).send({ message: "Database not connected" });
    }

    const jobTitle = req.params.title;

    // Fetch job by title
    const job = await db.collection("jobs").findOne({ title: jobTitle });

    if (!job) {
      return res.status(404).send({ message: "Job not found" });
    }

    res.status(200).send(job);
  } catch (error) {
    console.error("Error fetching job by title:", error);
    res
      .status(500)
      .send({ message: "Failed to fetch job", error: error.message });
  }
});

app.get('/api/job/:title/model', async (req, res) => {
  try {
    if (!db) {
      console.error('Database is not connected');
      return res.status(500).send({ message: 'Database not connected' });
    }

    const jobTitle = req.params.title;
    console.log('Fetching model for job with title:', jobTitle);

    // Fetch the job document from the database
    const job = await db.collection('jobs').findOne({ title: jobTitle });
    console.log('Query result:', job);

    if (!job) {
      console.warn('Job not found:', jobTitle);
      return res.status(404).send({ message: 'Job not found' });
    }

    if (!job.model) {
      console.warn('No model URL found for job:', jobTitle);
      return res.status(404).send({ message: 'No model URL found for this job' });
    }

    // Return the model URL
    res.status(200).send({ modelUrl: job.model });
  } catch (error) {
    console.error('Error fetching model:', error);
    res.status(500).send({ message: 'Failed to fetch model', error: error.message });
  }
});
app.get('/api/jobs', async (req, res) => {
  try {
    const jobs = await db.collection('jobs').find().toArray(); // Replace 'db.collection' with your database logic
    res.status(200).json(jobs);
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ message: 'Failed to fetch jobs' });
  }
});



// Upload route for 3D files to S3
app.post("/upload3DFile", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).send({ message: "No file uploaded." });
  }
  const fileUrl = req.file.location; // S3 returns the file URL in the location property
  res
    .status(200)
    .send({ message: "File uploaded successfully!", fileUrl: fileUrl });
});

// Route to save job to MongoDB
app.post("/api/saveJob", async (req, res) => {
  try {
    const job = req.body;
    if (!job || !job.title || !job.unit || !job.model) {
      return res.status(400).send({ message: "Invalid job data" });
    }
    const result = await db.collection("jobs").insertOne(job);
    res.status(200).send({ message: "Job saved successfully!", result });
  } catch (error) {
    console.error("Error saving job:", error);
    res
      .status(500)
      .send({ message: "Failed to save job", error: error.message });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
