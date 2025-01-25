const { S3Client, PutBucketCorsCommand } = require("@aws-sdk/client-s3");

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const setCorsConfiguration = async (bucketName) => {
  const corsConfiguration = {
    CORSRules: [
      {
        AllowedOrigins: [process.env.CLIENT_ORIGIN || '*'],
        AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
        AllowedHeaders: ['*'],
        ExposeHeaders: ['ETag'],
        MaxAgeSeconds: 3000,
      },
    ],
  };

  try {
    const command = new PutBucketCorsCommand({
      Bucket: bucketName,
      CORSConfiguration: corsConfiguration,
    });
    await s3Client.send(command);
    console.log('CORS configuration set successfully.');
  } catch (error) {
    console.error('Error setting CORS configuration:', error);
  }
};

module.exports = { s3Client, setCorsConfiguration };