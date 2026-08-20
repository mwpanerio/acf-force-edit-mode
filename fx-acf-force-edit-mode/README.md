# FX ACF Force Edit Mode (MU plugin)

Restores **ACF Blocks V2 in-canvas edit mode** when WordPress iframes the post editor.

## Why

Newer WordPress releases always iframe the post editor. ACF V2 edit-mode fields cannot run inside that iframe, so ACF forces preview.

- https://make.wordpress.org/core/2026/08/03/iframed-editor-changes-in-wordpress-7-1/
- https://www.advancedcustomfields.com/resources/acf-blocks-v3/

## Install

1. Copy **both** of these into `wp-content/mu-plugins/`:
   - `fx-acf-force-edit-mode.php` (loader)
   - `fx-acf-force-edit-mode/` (folder with PHP + JS)
2. Hard-refresh the block editor (`Cmd/Ctrl+Shift+R`).

No activation step -- MU plugins load automatically.

## What it includes

| File | Purpose |
|------|---------|
| `assets/js/acf-force-non-iframe-canvas.js` | Keeps the editor canvas non-iframed |
| `assets/js/acf-block-edit-mode.js` | Restores `mode: edit` on ACF blocks |
| PHP filters | Prefers ACF block version 2 + `mode: edit` for FX BAM blocks |

## Notes

- JSX / InnerBlocks parents (e.g. homepage wrapper) stay in preview on purpose.
- If this MU plugin is present, the theme skips its duplicate copies of the same hooks.
- This is a compatibility workaround for V2 edit UX. ACF V3 (sidebar / expanded editor) remains the longer-term iframe-native path.
