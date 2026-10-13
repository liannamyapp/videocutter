import { useCallback, useEffect, useRef, useState } from 'react'
import { Uploader } from './components/Uploader'
import { Trimmer } from './components/Trimmer'
import { ClipList } from './components/ClipList'
import { isTrimSupported, trimVideo } from './lib/trim'
import type { ClipJob, SourceVideo } from './types'

function readMetadata(file: File): Promise<SourceVideo> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const el = document.createElement('video')
    el.preload = 'metadata'
    el.onloadedmetadata = () => {
      if (!Number.isFinite(el.duration) || el.duration === 0) {
        URL.revokeObjectURL(url)
        return reject(new Error('Не удалось определить длительность видео'))
      }
      resolve({ name: file.name, size: file.size, url, duration: el.duration, width: el.videoWidth, height: el.videoHeight })
    }
    el.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Браузер не может открыть этот формат'))
    }
    el.src = url
  })
}

export default function App() {
  const [source, setSource] = useState<SourceVideo | null>(null)
  const [jobs, setJobs] = useState<ClipJob[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const busy = useRef(false)
  const supported = useRef(isTrimSupported()).current

  const update = (id: string, patch: Partial<ClipJob>) =>
    setJobs((list) => list.map((j) => (j.id === id ? { ...j, ...patch } : j)))

  // Очередь: обрабатываем задачи строго по одной, в порядке добавления
  const runNext = useCallback(async (list: ClipJob[], src: SourceVideo | null) => {
    if (busy.current || !src) return
    const next = [...list].reverse().find((j) => j.status === 'queued')
    if (!next) return
    busy.current = true
    update(next.id, { status: 'processing', progress: 0 })
    try {
      const blob = await trimVideo({
        sourceUrl: src.url,
        start: next.start,
        end: next.end,
        onProgress: (p) => update(next.id, { progress: p }),
      })
      update(next.id, { status: 'done', url: URL.createObjectURL(blob), size: blob.size, progress: 1 })
    } catch (e) {
      update(next.id, { status: 'error', error: e instanceof Error ? e.message : 'Неизвестная ошибка' })
    } finally {
      busy.current = false
      setJobs((l) => [...l]) // триггерим эффект для следующей задачи
    }
  }, [])

  useEffect(() => { runNext(jobs, source) }, [jobs, source, runNext])

  const handleFile = async (file: File) => {
    setLoadError(null)
    try {
      if (source) URL.revokeObjectURL(source.url)
      setSource(await readMetadata(file))
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Ошибка загрузки')
    }
  }

  const addJob = (start: number, end: number) => {
    if (!source) return
    const job: ClipJob = {
      id: Math.random().toString(36).slice(2, 8),
      sourceName: source.name,
      start, end,
      status: 'queued',
      progress: 0,
      createdAt: Date.now(),
    }
    setJobs((list) => [job, ...list])
  }

  const removeJob = (id: string) =>
    setJobs((list) => {
      const job = list.find((j) => j.id === id)
      if (job?.url) URL.revokeObjectURL(job.url)
      return list.filter((j) => j.id !== id)
    })

  const retryJob = (id: string) => update(id, { status: 'queued', error: undefined, progress: 0 })

  return (
    <div className="app">
      <header>
        <h1>Video Cutter</h1>
        <p className="muted">Нарезка видео прямо в браузере · React + TypeScript + Vite</p>
      </header>

      {!supported && (
        <div className="warning">
          Ваш браузер не поддерживает запись видео. Откройте страницу в Chrome, Edge или Firefox.
        </div>
      )}

      <main className="layout">
        <div>
          {source
            ? <Trimmer key={source.url} video={source} onCut={addJob} onReset={() => setSource(null)} />
            : <Uploader onFile={handleFile} error={loadError} />}
        </div>
        <ClipList jobs={jobs} onRemove={removeJob} onRetry={retryJob} />
      </main>
    </div>
  )
}
