# Contributing to Code-to-Knowledge Explorer

Thank you for wanting to contribute! This document explains how to set up the project, the contribution workflow, and how to add new language parsers.

---

## Code of conduct

Please read and follow the [Code of Conduct](CODE_OF_CONDUCT.md).

---

## Local development (recommended)

### Using Docker (recommended)

1. Install Docker & Docker Compose.
2. From the repository root:

```bash
docker-compose up --build
```

3. Open:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000`

### Without Docker

**Backend**

```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
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

## How to contribute (workflow)

1. **Fork** the repository on GitHub.
2. Create a feature branch from `main`:

```bash
git switch -c feat/your-feature-name
```

3. Make changes, run tests and linters.
4. Commit changes using **Conventional Commits** (see below).
5. Push your branch and open a Pull Request to `main`.
6. Fill the PR template and reference any related issue.

---

## Branch & commit conventions

**Branch name examples**

- `feat/parser-python`
- `fix/api-dependency-query`
- `chore/docs-update`

**Commit message style (Conventional Commits)**:

```
<type>(scope?): short description

optional body

optional footer(s)
```

Common types:

- `feat` — new feature
- `fix` — bug fix
- `docs` — documentation only changes
- `chore` — build, CI, tooling
- `test` — tests

**Examples**

- `feat(parser): add python parser skeleton`
- `fix(api): correct dependency traversal`
- `docs: update CONTRIBUTING.md`

---

## Adding a new language parser

Parsers live in `backend/parsers/`. Each parser should:

1. Implement a `parse_repo(path: str) -> dict` function that returns structured data.
2. Produce JSON with at least these keys: `modules`, `functions`, `classes`, `calls`, `imports`.

**Example minimal return structure**

```json
{
  "modules": [{ "id": "module_a", "path": "src/a.py" }],
  "functions": [
    {
      "id": "module_a.func1",
      "name": "func1",
      "module": "module_a",
      "start_line": 10
    }
  ],
  "calls": [{ "caller": "module_a.func1", "callee": "module_b.func2" }],
  "imports": [{ "module": "module_a", "imports": ["module_b"] }]
}
```

**Testing a parser**

- Add unit tests under `backend/tests/`.
- Run tests with `pytest` (or `python -m pytest`).

---

## Opening a PR

- Reference the issue number (if any).
- Describe what you changed and why.
- Include testing instructions and screenshots if the change is UI-related.
- Ensure CI passes.

---

## Communication

- Use GitHub Issues & Discussions for design questions.
- If you need help, open an issue with the `help wanted` label or join the project Discussion (if enabled).

---

Thanks again — your contributions help make this project useful for everyone!
