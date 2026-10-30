# AI Chatbots, Spring AI & GitOps Pipeline – Summary

## 1. How companies build chatbots

- **Languages:** Python is most common for AI and backend work, with JavaScript/TypeScript for the chat UI. Java is a solid option too (Spring AI, LangChain4j).
- **Training:** Most companies do **not** train their own model. They use an existing model (Claude, GPT) through an API.
- **RAG (Retrieval-Augmented Generation):** Company docs and FAQs are searched, and the relevant parts are passed to the model along with the user's question.
- **Fine-tuning:** Less common and more expensive. Mostly done by bigger companies.
- **Chatbot vs. agent:** A chatbot answers questions. An agent can also take actions (look up orders, issue refunds) through tools connected to company systems.
- **Platforms:** Many companies use ready-made tools like Intercom or Zendesk instead of building their own.

## 2. Python vs. Java for the backend

- **Recommendation for AI backends:** Python + **FastAPI**. Most AI tooling and examples appear in Python first.
- **FastAPI:** A lightweight Python web framework for REST APIs. It uses type hints, validates input, and generates API docs automatically. Think of it as a slimmed-down Spring Boot for the REST layer.
- **Other Python frameworks:** Django, Flask.
- **Simplicity:** Python is generally simpler (less boilerplate, no compile step). Java may feel quicker at first because you already know it.
- **Choose Java when** the work has to fit into an existing Java codebase or team.
- **Learning Python with a Java background:** about 1–2 weeks to write useful code, about a month for a basic FastAPI backend, and a few months to write idiomatic Python. Learn by building a small project.

## 3. Java AI frameworks

- **LangChain4j:** An independent Java library inspired by Python's LangChain. Handles model connections, chat memory, RAG, and tool calling. Works with Spring Boot, Quarkus, or plain Java.
- **Spring AI:** The official Spring project with the same core features, Spring-style (auto-config, DI). Best choice if you're on Spring Boot.
- **Calling the Claude API directly** (Anthropic Java SDK) is often simpler for basic chatbots. Frameworks pay off once you need memory, RAG, tools, or easy model switching.

## 4. Learning resources

- **Spring Academy** (spring.academy): The official Spring learning platform, run by **Broadcom**. It has a Spring AI intro course (`spring.academy/courses/spring-ai-intro`). Labs run in the browser (Educates environment) and need a Broadcom account. Content has been free since 2024; confirm when you sign up.
- **Udemy (paid, often on sale):** "Spring AI: Beginner to Guru", "From Java Dev to AI Engineer: Spring AI Fast Track".
- **Free:** Official Spring AI docs (spring.io/ai), Baeldung's "Introduction to Spring AI".
- **Idea:** Build the same small chatbot in Spring AI and in Python/FastAPI to compare them.

## 5. Career and the bigger picture

- There is real demand for chatbot and agent work. Simple FAQ bots are a crowded market. Custom agents that connect to internal systems pay better, and Java skills help there.
- **Future of AI languages:** Python for research and training. TypeScript and Java are growing for AI applications. C++, Rust, and CUDA handle the performance-critical parts.
- **Java vs. Rust:** Stick with Java for work, add Python for AI. Rust only if low-level performance work interests you.

## 6. Claude PR review with GitHub Actions

- The workflow file goes in `.github/workflows/`, e.g. `claude-review.yml`.
- It uses Anthropic's official action: `anthropics/claude-code-action`.
- **Setup shortcut:** Run `/install-github-app` in Claude Code. It installs the Claude GitHub App, adds the secret, and opens a PR with the workflow files.
- **Secrets:** These are normal GitHub Actions secrets (Settings → Secrets and variables → Actions). They're encrypted and masked in logs.
- **Using a Claude Pro account:** Pro does not give you an API key (API keys come from console.anthropic.com and are billed separately). Instead, run `claude setup-token` to get an OAuth token and store it as `CLAUDE_CODE_OAUTH_TOKEN`. Reviews then count against your Pro usage limits.

### Sample workflow

```yaml
name: Claude PR Review

on:
  pull_request:
    types: [opened, synchronize, reopened]

permissions:
  contents: read
  pull-requests: write
  id-token: write

jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Claude review
        uses: anthropics/claude-code-action@v1
        with:
          claude_code_oauth_token: ${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}
          prompt: |
            Review this pull request for a Spring Boot application.
            Focus on bugs, security issues, performance, Spring best
            practices, and missing tests. Leave concise comments on
            the PR. If you find a critical issue, fail the job.
```

Check the input names against the action's README for your version.

### Maven build

- The Claude review does **not** build or test the code.
- Add a separate job that uses `actions/setup-java` and runs `mvn verify`.
- Jobs run **in parallel** by default. Use `needs:` to make one job wait for another. (Decision: keep them parallel.)

