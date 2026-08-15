import AWS from 'aws-sdk';
import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger';

const S3_BUCKET = process.env.AWS_S3_BUCKET || '';

let s3: AWS.S3 | null = null;
if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && S3_BUCKET) {
  AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.S3_REGION || 'us-east-1'
  });
  s3 = new AWS.S3();
}

export async function uploadFileToS3(localPath: string, key: string) {
  if (!s3) {
    logger.warn('S3 not configured');
    return null;
  }
  const body = fs.readFileSync(localPath);
  const params: AWS.S3.PutObjectRequest = {
    Bucket: S3_BUCKET,
    Key: key,
    Body: body,
    ACL: 'private'
  };
  await s3.putObject(params).promise();
  // generate signed url
  const url = s3.getSignedUrl('getObject', { Bucket: S3_BUCKET, Key: key, Expires: 60 * 60 });
  return url;
}

export async function saveBufferToS3(buffer: Buffer, key: string) {
  if (!s3) {
    logger.warn('S3 not configured');
    return null;
  }
  const params: AWS.S3.PutObjectRequest = {
    Bucket: S3_BUCKET,
    Key: key,
    Body: buffer,
    ACL: 'private'
  };
  await s3.putObject(params).promise();
  const url = s3.getSignedUrl('getObject', { Bucket: S3_BUCKET, Key: key, Expires: 60 * 60 });
  return url;
}
