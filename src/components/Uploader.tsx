import { useRef, useState } from 'react'

const MAX_SIZE = 200 * 1024 * 1024

interface Props {
  onFile: (file: File) => void
  error: string | null
}

export function Uploader({ onFile, error }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [drag, setDrag] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  const handle = (file: File | undefined) => {
    if (!file) return
    if (!file.type.startsWith('video/')) return setLocalError('Это не видеофайл')
    if (file.size > MAX_SIZE) return setLocalError('Файл больше 200 МБ')
    setLocalError(null)
    onFile(file)
  }

  const shown = localError ?? error

  return (
    <div
      className={`dropzone${drag ? ' drag' : ''}`}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => { e.preventDefault(); setDrag(false); handle(e.dataTransfer.files[0]) }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        hidden
        onChange={(e) => { handle(e.target.files?.[0]); e.target.value = '' }}
      />
      <div className="dropzone-icon">▶</div>
      <p className="dropzone-title">Перетащите видео сюда или нажмите, чтобы выбрать</p>
      <p className="muted">MP4, WebM, MOV · до 200 МБ · файл не покидает ваш компьютер</p>
      {shown && <p className="error">{shown}</p>}
    </div>
  )
}
