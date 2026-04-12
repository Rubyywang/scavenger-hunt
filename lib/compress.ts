const MAX_PX   = 1200
const QUALITY  = 0.8

// Client-side image compression. Max 1200px on longest side, 80% JPEG quality.
// Typical output: 150–400 KB vs 8–15 MB iPhone original.
export function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    createImageBitmap(file)
      .then((bitmap) => {
        const scale  = Math.min(MAX_PX / bitmap.width, MAX_PX / bitmap.height, 1)
        const canvas = document.createElement('canvas')
        canvas.width  = Math.round(bitmap.width  * scale)
        canvas.height = Math.round(bitmap.height * scale)
        canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
        canvas.toBlob(
          (blob) => {
            if (!blob) { reject(new Error('Compression failed')); return }
            resolve(blob)
          },
          'image/jpeg',
          QUALITY
        )
      })
      .catch(reject)
  })
}
