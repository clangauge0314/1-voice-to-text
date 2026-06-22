import { Readable } from 'stream'
import cloudinary from '../config/cloudinary.js'

export function uploadBuffer(buffer, options = {}) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'video',
        folder: 'voice-to-text/audio',
        ...options,
      },
      (error, result) => {
        if (error) reject(error)
        else resolve(result)
      },
    )

    Readable.from(buffer).pipe(uploadStream)
  })
}

export function deleteAsset(publicId, resourceType = 'video') {
  return cloudinary.uploader.destroy(publicId, { resource_type: resourceType })
}
