# GitHub Actions pnpm-lock.yaml Bugfix Design

## Overview

The GitHub Actions workflow fails because `pnpm-lock.yaml` is missing from the repository, while `package-lock.json` is explicitly gitignored. The project uses pnpm as its package manager (evidenced by pnpm scripts in package.json and the workflow configuration), but the lock file was never committed to version control. The fix requires generating `pnpm-lock.yaml` and committing it to the repository, while ensuring `package-lock.json` remains gitignored to prevent package manager conflicts.

## Glossary

- **Bug_Condition (C)**: The condition that triggers the bug - when GitHub Actions workflow runs and pnpm-lock.yaml is missing from the repository
- **Property (P)**: The desired behavior when the workflow runs - actions/setup-node@v4 successfully finds and caches dependencies using pnpm-lock.yaml
- **Preservation**: Existing local development workflow, build outputs, and dependency resolution that must remain unchanged by the fix
- **actions/setup-node@v4**: GitHub Action that sets up Node.js environment with dependency caching support for npm, yarn, and pnpm
- **cache-dependency-path**: Parameter in actions/setup-node@v4 that specifies the path to the lock file for dependency caching
- **--frozen-lockfile**: pnpm install flag that ensures exact dependency versions from lock file without modifications

## Bug Details

### Bug Condition

The bug manifests when the GitHub Actions workflow executes and attempts to set up Node.js with pnpm caching. The `actions/setup-node@v4` action is configured with `cache: 'pnpm'` and `cache-dependency-path: pnpm-lock.yaml`, but this file does not exist in the repository root because it was never committed to version control.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type GitHubActionsWorkflowRun
  OUTPUT: boolean
  
  RETURN input.workflow == "deploy-docs.yml"
         AND input.step == "Setup Node"
         AND NOT fileExistsInRepo("pnpm-lock.yaml")
         AND workflowConfigSpecifies("cache-dependency-path: pnpm-lock.yaml")
