const github = require('@actions/github');
const core = require('@actions/core');
const fetch = require('node-fetch'); // Ensure you have 'node-fetch' installed if running this script outside of the actions/github-script environment

async function run() {
  const username = github.context.payload.pull_request.user.login;
  const response = await fetch(`https://dailydevtools.com/github_spam_list?username=${username}`);
  const result = await response.json();

  if (result.banned) {
    const token = core.getInput('GITHUB_TOKEN');
    const octokit = github.getOctokit(token);

    const { owner, repo } = github.context.repo;
    const issue_number = github.context.payload.pull_request.number;

    // Comment on the PR
    await octokit.rest.issues.createComment({
      owner,
      repo,
      issue_number,
      body: 'Your account has been flagged as potential spam. This pull request will be closed.',
    });

    // Close the PR
    await octokit.rest.pulls.update({
      owner,
      repo,
      pull_number: issue_number,
      state: 'closed',
    });

    // Apply a label
    await octokit.rest.issues.addLabels({
      owner,
      repo,
      issue_number,
      labels: ['potential spam'],
    });
  }
}

run().catch(err => core.setFailed(err.message));
