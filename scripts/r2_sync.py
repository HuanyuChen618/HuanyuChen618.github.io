"""Upload /misc images to the Cloudflare R2 bucket, mirroring paths (public/misc/x/y.webp -> misc/x/y.webp).
Only new or changed files are sent (tracked in scripts/r2-manifest.json). Needs `npx wrangler login` once.
usage: python scripts/r2_sync.py [--dry]"""
import os, sys, json, hashlib, subprocess
from concurrent.futures import ThreadPoolExecutor

SITE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUB = os.path.join(SITE, "public")
BUCKET = "huanyu-site-media"
MAN = os.path.join(SITE, "scripts", "r2-manifest.json")
TYPES = {".mp4": "video/mp4", ".webp": "image/webp", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".gif": "image/gif"}
NPX = "npx.cmd" if os.name == "nt" else "npx"

def files():
    # two levels below public/misc, listed one folder at a time
    root = os.path.join(PUB, "misc")
    for name in sorted(os.listdir(root)):
        p = os.path.join(root, name)
        if os.path.isfile(p):
            yield p
            continue
        for sub in sorted(os.listdir(p)):
            q = os.path.join(p, sub)
            if os.path.isdir(q):
                for s2 in sorted(os.listdir(q)):
                    yield os.path.join(q, s2)
            else:
                yield q

def digest(p):
    h = hashlib.sha1()
    with open(p, "rb") as f:
        for b in iter(lambda: f.read(1 << 20), b""): h.update(b)
    return h.hexdigest()

def put(item):
    key, path, ctype = item
    r = subprocess.run([NPX, "--yes", "wrangler@4", "r2", "object", "put", f"{BUCKET}/{key}", "--file", path,
                        "--content-type", ctype, "--cache-control", "public, max-age=86400", "--remote"],
                       capture_output=True, text=True, encoding="utf-8", errors="replace", cwd=os.path.dirname(MAN))
    return key, r.returncode == 0, (r.stderr or r.stdout)[-300:]

if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    man = json.load(open(MAN)) if os.path.exists(MAN) else {}
    todo = []
    for p in files():
        ext = os.path.splitext(p)[1].lower()
        if ext not in TYPES: continue
        key = os.path.relpath(p, PUB).replace(os.sep, "/")
        d = digest(p)
        if man.get(key) != d: todo.append((key, p, TYPES[ext], d))
    print(len(todo), "files to upload")
    if "--dry" in sys.argv: sys.exit()
    hashes = {k: d for k, _, _, d in todo}; failed = []
    with ThreadPoolExecutor(8) as ex:
        for i, (key, ok, msg) in enumerate(ex.map(put, [(k, p, t) for k, p, t, _ in todo]), 1):
            if ok: man[key] = hashes[key]
            else: failed.append((key, msg))
            if i % 100 == 0:
                print(i, "done", flush=True); json.dump(man, open(MAN, "w"), indent=0, sort_keys=True)
    json.dump(man, open(MAN, "w"), indent=0, sort_keys=True)
    print("uploaded", len(todo) - len(failed), "failed", len(failed))
    for k, m in failed[:10]: print("FAIL", k, m)
