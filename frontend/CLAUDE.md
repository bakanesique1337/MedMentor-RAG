# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Правила и стандарты

Детальные правила кодирования находятся в `.claude/rules/`:

- `vue-best-practices.md` — архитектура компонентов, naming
- `typescript.md` — конвенции TypeScript, запрещённые паттерны
- `structure.md` — файловая структура проекта

## Project Overview

MedMentor-RAG project is an AI-powered medical training simulator designed for medical students and
continuing medical education programs.
The system simulates a multi-turn dialogue with a virtual patient to help users practice clinical
reasoning, history taking, and diagnostic hypothesis building.

The core principle of the system is strict fact-grounded dialogue generation. The AI model does not generate medical
facts autonomously. Instead, it verbalizes only verified clinical data retrieved from a structured knowledge base using
a Retrieval-Augmented Generation (RAG) architecture.

## Architecture Overview

Backend:

- Java + Spring Boot
- Spring AI for LLM abstraction and RAG pipelines
- PostgreSQL with pgvector extension

The backend is responsible for:

- Managing dialogue sessions
- Performing semantic search over clinical case fragments
- Aggregating retrieved knowledge into structured prompts
- Enforcing strict fact grounding
- Logging dialogue activity and retrieved fragments

Frontend:

- SPA
- Vue 3, Composition API
- Tailwind
- Vite
- Bun

## Code Style

- Keep code simple, explicit, typed, and ready for automation.
- Source files are UTF-8 but must contain only ASCII characters. Do not use smart quotes,
  ellipses, em-dashes, emoji, or other non-ASCII glyphs.
- Prefer explicit over implicit constructs. No wildcard imports.

## Ключевые запреты

- ❌ `px` для размеров (кроме `1px` для border)
- ❌ `any` в TypeScript
- ❌ `==` / `!=` — только `===` / `!==`
- ❌ `window`/`document` вне `onMounted`
- ❌ `:key` через index массива

## Build Commands

- `bun run dev` — run dev-server
- `bun run build` — build
- `bun run type-check` — TypeScript check
- `bun run el:check` / `el:fix` — ESLint
- `bun run sl:check` / `sl:fix` — Stylelint

## Updating this document

AI agents should update this file whenever they learn something new about this project
that future tasks might need to take into account. Keeping the guidelines current helps
everyone work more effectively.
