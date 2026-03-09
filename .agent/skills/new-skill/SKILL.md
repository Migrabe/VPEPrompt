---
name: new-skill
description: Audit codebases for option conflicts, logic errors, mutual exclusions, and compatibility risks across feature combinations. Use when asked to verify interactions between newly added options and existing behavior, detect rule collisions, and propose an updated conflict-resolution model. Trigger for requests like "option conflict audit", "compatibility audit", "mutual exclusion check", and Russian equivalents such as "Аудит конфликтов опций", "проверка совместимости опций", "проверка взаимоисключений", "конфликты пресетов". Specialized for semantic and JSON prompt generation systems for image/video generation.
---

# Conflict Logic and Compatibility Auditor

## Overview

Audit option systems that combine presets, toggles, and rule-based pruning.
Focus on conflicts between new options and existing logic, then propose deterministic updated logic.

Designed for prompt generation systems where options produce semantic text prompts and JSON payloads
sent to image/video generation engines. Engine list is not fixed — treat capability gates dynamically
based on what the project declares, not a hardcoded model list.

## Workflow

1. Map option definitions and execution paths.
2. Build an interaction matrix for new options versus existing options.
3. Detect conflicts, contradictions, and compatibility gaps.
4. Validate runtime behavior with launch-level checks.
5. Deliver findings and an updated logic model.

## Step 1: Map Option Sources

Inspect all places where options are defined, transformed, or enforced:

- UI option groups and defaults
- Client state management and pruning logic
- Server-side normalization/pruning
- Prompt/JSON builders
- Import/export, presets, templates, and migrations
- Config files with rule tables (taxonomy/conflict rules)

Produce a short source map before deep analysis.

## Step 2: Build Interaction Matrix

Create a matrix centered on newly added options.
For each new option, test these pair classes:

- New option x existing hard modes
- New option x presets
- New option x engine/model-specific options
- New option x legacy aliases/fields
- New option x export/import/state restore

Track expected behavior and observed behavior for each pair.

## Step 3: Detect Problem Classes

### General conflict types

- Conflicting rules: two rules force opposite outcomes.
- One-way exclusivity: A disables B, but B does not disable A.
- Hidden stale state: disabled options stay active in output JSON/prompt.
- UI/server divergence: client allows state that server prunes differently (or vice versa).
- Precedence ambiguity: rule order changes result nondeterministically.
- Engine incompatibility: options emitted for engines that do not support them.
- Legacy drift: new canonical field added, old field still used without synchronization.

Treat high-severity issues as those that change final prompt/output silently.

### Prompt structure validation

- JSON schema compliance: validate output against the schema declared by the active engine config,
  not a hardcoded model list. Flag missing required fields, extra disallowed fields, and type mismatches.
- Token/length limits: check that assembled prompt string does not exceed the engine's declared limit.
- Empty or null required fields: detect required prompt fields left blank or set to null on submit.
- Weight/emphasis syntax: validate `(word:1.2)`, `[word]`, `{word}` — mismatched brackets, out-of-range weights.

### Semantic conflicts

- Contradictory style tags: e.g. `realistic` + `anime`, `dark` + `bright` in same positive prompt.
- Quality tag collisions: opposing quality modifiers present simultaneously (e.g. `masterpiece` + `low quality`).
- Duplicate tags with diverging weights: same concept with conflicting emphasis values.
- Positive/negative prompt overlap: terms present in both positive and negative prompt.

### Engine and model compatibility (dynamic)

- Options sent to an engine that does not declare support for them in the project's engine config.
- Aspect ratio or resolution values outside the declared range of the active engine.
- Sampling parameters (steps, CFG, sampler) outside the engine's declared valid range.
- Auxiliary modules (e.g. ControlNet, adapters) referenced without a compatible base model selected.

### Presets and templates

- Preset override order: user options vs preset — verify precedence is deterministic and documented.
- Round-trip integrity: `create → export → import → rebuild` produces identical output.
- Template variable substitution: empty variables, special characters, Unicode in substituted fields.
- Dual-preset conflict: two active presets that set the same field to different values.

### UI vs server state

- Option enabled in UI but stripped by server normalization — user receives no feedback.
- Residual state after reset/clear: fields not fully zeroed.
- Session/history restore: state loaded from history reintroduces pruned or invalid options.

### Edge cases

- Empty prompt submitted to generation endpoint.
- Maximum-length prompt for the active engine (boundary, over-boundary).
- Special characters in prompt fields: `"`, `\`, `{}`, backticks, HTML entities.
- Unicode content (non-Latin scripts, emoji) — encoding round-trip through JSON serialization.
- Regression guard: existing presets produce identical JSON output before and after rule changes.

## Step 4: Validate Runtime

Run targeted checks after analysis (and after any fixes):

- Existing smoke tests for option conflicts and prompt generation
- State round-trip checks (set -> prune -> export -> import -> build)
- Semantic conflict scan on a representative sample of saved presets
- Token/length check against each engine's declared limit
- Launch-level verification:
  - `bash scripts/verify-runtime.sh`

If a check cannot run, state exactly why and what remains unverified.

## Step 5: Propose Updated Logic

Define a strict precedence model and keep it identical on client and server.
Use this recommended order unless project constraints require another order:

1. Hard constraints (physically impossible or mode-locked combinations)
2. Mutual exclusivity groups
3. Engine capability gates (read from engine config, not hardcoded)
4. Preset overrides
5. Derived recommendations (soft rules, warnings only)

Specify for each conflict action type:

- `disable`: clear and lock target fields
- `exclude`: remove only incompatible values from multi-choice fields
- `warn`: keep state but surface warning

Require deterministic behavior:

- Apply rules in a stable order.
- Re-run pruning until state converges or max passes reached.
- Log rule hits in debug mode for reproducibility.

## New Option Integration Checklist

When introducing a new option, verify all items:

- Added to canonical state defaults
- Added to reset/clear logic
- Added to export/import serialization
- Added to server compute path
- Added to prompt and JSON builders (or explicitly excluded)
- Added to engine capability gate checks (if engine-specific)
- Added to semantic conflict rules (if it carries style/quality meaning)
- Added to conflict matrix tests
- Added to docs/config rule tables with rationale

Reject changes that skip test coverage for new option interactions.

## Output Format

Return results in this structure:

1. Findings by severity (critical -> high -> medium -> low)
2. For each finding:
   - file and line reference
   - conflicting options/rules
   - impact
   - minimal reproduction
   - concrete fix
3. Updated logic proposal:
   - precedence order
   - rule examples
   - migration notes for existing states
4. Validation status:
   - checks run
   - pass/fail
   - gaps

Keep summaries short. Prioritize concrete, testable findings.