## 7. Gating and deployment

- **Branch protection on main/master:** Require a PR with 0 approvals, because GitHub doesn't let a solo developer approve their own PR. Your review is the human gate: you read the PR and click Merge yourself, so auto-merge stays off. Require a single final "all checks passed" job as the status check. That job covers the Maven build and Claude review (see section 10 for why).
- **Decision: the Claude review fails the job on critical issues,** so it blocks the merge. The action only comments by default, so `ci.yml` has Claude return a `critical_issues` verdict, and a workflow step fails on it. Tested with a PR containing a deliberate critical bug.
- **Decision: separate builds, one review.** `backend-build` and `frontend-build` each run only when their own folder changes. One `claude-review` job runs when `backend/`, `frontend/` or `.github/` changes, because a single review sees a change across both. `all-checks-passed` accepts skipped jobs.
- **Deploy on merge**, so only reviewed and checked code is deployed.

## 8. GitOps with Argo CD

- **GitOps** is an approach, not a tool: Git holds the desired state of the cluster.
- **Argo CD** is free and open source (a CNCF project). It runs in the cluster and syncs it to Git. Paid managed versions (e.g. Akuity) are optional.

### The flow

1. **Merge to master:** The pipeline builds the image and pushes it with a new tag.
2. **Update the release branch:** The pipeline copies the chart and commits the new tag to the `release/test` branch (e.g. `deploy/envs/test/values.yaml` → `image.tag`). See section 10. A separate config repo is the alternative.
   - **Decision: a release branch.** Argo CD watches `release/test`, so the chart and tag arrive in one commit after the image exists. The branch isn't locked, so `GITHUB_TOKEN` can push to it, and `main` has no exceptions.
   - Update the tag with `yq` (or `kustomize edit set image`).
   - Commit and push, e.g. "Deploy myapp 1.4.0-3f2a9c1 to test".
   - Alternative: **Argo CD Image Updater** watches the registry and makes this commit for you.
3. **Argo CD** detects the change and deploys it. Rolling back means reverting a commit on `release/test`.

### Image tagging

- Use the Git commit SHA (short), e.g. `myapp:3f2a9c1`, or combine it with the Maven version: `1.4.0-3f2a9c1`.
- Read the Maven version with: `mvn help:evaluate -Dexpression=project.version -q -DforceStdout`
- Strip `-SNAPSHOT` before using the version as a tag.
- Never deploy with `latest`, because Argo CD won't detect a change.

## 9. Final plan: local setup (no AWS)

- **Cluster:** Local **Minikube** with one Spring Boot service.
- **Code and CI:** GitHub + GitHub Actions (Maven build + Claude review, in parallel).
- **Registry:** **GitHub Container Registry (ghcr.io)**. Push with the built-in `GITHUB_TOKEN`.
  - **Decision: public images.** They're free, and Minikube pulls them without an image pull secret or GitHub personal access token.
  - Anyone can download a public image, so nothing secret may go into it. The Claude API key stays in a Kubernetes Secret.
- **Image architecture:** The Mac is an M4 Pro, so Minikube runs arm64, while GitHub's `ubuntu-latest` runners build amd64. The release pipeline runs on GitHub's `ubuntu-24.04-arm` runner and builds for `linux/arm64`, or the pods would fail with `exec format error`.
- **Claude API key:** The backend needs an API key from console.anthropic.com at runtime. This is separate from the `CLAUDE_CODE_OAUTH_TOKEN` used for PR reviews. Create it by hand as a Kubernetes Secret and reference it from the Helm chart. It must never go in `deploy/`, because Git holds everything there.
- **Repo visibility:** **Decision: public repo.** Argo CD reads it without credentials. Anyone can see the code, so secrets never go into Git.
- **Deployment:** **Argo CD inside Minikube** pulls from GitHub, so GitHub never needs to reach your laptop. Push-based `helm upgrade` from Actions won't work without a self-hosted runner.
- **Packaging:** **Helm** this time instead of Kustomize, for the learning value. A simple chart with a Deployment, Service, and ConfigMap is enough.
- **Running it locally:** Nothing deploys while Minikube is stopped; Argo CD catches up with the latest commit when it starts again. Argo CD checks Git about every 3 minutes by default, so a merge doesn't show up right away. With the Docker driver on a Mac, keep `minikube tunnel` running to reach the Ingress from the browser.

## 10. Angular frontend: putting it together

The two topics connect: the Spring AI chatbot is the service that the pipeline reviews and deploys, and an Angular app is the chat UI on top.

