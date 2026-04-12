'use client'

import { useState, useRef } from 'react'

interface Props {
  clueId: string
}

type Stage = 'idle' | 'preview' | 'submitting' | 'done' | 'error'

export default function PhotoCapture({ clueId }: Props) {
  const [stage, setStage]     = useState<Stage>('idle')
  const [preview, setPreview] = useState<string | null>(null)
  const [blob, setBlob]       = useState<Blob | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const { compressImage } = await import('@/lib/compress')
    const compressed = await compressImage(file)
    setBlob(compressed)
    setPreview(URL.createObjectURL(compressed))
    setStage('preview')
  }

  async function handleSubmit() {
    if (!blob) return
    setStage('submitting')

    const form = new FormData()
    form.append('photo',   blob, 'photo.jpg')
    form.append('clue_id', clueId)

    const res  = await fetch('/api/game/submit', { method: 'POST', body: form })
    const data = await res.json()

    if (!res.ok) {
      setErrorMsg(data.error ?? 'Submit failed')
      setStage('error')
      return
    }

    setStage('done')
  }

  function handleRetake() {
    setStage('idle')
    setPreview(null)
    setBlob(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  if (stage === 'done') {
    return <p className="text-sm text-yellow-600 font-medium">Submitted — awaiting review</p>
  }

  if (stage === 'error') {
    return (
      <div className="space-y-2">
        <p className="text-sm text-red-600">{errorMsg}</p>
        <button onClick={handleRetake} className="text-sm underline">Try again</button>
      </div>
    )
  }

  if (stage === 'preview' || stage === 'submitting') {
    return (
      <div className="space-y-3">
        {preview && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Preview" className="w-full rounded object-cover max-h-64" />
        )}
        <div className="flex gap-2">
          <button
            onClick={handleRetake}
            disabled={stage === 'submitting'}
            className="flex-1 border rounded py-2 text-sm disabled:opacity-50"
          >
            Retake
          </button>
          <button
            onClick={handleSubmit}
            disabled={stage === 'submitting'}
            className="flex-1 bg-black text-white rounded py-2 text-sm disabled:opacity-50"
          >
            {stage === 'submitting' ? 'Uploading…' : 'Submit'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <input
        ref={inputRef}
        id={`capture-${clueId}`}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />
      <label
        htmlFor={`capture-${clueId}`}
        className="inline-block bg-black text-white text-sm rounded px-4 py-2 cursor-pointer"
      >
        Upload proof
      </label>
    </>
  )
}
