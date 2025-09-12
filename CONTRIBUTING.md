Thanks for your interest in contributing to Text Clock!

Quick start

- Install Node.js (npm) or Yarn, plus Perl and Makefile tooling.
- Install dependencies:

```bash
yarn install
# or: npm install
```

- Build:

```bash
yarn build
# or: make pack
```

- Run tests:

```bash
yarn test
# or: npm test
```

Style and linting

- Formatting is enforced by Prettier. Run `yarn format` before committing.
- Linting is optional but encouraged: `yarn lint`.

Code layout

- Constants have been moved into `constants/` with subfolders for `dates/` and `times/`.
- Runtime variants live in `constants/dates/extension.ts` and `constants/dates/prefs.ts` (and similar for `times`).
- If you add or move constants, please keep the runtime `.js` suffix in import paths so GNOME's GJS can resolve them at runtime.

Submitting

- Fork the repository, create a feature branch, and open a pull request against `main`.
- Keep commits focused and include tests where relevant.

Thanks!
