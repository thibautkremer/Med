const TOKEN = process.env.GITHUB_TOKEN;
const REPO = 'thibautkremer/Med';
async function check() {
  const res = await fetch(`https://api.github.com/repos/${REPO}/actions/runs?per_page=3`, {
    headers: { 'Authorization': `Bearer ${TOKEN}`, 'Accept': 'application/vnd.github+json' }
  });
  const data = await res.json();
  if (data.workflow_runs) {
    data.workflow_runs.forEach(run => {
      console.log(`Run #${run.run_number} (${run.id}): name=${run.name}, status=${run.status}, conclusion=${run.conclusion}, url=${run.html_url}`);
    });
  }
}
check();
