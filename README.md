# Pa11y Ratchet

A GitHub Action that helps prevent the introduction of new accessibility issues. Pa11y Ratchet compares the number of issues found for each Pa11y issue code against the base branch, and fails if the count for any code has gone up. Each fix you land becomes the new ceiling, so a backlog too large to clear at once can only shrink.

## Features

- 🔍 Scans your site using [Pa11y](https://pa11y.org/), a powerful accessibility testing tool
- 📊 Provides detailed reports of accessibility issues in PR comments
- 🚫 Prevents merging when new accessibility issues are introduced
- 🗺️ Supports scanning multiple URLs via sitemap or explicit URL list
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
| `sitemap-url` | URL of the sitemap to scan. Accepts a `<urlset>` sitemap or a `<sitemapindex>`, in which case all child sitemaps are fetched and combined | No* | - |
| `urls` | Newline-separated list of URLs to scan | No* | - |
| `github-token` | GitHub token for PR comments | Yes | - |
| `find` | URL substring to search for | No | - |
| `replace` | Replacement for found substring | No | - |
| `include` | Regex pattern to filter URLs | No | - |
| `ignore` | Comma-separated list of issue codes to ignore | No | - |
| `config-path` | Path to Pa11y configuration file | No | - |

\* Either `sitemap-url` or `urls` must be provided.

`ignore` codes must match the format of the runner configured in `config-path` (Pa11y's default runner is `htmlcs`). htmlcs codes look like `WCAG2AA.Principle1.Guideline1_4.1_4_3.G18.Fail`; axe codes look like `color-contrast`. An ignore entry that matches no issue in a scan produces a `::warning::` in the workflow log, since a mismatched code silently fails to ignore anything.

## Example with URL List

```yaml
- uses: narthur/pa11y-ratchet@v3
  with:
    urls: |
      https://example.com/
      https://example.com/about
      https://example.com/contact
    github-token: ${{ secrets.GITHUB_TOKEN }}
```

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

1. Retrieves URLs from your sitemap or uses the provided URL list
2. Scans each URL for accessibility issues using Pa11y
3. Uploads the results as an artifact keyed to the current commit SHA
4. Downloads the base commit's artifact from a previous run of this action
5. Updates the PR comment with a detailed comparison — which issues are new, fixed, and retained — matching on issue code, selector, and URL
6. Fails if the head branch has more issues of any one code than the base branch. Codes listed in `ignore` are skipped
7. Generates a GitHub summary report

The pass/fail gate is a per-code count comparison, not the issue-level matching used in the PR comment: an issue that moves to a different selector or URL will not fail the build, but introducing an extra issue of an existing code will.

Because the base results are read from an artifact rather than rescanned, the action must have already run on the base commit. When no base artifact is found, the action reports the current issues and passes.

## Reports

Pa11y Ratchet provides two types of reports:

1. **PR Comments**: Detailed comparison between base and current branches
2. **GitHub Summary**: Comprehensive list of current issues with URLs and selectors

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

[MIT license](./LICENSE)