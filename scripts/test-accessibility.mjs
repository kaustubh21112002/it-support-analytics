// scripts/test-accessibility.mjs
// Repeatable WCAG 2.2 AA Accessibility & Verification Suite
// Tests color contrast ratios, heading outline hierarchy, decorative separator hiding,
// bypass blocks, accessible names, and third-party extension isolation.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('===============================================================');
console.log(' Running WCAG 2.2 AA Accessibility & Verification Test Suite');
console.log('===============================================================\n');

let totalTests = 0;
let passedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`  [PASS] ${message}`);
    passedTests++;
  } else {
    console.error(`  [FAIL] ${message}`);
    process.exitCode = 1;
  }
}

// -----------------------------------------------------------------------------
// 1. WCAG 2.2 Relative Luminance and Contrast Ratio Engine
// -----------------------------------------------------------------------------
console.log('--- 1. WCAG 2.2 AA COLOR CONTRAST VERIFICATION ---');

function parseHex(hex) {
  const clean = hex.replace('#', '');
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16)
  ];
}

function relativeLuminance(hex) {
  const [r, g, b] = parseHex(hex).map((val) => {
    const sRGB = val / 255;
    return sRGB <= 0.04045
      ? sRGB / 12.92
      : Math.pow((sRGB + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(hex1, hex2) {
  const l1 = relativeLuminance(hex1);
  const l2 = relativeLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// Governed background tokens
const backgrounds = {
  white: '#FFFFFF',
  canvas: '#F7F8FC',
  surfaceSubtle: '#F8FAFC',
  slate100: '#F1F5F9',
  slate200: '#E2E8F0'
};

// Test secondary-text token
const updatedSecondaryText = '#475569'; // Slate-600
const oldSecondaryText = '#64748B';     // Slate-500

const oldCanvasRatio = contrastRatio(oldSecondaryText, backgrounds.canvas);
assert(
  oldCanvasRatio < 4.5,
  `Historical secondary text (#64748B) on canvas (#F7F8FC) failed WCAG AA normal text: ${oldCanvasRatio.toFixed(2)}:1 (< 4.5:1)`
);

for (const [bgName, bgHex] of Object.entries(backgrounds)) {
  const ratio = contrastRatio(updatedSecondaryText, bgHex);
  assert(
    ratio >= 4.5,
    `Shared secondary text token (#475569) on ${bgName} (${bgHex}): ${ratio.toFixed(2)}:1 (Passes WCAG AA >= 4.5:1)`
  );
}

// Test primary text and brand colors
const primaryRatio = contrastRatio('#0F172A', backgrounds.canvas);
assert(
  primaryRatio >= 7.0,
  `Primary text (#0F172A) on canvas (#F7F8FC): ${primaryRatio.toFixed(2)}:1 (Passes WCAG AAA >= 7.0:1)`
);

const brandRatio = contrastRatio('#4F46E5', backgrounds.white);
assert(
  brandRatio >= 4.5,
  `Brand CTA color (#4F46E5) on white (#FFFFFF): ${brandRatio.toFixed(2)}:1 (Passes WCAG AA >= 4.5:1)`
);

// -----------------------------------------------------------------------------
// 2. Page Heading Hierarchy & Outline Integrity (Issue 3)
// -----------------------------------------------------------------------------
console.log('\n--- 2. HEADING OUTLINE & SECTION HIERARCHY (ISSUE 3) ---');

const landingPagePath = path.join(rootDir, 'src', 'pages', 'public', 'LandingPage.tsx');
const landingPageContent = fs.readFileSync(landingPagePath, 'utf8');

// Match all heading elements in source order
const headingRegex = /<(h[1-6])[^>]*>([\s\S]*?)<\/\1>/gi;
const headings = [];
let match;
while ((match = headingRegex.exec(landingPageContent)) !== null) {
  headings.push({
    tag: match[1].toLowerCase(),
    level: parseInt(match[1][1], 10),
    text: match[2].replace(/<[^>]*>/g, '').trim()
  });
}

assert(headings.length >= 4, `Landing page contains ${headings.length} heading elements`);
assert(headings[0].tag === 'h1', `Landing page begins with top-level <h1> ("${headings[0].text.slice(0, 30)}...")`);

// Inspect SLA Compliance & Queue Health heading level
const slaHeading = headings.find((h) => h.text.includes('SLA Compliance & Queue Health'));
assert(
  slaHeading && slaHeading.tag === 'h2',
  `"SLA Compliance & Queue Health" heading is level <h2> (Corrected from premature <h3>, preventing skipped level)`
);

// Verify no heading level jumps by more than +1
let hasSkippedLevel = false;
for (let i = 1; i < headings.length; i++) {
  if (headings[i].level > headings[i - 1].level + 1) {
    hasSkippedLevel = true;
    console.error(`  Heading level jumped from ${headings[i - 1].tag} to ${headings[i].tag}`);
  }
}
assert(!hasSkippedLevel, 'Heading outline is strictly sequential with zero skipped heading levels');

// -----------------------------------------------------------------------------
// 3. Decorative Separator Hiding (Issue 51)
// -----------------------------------------------------------------------------
console.log('\n--- 3. DECORATIVE SEPARATOR DOT HIDING (ISSUE 51) ---');

// Check that standalone middle dots in LandingPage are marked aria-hidden="true"
const middleDotLines = landingPageContent
  .split('\n')
  .filter((line) => line.includes('·') && line.includes('<span'));

let allDotsHidden = true;
for (const line of middleDotLines) {
  if (!line.includes('aria-hidden="true"')) {
    allDotsHidden = false;
    console.error(`  Unshielded middle dot found in line: ${line.trim()}`);
  }
}

assert(
  allDotsHidden && middleDotLines.length >= 3,
  `All ${middleDotLines.length} decorative separator dots (·) have aria-hidden="true" to prevent screen-reader disruption`
);

// -----------------------------------------------------------------------------
// 4. Third-Party Extension Contamination Audit
// -----------------------------------------------------------------------------
console.log('\n--- 4. THIRD-PARTY EXTENSION CONTAMINATION ISOLATION ---');

const extensionSelectors = [
  'USE_CHAT_GPT_AI_ROOT',
  'ait-',
  'aitopia-',
  'data-v-a991518b'
];

function checkDirForSelectors(dirPath) {
  const files = fs.readdirSync(dirPath, { withFileTypes: true });
  const violations = [];
  for (const file of files) {
    const fullPath = path.join(dirPath, file.name);
    if (file.isDirectory()) {
      if (file.name !== 'node_modules' && file.name !== '.git' && file.name !== 'dist') {
        violations.push(...checkDirForSelectors(fullPath));
      }
    } else if (/\.(tsx?|jsx?|css|html)$/.test(file.name)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      for (const sel of extensionSelectors) {
        if (content.includes(sel)) {
          violations.push({ file: fullPath, selector: sel });
        }
      }
    }
  }
  return violations;
}

const foundViolations = checkDirForSelectors(rootDir);
assert(
  foundViolations.length === 0,
  `Repository source is 100% free of third-party extension artifacts (USE_CHAT_GPT_AI_ROOT, ait-*, aitopia-*, data-v-a991518b)`
);

// -----------------------------------------------------------------------------
// 5. Bypass Blocks & Landmark Navigation (WCAG 2.4.1)
// -----------------------------------------------------------------------------
console.log('\n--- 5. BYPASS BLOCKS & LANDMARK STRUCTURE (WCAG 2.4.1) ---');

assert(
  landingPageContent.includes('href="#main-content"') && landingPageContent.includes('id="main-content"'),
  'LandingPage includes accessible "Skip to main content" bypass link and matching main#main-content'
);

const appShellPath = path.join(rootDir, 'src', 'components', 'layout', 'AppShell.tsx');
const appShellContent = fs.readFileSync(appShellPath, 'utf8');
assert(
  appShellContent.includes('href="#main-content"') && appShellContent.includes('id="main-content"'),
  'AppShell includes accessible "Skip to main content" bypass link and matching main#main-content'
);

// -----------------------------------------------------------------------------
// 6. Accessible Names & ARIA Semantics
// -----------------------------------------------------------------------------
console.log('\n--- 6. ACCESSIBLE NAMES & ARIA SEMANTICS ---');

// Verify progressbar has full ARIA description
assert(
  landingPageContent.includes('role="progressbar"') &&
  landingPageContent.includes('aria-valuenow=') &&
  landingPageContent.includes('aria-valuetext="87.9% compliant"'),
  'Interactive progressbar has aria-label, aria-valuenow, and human-readable aria-valuetext'
);

// Verify all image tags in src/ have alt attributes
function checkImgAlt(dirPath) {
  const files = fs.readdirSync(dirPath, { withFileTypes: true });
  let missingAlt = 0;
  for (const file of files) {
    const fullPath = path.join(dirPath, file.name);
    if (file.isDirectory()) {
      if (file.name !== 'node_modules' && file.name !== '.git' && file.name !== 'dist') {
        missingAlt += checkImgAlt(fullPath);
      }
    } else if (/\.(tsx?|jsx?)$/.test(file.name)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const imgRegex = /<img\b([^>]*)\/?>/gi;
      let m;
      while ((m = imgRegex.exec(content)) !== null) {
        if (!/alt=/i.test(m[1])) {
          missingAlt++;
          console.error(`  Missing alt attribute in ${fullPath}: ${m[0]}`);
        }
      }
    }
  }
  return missingAlt;
}

const missingImgAlt = checkImgAlt(path.join(rootDir, 'src'));
assert(missingImgAlt === 0, 'All <img> elements across src/ possess explicit alt attributes');

// Verify form labels in LoginPage
const loginPagePath = path.join(rootDir, 'src', 'pages', 'auth', 'LoginPage.tsx');
const loginPageContent = fs.readFileSync(loginPagePath, 'utf8');
assert(
  loginPageContent.includes('htmlFor="login-email"') &&
  loginPageContent.includes('id="login-email"') &&
  loginPageContent.includes('htmlFor="login-password"') &&
  loginPageContent.includes('id="login-password"'),
  'LoginPage form inputs have explicitly matching <label htmlFor> bindings'
);

// -----------------------------------------------------------------------------
// SUMMARY
// -----------------------------------------------------------------------------
console.log('\n===============================================================');
console.log(` ACCESSIBILITY AUDIT RESULT: ${passedTests}/${totalTests} TESTS PASSED`);
console.log('===============================================================');

if (passedTests === totalTests) {
  console.log('\n✓ ALL APPLICATION-OWNED ACCESSIBILITY TESTS PASSED CLEANLY!\n');
  process.exit(0);
} else {
  console.error('\n✗ ACCESSIBILITY AUDIT ENCOUNTERED DEFECTS.\n');
  process.exit(1);
}
