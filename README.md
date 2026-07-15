# 五子棋 · 卿卿 vs 栖栖 🦊

A small single-page Gomoku (Five-in-a-Row) game built with React + Vite.
You play as **卿卿** (black ⚫); a simple heuristic AI, **栖栖** (white ⚪), plays back.

## Features

- 13×13 board rendered with SVG
- Click any empty intersection to place a stone; the AI replies instantly
- Heuristic AI that both attacks and blocks (weighs offense slightly higher)
- Win detection in all four directions, last-move highlight, move counter
- One-tap **重新开始** (restart)

## Getting started

```bash
npm install
npm run dev
```

Then open the URL Vite prints (default http://localhost:5173).

## Build

```bash
npm run build
npm run preview
```

## Project layout

```
index.html          # Vite entry
src/main.jsx        # React root
src/Gomoku.jsx      # Game board, win logic, and AI
src/index.css       # Global reset
```
