import { useEffect, useRef, useState } from 'react'
import type { SourceVideo } from '../types'
import { formatBytes, formatTime, parseTime, rangeErrorText, validateRange } from '../lib/time'

interface Props {
  video: SourceVideo
  onCut: (start: number, end: number) => void
  onReset: () => void
}

export function Trimmer({ video, onCut, onReset }: Props) {
  const ref = useRef<HTMLVideoElement>(null)
  const [start, setStart] = useState(0)
  const [end, setEnd] = useState(Math.min(video.duration, 10))
  const [startText, setStartText] = useState(formatTime(0))
  const [endText, setEndText] = useState(formatTime(Math.min(video.duration, 10)))
  const [current, setCurrent] = useState(0)

  useEffect(() => { setStartText(formatTime(start)) }, [start])
  useEffect(() => { setEndText(formatTime(end)) }, [end])

  const error = validateRange(start, end, video.duration)
  const pct = (t: number) => `${(t / video.duration) * 100}%`

  const commitText = (text: string, setter: (n: number) => void, fallback: number, setText: (s: string) => void) => {
    const parsed = parseTime(text)
    if (parsed === null) setText(formatTime(fallback))
    else setter(Math.min(parsed, video.duration))
  }

  const previewRange = () => {
    const el = ref.current
    if (!el) return
    el.currentTime = start
    el.play()
  }

  return (
    <section className="card">
      <div className="card-head">
        <div>
          <h2>{video.name}</h2>
          <p className="muted">
            {formatTime(video.duration)} · {video.width}×{video.height} · {formatBytes(video.size)}
          </p>
        </div>
        <button className="ghost" onClick={onReset}>Другое видео</button>
      </div>

      <video
        ref={ref}
        src={video.url}
        controls
        className="player"
        onTimeUpdate={(e) => {
          const t = e.currentTarget.currentTime
          setCurrent(t)
          if (t >= end && !e.currentTarget.paused && t - end < 0.5) e.currentTarget.pause()
        }}
      />

      <div className="timeline" aria-hidden>
        <div className="range" style={{ left: pct(start), width: pct(Math.max(0, end - start)) }} />
        <div className="playhead" style={{ left: pct(current) }} />
      </div>

      <div className="sliders">
        <label>
          Начало
          <input type="range" min={0} max={video.duration} step={0.1} value={start}
            onChange={(e) => setStart(Number(e.target.value))} />
        </label>
        <label>
          Конец
          <input type="range" min={0} max={video.duration} step={0.1} value={end}
            onChange={(e) => setEnd(Number(e.target.value))} />
        </label>
      </div>

      <div className="controls">
        <div className="time-field">
          <span>С</span>
          <input value={startText} onChange={(e) => setStartText(e.target.value)}
            onBlur={() => commitText(startText, setStart, start, setStartText)}
            onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()} />
          <button className="ghost small" onClick={() => setStart(Math.round(current * 10) / 10)}>← текущее</button>
        </div>
        <div className="time-field">
          <span>По</span>
          <input value={endText} onChange={(e) => setEndText(e.target.value)}
            onBlur={() => commitText(endText, setEnd, end, setEndText)}
            onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()} />
          <button className="ghost small" onClick={() => setEnd(Math.round(current * 10) / 10)}>← текущее</button>
        </div>
      </div>

      <div className="actions">
        <span className="muted">Длина фрагмента: {formatTime(Math.max(0, end - start))}</span>
        <div className="actions-buttons">
          <button className="ghost" onClick={previewRange} disabled={!!error}>Просмотр</button>
          <button onClick={() => onCut(start, end)} disabled={!!error}>Вырезать</button>
        </div>
      </div>
      {error && <p className="error">{rangeErrorText[error]}</p>}
    </section>
  )
}
