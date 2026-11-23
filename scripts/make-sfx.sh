#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────────────
# Procedural UI sound kit for DALER.
# Every sound is synthesised locally with ffmpeg's lavfi sources — no samples,
# no downloads, no licences. Output: public/audio/<name>.mp3 (mono, 44.1 kHz).
#
#   pnpm sfx            # regenerate all sounds
#
# Requires ffmpeg with libmp3lame (`ffmpeg -encoders | grep mp3`).
# ──────────────────────────────────────────────────────────────────────────────
set -euo pipefail

cd "$(dirname "$0")/.."
OUT="public/audio"
mkdir -p "$OUT"

if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "ffmpeg is required: https://ffmpeg.org/download.html" >&2
  exit 1
fi

SR=44100
render() {
  # $1 = name, $2 = duration (s), $3 = filtergraph producing [out]
  local name="$1" dur="$2" graph="$3"
  ffmpeg -hide_banner -loglevel error -y \
    -filter_complex "$graph" -map "[out]" -t "$dur" \
    -ac 1 -ar "$SR" -c:a libmp3lame -q:a 4 "$OUT/$name.mp3"
  printf '  ✓ %-7s %6s  %s\n' "$name" "${dur}s" "$(du -h "$OUT/$name.mp3" | cut -f1)"
}

echo "› synthesising UI sounds into $OUT/"

# key — crisp mechanical key: high-passed noise transient + soft low thump
render key 0.06 "
  anoisesrc=d=0.06:c=white:a=0.55:r=$SR,highpass=f=2400,lowpass=f=9000,
    afade=t=out:st=0:d=0.035[n];
  aevalsrc='0.5*sin(2*PI*170*t)*exp(-t*90)':d=0.06:s=$SR[b];
  [n][b]amix=inputs=2:normalize=0,volume=0.9[out]"

# key2 — the alternate key (slightly lower, rounder) to avoid machine-gun repetition
render key2 0.06 "
  anoisesrc=d=0.06:c=pink:a=0.6:r=$SR,highpass=f=1600,lowpass=f=6500,
    afade=t=out:st=0:d=0.04[n];
  aevalsrc='0.55*sin(2*PI*140*t)*exp(-t*80)':d=0.06:s=$SR[b];
  [n][b]amix=inputs=2:normalize=0,volume=0.9[out]"

# pop — bubbly pitch drop 920 → 280 Hz
render pop 0.16 "
  aevalsrc='0.8*sin(2*PI*(280*t + (640/38)*(1-exp(-38*t))))*exp(-t*26)':d=0.16:s=$SR,
    afade=t=in:d=0.004[out]"

# tick — tiny glassy blip for counters and hovers
render tick 0.04 "
  aevalsrc='0.45*sin(2*PI*1850*t)*exp(-t*140) + 0.2*sin(2*PI*3700*t)*exp(-t*220)':d=0.04:s=$SR[out]"

# toggle — two-stage switch: low latch then bright click
render toggle 0.14 "
  aevalsrc='0.6*sin(2*PI*520*t)*exp(-t*70)':d=0.14:s=$SR[a];
  aevalsrc='0.5*sin(2*PI*1040*t)*exp(-t*90)':d=0.14:s=$SR,adelay=55[b];
  anoisesrc=d=0.14:c=white:a=0.25:r=$SR,highpass=f=3500,afade=t=out:st=0:d=0.02[n];
  [a][b][n]amix=inputs=3:normalize=0[out]"

# whoosh — band-passed noise with a bell-shaped swell (motion-blur slide)
render whoosh 0.6 "
  anoisesrc=d=0.6:c=pink:a=0.9:r=$SR,highpass=f=350,lowpass=f=2600,
    volume='pow(sin(PI*t/0.6),2.4)':eval=frame,volume=1.4[out]"

# swell — soft rising pad (A minor-ish, slightly detuned) for the vector trace
render swell 1.8 "
  aevalsrc='(0.22*sin(2*PI*220*t)+0.16*sin(2*PI*329.6*t)+0.12*sin(2*PI*440.8*t)+0.06*sin(2*PI*659.2*t))*pow(min(t/1.4,1),2)':d=1.8:s=$SR,
    lowpass=f=2400,afade=t=out:st=1.35:d=0.45,volume=0.9[out]"

echo "✓ done"
