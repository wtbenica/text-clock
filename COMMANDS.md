## 🛠 Makefile Reference

Your Makefile provides comprehensive project automation:

### Development Commands

```bash
make                   # Run validation (compile + test + build)
make validate          # Complete validation pipeline (code quality checks)
make compile           # TypeScript compilation only
make test              # Run all 74 tests with coverage
make check-deps        # Verify required tools are installed
```

### Build and Package Commands

```bash
make build             # Prepare dist/ directory for distribution
make pack              # Create extension ZIP file
make clean             # Clean all generated files
```

### Installation Commands

```bash
make install           # Install to user directory (~/.local/share/gnome-shell/extensions)
make install-system    # Install system-wide (requires sudo)
make uninstall         # Remove from user directory
make uninstall-system  # Remove from system (requires sudo)
```

### Translation Commands

```bash
make pot               # Generate new POT file for translations
```

### Release Commands

```bash
make release                               # Create GitHub release
make release-aur                           # Update AUR package
make release-full                          # Automated GitHub + AUR releases
make bump-version TYPE={patch|minor|major} # Start next version development
```
