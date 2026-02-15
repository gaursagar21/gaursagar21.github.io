#!/usr/bin/env python3
"""
Image optimizer for this repo (no dependencies).

Uses macOS `sips` to:
- resize images to a max dimension (default 2000px)
- recompress JPEGs to a target quality (default 80)
- convert HEIC to JPEG (keeps filenames, changes extension to .jpg)

Workflow:
1) Drop originals in:
   - artwork/_raw/
   - photos/_raw/
2) Run:
   python3 scripts/optimize_images.py

Optimized output goes to:
   - artwork/
   - photos/
"""

from __future__ import annotations

import argparse
import os
import shlex
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable


ROOT = Path(__file__).resolve().parents[1]


IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".heic", ".heif", ".tif", ".tiff"}


@dataclass(frozen=True)
class Job:
    src: Path
    dst: Path
    fmt: str  # "jpeg" or "png"


def run(cmd: list[str]) -> None:
    proc = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    if proc.returncode != 0:
        raise RuntimeError(
            "Command failed:\n"
            f"$ {shlex.join(cmd)}\n\n"
            f"stdout:\n{proc.stdout}\n\n"
            f"stderr:\n{proc.stderr}\n"
        )


def human_bytes(n: int) -> str:
    units = ["B", "KB", "MB", "GB"]
    f = float(n)
    for u in units:
        if f < 1024 or u == units[-1]:
            return f"{f:.1f}{u}" if u != "B" else f"{int(f)}B"
        f /= 1024
    return f"{n}B"


def iter_images(folder: Path) -> Iterable[Path]:
    if not folder.exists():
        return []
    for root, _, files in os.walk(folder):
        for name in files:
            p = Path(root) / name
            if p.suffix.lower() in IMAGE_EXTS:
                yield p


def build_jobs(src_root: Path, out_root: Path) -> list[Job]:
    jobs: list[Job] = []
    for src in iter_images(src_root):
        rel = src.relative_to(src_root)
        ext = src.suffix.lower()

        # Output format + extension:
        # - preserve .jpg/.jpeg and .png extensions (so existing URLs don't break)
        # - convert HEIC/HEIF → .jpg
        # - convert TIFF → .jpg
        if ext == ".png":
            fmt = "png"
            dst = out_root / rel  # keep .png
        elif ext in {".jpg", ".jpeg"}:
            fmt = "jpeg"
            dst = out_root / rel  # keep .jpg/.jpeg
        elif ext in {".heic", ".heif", ".tif", ".tiff"}:
            fmt = "jpeg"
            dst = out_root / rel.with_suffix(".jpg")
        else:
            # default: keep filename but write jpeg
            fmt = "jpeg"
            dst = out_root / rel.with_suffix(".jpg")

        jobs.append(Job(src=src, dst=dst, fmt=fmt))
    return jobs


def optimize_one(job: Job, max_dim: int, jpeg_quality: int, overwrite: bool) -> tuple[int, int]:
    job.dst.parent.mkdir(parents=True, exist_ok=True)

    if job.dst.exists() and not overwrite:
        return (job.src.stat().st_size, job.dst.stat().st_size)

    before = job.src.stat().st_size

    # `sips` can resize and convert in one go.
    # But for already-compressed assets, "optimizing" can sometimes make files bigger.
    # We write to a temp output and only promote it if it's smaller.
    tmp = job.dst.with_name(job.dst.name + ".tmpopt")
    if tmp.exists():
        tmp.unlink()

    cmd = ["sips"]
    cmd += ["-Z", str(max_dim)]
    cmd += ["-s", "format", job.fmt]
    if job.fmt == "jpeg":
        cmd += ["-s", "formatOptions", str(jpeg_quality)]
    cmd += [str(job.src), "--out", str(tmp)]

    run(cmd)
    tmp_size = tmp.stat().st_size
    dst_size = job.dst.stat().st_size if job.dst.exists() else None

    # If the temp result is smaller than the existing dst (or dst doesn't exist), use it.
    use_tmp = (dst_size is None) or (tmp_size < dst_size)

    # Also prefer tmp if it's smaller than the source size (to avoid regressions).
    # If tmp isn't smaller than *either* dst or src, fall back.
    if not (tmp_size < before or use_tmp):
        use_tmp = False

    if use_tmp:
        tmp.replace(job.dst)
    else:
        tmp.unlink(missing_ok=True)
        # If dst doesn't exist yet and we can preserve the exact file type/extension, copy src.
        if not job.dst.exists() and job.src.suffix.lower() == job.dst.suffix.lower():
            job.dst.write_bytes(job.src.read_bytes())

    after = job.dst.stat().st_size if job.dst.exists() else before
    return (before, after)


def main() -> int:
    ap = argparse.ArgumentParser(description="Optimize images for artwork/ and photos/.")
    ap.add_argument("--max-dim", type=int, default=2000, help="Max width/height in pixels (default: 2000)")
    ap.add_argument("--jpeg-quality", type=int, default=80, help="JPEG quality (default: 80)")
    ap.add_argument("--overwrite", action="store_true", help="Overwrite already-optimized outputs")

    ap.add_argument("--art-in", default="artwork/_raw", help="Artwork input folder (default: artwork/_raw)")
    ap.add_argument("--art-out", default="artwork", help="Artwork output folder (default: artwork)")
    ap.add_argument("--photos-in", default="photos/_raw", help="Photos input folder (default: photos/_raw)")
    ap.add_argument("--photos-out", default="photos", help="Photos output folder (default: photos)")

    args = ap.parse_args()

    # Ensure `sips` exists (macOS).
    if subprocess.call(["/usr/bin/which", "sips"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL) != 0:
        print("Error: `sips` not found. This script currently targets macOS.", file=sys.stderr)
        return 2

    art_in = ROOT / args.art_in
    art_out = ROOT / args.art_out
    photos_in = ROOT / args.photos_in
    photos_out = ROOT / args.photos_out

    jobs = []
    jobs += build_jobs(art_in, art_out)
    jobs += build_jobs(photos_in, photos_out)

    if not jobs:
        print("No images found in:", file=sys.stderr)
        print(f"- {art_in}", file=sys.stderr)
        print(f"- {photos_in}", file=sys.stderr)
        return 0

    total_before = 0
    total_after = 0
    print(f"Optimizing {len(jobs)} image(s)…")
    for j in jobs:
        b, a = optimize_one(j, args.max_dim, args.jpeg_quality, args.overwrite)
        total_before += b
        total_after += a
        rel_dst = j.dst.relative_to(ROOT)
        rel_src = j.src.relative_to(ROOT)
        print(f"- {rel_src} → {rel_dst}  ({human_bytes(b)} → {human_bytes(a)})")

    saved = total_before - total_after
    pct = (saved / total_before * 100.0) if total_before else 0.0
    print(f"\nTotal: {human_bytes(total_before)} → {human_bytes(total_after)}  (saved {human_bytes(saved)} / {pct:.1f}%)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

