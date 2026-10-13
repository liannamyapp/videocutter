export type JobStatus = 'queued' | 'processing' | 'done' | 'error'

export interface SourceVideo {
  name: string
  size: number
  url: string
  duration: number
  width: number
  height: number
}

export interface ClipJob {
  id: string
  sourceName: string
  start: number
  end: number
  status: JobStatus
  progress: number
  createdAt: number
  url?: string
  size?: number
  error?: string
}

export const statusText: Record<JobStatus, string> = {
  queued: 'В очереди',
  processing: 'Обрабатывается',
  done: 'Готово',
  error: 'Ошибка',
}
