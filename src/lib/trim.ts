/**
 * Обрезка видео прямо в браузере, без сервера:
 * воспроизводим нужный отрезок в скрытом <video>, захватываем поток
 * через captureStream() и записываем его MediaRecorder'ом в WebM.
 */

export interface TrimOptions {
  sourceUrl: string
  start: number
  end: number
  onProgress?: (ratio: number) => void
  signal?: AbortSignal
}

type CapturableVideo = HTMLVideoElement & {
  captureStream?: () => MediaStream
  mozCaptureStream?: () => MediaStream
}

export function pickMimeType(): string | null {
  if (typeof MediaRecorder === 'undefined') return null
  const candidates = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4']
  return candidates.find((t) => MediaRecorder.isTypeSupported(t)) ?? null
}

export function isTrimSupported(): boolean {
  const video = document.createElement('video') as CapturableVideo
  return Boolean(pickMimeType() && (video.captureStream || video.mozCaptureStream))
}

function waitFor(el: HTMLMediaElement, event: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const ok = () => { cleanup(); resolve() }
    const fail = () => { cleanup(); reject(new Error('Не удалось загрузить видео')) }
    const cleanup = () => {
      el.removeEventListener(event, ok)
      el.removeEventListener('error', fail)
    }
    el.addEventListener(event, ok, { once: true })
    el.addEventListener('error', fail, { once: true })
  })
}

export async function trimVideo({ sourceUrl, start, end, onProgress, signal }: TrimOptions): Promise<Blob> {
  const mimeType = pickMimeType()
  if (!mimeType) throw new Error('Браузер не поддерживает запись видео (MediaRecorder)')

  const video = document.createElement('video') as CapturableVideo
  video.src = sourceUrl
  video.muted = false
  video.volume = 0 // звук попадает в поток, но не слышен пользователю
  video.playsInline = true
  video.preload = 'auto'

  await waitFor(video, 'loadedmetadata')
  video.currentTime = start
  await waitFor(video, 'seeked')

  const capture = video.captureStream ?? video.mozCaptureStream
  if (!capture) throw new Error('Браузер не поддерживает captureStream()')
  const stream = capture.call(video)

  const recorder = new MediaRecorder(stream, { mimeType })
  const chunks: BlobPart[] = []
  recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data) }

  return new Promise<Blob>((resolve, reject) => {
    let finished = false

    const stop = () => {
      if (finished) return
      finished = true
      video.pause()
      video.removeEventListener('timeupdate', onTime)
      if (recorder.state !== 'inactive') recorder.stop()
    }

    const onTime = () => {
      const ratio = (video.currentTime - start) / (end - start)
      onProgress?.(Math.min(1, Math.max(0, ratio)))
      if (video.currentTime >= end) stop()
    }

    recorder.onstop = () => {
      stream.getTracks().forEach((t) => t.stop())
      video.removeAttribute('src')
      video.load()
      if (signal?.aborted) return reject(new DOMException('Отменено', 'AbortError'))
      if (chunks.length === 0) return reject(new Error('Запись пустая — попробуйте другой файл'))
      onProgress?.(1)
      resolve(new Blob(chunks, { type: mimeType.split(';')[0] }))
    }
    recorder.onerror = () => { stop(); reject(new Error('Ошибка записи видео')) }

    signal?.addEventListener('abort', stop, { once: true })
    video.addEventListener('timeupdate', onTime)
    video.addEventListener('ended', stop, { once: true })

    recorder.start(250)
    video.play().catch((err) => { stop(); reject(err) })
  })
}
