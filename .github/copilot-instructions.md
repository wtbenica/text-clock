<!-- Copilot / AI agent helper instructions for the text-clock repository -->
# Text Clock — AI Agent Instructions

This file gives focused, actionable guidance so an AI coding agent can be immediately useful in the `text-clock` repository.

- Project purpose: a GNOME Shell extension that replaces the top-bar clock with a textual time/date display. Key runtime code lives in top-level TypeScript files compiled to JS and installed into the GNOME Shell extension folder.
- Primary language: TypeScript
- Dependency manager: yarn
- Build system: makefile


## Interaction Guidelines

- Pay attention to questions in the prompt. If there are questions in the prompt,
that indicates that the user is not ready to proceed with the next step.
- If you are unsure about something, ask the user for clarification.
- Provide concise, relevant explanations of what you are doing and why.
- In order to remove files, use `rm` command. Your built-in file deletion command is not supported.
- Include TSDoc comments for any new functions or classes you create.
- Familiarize yourself with the makefile and build process. For repetitive tasks, suggest adding makefile targets.
- Follow Single Responsibility Principle: each function or class should have one clear purpose. Refactor large functions into smaller ones as needed.
- Follow DRY principle: avoid duplicating code. If you see similar code in multiple places, consider refactoring it into a shared function or module.
- Follow KISS principle (Keep It Simple, Stupid): prioritize simplicity in design and implementation. Avoid unnecessary complexity.
- Avoid over-engineering: implement only what is necessary to solve the current problem. Don't add unnecessary abstractions or features. The extension is just a
simple clock replacement, so keep things simple.
- Testing only handles logic, not UI. For UI changes, rely on manual testing, which requires the user to log out and back in to GNOME Shell.
- When making changes, consider the impact on existing users. Avoid breaking changes unless absolutely necessary.
- Keep business logic separate from UI code. Try to write pure functions that can be tested in isolation. Use dependency injection to pass in dependencies rather than hard-coding them. All business logic should have unit tests.
- When attempting to fix bugs, use logging to help diagnose issues. Add logging statements to key points in the code to track execution flow and variable values. When done, remove any extraneous logging. Logging utilities are in `src/utils/logging`.
- When adding strings, use the gettext utilities in `src/utils/gettext` to ensure proper localization support. Also run `make i18n-update` to update the `.pot` file. Then update translations in `po/` folder.
