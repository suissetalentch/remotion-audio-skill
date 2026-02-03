# Contributing to remotion-audio-skill

First off, thank you for considering contributing to remotion-audio-skill! It's people like you that make this library a great tool for the Remotion community.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Making Changes](#making-changes)
- [Testing](#testing)
- [Submitting a Pull Request](#submitting-a-pull-request)
- [Style Guide](#style-guide)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Features](#suggesting-features)

## Code of Conduct

This project and everyone participating in it is governed by our commitment to creating a welcoming and inclusive environment. Please be respectful and constructive in all interactions.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/remotion-audio-skill.git
   cd remotion-audio-skill
   ```
3. **Add the upstream remote**:
   ```bash
   git remote add upstream https://github.com/suissetalentch/remotion-audio-skill.git
   ```

## Development Setup

### Prerequisites

- Node.js 18.0.0 or higher
- npm or pnpm
- An ElevenLabs API key (for integration tests)

### Installation

```bash
# Install dependencies
npm install

# Create environment file for testing
echo "ELEVENLABS_API_KEY=your_key_here" > .env.local
```

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run build` | Build the library for production |
| `npm run dev` | Build in watch mode |
| `npm run test` | Run all tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript type checking |

## Making Changes

### Branch Naming

Use descriptive branch names:

- `feat/add-new-voice-preset` - New features
- `fix/ducking-curve-calculation` - Bug fixes
- `docs/improve-api-reference` - Documentation
- `refactor/cache-manager` - Code refactoring
- `test/add-hook-tests` - Test additions

### Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): description

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code style (formatting, semicolons, etc.)
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `perf`: Performance improvement
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(components): add karaoke style to AutoCaption

fix(ducking): correct exponential smoothing calculation

docs(readme): add troubleshooting section
```

## Testing

### Running Tests

```bash
# Run all tests
npm run test

# Run specific test file
npm run test -- tests/unit/components/VoiceOver.test.tsx

# Run tests matching a pattern
npm run test -- --grep "ducking"

# Run with coverage
npm run test:coverage
```

### Writing Tests

- Place unit tests in `tests/unit/` mirroring the `src/` structure
- Place integration tests in `tests/integration/`
- Use descriptive test names that explain the expected behavior
- Mock external dependencies (ElevenLabs API) in unit tests

**Example test structure:**

```typescript
describe('ComponentName', () => {
  describe('when condition', () => {
    it('should expected behavior', () => {
      // Arrange
      // Act
      // Assert
    });
  });
});
```

### Test Coverage

We aim for >80% coverage on all metrics:
- Branches: 80%
- Functions: 80%
- Lines: 80%
- Statements: 80%

## Submitting a Pull Request

1. **Update your fork**:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Create a feature branch**:
   ```bash
   git checkout -b feat/your-feature
   ```

3. **Make your changes** and commit them

4. **Run quality checks**:
   ```bash
   npm run lint
   npm run typecheck
   npm run test
   ```

5. **Push to your fork**:
   ```bash
   git push origin feat/your-feature
   ```

6. **Open a Pull Request** on GitHub with:
   - Clear title following commit conventions
   - Description of changes
   - Link to related issues (if any)
   - Screenshots/recordings for UI changes

### PR Review Process

- All PRs require at least one review
- CI must pass (lint, typecheck, tests)
- Keep PRs focused and reasonably sized
- Respond to feedback constructively

## Style Guide

### TypeScript

- Use strict mode (`strict: true`)
- Prefer `interface` over `type` for object shapes
- Export types alongside implementations
- Use explicit return types on public functions

```typescript
// Good
export interface VoiceOverProps {
  text: string;
  voiceId?: string;
}

export function useVoiceOver(options: VoiceOverOptions): VoiceOverResult {
  // ...
}

// Avoid
export type VoiceOverProps = {
  text: string;
  voiceId?: string;
}
```

### React Components

- Use function components with hooks
- Props interfaces should be named `ComponentNameProps`
- Use `React.FC` sparingly (prefer explicit return types)
- Destructure props in function signature

```typescript
// Good
export function VoiceOver({ text, voiceId = 'aria' }: VoiceOverProps): JSX.Element {
  // ...
}

// Avoid
export const VoiceOver: React.FC<VoiceOverProps> = (props) => {
  const { text, voiceId } = props;
  // ...
}
```

### File Organization

```
src/
├── components/     # React components
├── hooks/          # Custom React hooks
├── services/       # API service classes
├── client/         # HTTP client and utilities
├── cache/          # Cache management
├── utils/          # Helper functions
├── presets/        # Preset configurations
├── pipeline/       # Prerender pipeline
├── types.ts        # Shared type definitions
├── config.ts       # Configuration management
└── index.ts        # Public exports
```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `VoiceOver`, `BackgroundMusic` |
| Hooks | camelCase with `use` prefix | `useVoiceOver`, `useAudioDucking` |
| Services | PascalCase with `Service` suffix | `TTSService`, `MusicService` |
| Utils | camelCase | `computeDuckingCurve`, `sha256` |
| Constants | SCREAMING_SNAKE_CASE | `DEFAULT_VOICE_ID` |
| Types/Interfaces | PascalCase | `VoiceOverProps`, `TTSRequest` |

## Reporting Bugs

### Before Submitting

1. Check existing issues to avoid duplicates
2. Try the latest version
3. Gather relevant information

### Bug Report Template

```markdown
**Description**
A clear description of the bug.

**Steps to Reproduce**
1. Configure with '...'
2. Use component '....'
3. See error

**Expected Behavior**
What you expected to happen.

**Actual Behavior**
What actually happened.

**Environment**
- remotion-audio-skill version:
- Remotion version:
- Node.js version:
- OS:

**Code Example**
```tsx
// Minimal reproduction code
```

**Error Output**
```
// Any error messages
```
```

## Suggesting Features

We welcome feature suggestions! Please:

1. Check if a similar feature has been requested
2. Describe the problem your feature solves
3. Propose a solution with example usage
4. Consider implementation complexity

### Feature Request Template

```markdown
**Problem Statement**
Describe the problem or limitation you're facing.

**Proposed Solution**
How you envision the feature working.

**Example Usage**
```tsx
// How you'd use the new feature
```

**Alternatives Considered**
Other approaches you've thought about.

**Additional Context**
Any other relevant information.
```

## Questions?

- Open a [GitHub Discussion](https://github.com/suissetalentch/remotion-audio-skill/discussions)
- Check existing documentation
- Review closed issues for similar questions

---

Thank you for contributing to remotion-audio-skill!
