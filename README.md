# VPEPrompt

VPE Prompt Builder is a dual-surface project:

- Full application: Node/Express runtime with API-backed features such as prompt normalization, translation, enhancement, and automatic mobile/desktop routing.
- Static preview: GitHub Pages-compatible frontend shell for browsing and generating prompts without backend-only actions.

## Deployment Model

- `main`: source of truth for the full Node application.
- `gh-pages`: static GitHub Pages preview only.
- Render or another Node host should run the full app through `render.yaml`.

## Local Run

```bash
npm install
npm start
```

App URL:

- Desktop: `http://localhost:3000/`
- Mobile: `http://localhost:3000/mobile/`

## Verification

Run the project smoke suite before pushing:

```bash
bash scripts/verify-runtime.sh
```

## Health Endpoints

- `GET /health`
- `GET /ready`

## GitHub Pages Notes

GitHub Pages hosts the static shell only. Backend-dependent actions such as translation and AI enhancement are intentionally unavailable there.
