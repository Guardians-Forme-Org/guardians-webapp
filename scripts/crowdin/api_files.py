"""Upload the guardians-api sources and Hungarian to Crowdin, outside any branch.

The Crowdin plan allows one branch (the webapp's GitHub integration uses it),
so the API files live in a top-level "api" folder instead.

  set -a; . ~/.config/guardians/crowdin.env; set +a
  python3 -I api_files.py <guardians-api checkout> [--translations] [--dry-run]

Sources are added or updated. --translations also uploads the API's Hungarian
(assets/templates/hu.json and assets/locales/hu.yaml). hu.matched.json here is
the first match from the client's Word documents (30 Oct 2026), kept for reference.
"""
import json
import os
import sys
import urllib.error
import urllib.request

PROJECT = 940113
BASE = f"https://api.crowdin.com/api/v2/projects/{PROJECT}"
HERE = os.path.dirname(os.path.abspath(__file__))

# Crowdin file name -> (repo source, export pattern, Hungarian file)
FILES = {
    "challenge-templates.json": (
        "assets/templates/en.json",
        "/assets/templates/%two_letters_code%.json",
        "assets/templates/hu.json",
    ),
    "api-messages.yaml": (
        "assets/locales/en.yaml",
        "/assets/locales/%two_letters_code%.yaml",
        "assets/locales/hu.yaml",
    ),
}
TITLES = {
    "challenge-templates.json": "Challenge templates (names, steps, field labels, options, units)",
    "api-messages.yaml": "API messages (errors, impact summaries, units)",
}


def call(method, url, body=None, raw=None, headers=None):
    token = os.environ["CROWDIN_TOKEN"]
    h = {"Authorization": f"Bearer {token}"}
    data = None
    if raw is not None:
        data = raw
        h.update(headers or {})
    elif body is not None:
        data = json.dumps(body).encode()
        h["Content-Type"] = "application/json"
    req = urllib.request.Request(url, data=data, method=method, headers=h)
    try:
        with urllib.request.urlopen(req, timeout=600) as r:
            text = r.read().decode()
            return json.loads(text) if text else {}
    except urllib.error.HTTPError as e:
        sys.exit(f"{method} {url.replace(BASE, '')}: {e.code} {e.read().decode()[:400]}")


def storage(path, name):
    with open(path, "rb") as f:
        raw = f.read()
    r = call("POST", "https://api.crowdin.com/api/v2/storages", raw=raw,
             headers={"Crowdin-API-FileName": name, "Content-Type": "application/octet-stream"})
    return r["data"]["id"]


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    if len(args) != 1:
        sys.exit(__doc__)
    repo = args[0]
    dry = "--dry-run" in sys.argv
    with_tr = "--translations" in sys.argv

    dirs = call("GET", f"{BASE}/directories?limit=500")["data"]
    api_dir = next((d["data"] for d in dirs if d["data"]["name"] == "api" and not d["data"]["branchId"]
                    and not d["data"]["directoryId"]), None)
    if api_dir is None:
        print("create folder api")
        if not dry:
            api_dir = call("POST", f"{BASE}/directories", {"name": "api", "title": "guardians-api"})["data"]
    files = call("GET", f"{BASE}/files?limit=500&directoryId={api_dir['id']}")["data"] if api_dir else []
    existing = {f["data"]["name"]: f["data"] for f in files}

    for name, (src, pattern, hu) in FILES.items():
        path = os.path.join(repo, src)
        if name in existing:
            print(f"update {name} from {src}")
            if not dry:
                call("PUT", f"{BASE}/files/{existing[name]['id']}",
                     {"storageId": storage(path, name), "updateOption": "keep_translations_and_approvals"})
            file_id = existing[name]["id"]
        else:
            print(f"add {name} from {src}")
            if dry:
                continue
            file_id = call("POST", f"{BASE}/files", {
                "storageId": storage(path, name), "name": name, "directoryId": api_dir["id"],
                "title": TITLES[name], "exportOptions": {"exportPattern": pattern},
            })["data"]["id"]

        if with_tr:
            hu_path = hu if os.path.isabs(hu) else os.path.join(repo, hu)
            print(f"  hu from {os.path.relpath(hu_path)}")
            if not dry:
                call("POST", f"{BASE}/translations/hu", {
                    "storageId": storage(hu_path, name), "fileId": file_id,
                    "importEqSuggestions": True, "autoApproveImported": True,
                })


if __name__ == "__main__":
    main()
