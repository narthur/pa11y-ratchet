# Pa11y Ratchet

A GitHub Action that helps prevent the introduction of new accessibility issues. Pa11y Ratchet compares the current branch's accessibility issues against the base branch and fails if new issues are detected.

## Features

- 🔍 Scans your site using [Pa11y](https://pa11y.org/), a powerful accessibility testing tool
- 📊 Provides detailed reports of accessibility issues in PR comments
- 🚫 Prevents merging when new accessibility issues are introduced
- 🗺️ Supports scanning multiple URLs via sitemap
- ⚙️ Configurable URL filtering and issue ignoring
- 📝 Generates GitHub summary reports with issue details

## Usage

```yaml
name: Accessibility Check
on:
  pull_request:
    branches: [ main ]

jobs:
  pa11y:
    runs-on: ubuntu-latest
    steps:
      - uses: narthur/pa11y-ratchet@v3
        with:
          sitemap-url: 'https://example.com/sitemap.xml'
          github-token: ${{ secrets.GITHUB_TOKEN }}
```

## Inputs

| Name | Description | Required | Default |
|------|-------------|----------|---------|
| `sitemap-url` | URL of the sitemap to scan | Yes | - |
| `github-token` | GitHub token for PR comments | Yes | - |
| `find` | URL substring to search for | No | - |
| `replace` | Replacement for found substring | No | - |
| `include` | Regex pattern to filter URLs | No | - |
| `ignore` | Comma-separated list of issue codes to ignore | No | - |
| `config-path` | Path to Pa11y configuration file | No | - |

## Example with All Options

```yaml
- uses: narthur/pa11y-ratchet@v3
  with:
    sitemap-url: 'https://example.com/sitemap.xml'
    github-token: ${{ secrets.GITHUB_TOKEN }}
    find: 'https://example.com'
    replace: 'http://localhost:3000'
    include: '^https://example.com/blog'
    ignore: 'WCAG2AA.Principle4.Guideline4_1.4_1_2.H91.InputEmail.Name'
    config-path: '.pa11yrc'
```

## How It Works

1. Retrieves URLs from your sitemap
2. Scans each URL for accessibility issues using Pa11y
3. Compares issues between base and current branches
4. Updates PR with detailed comparison
5. Fails if new issues are detected
6. Generates a GitHub summary report

## Reports

Pa11y Ratchet provides two types of reports:

1. **PR Comments**: Detailed comparison between base and current branches
2. **GitHub Summary**: Comprehensive list of current issues with URLs and selectors

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

[MIT license](./LICENSE)