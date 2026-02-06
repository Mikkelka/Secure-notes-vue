import { describe, expect, it } from 'vitest'
import { sanitizeNoteContent } from './sanitizeHtml'

describe('sanitizeNoteContent', () => {
  it('removes unsafe script tags', () => {
    const output = sanitizeNoteContent('<p>Hello</p><script>alert(1)</script>')
    expect(output).toContain('<p>Hello</p>')
    expect(output).not.toContain('<script')
  })

  it('linkifies plain urls safely', () => {
    const output = sanitizeNoteContent('<p>Visit https://example.com</p>')
    expect(output).toContain('href="https://example.com"')
    expect(output).toContain('<a')
  })

  it('removes javascript urls', () => {
    const output = sanitizeNoteContent('<a href="javascript:alert(1)" target="_blank">bad</a>')
    expect(output).toContain('<a')
    expect(output).not.toContain('href=')
  })
})