- **Architecture:** Angular chat UI → REST call → Spring Boot backend (Spring AI) → Claude API. The API key or token stays in the backend and never reaches the browser.
- **Streaming:** Stream the replies so text appears word by word. Spring AI can return a stream (Server-Sent Events), and Angular reads it with `EventSource` or `fetch`.
- **Deployment:** Build Angular into static files, serve them with nginx in a Docker image, and push the image to GHCR. Deploy it to Minikube as a second service in the Helm chart.
- **Routing:** Use an Ingress in Minikube (`minikube addons enable ingress`) so `/` goes to the frontend and `/api` goes to the backend. Same origin means no CORS issues.
- **Pipeline:** Same pattern as the backend. Run Claude PR reviews and an Angular build/test job (`npm ci`, `ng test`, `ng build`). On merge, push the image and update its tag in `deploy/`.
- **Repo layout (decided):** One monorepo with `backend/`, `frontend/` and `deploy/` (Helm chart + image tags) folders. Each build runs only when its folder changes, and CI ignores `deploy/`. Don't use workflow-level `paths:` filters for this: a required check whose workflow never runs stays pending, so the PR can't merge. Instead, the workflow always runs, a `changes` job (e.g. `dorny/paths-filter`) decides which build jobs to run, and a final "all checks passed" job uses `needs:` with `if: always()` and passes when the others succeeded or were skipped. The release workflow runs on `main` and commits to `release/test`, so it can't start a loop. It doesn't rerun the tests, because CI already ran them on the PR.

## 11. Implementation plan

1. **Spring AI course:** Do the course on Spring Academy. Done when the course is finished.
2. **Monorepo:** Create the GitHub repo with `backend/`, `frontend/` and `deploy/` (use `.gitkeep` placeholders, since Git doesn't track empty folders), plus a `.gitignore` and README. Done when the repo is on GitHub with that layout.
3. **Chatbot backend:** Build the Spring Boot service in `backend/` with streaming replies from Claude. Done when a local request gets a streamed reply.
4. **CI pipeline (on PR):** Add the Claude review workflow (`claude setup-token` → `CLAUDE_CODE_OAUTH_TOKEN` secret), the Maven build, the `changes` and "all checks passed" jobs, and branch protection (PR required, 0 approvals, the "all checks passed" job as the required check). Done when a PR can't merge until its checks pass, and a PR with a deliberate critical bug fails the Claude review.
5. **Release pipeline (on merge):** Add the Dockerfile, the Helm chart in `deploy/`, the arm64 build-and-push-to-GHCR job, and the commit to the `release/test` branch. Done when a merge produces a new image and a new commit on that branch.
6. **Cluster deployment:** Create the cluster with `minikube start -p chatbot-test`, which is the test environment. Install Argo CD and point it at `deploy/chart` on the `release/test` branch. Create the Claude API key as the Secret `chatbot-claude`, with the key `api-key`. Done when a merge updates the running pod and reverting the tag commit rolls it back.
7. **Angular frontend:** Build the chat UI and its build job, then deploy it the same way (nginx image, Ingress). Done when you can chat in the browser through Minikube.
8. **Claude auto-fix (one attempt per PR for now, maybe up to 3 later):** Add a job that commits a fix to the PR branch when the review finds critical issues. Use the Claude GitHub App's token, because commits pushed with `GITHUB_TOKEN` don't re-trigger the checks. Allow the App's bot to trigger the Claude action, and run the job only on PRs from branches in this repo (not forks). A `claude-fix` label limits it to one attempt, and if critical issues remain, it leaves a comment asking you to step in. You still review and click Merge. Done when a PR with a fixable issue gets fixed and passes, and a PR that can't be fixed stops after one attempt.
9. Optional: add Argo CD Image Updater, or try the same project in Python/FastAPI.

### Reminders

- **Step 5:** The first release run is the real test. Check that the new image is public on GHCR, since Minikube has no pull secret.
- **Diagram:** "push image" and "commit tag" run in sequence, although the fork in `architecture.png` makes them look parallel.
- **Public repo:** Turn on "Require approval for all external contributors" under Settings > Actions > General, and read any change to `.github/` carefully before merging.
- **API budget:** Check that auto-reload is off in console.anthropic.com, or set a monthly spending limit.
- **Step 7:** Add the `frontend-build` job to `ci.yml`, and to the jobs `all-checks-passed` waits for.
- **Before going public:** Add a login or rate limit to `/api/chat`. Anyone who can reach it can run up the API bill.
- **Claude review token:** It lasts one year, so renew `CLAUDE_CODE_OAUTH_TOKEN` before it expires.
- **Doc cleanup:** Use "main" everywhere instead of "master" (section 8), and "API key" instead of "API key or token" (section 10).
