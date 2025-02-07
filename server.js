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

// CORS configuration with expanded headers
app.use(cors({
  origin: process.env.CORS_ORIGIN || "*",
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  exposedHeaders: ["Content-Disposition", "Content-Type"]
}));

// MongoDB setup remains the same
let db;
const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017";
const connectToMongoDB = async () => {
  try {
    const client = await MongoClient.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    db = client.db("test");
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    setTimeout(connectToMongoDB, 5000);
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
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (req, file, cb) => {
      // Generate unique folder for each upload session
      const timestamp = Date.now();
      const uploadFolder = `uploads/${timestamp}`;
      const ext = path.extname(file.originalname).toLowerCase();
      
      // Set correct content type based on file extension
      let contentType;
      switch (ext) {
        case '.obj':
          contentType = 'application/x-tgif';
          break;
        case '.mtl':
          contentType = 'text/plain';
          break;
        default:
          contentType = 'application/octet-stream';
      }
      
      file.contentType = contentType;
      const fileName = `${uploadFolder}/${file.fieldname}${ext}`;
      cb(null, fileName);
    },
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname });
    }
  }),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  }
});

app.get("/api/jobs", async (req, res) => {
  try {
    const jobs = await db.collection("jobs").find().toArray();
    res.status(200).json(jobs);
  } catch (error) {
    console.error("Error fetching jobs:", error);
    res.status(500).json({ message: "Failed to fetch jobs" });
  }
});

app.get("/api/job/title/:title", async (req, res) => {
  try {
    const jobTitle = req.params.title;
    const job = await db.collection("jobs").findOne({ title: jobTitle });

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    res.status(200).json(job);
  } catch (error) {
    console.error("Error fetching job by title:", error);
    res.status(500).json({ message: "Failed to fetch job" });
  }
});

// Update the model API endpoint in server.js
app.get("/api/job/:title/model", async (req, res) => {
  try {
    const jobTitle = req.params.title;
    const job = await db.collection("jobs").findOne({ title: jobTitle });

    if (!job || !job.model) {
      return res.status(404).json({ message: "Model not found for this job" });
    }

    // Ensure we're returning the model URLs in the expected format
    const modelUrl = {
      objUrl: job.model.objUrl,
      mtlUrl: job.model.mtlUrl
    };

    res.status(200).json({ modelUrl });
  } catch (error) {
    console.error("Error fetching model:", error);
    res.status(500).json({ message: "Failed to fetch model" });
  }
});

const validateJobData = (job) => {
  if (!job || typeof job !== 'object') {
    return { valid: false, message: "Invalid job data" };
  }

  if (!job.title || typeof job.title !== 'string') {
    return { valid: false, message: "Invalid or missing job title" };
  }

  if (!job.unit || typeof job.unit !== 'string') {
    return { valid: false, message: "Invalid or missing unit" };
  }

  if (!job.model || typeof job.model !== 'object') {
    return { valid: false, message: "Invalid or missing model data" };
  }

  if (!job.model.objUrl || !job.model.mtlUrl) {
    return { valid: false, message: "Model data must include both objUrl and mtlUrl" };
  }

  if (typeof job.model.objUrl !== 'string' || typeof job.model.mtlUrl !== 'string') {
    return { valid: false, message: "Model URLs must be strings" };
  }

  return { valid: true };
};

// Update your saveJob endpoint to use this validation
app.post("/api/saveJob", async (req, res) => {
  try {
    const job = req.body;
    const validation = validateJobData(job);
    
    if (!validation.valid) {
      return res.status(400).json({ message: validation.message });
    }

    const result = await db.collection("jobs").insertOne(job);
    res.status(200).json({ message: "Job saved successfully", result });
  } catch (error) {
    console.error("Error saving job:", error);
    res.status(500).json({ message: "Failed to save job" });
  }
});
const { OpenAI } = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Ensure this is set in your .env file
});

app.post("/api/generate-components", async (req, res) => {
  try {
    const { prompt, meshes } = req.body;

    if (!prompt || !meshes || meshes.length === 0) {
      return res.status(400).json({ message: "Invalid request data" });
    }

    const aiPrompt = `
      You are an AI designed to analyze 3D models. 
      Given a list of mesh names and their positions, find all components and their associated hardware if asked.
      hardware is anything that starts with "hrd_" in the name and is mounting something.
      
      Return a structured JSON format where each bracket has a list of associated fasteners.

      Mesh Data: ${JSON.stringify(meshes)}

      User Prompt: ${prompt}

      Output the response in JSON format like:
      {
        "Bracket Assembly 1": [
          "bkt_Lbracket_ABC123",
          "Fastener_789X",
          "Fastener_789X",
          "Collar_456Y",
          "Collar_456Y"
        ]
      }
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [{ role: "system", content: aiPrompt }],
      response_format: { type: "json_object" }, // FIXED FORMAT
    });
    

    const structuredComponents = JSON.parse(response.choices[0].message.content);

    res.status(200).json(structuredComponents);
  } catch (error) {
    console.error("AI component generation error:", error);
    res.status(500).json({ message: "Failed to generate components" });
  }
});


app.post("/upload3DFile", upload.fields([
  { name: 'objFile', maxCount: 1 },
  { name: 'mtlFile', maxCount: 1 }
]), (req, res) => {
  try {
    const files = req.files;
    
    if (!files || !files.objFile) {
      return res.status(400).json({ message: "No OBJ file uploaded" });
    }

    const objFile = files.objFile[0];
    const mtlFile = files.mtlFile ? files.mtlFile[0] : null;

    // Return both URLs in the response
    const response = {
      objUrl: objFile.location, // S3 URL for the OBJ file
      mtlUrl: mtlFile ? mtlFile.location : null // S3 URL for the MTL file (if exists)
    };

    // Log the response for debugging
    console.log('Upload successful, returning URLs:', response);

    res.status(200).json(response);
  } catch (error) {
    console.error('Error handling file upload:', error);
    res.status(500).json({ 
      message: "Error uploading file", 
      error: error.message 
    });
  }
});

// AFTER all API routes, handle static files
app.use(express.static(path.join(__dirname, "dist"), {
  setHeaders: (res, filePath) => {
    const ext = path.extname(filePath).toLowerCase();
    if (ext === '.obj') {
      res.setHeader('Content-Type', 'application/x-tgif');
    } else if (ext === '.mtl') {
      res.setHeader('Content-Type', 'text/plain');
    }
  }
}));

// The catch-all route should be LAST
app.get("*", (req, res, next) => {
  if (req.path.startsWith('/api/')) {
    // If it's an API route that wasn't matched, return 404
    return res.status(404).json({ message: "API endpoint not found" });
  }
  
  if (req.path.includes(".") && !req.path.endsWith(".html")) {
    return next();
  }
  
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

const PORT = process.env.PORT || 3000;

const startServer = () => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
};

// Only start server after MongoDB connects
connectToMongoDB().then(() => {
  startServer();
});