const fs = require('node:fs');
const path = require('node:path');

function formatDate(date) {
  const twoDigits = (value) => String(value).padStart(2, '0');
  return {
    day: `${date.getFullYear()}-${twoDigits(date.getMonth() + 1)}-${twoDigits(date.getDate())}`,
    time: `${twoDigits(date.getHours())}${twoDigits(date.getMinutes())}${twoDigits(date.getSeconds())}`,
  };
}

function escapeMarkdown(value) {
  return String(value).replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
}

class MarkdownReporter {
  onBegin(config, suite) {
    this.suite = suite;
  }

  onEnd(result) {
    const timestamp = new Date();
    const { day, time } = formatDate(timestamp);
    const directory = path.resolve('TEST_RESULTS');
    fs.mkdirSync(directory, { recursive: true });

    let reportPath = path.join(directory, `${day}-playwright-${time}.md`);
    let suffix = 1;
    while (fs.existsSync(reportPath)) {
      reportPath = path.join(directory, `${day}-playwright-${time}-${suffix}.md`);
      suffix += 1;
    }

    const tests = this.suite.allTests();
    const passed = tests.filter((test) => test.outcome() === 'expected').length;
    const failed = tests.filter((test) => test.outcome() === 'unexpected').length;
    const skipped = tests.filter((test) => test.outcome() === 'skipped').length;
    const lines = [
      '# Playwright Test Run',
      '',
      `- **Date:** ${timestamp.toLocaleString()}`,
      `- **Overall result:** ${result.status}`,
      `- **Passed:** ${passed}`,
      `- **Failed:** ${failed}`,
      `- **Skipped:** ${skipped}`,
      '',
      '## Test cases',
      '',
    ];

    for (const test of tests) {
      const latestResult = test.results[test.results.length - 1];
      const status = test.outcome();
      lines.push(`### ${escapeMarkdown(test.title)}`);
      lines.push('');
      lines.push(`- **Status:** ${status}`);
      lines.push(`- **Duration:** ${latestResult ? `${latestResult.duration} ms` : 'Not run'}`);
      if (latestResult?.error) {
        lines.push(`- **Error:** ${escapeMarkdown(latestResult.error.message || latestResult.error)}`);
      }
      lines.push('');
    }

    fs.writeFileSync(reportPath, `${lines.join('\n')}\n`, 'utf8');
    console.log(`Markdown test report: ${path.relative(process.cwd(), reportPath)}`);
  }
}

module.exports = MarkdownReporter;
