const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const TOKEN = process.env.GITHUB_TOKEN;
const REPO = 'thibautkremer/Med';

if (!TOKEN) {
  console.error("Error: GITHUB_TOKEN environment variable is not set.");
  process.exit(1);
}

async function run() {
  try {
    console.log("Fetching latest successful workflow runs...");
    const runsRes = await fetch(`https://api.github.com/repos/${REPO}/actions/runs?status=success&branch=main`, {
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Accept': 'application/vnd.github+json',
        'User-Agent': 'node-fetch'
      }
    });

    if (!runsRes.ok) {
      throw new Error(`Failed to fetch runs: ${runsRes.statusText} (${runsRes.status})`);
    }

    const runsData = await runsRes.json();
    const successfulRuns = runsData.workflow_runs || [];
    
    if (successfulRuns.length === 0) {
      console.log("No successful workflow runs found on main branch.");
      return;
    }

    const latestRun = successfulRuns[0];
    console.log(`Latest successful run found: Run #${latestRun.run_number} (ID: ${latestRun.id}) - ${latestRun.head_commit.message}`);

    console.log("Fetching artifacts for this run...");
    const artifactsRes = await fetch(`https://api.github.com/repos/${REPO}/actions/runs/${latestRun.id}/artifacts`, {
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Accept': 'application/vnd.github+json',
        'User-Agent': 'node-fetch'
      }
    });

    if (!artifactsRes.ok) {
      throw new Error(`Failed to fetch artifacts: ${artifactsRes.statusText} (${artifactsRes.status})`);
    }

    const artifactsData = await artifactsRes.json();
    const artifacts = artifactsData.artifacts || [];
    
    // Find apk artifact (name could be 'app-debug-apk' or contain 'apk')
    const apkArtifact = artifacts.find(a => a.name.toLowerCase().includes('apk'));

    if (!apkArtifact) {
      console.log("No APK artifact found in the latest successful run.");
      console.log("Available artifacts:", artifacts.map(a => a.name));
      return;
    }

    console.log(`Found APK artifact: "${apkArtifact.name}" (ID: ${apkArtifact.id}, Size: ${(apkArtifact.size_in_bytes / 1024 / 1024).toFixed(2)} MB)`);
    console.log("Downloading artifact ZIP archive...");

    const zipRes = await fetch(`https://api.github.com/repos/${REPO}/actions/artifacts/${apkArtifact.id}/zip`, {
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Accept': 'application/vnd.github+json',
        'User-Agent': 'node-fetch'
      }
    });

    if (!zipRes.ok) {
      throw new Error(`Failed to download zip: ${zipRes.statusText} (${zipRes.status})`);
    }

    const arrayBuffer = await zipRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    const zipPath = path.join(__dirname, 'artifact.zip');
    fs.writeFileSync(zipPath, buffer);
    console.log(`Saved ZIP archive to ${zipPath}`);

    // Unzip the file
    const extractDir = path.join(__dirname, 'extracted_apk');
    if (fs.existsSync(extractDir)) {
      fs.rmSync(extractDir, { recursive: true, force: true });
    }
    fs.mkdirSync(extractDir);

    console.log("Extracting ZIP archive...");
    execSync(`unzip -o "${zipPath}" -d "${extractDir}"`);

    // Find the APK inside extracted directory
    const files = fs.readdirSync(extractDir);
    const apkFile = files.find(f => f.endsWith('.apk'));

    if (!apkFile) {
      throw new Error("No .apk file found inside the extracted artifact ZIP.");
    }

    const sourceApkPath = path.join(extractDir, apkFile);
    const destApkPath = path.join(__dirname, 'app-debug.apk');
    
    fs.copyFileSync(sourceApkPath, destApkPath);
    console.log(`Successfully extracted and saved APK to: ${destApkPath}`);

    // Cleanup zip and extracted directory
    fs.unlinkSync(zipPath);
    fs.rmSync(extractDir, { recursive: true, force: true });
    console.log("Cleaned up temporary ZIP and extraction directory.");
    
  } catch (error) {
    console.error("Error executing script:", error);
    process.exit(1);
  }
}

run();
