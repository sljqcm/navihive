import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'yaml';

/**
 * Bug Condition Exploration Test for GitHub Actions pnpm-lock.yaml Issue
 * 
 * **Validates: Requirements 1.1, 1.2, 1.3, 2.1, 2.2, 2.3**
 * 
 * This test encodes the EXPECTED BEHAVIOR from the bugfix spec.
 * On UNFIXED code (missing pnpm-lock.yaml), this test WILL FAIL - that's correct!
 * The failure confirms the bug exists.
 * 
 * After the fix is implemented (pnpm-lock.yaml is committed), this test WILL PASS,
 * confirming the bug is fixed.
 */
describe('Property 1: Bug Condition - GitHub Actions Cannot Find pnpm-lock.yaml', () => {
  const repoRoot = path.resolve(__dirname, '..');
  const pnpmLockPath = path.join(repoRoot, 'pnpm-lock.yaml');
  const workflowPath = path.join(repoRoot, '.github', 'workflows', 'deploy-docs.yml');

  /**
   * Test implementation of isBugCondition from design.md:
   * 
   * FUNCTION isBugCondition(input)
   *   RETURN input.workflow == "deploy-docs.yml"
   *          AND input.step == "Setup Node"
   *          AND NOT fileExistsInRepo("pnpm-lock.yaml")
   *          AND workflowConfigSpecifies("cache-dependency-path: pnpm-lock.yaml")
   * END FUNCTION
   */
  it('should have pnpm-lock.yaml in repository root for GitHub Actions caching', () => {
    // Expected Behavior 2.3: WHEN the repository is checked out in CI 
    // THEN the system SHALL find pnpm-lock.yaml committed to version control
    expect(
      fs.existsSync(pnpmLockPath),
      'pnpm-lock.yaml must exist in repository root for GitHub Actions workflow to succeed'
    ).toBe(true);
  });

  it('should have valid pnpm-lock.yaml that can be parsed', () => {
    // Expected Behavior 2.2: WHEN actions/setup-node@v4 attempts to cache dependencies
    // THEN the system SHALL find pnpm-lock.yaml at the repository root
    
    // This test will fail on unfixed code because the file doesn't exist
    if (!fs.existsSync(pnpmLockPath)) {
      throw new Error(
        'pnpm-lock.yaml not found. This matches the GitHub Actions error: ' +
        '"Dependencies lock file is not found in /home/runner/work/Cloudflare-Navihive/Cloudflare-Navihive. ' +
        'Supported file patterns: pnpm-lock.yaml"'
      );
    }

    const content = fs.readFileSync(pnpmLockPath, 'utf-8');
    
    // Verify it's valid YAML
    expect(() => {
      const parsed = yaml.parse(content);
      expect(parsed).toBeDefined();
      expect(parsed.lockfileVersion).toBeDefined();
    }).not.toThrow();
  });

  it('should have workflow configuration that references pnpm-lock.yaml', () => {
    // Verify the workflow file exists and is configured correctly
    expect(fs.existsSync(workflowPath)).toBe(true);

    const workflowContent = fs.readFileSync(workflowPath, 'utf-8');
    
    // Verify workflow specifies cache: 'pnpm'
    expect(workflowContent).toContain("cache: 'pnpm'");
    
    // Verify workflow specifies cache-dependency-path: pnpm-lock.yaml
    expect(workflowContent).toContain('cache-dependency-path: pnpm-lock.yaml');
  });

  it('should have pnpm-lock.yaml matching the workflow cache-dependency-path', () => {
    // Expected Behavior 2.1: WHEN the GitHub Actions workflow runs
    // THEN the system SHALL successfully locate pnpm-lock.yaml and proceed with dependency installation
    
    const workflowContent = fs.readFileSync(workflowPath, 'utf-8');
    
    // Extract the cache-dependency-path from workflow
    const cacheDependencyPathMatch = workflowContent.match(/cache-dependency-path:\s*(.+)/);
    expect(cacheDependencyPathMatch).toBeDefined();
    
    const expectedPath = cacheDependencyPathMatch![1].trim();
    expect(expectedPath).toBe('pnpm-lock.yaml');
    
    // Verify the file exists at the expected location
    const lockFilePath = path.join(repoRoot, expectedPath);
    expect(
      fs.existsSync(lockFilePath),
      `Lock file must exist at ${expectedPath} as specified in workflow configuration`
    ).toBe(true);
  });

  it('should not have package-lock.json in repository (gitignored to prevent conflicts)', () => {
    // Verify package-lock.json is gitignored (prevents npm/pnpm conflicts)
    const packageLockPath = path.join(repoRoot, 'package-lock.json');
    const gitignorePath = path.join(repoRoot, '.gitignore');
    
    if (fs.existsSync(gitignorePath)) {
      const gitignoreContent = fs.readFileSync(gitignorePath, 'utf-8');
      expect(gitignoreContent).toContain('package-lock.json');
    }
  });
});
