"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_multiclass_256x256/float32/latest/selfie_multiclass_256x256.tflite";
const WASM_BASE = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.33/wasm";
const BUNDLE_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.33/vision_bundle.mjs";
const HAIR_CLASS_ID = 1;
const BLEACH_BASE_ALPHA = 0.28;
const DYE_BASE_ALPHA = 0.48;

type ColorPreset = {
  name: string;
  hex: `#${string}`;
  mode: "bleach" | "dye";
};

const COLOR_PRESETS: ColorPreset[] = [
  { name: "Butter Blonde", hex: "#E8D37C", mode: "bleach" },
  { name: "Beige Blonde", hex: "#DCC59A", mode: "bleach" },
  { name: "Warm Caramel", hex: "#B97942", mode: "bleach" },
  { name: "Burnt Copper", hex: "#B9542A", mode: "dye" },
  { name: "Cherry Cola", hex: "#7A2135", mode: "dye" },
  { name: "Dimensional Cocoa", hex: "#5B3A2F", mode: "dye" },
  { name: "Espresso", hex: "#2F201C", mode: "dye" },
  { name: "Surreal Bronde", hex: "#9B7E63", mode: "bleach" }
];
const DEFAULT_PRESET = COLOR_PRESETS[3];

type SegmenterLike = {
  close: () => void;
  segmentForVideo: (video: HTMLVideoElement, timestampMs: number) => {
    categoryMask?: {
      width: number;
      height: number;
      getAsUint8Array: () => Uint8Array;
    };
    close: () => void;
  };
};

type Hsl = { h: number; s: number; l: number };

