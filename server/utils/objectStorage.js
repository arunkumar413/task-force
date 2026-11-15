const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");

function storage() {
  const bucket = process.env.S3_BUCKET || process.env.GARAGE_DEFAULT_BUCKET;
  const accessKeyId = process.env.S3_ACCESS_KEY_ID || process.env.GARAGE_DEFAULT_ACCESS_KEY;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY || process.env.GARAGE_DEFAULT_SECRET_KEY;
  if (!bucket || !accessKeyId || !secretAccessKey) throw Object.assign(new Error("Configure object storage before uploading files"), { status: 503 });
  const client = new S3Client({
    endpoint: process.env.S3_ENDPOINT || "http://127.0.0.1:3900",
    region: process.env.S3_REGION || "garage",
    credentials: { accessKeyId, secretAccessKey }, forcePathStyle: true,
    requestChecksumCalculation: "WHEN_REQUIRED", responseChecksumValidation: "WHEN_REQUIRED",
    maxAttempts: 2,
  });
  return { client, bucket };
}
exports.upload = async function (key, file) {
  const { client, bucket } = storage();
  try {
    await client.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: file.buffer, ContentLength: file.size, ContentType: "application/octet-stream" }), { abortSignal: AbortSignal.timeout(60000) });
    return { storage_key: key, storage_bucket: bucket };
  } finally { client.destroy(); }
};
exports.remove = async function (attachment) {
  const { client } = storage();
  try { await client.send(new DeleteObjectCommand({ Bucket: attachment.storage_bucket, Key: attachment.storage_key }), { abortSignal: AbortSignal.timeout(15000) }); }
  finally { client.destroy(); }
};
exports.download = async function (attachment) {
  const { client } = storage();
  try {
    const result = await client.send(new GetObjectCommand({ Bucket: attachment.storage_bucket, Key: attachment.storage_key }), { abortSignal: AbortSignal.timeout(60000) });
    result.Body.once("close", () => client.destroy());
    return result;
  } catch (err) { client.destroy(); throw err; }
};
