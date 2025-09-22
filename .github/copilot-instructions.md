<!-- Copilot / AI agent helper instructions for the text-clock repository -->
# Text Clock — AI Agent Instructions

This file gives focused, actionable guidance so an AI coding agent can be immediately useful in the `text-clock` repository.

## Interaction Guidelines

- **Challenge and Suggest Alternatives**: Feel free to challenge ideas or suggest other approaches. Not every suggestion is a directive—treat them as brainstorming. Propose better ideas, ask questions, and engage in two-way conversation. You are a coding partner, not a servant.
- **Explain Before Acting**: Don't start making changes without explaining your thought process. Provide a concise plan for approval before implementing. Once approved, implement as you see fit.
- **Concise Explanations**: Describe your goal and key implementation points without line-by-line details. Balance brevity with necessary information.
- **Seek Confirmation**: Present plans for approval. After approval, proceed without further micromanagement.
- **Ask Questions**: If unclear, ask questions. Conversations are collaborative—leverage your strengths and seek clarification on user expertise.

- Project purpose: a GNOME Shell extension that replaces the top-bar clock with a textual time/date display. Key runtime code lives in top-level TypeScript files compiled to JS and installed into the GNOME Shell extension folder.

- Where to start:
  - Read `README.md` for install/test expectations and `Makefile` for build targets and tooling assumptions (`node`, `yarn` v4+, `glib-compile-schemas`).
  - Core runtime entrypoint: `extension.ts` — extension enable/disable lifecycle and integration with GNOME Shell UI.
  - UI implementation: `ui/clock_label.ts` (clock widget) and `clock_formatter.ts` (time -> text logic).
  - Preferences UI: `prefs.ts` and `constants/*/prefs.ts` — follow these for schema keys and i18n string sources.

- Build and test commands (use these exact commands):
  - Install/check deps: `make check-deps`
  - Build TypeScript: `yarn build` (which runs `tsc -p config/tsconfig.json`)
  - Run tests: `yarn test` (uses Jest with `config/jest.config.cjs`)
  - Development watch: `yarn dev`
  - Install extension locally: `make install` (or `yarn install:ext`)

- Important repo conventions and patterns:
  - TypeScript targets GJS imports via `gi://` and `resource:///` runtime imports. Generated JS must be compatible with GNOME Shell's GJS environment — keep `type: module` and build config in `config/tsconfig.json`.
  - Localization uses `po/` and `locale/` assets; word strings are packaged via `constants/times/*` and `constants/dates/*` (see `TRANSLATE_PACK` in `extension.ts` / `prefs.ts`).
  - Settings are stored in `Gio.Settings` keys defined in `constants/index.ts` (`SETTINGS.*`). Bindings often use `settings.bind()` or `settings.connect("changed::key", ...)`.
  - Robustness: this repository targets GNOME Shell 45+. Keep code clear and handle errors where appropriate. Prefer the centralized logging helpers in `utils/error-utils.ts` (for example `logErr`, `logWarn`, `logInfo`, `logDebug`) instead of ad-hoc helpers such as `logExtensionError` to keep error handling consistent.

- Testing patterns:
  - Unit tests live in `tests/unit` and use mocked `WordPack`/`ClockFormatter` inputs; prefer adding pure logic tests (no GJS runtime) for node-runnerable code.
  - Avoid writing integration tests that require GJS/GNOME Shell runtime unless a test harness exists — stick to `jest` unit tests for TypeScript logic.

- Typical small tasks and examples:
  - Add a new translation string: update `constants/times/*` and `constants/dates/*`, update `po/*.po`, and ensure `yarn build` still succeeds.
  - Fix clock text formatting bug: modify `clock_formatter.ts` and add/extend unit tests in `tests/unit/clock-formatter.test.ts`.
  - Change a pref-binding: update `prefs.ts`, `constants/index.ts` key name(s) if needed, and ensure `settings.bind()` usage follows existing error-handling style.

- File locations that matter most (explicit references):
  - `extension.ts` — GNOME Shell extension lifecycle and integration points
  - `ui/clock_label.ts` — visual widget and GObject properties
  - `clock_formatter.ts` — core formatting logic and fuzziness math
  - `prefs.ts` — preferences UI, bindings, and example usage of `ClockFormatter` for preview
  - `Makefile`, `make/Makefile.build`, `package.json` — build/test/install flows
  - `tests/unit` — jest unit tests that must pass on CI

- Safety and compatibility notes for agents:
  - Do not assume Node/Electron-style DOM APIs — runtime is GNOME Shell/GJS. Keep changes to logic and build outputs that remain compatible with GJS (avoid browser or Node-only APIs unless used only in tests).
  - Preserve existing defensive try/catch patterns when touching integration points. Prefer the centralized logging helpers in `utils/error-utils.ts` (for example `logErr`, `logWarn`, `logInfo`, `logDebug`) instead of `logExtensionError` so logging is consistent and test-friendly.

- When proposing code changes include:
  - Which files to modify (paths), a short rationale, and exact commands to run locally to verify (`yarn build`, `yarn test`, `make install`).
  - Small, focused unit tests for logic changes in `tests/unit`.

If anything in this file is unclear or you need more examples (e.g. how `ui/clock_label.ts` implements properties), ask for the specific area and I will surface the minimal files/snippets.
