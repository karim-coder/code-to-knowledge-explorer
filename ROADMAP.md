# Roadmap

This document outlines near-term milestones and expected scope for each release.

---

## v0.1 — MVP (Goals)

- Repo import: GitHub public repos + local zip upload
- Parsers: Python and JavaScript/TypeScript
- Backend: FastAPI basic API (health check, parse trigger, fetch graph)
- Storage: Prototype relationships in Neo4j or a JSON/SQLite store
- Frontend: Interactive graph visualization (nodes, edges), basic search

**Target:** Deliver a working prototype for a single repo import and graph exploration.

---

## v0.2 — Expand language support & UX

- Community parser plugin system (docs + examples)
- Add Rust / Go parsers (via community contributions)
- Improve graph UX: filtering, collapse/expand, node details panel
- Export: JSON and GraphML export of knowledge graph

---

## v0.3 — AI & editor integrations

- Integrate LLM-based explanations:
  - “Explain what this function does”
  - “Show probable impact if this module is removed”
- VS Code extension to view graph inside the editor
- Caching & incremental parsing for speed

---

## v1.0 — Team & production features

- Authentication & team workspaces
- Collaboration: saved views, annotations
- Deployment guides & production-ready configuration
- Performance improvements, metrics, and monitoring

---

## Long-term ideas

- Cross-repo analysis (dependency graphs across multiple repos)
- CI hooks to auto-generate/update graph on push
- Visualization of runtime traces combined with static analysis
