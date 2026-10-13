import { describe, expect, it } from 'vitest'
import { formatBytes, formatTime, parseTime, validateRange } from './time'

describe('formatTime', () => {
  it('форматирует секунды', () => {
    expect(formatTime(0)).toBe('00:00.0')
    expect(formatTime(65.25)).toBe('01:05.3')
  })
  it('защищается от некорректных значений', () => {
    expect(formatTime(NaN)).toBe('00:00.0')
    expect(formatTime(-3)).toBe('00:00.0')
  })
})

describe('parseTime', () => {
  it('разбирает разные форматы', () => {
    expect(parseTime('12')).toBe(12)
    expect(parseTime('1:05')).toBe(65)
    expect(parseTime('01:05.5')).toBe(65.5)
  })
  it('отклоняет мусор', () => {
    expect(parseTime('abc')).toBeNull()
    expect(parseTime('1:75')).toBeNull()
    expect(parseTime('')).toBeNull()
  })
})

describe('validateRange', () => {
  it('принимает корректный диапазон', () => {
    expect(validateRange(1, 5, 10)).toBeNull()
  })
  it('ловит ошибки', () => {
    expect(validateRange(-1, 5, 10)).toBe('start-negative')
    expect(validateRange(5, 5, 10)).toBe('end-before-start')
    expect(validateRange(1, 12, 10)).toBe('end-after-duration')
    expect(validateRange(1, 1.2, 10)).toBe('too-short')
  })
})

describe('formatBytes', () => {
  it('выбирает единицы', () => {
    expect(formatBytes(500)).toBe('500 Б')
    expect(formatBytes(2048)).toBe('2.0 КБ')
    expect(formatBytes(5 * 1024 * 1024)).toBe('5.0 МБ')
  })
})
