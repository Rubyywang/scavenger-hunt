const SUBMISSION_MAX_PX    = 1200
const SUBMISSION_MAX_BYTES = 500 * 1024       // 500 KB

const CLUE_MAX_PX    = 2400
const CLUE_MAX_BYTES = 3 * 1024 * 1024  // 3 MB

function renderToCanvas(file: File, maxPx: number): Promise<HTMLCanvasElement> {
  return createImageBitmap(file).then((bitmap) => {
    const scale  = Math.min(maxPx / bitmap.width, maxPx / bitmap.height, 1)
    const canvas = document.createElement('canvas')
    canvas.width  = Math.round(bitmap.width  * scale)
    canvas.height = Math.round(bitmap.height * scale)
    canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    return canvas
  })
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) { reject(new Error('Compression failed')); return }
        resolve(blob)
      },
      'image/jpeg',
      quality
    )
  })
}

async function compressTo(file: File, initialMaxPx: number, maxBytes: number): Promise<Blob> {
  let maxPx = initialMaxPx

  while (maxPx >= 400) {
    const canvas = await renderToCanvas(file, maxPx)

    let quality = 0.85
    while (quality >= 0.4) {
      const blob = await canvasToBlob(canvas, quality)
      if (blob.size <= maxBytes) return blob
      quality -= 0.1
    }

    maxPx = Math.round(maxPx * 0.7)
  }

  const canvas = await renderToCanvas(file, 400)
  return canvasToBlob(canvas, 0.4)
}

// Submission photos: hard cap 500 KB.
export function compressImage(file: File): Promise<Blob> {
  return compressTo(file, SUBMISSION_MAX_PX, SUBMISSION_MAX_BYTES)
}

// Clue images: hard cap 3 MB, higher starting resolution.
export function compressClueImage(file: File): Promise<Blob> {
  return compressTo(file, CLUE_MAX_PX, CLUE_MAX_BYTES)
}

