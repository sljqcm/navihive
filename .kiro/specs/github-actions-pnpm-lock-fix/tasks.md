# Implementation Plan

- [x] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - GitHub Actions Cannot Find pnpm-lock.yaml
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bug exists
  - **Scoped PBT Approach**: For this deterministic bug, scope the property to the concrete failing case: GitHub Actions workflow execution with missing pnpm-lock.yaml
  - Test that GitHub Actions workflow fails when pnpm-lock.yaml is missing from repository root
  - Verify error message matches: "Dependencies lock file is not found in /home/runner/work/Cloudflare-Navihive/Cloudflare-Navihive. Supported file patterns: pnpm-lock.yaml"
  - Test implementation details from Bug Condition: isBugCondition returns true when workflow=="deploy-docs.yml" AND step=="Setup Node" AND NOT fileExistsInRepo("pnpm-lock.yaml")
  - The test assertions should match the Expected Behavior Properties: actions/setup-node@v4 SHALL successfully locate pnpm-lock.yaml
  - Run test on UNFIXED code (current repository state without pnpm-lock.yaml)
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bug exists)
  - Document counterexamples found to understand root cause (e.g., "Workflow execution on push to main fails at Setup Node step with missing lock file error")
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Local Development and Build Outputs Unchanged
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED code for non-buggy inputs (local pnpm commands)
  - Run `pnpm install` locally and observe that dependencies install correctly
  - Run `pnpm docs:build` and capture the build output hash/checksum
  - Run `pnpm list` and capture the dependency tree structure
  - Write property-based tests capturing observed behavior patterns from Preservation Requirements:
    - Property: For all local pnpm commands (install, dev, build), dependency resolution and build outputs remain identical
    - Property: For all package versions in pnpm-lock.yaml, the resolved versions match package.json constraints
    - Property: For all build artifacts in docs/.vitepress/dist, the file contents remain byte-for-byte identical
  - Property-based testing generates many test cases for stronger guarantees
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ] 3. Fix for missing pnpm-lock.yaml in repository

  - [x] 3.1 Generate and commit pnpm-lock.yaml
    - Run `pnpm install` locally to generate pnpm-lock.yaml from package.json
    - Verify pnpm-lock.yaml is created in repository root
    - Verify .gitignore does NOT ignore pnpm-lock.yaml (only package-lock.json should be ignored)
    - Stage the lock file: `git add pnpm-lock.yaml`
    - Commit with conventional commit message: `git commit -m "fix(ci): add pnpm-lock.yaml for GitHub Actions caching"`
    - Verify workflow configuration in .github/workflows/deploy-docs.yml correctly references pnpm-lock.yaml (no changes needed)
    - _Bug_Condition: isBugCondition(input) where input.workflow=="deploy-docs.yml" AND NOT fileExistsInRepo("pnpm-lock.yaml")_
    - _Expected_Behavior: actions/setup-node@v4 SHALL successfully locate pnpm-lock.yaml and proceed with dependency caching_
    - _Preservation: Local development workflow (pnpm install, pnpm dev, pnpm build) SHALL produce identical results; build outputs SHALL remain byte-for-byte identical; dependency resolution SHALL produce same package versions_
    - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 3.4_

  - [ ] 3.2 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - GitHub Actions Finds pnpm-lock.yaml
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 1
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - Verify GitHub Actions workflow can locate pnpm-lock.yaml at repository root
    - Verify actions/setup-node@v4 successfully caches dependencies
    - Verify workflow completes all steps: Setup Node → Install dependencies → Build VitePress site → Deploy to GitHub Pages
    - _Requirements: 2.1, 2.2, 2.3_

  - [ ] 3.3 Verify preservation tests still pass
    - **Property 2: Preservation** - Local Development and Build Outputs Unchanged
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run preservation property tests from step 2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Verify `pnpm install` produces identical node_modules structure
    - Verify `pnpm docs:build` produces byte-for-byte identical output (compare checksums)
    - Verify `pnpm list` shows identical dependency tree
    - Verify committed pnpm-lock.yaml matches locally generated one (no manual edits)
    - Confirm all tests still pass after fix (no regressions)

- [ ] 4. Checkpoint - Ensure all tests pass
  - Verify bug condition test passes (GitHub Actions workflow succeeds)
  - Verify preservation tests pass (local development unchanged)
  - Verify pnpm-lock.yaml is committed and tracked in git
  - Verify package-lock.json remains gitignored
  - Push changes and monitor GitHub Actions workflow execution
  - Ensure all tests pass, ask the user if questions arise
