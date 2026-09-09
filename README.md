# UMAS3D Project Page

This directory is a self-contained static website suitable for GitHub Pages.
It has no runtime dependency on files outside this directory.

## Structure

- `index.html`: page entry point
- `css/`: page styles
- `js/`: demo and instruction-modal behavior
- `fonts/`: locally hosted fonts used by the page
- `assets/fig1.png`: overview figure
- `assets/own_results/`: all demo videos, preview images, editing-instruction images, and the demo manifest

## Local preview

```bash
python -m http.server 8000
```

Then open `http://localhost:8000/`.

## GitHub Pages

Upload this directory as the repository root and configure GitHub Pages to deploy from the repository branch. All website asset paths are relative and work under a GitHub Pages project subpath.
