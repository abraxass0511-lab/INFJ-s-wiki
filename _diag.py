import json
from urllib.request import Request, urlopen

REPO = "abraxass0511-lab/INFJ-s-wiki"

# Get latest OCR workflow runs
url = f"https://api.github.com/repos/{REPO}/actions/runs?per_page=10"
data = json.loads(urlopen(Request(url, headers={"Accept":"application/vnd.github+json"})).read().decode())

for run in data.get("workflow_runs", []):
    if "OCR" in run["name"]:
        print(f"Run: {run['name']}")
        print(f"  Status: {run['status']}/{run['conclusion']}")
        print(f"  Created: {run['created_at']}")
        print(f"  Trigger: {run['event']}")
        print(f"  ID: {run['id']}")
        
        # Check jobs
        jobs_url = run["jobs_url"]
        jobs = json.loads(urlopen(Request(jobs_url, headers={"Accept":"application/vnd.github+json"})).read().decode())
        for job in jobs.get("jobs", []):
            print(f"  Job: {job['name']} -> {job['conclusion']}")
            for step in job.get("steps", []):
                print(f"    Step: {step['name']} -> {step['conclusion']}")
        print()
