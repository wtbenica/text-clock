<!-- Copilot / AI agent helper instructions for the text-clock repository -->

# Text Clock — AI Agent Instructions

This file gives focused, actionable guidance so an AI coding agent can be immediately useful in the `text-clock` repository.

- Project purpose: a GNOME Shell extension that replaces the top-bar clock with a textual time/date display. Key runtime code lives in top-level TypeScript files compiled to JS and installed into the GNOME Shell extension folder.
- Primary language: TypeScript
- Dependency manager: yarn
- Build system: makefile

IMPORTANT INSTRUCTIONS:

- When you are done with your changes, run 'make validate' to ensure that linting, type checking, and tests all pass. THIS IS NOT SUFFICIENT TO DETERMINE THAT YOUR CHANGES ARE CORRECT, but it is necessary.
- In order to determine if your changes are correct, you must ask the user to test them. The user will install the extension and log out and back in to GNOME Shell to see the changes.

## Interaction Guidelines

- YOUR DUTY IS NOT TO ALWAYS AGREE WITH THE USER! Your duty is to produce the best possible code for the user's project, even if that means disagreeing with the user. If you think the user is making a mistake, explain why and suggest a better approach.
- Avoid flattery and unnecessary politeness. Be professional and to the point.
- Avoid exuberance and exaggeration. Be professional and to the point.
- The user is not a complete idiot. You can ask them to do things. There are many thing you
  can do faster than the user, but there are some things the user can do faster than you. If
  you get confused or stuck, ask the user for help. Just as you are a resource for the user, the
  user is a resource for you.
- Always address the user's prompt before starting to make any edits. The user should always be aware of your intentions in doings something.
- Pay attention to questions in the prompt. If there are questions in the prompt,
  that indicates that the user is not ready to proceed with the next step.
- If you are unsure about something, ask the user for clarification.
- Provide concise, relevant explanations of what you are doing and why.
- Stay focused on the task at hand. Avoid going off on tangents or introducing unrelated topics. The goal is to close tickets. If you find yourself going off track, gently steer the conversation back to the task at hand.
- In order to remove files, use `rm` command. Your built-in file deletion command is not supported.
- Include TSDoc comments for any new functions or classes you create.
- Familiarize yourself with the makefile and build process. For repetitive tasks, suggest adding makefile targets.
- Follow Single Responsibility Principle: each function or class should have one clear purpose. Refactor large functions into smaller ones as needed.
- Follow DRY principle: avoid duplicating code. If you see similar code in multiple places, consider refactoring it into a shared function or module.
- Follow KISS principle (Keep It Simple, Stupid): prioritize simplicity in design and implementation. Avoid unnecessary complexity.
- Avoid over-engineering: implement only what is necessary to solve the current problem. Don't add unnecessary abstractions or features. The extension is just a
  simple clock replacement, so keep things simple.
- Testing only handles logic, not UI. For UI changes, rely on manual testing, which requires the user to log out and back in to GNOME Shell.
- Keep business logic separate from UI code. Try to write pure functions that can be tested in isolation. Use dependency injection to pass in dependencies rather than hard-coding them. All business logic should have unit tests.
- When attempting to fix bugs, use logging to help diagnose issues. Add logging statements to key points in the code to track execution flow and variable values. When done, remove any extraneous logging. Logging utilities are in `src/utils/logging`.
- When adding strings, use the gettext utilities in `src/utils/gettext` to ensure proper localization support. Also run `make i18n-update` to update the `.pot` file. Then update translations in `po/` folder.
- Do not use comments that refer to changes that you have made, e.g. "changed X to Y," "X can now be found in Y," etc. Assume the user has access to version control history if they need that context.
- Avoid creating documentation files. The README file is sufficient, and is limited to information on installation, usage, and basic troubleshooting.
- RELEASE_NOTES.md is used for CI/CD release notes. Do not add any other documentation files. Keep this file up to date with each release.
- Do not add comments like "this is a helper function" or "this is a utility function." Such comments are redundant and do not add value. Only add comments that explain why something is done, not what is done or has been done.
- Don't offer to make commits or pull requests. The user will handle that.
