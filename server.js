require("dotenv").config();
const express = require("express");
const multer = require("multer");
const multerS3 = require("multer-s3");
const { S3Client } = require("@aws-sdk/client-s3");
const cors = require("cors");
const { MongoClient } = require("mongodb");
const path = require("path");

const app = express();
app.use(express.json());

// CORS configuration
const allowedOrigin = process.env.CORS_ORIGIN || "*"; // Use "*" for development, replace with your domain in production
app.use(
  cors({
    origin: allowedOrigin,
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// MongoDB connection setup
let db;
const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017";
const connectToMongoDB = async () => {
  try {
    const client = await MongoClient.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    db = client.db("test"); // Replace "test" with your database name
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    setTimeout(connectToMongoDB, 5000); // Retry connection after 5 seconds
  }
};
connectToMongoDB();

// S3 Configuration
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Multer configuration for S3 uploads
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

// Routes

// Fetch all jobs
app.get("/api/jobs", async (req, res) => {
  try {
    const jobs = await db.collection("jobs").find().toArray();
    res.status(200).json(jobs);
  } catch (error) {
    console.error("Error fetching jobs:", error);
    res.status(500).json({ message: "Failed to fetch jobs" });
  }
});

// Fetch a job by title
app.get("/api/job/title/:title", async (req, res) => {
  try {
    const jobTitle = req.params.title;
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

// Fetch a job's 3D model URL
app.get("/api/job/:title/model", async (req, res) => {
  try {
    const jobTitle = req.params.title;
    const job = await db.collection("jobs").findOne({ title: jobTitle });

    if (!job || !job.model) {
      return res.status(404).send({ message: "Model not found for this job" });
    }

    res.status(200).send({ modelUrl: job.model });
  } catch (error) {
    console.error("Error fetching model:", error);
    res
      .status(500)
      .send({ message: "Failed to fetch model", error: error.message });
  }
});

// Upload 3D file to S3
app.post("/upload3DFile", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).send({ message: "No file uploaded" });
  }

  const fileUrl = req.file.location;
  res.status(200).send({ message: "File uploaded successfully", fileUrl });
});

// Save a job to MongoDB
app.post("/api/saveJob", async (req, res) => {
  try {
    const job = req.body;

    if (!job || !job.title || !job.unit || !job.model) {
      return res.status(400).send({ message: "Invalid job data" });
    }

    const result = await db.collection("jobs").insertOne(job);
    res.status(200).send({ message: "Job saved successfully", result });
  } catch (error) {
    console.error("Error saving job:", error);
    res
      .status(500)
      .send({ message: "Failed to save job", error: error.message });
  }
});

// Serve static files (for frontend)
app.use(express.static(path.join(__dirname, "dist")));
app.get("*", (req, res, next) => {
  if (req.path.includes(".") && !req.path.endsWith(".html")) {
    return next(); // Skip this route for static assets
  }
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