export default function HairOutlinePage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const segmenterRef = useRef<SegmenterLike | null>(null);
  const selectedRef = useRef<ColorPreset>(DEFAULT_PRESET);
  const strengthRef = useRef(60);
  const bleachPassRef = useRef<1 | 2 | 3>(1);
  const rootMixRef = useRef(55);
  const midMixRef = useRef(85);
  const endMixRef = useRef(115);
  const frameCountRef = useRef(0);

  const [running, setRunning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<ColorPreset>(DEFAULT_PRESET);
  const [strength, setStrength] = useState(60);
  const [bleachPass, setBleachPass] = useState<1 | 2 | 3>(1);
  const [rootMix, setRootMix] = useState(55);
  const [midMix, setMidMix] = useState(85);
  const [endMix, setEndMix] = useState(115);
  const [avgHairTone, setAvgHairTone] = useState<Hsl>({ h: 30, s: 0.35, l: 0.35 });

  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);

  useEffect(() => {
    strengthRef.current = strength;
  }, [strength]);

  useEffect(() => {
    bleachPassRef.current = bleachPass;
  }, [bleachPass]);

  useEffect(() => {
    rootMixRef.current = rootMix;
  }, [rootMix]);

  useEffect(() => {
    midMixRef.current = midMix;
  }, [midMix]);

  useEffect(() => {
    endMixRef.current = endMix;
  }, [endMix]);

  const clamp01 = useCallback((v: number) => Math.max(0, Math.min(1, v)), []);
  const lerp = useCallback((a: number, b: number, t: number) => a + (b - a) * t, []);

  const rgbToHsl = useCallback((r: number, g: number, b: number): Hsl => {
    const rn = r / 255;
    const gn = g / 255;
    const bn = b / 255;
    const max = Math.max(rn, gn, bn);
    const min = Math.min(rn, gn, bn);
    const delta = max - min;

    let h = 0;
    const l = (max + min) / 2;
    const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

    if (delta !== 0) {
      if (max === rn) h = ((gn - bn) / delta) % 6;
      else if (max === gn) h = (bn - rn) / delta + 2;
      else h = (rn - gn) / delta + 4;
      h *= 60;
      if (h < 0) h += 360;
    }

    return { h, s, l };
  }, []);

  const hslToRgb = useCallback((h: number, s: number, l: number) => {
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const hh = h / 60;
    const x = c * (1 - Math.abs((hh % 2) - 1));

    let rn = 0;
    let gn = 0;
    let bn = 0;

    if (hh >= 0 && hh < 1) [rn, gn, bn] = [c, x, 0];
    else if (hh < 2) [rn, gn, bn] = [x, c, 0];
    else if (hh < 3) [rn, gn, bn] = [0, c, x];
    else if (hh < 4) [rn, gn, bn] = [0, x, c];
    else if (hh < 5) [rn, gn, bn] = [x, 0, c];
    else [rn, gn, bn] = [c, 0, x];

    const m = l - c / 2;
    return {
      r: Math.round((rn + m) * 255),
      g: Math.round((gn + m) * 255),
      b: Math.round((bn + m) * 255)
    };
  }, []);

  const hueDistance = useCallback((a: number, b: number) => {
    const d = Math.abs(a - b);
    return Math.min(d, 360 - d) / 180;
  }, []);

  const applyBleachPass = useCallback(
    (base: Hsl, pass: 1 | 2 | 3): Hsl => {
      const p = pass;
      const lift = [0, 0.11, 0.2, 0.3][p];
      const satDrop = [0, 0.18, 0.34, 0.48][p];
      const hueWarmShift = [0, 5, 9, 12][p];

      return {
        h: (base.h + hueWarmShift) % 360,
        s: clamp01(base.s * (1 - satDrop)),
        l: clamp01(base.l + lift * (1 - base.l * 0.45))
      };
    },
    [clamp01]
  );

  const applyTargetColor = useCallback(
    (base: Hsl, target: Hsl, mode: ColorPreset["mode"], applied: number): Hsl => {
      if (mode === "bleach") {
        return {
          h: lerp(base.h, target.h, 0.22 * applied),
          s: clamp01(base.s * (1 - 0.62 * applied) + target.s * (0.22 * applied)),
          l: clamp01(base.l + (0.26 + target.l * 0.2) * applied)
        };
      }

      return {
        h: lerp(base.h, target.h, 0.92 * applied),
        s: clamp01(base.s * (1 - 0.16 * applied) + target.s * (1.05 * applied)),
        l: clamp01(base.l * (1 - 0.2 * applied) + target.l * (0.2 * applied))
      };
    },
    [clamp01, lerp]
  );

  const getRecommendedPass = useCallback(
    (target: Hsl, currentHair: Hsl, mode: ColorPreset["mode"]): 1 | 2 | 3 => {
      if (mode === "bleach") {
        if (target.l >= 0.72) return 3;
        if (target.l >= 0.55) return 2;
        return 1;
      }

      const candidates: Array<1 | 2 | 3> = [1, 2, 3];
      let best: 1 | 2 | 3 = 1;
      let bestScore = Number.POSITIVE_INFINITY;

      for (const pass of candidates) {
        const bleached = applyBleachPass(currentHair, pass);
        const projected = applyTargetColor(bleached, target, mode, 0.72);
        const score =
          hueDistance(projected.h, target.h) * 0.58 +
          Math.abs(projected.s - target.s) * 0.22 +
          Math.abs(projected.l - target.l) * 0.2;

        if (score < bestScore) {
          bestScore = score;
          best = pass;
        }
      }

      return best;
    },
    [applyBleachPass, applyTargetColor, hueDistance]
  );

  const selectedHsl = useMemo(() => {
    const hex = selected.hex.slice(1);
    const r = Number.parseInt(hex.slice(0, 2), 16);
    const g = Number.parseInt(hex.slice(2, 4), 16);
    const b = Number.parseInt(hex.slice(4, 6), 16);
    return rgbToHsl(r, g, b);
  }, [rgbToHsl, selected.hex]);

  const recommendedPass = useMemo(
    () => getRecommendedPass(selectedHsl, avgHairTone, selected.mode),
    [avgHairTone, getRecommendedPass, selected.mode, selectedHsl]
  );

  const stopSession = useCallback(() => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (segmenterRef.current) {
      segmenterRef.current.close();
      segmenterRef.current = null;
    }

    setRunning(false);
  }, []);

  useEffect(() => {
    return () => stopSession();
  }, [stopSession]);

  const drawHairOutline = useCallback(
    (result: ReturnType<SegmenterLike["segmentForVideo"]>) => {
      const mask = result.categoryMask;
      const output = canvasRef.current;
      const video = videoRef.current;

      if (!mask || !output || !video) return;

      const outputCtx = output.getContext("2d");
      if (!outputCtx) return;

      const maskCanvas = maskCanvasRef.current ?? document.createElement("canvas");
      maskCanvasRef.current = maskCanvas;
      maskCanvas.width = mask.width;
      maskCanvas.height = mask.height;

      const maskCtx = maskCanvas.getContext("2d");
      if (!maskCtx) return;

      const frameCanvas = frameCanvasRef.current ?? document.createElement("canvas");
      frameCanvasRef.current = frameCanvas;
      frameCanvas.width = mask.width;
      frameCanvas.height = mask.height;

      const frameCtx = frameCanvas.getContext("2d", { willReadFrequently: true });
      if (!frameCtx) return;

      frameCtx.drawImage(video, 0, 0, frameCanvas.width, frameCanvas.height);
      const sourceFrame = frameCtx.getImageData(0, 0, frameCanvas.width, frameCanvas.height);
      const src = sourceFrame.data;

      const classes = mask.getAsUint8Array();
      const width = mask.width;
      const height = mask.height;
      const pixels = new Uint8ClampedArray(width * height * 4);

      const currentSelected = selectedRef.current;
      const currentStrength = strengthRef.current;
      const alphaScale = clamp01(currentStrength / 100);
      const selectedHex = currentSelected.hex.slice(1);
      const targetHsl = rgbToHsl(
        Number.parseInt(selectedHex.slice(0, 2), 16),
        Number.parseInt(selectedHex.slice(2, 4), 16),
        Number.parseInt(selectedHex.slice(4, 6), 16)
      );
      const fillAlphaBase = currentSelected.mode === "bleach" ? BLEACH_BASE_ALPHA : DYE_BASE_ALPHA;

      let accumH = 0;
      let accumS = 0;
      let accumL = 0;
      let count = 0;

      for (let y = 1; y < height - 1; y += 1) {
        for (let x = 1; x < width - 1; x += 1) {
          const i = y * width + x;
          if (classes[i] !== HAIR_CLASS_ID) continue;

          const top = classes[i - width] !== HAIR_CLASS_ID;
          const right = classes[i + 1] !== HAIR_CLASS_ID;
          const bottom = classes[i + width] !== HAIR_CLASS_ID;
          const left = classes[i - 1] !== HAIR_CLASS_ID;

          const p = i * 4;
          const isEdge = top || right || bottom || left;
          const yNorm = y / (height - 1);
          const zoneFactor =
            yNorm < 0.35
              ? lerp(rootMixRef.current / 100, midMixRef.current / 100, yNorm / 0.35)
              : lerp(midMixRef.current / 100, endMixRef.current / 100, (yNorm - 0.35) / 0.65);
          const applied = clamp01(alphaScale * zoneFactor);
          const fillAlpha = Math.round(255 * fillAlphaBase * applied);

          const sr = src[p];
          const sg = src[p + 1];
          const sb = src[p + 2];
          const srcHsl = rgbToHsl(sr, sg, sb);

          accumH += srcHsl.h;
          accumS += srcHsl.s;
          accumL += srcHsl.l;
          count += 1;

          const bleachedBase = applyBleachPass(srcHsl, bleachPassRef.current);
          const finalHsl = applyTargetColor(bleachedBase, targetHsl, currentSelected.mode, applied);
          const tinted = hslToRgb(finalHsl.h, finalHsl.s, finalHsl.l);

          if (isEdge) {
            pixels[p] = 236;
            pixels[p + 1] = 72;
            pixels[p + 2] = 153;
            pixels[p + 3] = 210;
          } else {
            pixels[p] = tinted.r;
            pixels[p + 1] = tinted.g;
            pixels[p + 2] = tinted.b;
            pixels[p + 3] = fillAlpha;
          }
        }
      }

      if (count > 0) {
        frameCountRef.current += 1;
        const tone = {
          h: accumH / count,
          s: accumS / count,
          l: accumL / count
        };
        if (frameCountRef.current % 12 === 0) {
          setAvgHairTone(tone);
        }
      }

      maskCtx.putImageData(new ImageData(pixels, width, height), 0, 0);
      outputCtx.clearRect(0, 0, output.width, output.height);
      outputCtx.drawImage(maskCanvas, 0, 0, output.width, output.height);
    },
    [
      applyBleachPass,
      applyTargetColor,
      bleachPass,
      clamp01,
      endMix,
      hslToRgb,
      lerp,
      midMix,
      rgbToHsl,
      rgbToHsl
    ]
  );

  const startSession = useCallback(async () => {
    if (running || loading) return;

    setError(null);
    setLoading(true);

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) throw new Error("video/canvas element not found");

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      });

      streamRef.current = stream;
      video.srcObject = stream;
      await video.play();

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const { FilesetResolver, ImageSegmenter } = (await import(
        /* webpackIgnore: true */ BUNDLE_URL
      )) as {
        FilesetResolver: { forVisionTasks: (path: string) => Promise<unknown> };
        ImageSegmenter: {
          createFromOptions: (
            fileset: unknown,
            options: Record<string, unknown>
          ) => Promise<SegmenterLike>;
        };
      };

      const vision = await FilesetResolver.forVisionTasks(WASM_BASE);
      let segmenter: SegmenterLike;

      try {
        segmenter = await ImageSegmenter.createFromOptions(vision, {
          baseOptions: { modelAssetPath: MODEL_URL, delegate: "GPU" },
          runningMode: "VIDEO",
          outputCategoryMask: true,
          outputConfidenceMasks: false
        });
      } catch {
        segmenter = await ImageSegmenter.createFromOptions(vision, {
          baseOptions: { modelAssetPath: MODEL_URL, delegate: "CPU" },
          runningMode: "VIDEO",
          outputCategoryMask: true,
          outputConfidenceMasks: false
        });
      }

      segmenterRef.current = segmenter;
      setRunning(true);

      const render = () => {
        const currentVideo = videoRef.current;
        const currentSegmenter = segmenterRef.current;
        if (!currentVideo || !currentSegmenter) return;

        if (currentVideo.readyState >= 2) {
          const segResult = currentSegmenter.segmentForVideo(currentVideo, performance.now());
          drawHairOutline(segResult);
          segResult.close();
        }

        frameRef.current = requestAnimationFrame(render);
      };

      frameRef.current = requestAnimationFrame(render);
    } catch (e) {
      setError(e instanceof Error ? e.message : "카메라/모델 초기화에 실패했습니다.");
      stopSession();
    } finally {
      setLoading(false);
    }
  }, [drawHairOutline, loading, running, stopSession]);

  return (
    <section>
      <h1 className="page-title">Hair Outline (MediaPipe)</h1>
      <p className="page-desc">탈색 1/2/3회 시뮬레이션 + 현재 컬러 기준 추천 횟수를 제공합니다.</p>

      <div className="hero-actions" style={{ marginBottom: 14 }}>
        <button className="btn-primary" onClick={startSession} disabled={loading || running}>
          {loading ? "초기화 중..." : running ? "실행 중" : "카메라 시작"}
        </button>
        <button className="btn-secondary" onClick={stopSession} disabled={!running && !loading}>
          중지
        </button>
      </div>

      <div className="panel" style={{ marginBottom: 14 }}>
        <h3 style={{ marginTop: 0 }}>컬러 팔레트</h3>
        <p className="page-desc" style={{ marginTop: 0 }}>
          컬러 선택 후 탈색 횟수를 바꿔보면 결과가 달라집니다.
        </p>
        <div className="palette-grid">
          {COLOR_PRESETS.map((preset) => {
            const active = preset.name === selected.name;
            return (
              <button
                key={preset.name}
                className={`palette-item ${active ? "active" : ""}`}
                onClick={() => setSelected(preset)}
                type="button"
              >
                <span className="swatch" style={{ background: preset.hex }} />
                <span>
                  <strong>{preset.name}</strong>
                  <small>{preset.mode === "bleach" ? "탈색 계열" : "염색 계열"}</small>
                </span>
              </button>
            );
          })}
        </div>

        <div className="bleach-pass-wrap">
          <span className="bleach-pass-title">탈색 횟수</span>
          <div className="bleach-pass-buttons">
            {[1, 2, 3].map((pass) => {
              const p = pass as 1 | 2 | 3;
              const active = bleachPass === p;
              const recommended = recommendedPass === p;
              return (
                <button
                  key={p}
                  type="button"
                  className={`bleach-pass-btn ${active ? "active" : ""}`}
                  onClick={() => setBleachPass(p)}
                >
                  {p}회
                  {recommended ? " (추천)" : ""}
                </button>
              );
            })}
          </div>
          <p className="page-desc" style={{ marginTop: 8 }}>
            추천 횟수: <strong>{recommendedPass}회</strong> · 현재 헤어 밝기 {Math.round(avgHairTone.l * 100)}%
          </p>
        </div>

        <label className="strength-row">
          <span>강도: {strength}%</span>
          <input type="range" min={20} max={95} value={strength} onChange={(e) => setStrength(Number(e.target.value))} />
        </label>
        <label className="strength-row">
          <span>뿌리 강도: {rootMix}%</span>
          <input type="range" min={20} max={120} value={rootMix} onChange={(e) => setRootMix(Number(e.target.value))} />
        </label>
        <label className="strength-row">
          <span>중간 강도: {midMix}%</span>
          <input type="range" min={40} max={140} value={midMix} onChange={(e) => setMidMix(Number(e.target.value))} />
        </label>
        <label className="strength-row">
          <span>끝 강도: {endMix}%</span>
          <input type="range" min={60} max={180} value={endMix} onChange={(e) => setEndMix(Number(e.target.value))} />
        </label>
      </div>

      {error && <p style={{ color: "#b41340", fontWeight: 700, marginBottom: 10 }}>오류: {error}</p>}

      <div className="hair-cam-wrap">
        <video ref={videoRef} className="hair-video" muted playsInline />
        <canvas ref={canvasRef} className="hair-overlay" />
      </div>

      <p className="page-desc" style={{ marginTop: 12 }}>
        참고: 실제 시술 결과는 베이스 모발 상태/산화제/시술 시간에 따라 달라집니다. 여기서는 카메라 기반 시뮬레이션입니다.
      </p>
    </section>
  );
}
