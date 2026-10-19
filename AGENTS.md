# Project Layout Rules

1. AI training: one `.ipynb` in `training/`, never `.py`. Dataset in `training/dataset/`. Keep few files, no clutter.
2. Notebook structure: a Markdown cell heading each section: Imports, Data, Model, Training, Eval.
3. UI + DB: separate `frontend/` and `backend/` folders. (No DB in v1, single Next.js app. If persistence is added later, split into `frontend/` and `backend/`).

## Coding Rules
- Idiomatic, well-typed, production-grade, compact.
- Functional first. Functions under 30 lines.
- Comments only for non-trivial logic.
- Handle exceptions explicitly. No empty `catch` blocks.
- Run project linters/formatters on edited files before declaring done.
- Flat color fills only. No gradient text, no ai-slop color gradation.
