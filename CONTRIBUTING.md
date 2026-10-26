# Guide to Contributing

Delete the contents of this file and replace with the contents of a proper guide to contributing to this project, as described in the [instructions](./instructions-0c-project-setup#contributingmd)

Contributing to Later

This document is a contract between everyone who works on this project: team members, collaborators, and outside contributors. By opening a pull request, you agree to the rules and processes described here.

# Table of Contents

1. Team Norms

2. Git Workflow

3. Rules of Contributing

4. Local Development Setup

5. Building and Testing

6. Getting Help

# 1. Team Norms

These are commitments we make to each other. They reflect how our team actually works.

# Team Values

Respect: We treat teammates and contributors with courtesy and assume good intent.
Honesty: We report our real progress, admit mistakes and blockers early, and credit others' work. We never claim work we did not do, and we never hide a broken build or a missed task.
Accountability: We do what we say we will do. If we cannot, we say so as early as possible.
Quality: We write high quality code and review each other's work carefully.

# How We Work Together
Our main communication channel is Discord. We respond to messages directed at us within 2 hours (urgent matters: for urgent matters, use Instagram or Whatsapp).
Every member commits work under their own GitHub account so contributions are visible.
A member who needs help posts in the group describing what they tried, and teammates respond within 2 hours. We try to ask for help after being stuck for about 1 hour rather than silently struggling.

# Sprint Cadence
Each sprint is 2 weeks long
Work is tracked on our Later task board. Each member keeps their work on the task board up to date.

# Daily Standups
Schedule: Monday 11:00, Wednesday 11:00, Thursday 11:20, lasting about 15 minutes, on Zoom
Members are expected to attend synchronously. Each person answers: What did I do? What will I do next? What is blocking me?
Members who do not participate need to have a valid reason. Answer the questions in the personal communication group instead. 
Definition of Done
A task or spike is done only when:
The code is written and meets the acceptance criteria in its issue.
It has been peer-reviewed and approved by at least one teammate who is not the author.
Automated tests pass and the build is not broken.
Any needed documentation is also updated.
It is merged into master and its card is moved to Done on the Task Board.

# Coding Standards
Everyone uses VS Code as the designated editor 
Write the minimum code to get things working end to end first, then iterate and improve.
Code for each task and spike must be peer-reviewed and pass tests before merging into master.
Always push working code. If you break the pipeline or build, fixing it is your top priority.
Make small commits, one per feature or bug fix, with proper commit messages.
use descriptive variable and function names and avoid unnecessary shortening.
Do not leave dead or commented-out code behind. If you see it, delete it.
Write tests for critical integration points and functionality.

# Resolving Conflicts over Code
Talk directly: The people involved discuss the disagreement openly and respectfully.
Team discussion: If unresolved, bring it to the team, at the next standup meeting. Disagreements about technical direction of the project are settled by a consensus.
Escalate. If a member repeatedly fails to deliver on their obligations, or a conflict cannot be resolved by the team, we raise it with the professor or TA.

# 2. Git Workflow
We use a feature-branch workflow. No one commits directly to master and all changes are done through reviewed pull requests.

# Step by Step

Pick an issue from the task board and assign yourself. Every change starts with an issue.
Get the latest code (Pull the latest changes)
Create a new branch for your task
Make the necessary changes and test them.
Commit small and often with descriptive messages
Stay up to date by merging or rebasing master into your branch regularly.
Push your branch to Github
Open a pull request into master, link the issue (Closes #42), and request a review.
Address review feedback by pushing more commits to the same branch.
Merge once approved and all checks pass

# Commit Messages

Start with a short summary in the present tense
Add detail when something is not obvious.
One logical change per commit.

# 3. Rules of Contributing

# How and What You Can Contribute

Report bugs and suggest features by opening an issue.
Fix bugs, build features, write tests, or improve documentation from open issues on the task board.
Review other people's pull requests.
Before starting work, check that an issue exists and that nobody else is already assigned to it. For anything large, comment on the issue first so the team can agree on the right approach.
Reporting Bugs and Requesting Features
Search existing issues first to avoid duplicates. A good bug report includes steps to reproduce, expected vs. actual behavior, screenshots or error output, and your environment (OS, browser, Node version). A feature request should explain the problem it solves and who benefits.

# Pull Request Rules

Every pull request must:
Be linked to an issue
Target master
Have a clear title and description of what changed and why
Include screenshots for visible UI changes
Be small and focused (one task per pull request)
Pass tests
Include tests for new behavior where applicable
Contain no secrets, .env files, or node_modules
Be approved by at least one teammate who is not the author
Have all review comments resolved

# Code Review

Authors: review your own diff first, respond to every comment, and keep feedback impersonal. 
Reviewers: review within 24 hours, be specific and explain the reasoning behind requests, and approve only when you would be comfortable maintaining the code.

# 4. Local Development Setup
Follow these instructions to set up your local environment and prepare to contribute to the project.
Prerequisites
Before getting started, ensure that you have the following:
Git: Installed on your computer for version control.
GitHub account: Access to the team's shared GitHub repository.
Node.js and npm: Required to run the JavaScript development environment.
Configure Git
Configure your local Git username to match your GitHub username so that your contributions can be correctly attributed.
Run the following command, replacing your-github-username with your GitHub username:
git config --global user.name "your-github-username"
Verify your configuration:
git config user.name
Ensure that your GitHub account is also configured correctly.
Clone the Repository
clone the shared repository rather than creating separate forks.
Run the following commands :
git clone https://github.com/agile-students-fall2026/Later.git
Install Dependencies
Install the dependencies required by the project using npm.
Create a Feature Branch
Before making changes, update your local copy and create a branch for your task.
git checkout main
git pull origin main
git checkout -b feature/your-feature-name
Use a descriptive branch name that reflects the feature you are working on.
Verify Your Setup
After completing the setup, verify that the project's dependencies are installed and that any required environment variables and database connections are configured.
Refer to the project's README.md and the scripts defined in its package.json files for the appropriate commands to start the application.
Once your environment is configured, you can begin developing on your feature branch and submit your changes through a Pull Request following the team's Git workflow.

# 5. Building and Testing

Still working on Sprint 0. Will be updated once the project reaches the relevant stage.

# 6. Getting Help
Questions about the project: message the team on Discord or Instagram

Questions about this document: ask the Scrum Master.

This document was collaboratively written and agreed upon by all team members. 

