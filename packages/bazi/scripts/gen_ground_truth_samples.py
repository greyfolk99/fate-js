"""
ground_truth_1800_2200.npz 에서 랜덤 500개 날짜+시간 조합을 추출해
__tests__/fixtures/ground_truth_samples.json 으로 출력한다.

실행:
  python3 scripts/gen_ground_truth_samples.py
"""

import json
import datetime
import pathlib
import numpy as np

# ── 경로 설정 ──────────────────────────────────────────────────────────────────
SCRIPT_DIR = pathlib.Path(__file__).parent
PACKAGE_DIR = SCRIPT_DIR.parent
NPZ_PATH = pathlib.Path("/Users/hjseo/apps/python-bazi/bazi/_data/ground_truth_1800_2200.npz")
OUT_PATH = PACKAGE_DIR / "__tests__" / "fixtures" / "ground_truth_samples.json"

# @fate/bazi 에서 사용하는 12시주 대표 시간
REPRESENTATIVE_HOURS = [23, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21]

N_SAMPLES = 500
SEED = 42

# ── 데이터 로드 ────────────────────────────────────────────────────────────────
print(f"Loading: {NPZ_PATH}")
data = np.load(NPZ_PATH)
ordinals = data["ordinals"]   # (N_days,) int32
bazi_arr  = data["bazi"]      # (N_days, 24, 8) int8

print(f"Coverage: {datetime.date.fromordinal(int(ordinals[0]))} ~ {datetime.date.fromordinal(int(ordinals[-1]))}")
print(f"Days: {len(ordinals)}, Generating {N_SAMPLES} samples …")

rng = np.random.default_rng(SEED)

# 날짜 인덱스 랜덤 선택 (500개)
day_indices = rng.choice(len(ordinals), size=N_SAMPLES, replace=False)
# 각 날짜마다 대표 시간 중 하나를 랜덤 선택
chosen_hours = rng.choice(REPRESENTATIVE_HOURS, size=N_SAMPLES)

samples = []
for day_idx, hour in zip(day_indices, chosen_hours):
    ord_val = int(ordinals[day_idx])
    d = datetime.date.fromordinal(ord_val)
    gt = bazi_arr[day_idx, hour]  # shape (8,)

    samples.append({
        "year":  d.year,
        "month": d.month,
        "day":   d.day,
        "hour":  int(hour),
        "expected": {
            "yearGan":  int(gt[0]),
            "yearZhi":  int(gt[1]),
            "monthGan": int(gt[2]),
            "monthZhi": int(gt[3]),
            "dayGan":   int(gt[4]),
            "dayZhi":   int(gt[5]),
            "hourGan":  int(gt[6]),
            "hourZhi":  int(gt[7]),
        }
    })

OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
with open(OUT_PATH, "w", encoding="utf-8") as f:
    json.dump(samples, f, ensure_ascii=False, indent=2)

print(f"Written {len(samples)} samples → {OUT_PATH}")
