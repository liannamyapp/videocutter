/** Форматирует секунды в mm:ss.d */
export function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '00:00.0'
  const m = Math.floor(seconds / 60)
  const s = seconds - m * 60
  return `${String(m).padStart(2, '0')}:${s.toFixed(1).padStart(4, '0')}`
}

/** Разбирает "mm:ss", "mm:ss.d" или "ss" в секунды. Возвращает null при ошибке. */
export function parseTime(input: string): number | null {
  const value = input.trim()
  if (!/^\d+(:\d{1,2})?(\.\d+)?$/.test(value)) return null
  const parts = value.split(':')
  if (parts.length === 1) return Number(parts[0])
  const minutes = Number(parts[0])
  const seconds = Number(parts[1])
  if (seconds >= 60) return null
  return minutes * 60 + seconds
}

export type RangeError = 'start-negative' | 'end-before-start' | 'end-after-duration' | 'too-short'

export const MIN_CLIP_SECONDS = 0.5

/** Проверяет таймкоды фрагмента. Возвращает код ошибки или null. */
export function validateRange(start: number, end: number, duration: number): RangeError | null {
  if (start < 0) return 'start-negative'
  if (end <= start) return 'end-before-start'
  if (end > duration + 0.01) return 'end-after-duration'
  if (end - start < MIN_CLIP_SECONDS) return 'too-short'
  return null
}

export const rangeErrorText: Record<RangeError, string> = {
  'start-negative': 'Начало не может быть отрицательным',
  'end-before-start': 'Конец должен быть позже начала',
  'end-after-duration': 'Конец выходит за длительность видео',
  'too-short': `Фрагмент должен быть не короче ${MIN_CLIP_SECONDS} с`,
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} Б`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`
  return `${(bytes / 1024 / 1024).toFixed(1)} МБ`
}
