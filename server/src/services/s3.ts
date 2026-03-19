import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "crypto";

const s3 = new S3Client({
  endpoint: process.env.S3_ENDPOINT,
  region: process.env.S3_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY!,
    secretAccessKey: process.env.S3_SECRET_KEY!,
  },
  forcePathStyle: true,
});

const BUCKET = process.env.S3_BUCKET || "housing-map-photos";

export async function createPresignedUploadUrl(mimeType: string, extension: string): Promise<{ uploadUrl: string; storageKey: string; publicUrl: string }> {
  const key = `photos/${crypto.randomUUID()}${extension}`;
  const command = new PutObjectCommand({ Bucket: BUCKET, Key: key, ContentType: mimeType });
  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });
  const publicUrl = `${process.env.S3_ENDPOINT}/${BUCKET}/${key}`;
  return { uploadUrl, storageKey: key, publicUrl };
}

export async function deleteObject(storageKey: string): Promise<void> {
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: storageKey }));
}
