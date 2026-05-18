# Claude Code Bug Workflow Demo

Use this when you want to show the full E2E loop:

1. Introduce a small UI regression.
   - Example: in `src/components/LoginForm.jsx`, temporarily change the password input placeholder from `Enter your password` to `Enter your passcode`.
2. Run the focused Playwright test:

   ```bash
   npm run test:e2e -- tests/healthcare-ui.spec.js -g "logs in"
   ```

   Or run the visible demo version:

   ```bash
   npm run demo:bug
   ```

3. Show the failure output.
   - Playwright reports the missing locator.
   - A screenshot is saved under `test-results/.../test-failed-1.png`.
   - A video is saved under `test-results/.../video.webm`.
   - `error-context.md` shows the page snapshot and the exact failing test line.
4. Fix the UI regression.
   - Restore the placeholder to `Enter your password`.
5. Rerun the same test:

   ```bash
   npm run test:e2e -- tests/healthcare-ui.spec.js -g "logs in"
   ```

6. Show the green result.

This demonstrates that Claude Code can use E2E failure artifacts to locate a UI bug, patch it, and verify the fix.
