import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";

const s3 = new S3Client({
  endpoint: "http://localhost:3900",
  region: "garage",
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.GARAGE_DEFAULT_ACCESS_KEY,
    secretAccessKey: process.env.GARAGE_DEFAULT_SECRET_KEY,
  },
});

const Bucket = process.env.GARAGE_DEFAULT_BUCKET;
const Key = "documents/hello.txt";

// Upload an object.
await s3.send(new PutObjectCommand({
  Bucket,
  Key,
  Body: "Hello from my MacBook M5!",
  ContentType: "text/plain",
}));

console.log("Upload succeeded");

// Read it back.
const object = await s3.send(new GetObjectCommand({
  Bucket,
  Key,
}));

console.log(await object.Body.transformToString());

// List objects.
const result = await s3.send(new ListObjectsV2Command({ Bucket }));

console.log("Objects:", result.Contents?.map(item => item.Key) ?? []);