# Pa11y Ratchet Knowledge

## Project Overview
Pa11y Ratchet is a GitHub Action that helps detect newly-introduced accessibility issues. It compares the current branch's accessibility issues against the base branch and fails if new issues are detected.

## Key Components
- **GitHub Action**: Configured in `action.yml`
- **Pa11y Integration**: Uses Pa11y to scan URLs for accessibility issues
- **Issue Comparison**: Compares issues between base and head branches
- **Reporting**: Provides summary and detailed reports of accessibility issues

## Workflow
1. Retrieves URLs from a sitemap
2. Scans URLs for accessibility issues using Pa11y
3. Uploads issues as artifacts
4. Retrieves base branch issues for comparison
5. Updates PR comment with comparison results
6. Updates summary with issue details
7. Fails if new issues are detected

## Development Guidelines
- Use `pnpm` as the package manager
- Run `pnpm test` to run tests
- Run `pnpm run build` to build the project
- Run `pnpm run checkTs` to check TypeScript types
- Run `pnpm run lint` to lint the code

## Configuration Options
- `sitemap-url`: The sitemap URL to test
- `github-token`: The GitHub token for the repository
- `find`: The URL substring to search for in sitemap URLs
- `replace`: The replacement string for the find string
- `include`: Only include URLs that match this regular expression
- `ignore`: A comma-separated list of codes of issues to ignore
- `config-path`: Path to a pa11y configuration file

## Architecture
The project follows a modular architecture with clear separation of concerns:
- `src/lib`: Core functionality for scanning, comparing, and reporting issues
- `src/services`: External service integrations (GitHub)
- `src/main.ts`: Main entry point that orchestrates the workflow