END FUNCTION
```

### Examples

- **Workflow execution on push to main**: GitHub Actions checks out the repository, attempts to run "Setup Node" step with pnpm caching, fails with error "Dependencies lock file is not found in /home/runner/work/Cloudflare-Navihive/Cloudflare-Navihive. Supported file patterns: pnpm-lock.yaml"
- **Workflow execution via workflow_dispatch**: Manual trigger of the workflow results in the same failure at the "Setup Node" step
- **Local development**: Developers run `pnpm install` successfully because pnpm generates pnpm-lock.yaml locally, but this file is not tracked in git
- **Edge case - package-lock.json exists locally**: If a developer accidentally runs `npm install`, package-lock.json is generated but gitignored, preventing npm/pnpm conflicts

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Local development workflow must continue to work exactly as before (pnpm install, pnpm dev, pnpm build)
- Dependency resolution must produce identical package versions (same dependency tree)
- Build outputs in docs/.vitepress/dist must remain byte-for-byte identical
- VitePress documentation build process must remain unchanged
- GitHub Pages deployment configuration must remain unchanged
- package-lock.json must remain gitignored to prevent package manager conflicts

**Scope:**
All inputs that do NOT involve GitHub Actions workflow execution should be completely unaffected by this fix. This includes:
- Local pnpm commands (install, dev, build, deploy)
- Wrangler deployments to Cloudflare
- Manual documentation builds
- Any other CI/CD workflows (if they exist)

## Hypothesized Root Cause

Based on the bug description and repository analysis, the root cause is:

1. **Missing Lock File in Version Control**: The repository uses pnpm as its package manager (evidenced by pnpm scripts in package.json and pnpm/action-setup@v2 in the workflow), but `pnpm-lock.yaml` was never committed to git. This is likely because:
   - The project was initially set up with npm (package-lock.json exists in file tree)
   - When switching to pnpm, the lock file was generated locally but not committed
   - Developers' local .gitignore or global gitignore may have been ignoring lock files

2. **Gitignore Configuration**: The `.gitignore` file explicitly ignores `package-lock.json` (line 34), which is correct to prevent npm/pnpm conflicts. However, `pnpm-lock.yaml` is NOT explicitly ignored, meaning it should be committed but simply wasn't added to the repository.

3. **Workflow Configuration Mismatch**: The workflow correctly specifies `cache: 'pnpm'` and `cache-dependency-path: pnpm-lock.yaml`, but the referenced file doesn't exist in the repository, causing actions/setup-node@v4 to fail during the cache setup phase.

4. **No Local Failure**: Developers don't encounter this issue locally because pnpm automatically generates pnpm-lock.yaml when running `pnpm install`, but this file remains untracked in git.

## Correctness Properties

Property 1: Bug Condition - GitHub Actions Finds pnpm-lock.yaml

_For any_ GitHub Actions workflow execution where the workflow is "deploy-docs.yml" and the step is "Setup Node" with pnpm caching enabled, the actions/setup-node@v4 action SHALL successfully locate pnpm-lock.yaml at the repository root and proceed with dependency caching and installation without errors.

**Validates: Requirements 2.1, 2.2, 2.3**

Property 2: Preservation - Local Development and Build Outputs

_For any_ local development command (pnpm install, pnpm dev, pnpm build, pnpm deploy) or build process, the system SHALL produce exactly the same dependency resolution, package versions, and build outputs as before the fix, preserving all existing functionality for developers and other deployment workflows.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct:

**File**: Repository root

**Action**: Generate and commit pnpm-lock.yaml

**Specific Changes**:
1. **Generate pnpm-lock.yaml**: Run `pnpm install` locally to generate the lock file based on the current package.json dependencies
   - This will create pnpm-lock.yaml with exact versions of all dependencies and transitive dependencies
   - The lock file will be deterministic and reproducible

2. **Verify .gitignore**: Confirm that pnpm-lock.yaml is NOT in .gitignore
   - Already verified: pnpm-lock.yaml is not ignored
   - package-lock.json remains gitignored (correct behavior)

3. **Stage and commit pnpm-lock.yaml**: Add the generated lock file to version control
   - `git add pnpm-lock.yaml`
   - `git commit -m "fix(ci): add pnpm-lock.yaml for GitHub Actions caching"`

4. **Verify workflow configuration**: Confirm that .github/workflows/deploy-docs.yml correctly references pnpm-lock.yaml
   - Already verified: workflow has `cache-dependency-path: pnpm-lock.yaml` (line 37)
   - No changes needed to workflow file

5. **Optional - Add pnpm-lock.yaml to workflow trigger paths**: The workflow already includes pnpm-lock.yaml in the paths trigger (line 18), which is correct

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bug on the current repository state (missing pnpm-lock.yaml), then verify the fix works correctly and preserves existing behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm that the GitHub Actions workflow fails due to missing pnpm-lock.yaml.

**Test Plan**: Trigger the GitHub Actions workflow on the current repository state (without pnpm-lock.yaml) and observe the failure. This confirms the root cause analysis.

**Test Cases**:
1. **Workflow Execution Test**: Push a commit to main branch that modifies docs/** and observe workflow failure at "Setup Node" step (will fail on unfixed code)
2. **Manual Workflow Trigger**: Use workflow_dispatch to manually trigger the workflow and observe the same failure (will fail on unfixed code)
3. **Local Lock File Generation**: Run `pnpm install` locally and verify that pnpm-lock.yaml is generated successfully (will succeed, confirming pnpm works locally)
4. **Git Status Check**: Run `git status` after local pnpm install and verify that pnpm-lock.yaml appears as untracked (will show untracked file on unfixed code)

**Expected Counterexamples**:
- GitHub Actions workflow fails with error message: "Dependencies lock file is not found in /home/runner/work/Cloudflare-Navihive/Cloudflare-Navihive. Supported file patterns: pnpm-lock.yaml"
- Possible causes: pnpm-lock.yaml not committed to repository, workflow configuration references non-existent file

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds (GitHub Actions workflow execution), the fixed repository produces the expected behavior (successful workflow execution).

**Pseudocode:**
```
FOR ALL workflowRun WHERE isBugCondition(workflowRun) DO
  result := executeWorkflow_fixed(workflowRun)
  ASSERT workflowSucceeds(result)
  ASSERT stepCompletes(result, "Setup Node")
  ASSERT stepCompletes(result, "Install dependencies")
  ASSERT stepCompletes(result, "Build VitePress site")
  ASSERT stepCompletes(result, "Deploy to GitHub Pages")
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold (local development commands, other workflows), the fixed repository produces the same result as the original repository.

**Pseudocode:**
```
FOR ALL command WHERE NOT isBugCondition(command) DO
  ASSERT executeCommand_original(command) = executeCommand_fixed(command)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain (different pnpm commands, different build scenarios)
- It catches edge cases that manual unit tests might miss (e.g., dependency resolution with different node_modules states)
- It provides strong guarantees that behavior is unchanged for all non-CI inputs

**Test Plan**: Observe behavior on UNFIXED code first for local development commands, then write property-based tests capturing that behavior.

**Test Cases**:
1. **Local pnpm install Preservation**: Run `pnpm install` on both unfixed and fixed code, verify identical node_modules structure and package versions
2. **Build Output Preservation**: Run `pnpm docs:build` on both unfixed and fixed code, verify byte-for-byte identical output in docs/.vitepress/dist
3. **Dependency Resolution Preservation**: Compare dependency tree from `pnpm list` on both unfixed and fixed code, verify identical versions
4. **Lock File Integrity**: Verify that the committed pnpm-lock.yaml matches the locally generated one (no manual edits or corruption)

### Unit Tests

- Test that pnpm-lock.yaml exists in repository root after fix
- Test that pnpm-lock.yaml is valid YAML and parseable by pnpm
- Test that pnpm-lock.yaml contains all dependencies from package.json
- Test that package-lock.json remains gitignored

### Property-Based Tests

- Generate random sequences of pnpm commands (install, update, add, remove) and verify consistent lock file behavior
- Generate random GitHub Actions workflow triggers and verify successful execution
- Test that dependency resolution is deterministic across multiple pnpm install runs

### Integration Tests

- Test full GitHub Actions workflow execution from checkout to deployment
- Test that VitePress documentation builds successfully in CI
- Test that GitHub Pages deployment completes successfully
- Test that workflow caching works correctly (subsequent runs use cached dependencies)
