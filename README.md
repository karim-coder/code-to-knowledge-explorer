# 🧭 Code-to-Knowledge Explorer

Turn codebases into **interactive knowledge graphs** for faster onboarding, easier exploration, and better debugging.

---

## Table of Contents

- [Features](#features)
- [Quickstart](#quickstart)
- [Project structure](#project-structure)
- [Tech stack](#tech-stack)
- [Contributing](#contributing)
- [Roadmap](#roadmap)
- [License](#license)

---

## Features

- Import repositories (GitHub / local zip)
- Parse Python & JavaScript/TypeScript (functions, classes, imports)
- Visualize relationships in an interactive graph (modules → functions → calls)
- Search: “Where is function X used?”
- Extensible parser architecture — add support for more languages

---

## Quickstart

> **Note:** Replace `YOUR_GITHUB_USERNAME` below with your GitHub username.

### 1. Clone the repo

```bash
git clone git@github.com:YOUR_GITHUB_USERNAME/code-to-knowledge-explorer.git
cd code-to-knowledge-explorer
```

### 2. Run with Docker (recommended for development)

```bash
docker-compose up --build
```

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000`

### 3. Run without Docker (alternative)

**Backend**

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Frontend**

```bash
cd frontend
npm install
npm run dev
```

---

## Project structure (top-level)

```
.
├── .github/                # Templates, workflows
├── backend/                # FastAPI + parsers
├── frontend/               # Next.js UI
├── docs/                   # Documentation & assets
├── docker-compose.yml
├── README.md
├── CONTRIBUTING.md
├── ROADMAP.md
└── CODE_OF_CONDUCT.md
```

---

## Tech stack

- **Frontend:** Next.js + React + TailwindCSS + Cytoscape.js (or similar graph lib)
- **Backend:** FastAPI (Python) for parsing + REST API
- **Storage:** Neo4j (graph DB) for relationships (or start with SQLite for MVP)
- **Parsing:** Python AST libraries (`ast`, `libcst`) and `ts-morph` for TypeScript

---

## Contributing

We welcome contributions — see [CONTRIBUTING.md](CONTRIBUTING.md).

If you’re new: look for issues labeled `good first issue` or `help wanted`.

---

## Roadmap

See [ROADMAP.md](ROADMAP.md) for short-term and mid-term milestones.

---

## License

This project is licensed under the **MIT License**. See `LICENSE` for details.
