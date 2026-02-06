import DOMPurify from 'dompurify'

const ALLOWED_TAGS = [
  'p',
  'h1',
  'h2',
  'h3',
  'strong',
  'em',
  'u',
  's',
  'ul',
  'ol',
  'li',
  'br',
  'a',
  'code',
  'pre',
  'blockquote'
]

const ALLOWED_ATTR = [
  'href',
  'target',
  'rel',
  'data-mce-href'
]
const SAFE_URI_REGEX = /^(https?:|mailto:|tel:)/i
const URL_REGEX = /\b((?:https?:\/\/|www\.)[^\s<]+[^\s<.)])/gi
const SANITIZE_CACHE = new Map()
const MAX_CACHE_ENTRIES = 200
let hooksInstalled = false

const getCachedSanitized = (content) => {
  if (!SANITIZE_CACHE.has(content)) return null
  const value = SANITIZE_CACHE.get(content)
  SANITIZE_CACHE.delete(content)
  SANITIZE_CACHE.set(content, value)
  return value
}

const setCachedSanitized = (content, sanitized) => {
  SANITIZE_CACHE.set(content, sanitized)
  if (SANITIZE_CACHE.size > MAX_CACHE_ENTRIES) {
    const oldestKey = SANITIZE_CACHE.keys().next().value
    SANITIZE_CACHE.delete(oldestKey)
  }
}

const linkifyHtml = (html) => {
  if (typeof DOMParser === 'undefined') {
    return html.replace(URL_REGEX, (match) => {
      const href = match.startsWith('www.') ? `https://${match}` : match
      return `<a href="${href}" target="_blank" rel="noopener noreferrer">${match}</a>`
    })
  }

  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT)
  const textNodes = []

  while (walker.nextNode()) {
    const node = walker.currentNode
    const parentTag = node.parentElement?.tagName
    if (parentTag === 'A' || parentTag === 'CODE' || parentTag === 'PRE') continue
    if (URL_REGEX.test(node.nodeValue)) {
      textNodes.push(node)
    }
    URL_REGEX.lastIndex = 0
  }

  textNodes.forEach((node) => {
    const frag = doc.createDocumentFragment()
    const text = node.nodeValue || ''
    let lastIndex = 0
    let match

    URL_REGEX.lastIndex = 0
    while ((match = URL_REGEX.exec(text)) !== null) {
      if (match.index > lastIndex) {
        frag.appendChild(doc.createTextNode(text.slice(lastIndex, match.index)))
      }
      const raw = match[1]
      const href = raw.startsWith('www.') ? `https://${raw}` : raw
      const link = doc.createElement('a')
      link.setAttribute('href', href)
      link.setAttribute('target', '_blank')
      link.setAttribute('rel', 'noopener noreferrer')
      link.textContent = raw
      frag.appendChild(link)
      lastIndex = match.index + raw.length
    }
    if (lastIndex < text.length) {
      frag.appendChild(doc.createTextNode(text.slice(lastIndex)))
    }
    node.parentNode?.replaceChild(frag, node)
  })

  return doc.body.innerHTML
}

const ensureHooksInstalled = () => {
  if (hooksInstalled) return

  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    if (node.tagName !== 'A') return

    const dataHref = node.getAttribute('data-mce-href')
    const href = node.getAttribute('href')
    const candidate = href || dataHref

    if (candidate && SAFE_URI_REGEX.test(candidate)) {
      node.setAttribute('href', candidate)
      node.removeAttribute('data-mce-href')
    } else {
      node.removeAttribute('href')
      node.removeAttribute('data-mce-href')
    }

    if (node.getAttribute('target') === '_blank') {
      const rel = node.getAttribute('rel') || ''
      const tokens = new Set(rel.split(/\s+/).filter(Boolean))
      tokens.add('noopener')
      tokens.add('noreferrer')
      node.setAttribute('rel', Array.from(tokens).join(' '))
    } else {
      node.removeAttribute('target')
      node.removeAttribute('rel')
    }
  })

  hooksInstalled = true
}

export const sanitizeNoteContent = (content) => {
  if (!content || typeof content !== 'string') return ''

  ensureHooksInstalled()

  const cached = getCachedSanitized(content)
  if (cached !== null) return cached

  const linkifiedContent = linkifyHtml(content)

  const sanitized = DOMPurify.sanitize(linkifiedContent, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOWED_URI_REGEXP: SAFE_URI_REGEX,
    ALLOW_DATA_ATTR: false
  })

  setCachedSanitized(content, sanitized)
  return sanitized
}
