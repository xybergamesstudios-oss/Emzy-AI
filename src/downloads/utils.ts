import { uploadFileToS3 } from '../storage/s3';

export async function ensureViewOnceFileAccessible(localPath: string, mediaId: string) {
  // If S3 is configured, upload and return signed URL; otherwise return local path
  try {
    const buffer = await import('fs').then(m => m.readFileSync(localPath));
    const s3url = await uploadFileToS3(localPath, `viewonce/${mediaId}.${localPath.split('.').pop()}`);
    return s3url || localPath;
  } catch (e) {
    return localPath;
  }
}
