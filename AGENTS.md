# AGENTS.md

Guidance for Codex (OpenAI) when working in this repository.

## Quick Navigation

- Read `ARCHITECTURE.md` first for project structure and component relationships.
- For deeper background, see `docs/archive/CLAUDE.md`.

## Development Commands

- `npm run dev` - start dev server
- `npm run build` - production build
- `npm run lint` - lint
- `npm run preview` - preview build

## Security Notes

- Client-side encryption only; never log or persist raw passwords.
- Use `SecureStorage.getEncryptionKey()` for crypto operations.
- Respect session timeout and recovery flow; avoid storing plaintext secrets.

## Editor / Content Safety

- Rich text is rendered via `v-html` and must be sanitized.
- Keep allowed tags aligned with TinyMCE config and AI output rules.

## AI Output Rules

- AI output must be valid HTML only (no markdown).
- Do not generate `<img>` or badges in AI output.

## Project Notes (Short)

- Tech stack: Vue 3 + Pinia + Firebase + Tailwind.
- TinyMCE is fully local: `public/tinymce/` + `tinymce-script-src="/tinymce/tinymce.min.js"`.
- Auth/encryption: email uses password-derived key; Google uses UID-derived key.
- Notes/folders are encrypted client-side before Firestore.
- Secure folder uses PIN with master-password fallback.
- Models/AI settings live in `userSettings` and sessionStorage.

## More Context

For expanded guidance and background, see `docs/archive/CLAUDE.md`.
