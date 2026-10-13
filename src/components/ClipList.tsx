import type { ClipJob } from '../types'
import { statusText } from '../types'
import { formatBytes, formatTime } from '../lib/time'

interface Props {
  jobs: ClipJob[]
  onRemove: (id: string) => void
  onRetry: (id: string) => void
}

export function ClipList({ jobs, onRemove, onRetry }: Props) {
  if (jobs.length === 0) {
    return (
      <section className="card empty">
        <p className="muted">Здесь появятся вырезанные фрагменты</p>
      </section>
    )
  }

  return (
    <section className="card">
      <h2>Фрагменты</h2>
      <ul className="clips">
        {jobs.map((job) => (
          <li key={job.id} className="clip">
            <div className="clip-info">
              <div className="clip-title">
                {formatTime(job.start)} – {formatTime(job.end)}
                <span className={`badge ${job.status}`}>{statusText[job.status]}</span>
              </div>
              <div className="muted small-text">
                {job.sourceName}{job.size ? ` · ${formatBytes(job.size)}` : ''}
              </div>
              {job.status === 'processing' && (
                <div className="progress"><div style={{ width: `${Math.round(job.progress * 100)}%` }} /></div>
              )}
              {job.status === 'error' && <div className="error small-text">{job.error}</div>}
              {job.status === 'done' && job.url && <video src={job.url} controls className="clip-video" />}
            </div>
            <div className="clip-actions">
              {job.status === 'done' && job.url && (
                <a className="button small" href={job.url} download={`clip-${job.id}.webm`}>Скачать</a>
              )}
              {job.status === 'error' && (
                <button className="small" onClick={() => onRetry(job.id)}>Повторить</button>
              )}
              {job.status !== 'processing' && (
                <button className="ghost small" onClick={() => onRemove(job.id)}>Удалить</button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
