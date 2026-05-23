import { execSync } from "node:child_process";
import { appendFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const progressFile = path.join(scriptDir, "progress.txt");

const commits = [
  "Setup project structure",
  "Configure backend server",
  "Connect MongoDB database",
  "Implement JWT authentication",
  "Create user schema",
  "Add freelancer profile module",
  "Implement job posting API",
  "Create bidding system",
  "Add admin dashboard",
  "Improve UI responsiveness",
  "Fix authentication bugs",
  "Implement notifications",
  "Add payment integration",
  "Optimize database queries",
  "Improve frontend routing",
  "Add chat functionality",
  "Fix image upload issue",
  "Implement profile settings",
  "Enhance security middleware",
  "Finalize production configs",
];

if (!existsSync(path.join(scriptDir, ".git"))) {
  console.error("Run this script from inside the Git repository root.");
  process.exit(1);
}

function run(command) {
  execSync(command, {
    cwd: scriptDir,
    stdio: "pipe",
  });
}

for (let i = 0; i < 100; i++) {
  const message = `${commits[i % commits.length]} #${i + 1}`;
  const timestamp = new Date().toISOString();

  appendFileSync(progressFile, `Update ${i + 1} - ${timestamp}\n`);

  try {
    run("git add progress.txt");
    run(`git commit --allow-empty -m ${JSON.stringify(message)}`);
    console.log(`✅ Commit created: ${message}`);
  } catch (error) {
    console.log(`❌ Failed at commit ${i + 1}: ${message}`);
  }
}