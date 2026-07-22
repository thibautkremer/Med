const TOKEN = process.env.GITHUB_TOKEN;
const REPO = 'thibautkremer/Med';
async function getLogs() {
  const res = await fetch(`https://api.github.com/repos/${REPO}/actions/runs/29948257481/jobs`, {
    headers: { 'Authorization': `Bearer ${TOKEN}`, 'Accept': 'application/vnd.github+json' }
  });
  const data = await res.json();
  if (data.jobs && data.jobs[0]) {
    const jobId = data.jobs[0].id;
    const logRes = await fetch(`https://api.github.com/repos/${REPO}/actions/jobs/${jobId}/logs`, {
      headers: { 'Authorization': `Bearer ${TOKEN}`, 'Accept': 'application/vnd.github+json' }
    });
    const logs = await logRes.text();
    const lines = logs.split('\n');
    console.log(lines.slice(-60).join('\n'));
  }
}
getLogs();
