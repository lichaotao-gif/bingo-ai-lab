<script setup lang="ts">
import {
  computed,
  nextTick,
  onMounted,
  onUnmounted,
  ref,
  shallowRef,
  watch,
} from "vue";
import { useRoute, useRouter } from "vue-router";
import { saveExperimentResultSubmit } from "@/utils/experimentResultStorage";
import {
  Hands,
  HAND_CONNECTIONS,
  type NormalizedLandmarkList,
  type Results,
} from "@mediapipe/hands";
import { drawConnectors, drawLandmarks } from "@mediapipe/drawing_utils";

/** 与 node_modules 版本一致，供 locateFile 从 CDN 拉取 wasm */
const MEDIAPIPE_HANDS_VERSION = "0.4.1675469240";

type Dir = "up" | "down" | "left" | "right" | "none";

const route = useRoute();
const router = useRouter();

const videoRef = ref<HTMLVideoElement | null>(null);
const overlayRef = ref<HTMLCanvasElement | null>(null);
const gameRef = ref<HTMLCanvasElement | null>(null);

const gestureLabel = ref<Dir>("none");
const gestureLabelZh = computed(() => {
  const m: Record<Dir, string> = {
    none: "未知方向",
    up: "上",
    down: "下",
    left: "左",
    right: "右",
  };
  return m[gestureLabel.value];
});

const cameraError = ref<string | null>(null);
const videoDevices = ref<MediaDeviceInfo[]>([]);
const activeDeviceIndex = ref(0);

const gameRunning = ref(false);
const score = ref(0);

const handsRef = shallowRef<Hands | null>(null);
let rafId = 0;
let stream: MediaStream | null = null;
let snakeTimer: ReturnType<typeof setInterval> | null = null;

const GRID = 18;
const TICK_MS = 280;

let snake: { x: number; y: number }[] = [];
let dir: Dir = "right";
let nextDir: Dir = "right";
let food = { x: 5, y: 5 };
let pendingDirection: Dir = "none";

function classifyDirection(landmarks: NormalizedLandmarkList | undefined): Dir {
  if (!landmarks?.length) {
    return "none";
  }
  const wrist = landmarks[0];
  const tip = landmarks[8];
  if (!wrist || !tip) {
    return "none";
  }
  const dx = tip.x - wrist.x;
  const dy = tip.y - wrist.y;
  const len = Math.hypot(dx, dy);
  if (len < 0.06) {
    return "none";
  }
  const deg = (Math.atan2(dy, dx) * 180) / Math.PI;
  if (deg >= -45 && deg < 45) {
    return "right";
  }
  if (deg >= 45 && deg < 135) {
    return "down";
  }
  if (deg >= 135 || deg < -135) {
    return "left";
  }
  return "up";
}

const stableDir = ref<Dir>("none");
let stableCount = 0;

function updateStableDir(d: Dir) {
  if (d === "none") {
    stableCount = 0;
    stableDir.value = "none";
    return;
  }
  if (d === stableDir.value) {
    stableCount = Math.min(stableCount + 1, 4);
  } else {
    stableDir.value = d;
    stableCount = 1;
  }
  if (stableCount >= 2) {
    gestureLabel.value = d;
    pendingDirection = d;
  }
}

function isOpposite(a: Dir, b: Dir): boolean {
  return (
    (a === "up" && b === "down") ||
    (a === "down" && b === "up") ||
    (a === "left" && b === "right") ||
    (a === "right" && b === "left")
  );
}

function resetGame() {
  const mid = Math.floor(GRID / 2);
  snake = [
    { x: mid - 1, y: mid },
    { x: mid, y: mid },
    { x: mid + 1, y: mid },
  ];
  dir = "right";
  nextDir = "right";
  pendingDirection = "none";
  score.value = 0;
  placeFood();
  drawGame();
}

function placeFood() {
  const taken = new Set(snake.map((s) => `${s.x},${s.y}`));
  let x = 0;
  let y = 0;
  let guard = 0;
  do {
    x = Math.floor(Math.random() * GRID);
    y = Math.floor(Math.random() * GRID);
    guard += 1;
  } while (taken.has(`${x},${y}`) && guard < 400);
  food = { x, y };
}

function drawGame() {
  const canvas = gameRef.value;
  if (!canvas) {
    return;
  }
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return;
  }
  const w = canvas.width;
  const h = canvas.height;
  const cell = w / GRID;
  ctx.fillStyle = "#141824";
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = "rgba(255,255,255,0.06)";
  ctx.lineWidth = 1;
  for (let i = 0; i <= GRID; i++) {
    ctx.beginPath();
    ctx.moveTo(i * cell, 0);
    ctx.lineTo(i * cell, h);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i * cell);
    ctx.lineTo(w, i * cell);
    ctx.stroke();
  }
  ctx.fillStyle = "#34d399";
  ctx.fillRect(food.x * cell + 1, food.y * cell + 1, cell - 2, cell - 2);
  ctx.fillStyle = "#fb923c";
  snake.forEach((seg, i) => {
    const pad = i === 0 ? 2 : 3;
    ctx.fillRect(
      seg.x * cell + pad,
      seg.y * cell + pad,
      cell - pad * 2,
      cell - pad * 2,
    );
  });
}

function stepSnake() {
  if (!gameRunning.value) {
    return;
  }
  const nd = pendingDirection;
  if (nd !== "none" && !isOpposite(nd, dir)) {
    nextDir = nd;
  }
  dir = nextDir;
  const head = snake[snake.length - 1]!;
  let nx = head.x;
  let ny = head.y;
  if (dir === "up") {
    ny -= 1;
  } else if (dir === "down") {
    ny += 1;
  } else if (dir === "left") {
    nx -= 1;
  } else if (dir === "right") {
    nx += 1;
  }
  if (nx < 0 || nx >= GRID || ny < 0 || ny >= GRID) {
    gameRunning.value = false;
    return;
  }
  if (snake.some((s) => s.x === nx && s.y === ny)) {
    gameRunning.value = false;
    return;
  }
  snake.push({ x: nx, y: ny });
  if (nx === food.x && ny === food.y) {
    score.value += 1;
    placeFood();
  } else {
    snake.shift();
  }
  drawGame();
}

function startGameLoop() {
  if (snakeTimer) {
    clearInterval(snakeTimer);
  }
  snakeTimer = setInterval(stepSnake, TICK_MS);
}

function stopGameLoop() {
  if (snakeTimer) {
    clearInterval(snakeTimer);
    snakeTimer = null;
  }
}

function onStartGame() {
  resetGame();
  gameRunning.value = true;
  startGameLoop();
}

function onResetGame() {
  stopGameLoop();
  gameRunning.value = false;
  resetGame();
}

function onResults(results: Results) {
  const canvas = overlayRef.value;
  const video = videoRef.value;
  if (!canvas || !video) {
    return;
  }
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return;
  }
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  if (!results.multiHandLandmarks.length) {
    updateStableDir("none");
    gestureLabel.value = "none";
    return;
  }
  const lm = results.multiHandLandmarks[0];
  if (!lm) {
    return;
  }
  const d = classifyDirection(lm);
  updateStableDir(d);

  drawConnectors(ctx, lm, HAND_CONNECTIONS, {
    color: "rgba(56, 189, 248, 0.85)",
    lineWidth: 2,
  });
  drawLandmarks(ctx, lm, {
    color: "#fbbf24",
    lineWidth: 1,
    radius: 3,
  });
}

async function listCameras() {
  try {
    const list = await navigator.mediaDevices.enumerateDevices();
    videoDevices.value = list.filter((d) => d.kind === "videoinput");
  } catch {
    videoDevices.value = [];
  }
}

async function startStream(deviceId?: string) {
  cameraError.value = null;
  if (stream) {
    stream.getTracks().forEach((t) => t.stop());
    stream = null;
  }
  const constraints: MediaStreamConstraints = {
    video: deviceId
      ? { deviceId: { exact: deviceId }, width: { ideal: 640 }, height: { ideal: 480 } }
      : {
          facingMode: "user",
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
    audio: false,
  };
  try {
    stream = await navigator.mediaDevices.getUserMedia(constraints);
  } catch (e) {
    cameraError.value = "无法打开摄像头，请检查权限或设备。";
    console.error(e);
    return;
  }
  const v = videoRef.value;
  if (!v) {
    return;
  }
  v.srcObject = stream;
  await v.play();
  await listCameras();
}

function resizeOverlay() {
  const v = videoRef.value;
  const c = overlayRef.value;
  if (!v || !c) {
    return;
  }
  const rect = v.getBoundingClientRect();
  const w = Math.floor(rect.width);
  const h = Math.floor(rect.height);
  if (w > 0 && h > 0) {
    c.width = w;
    c.height = h;
  }
}

function loop() {
  const v = videoRef.value;
  const hands = handsRef.value;
  if (v && hands && v.readyState >= 2) {
    void hands.send({ image: v });
  }
  rafId = requestAnimationFrame(loop);
}

async function initHands() {
  const hands = new Hands({
    locateFile: (file) =>
      `https://cdn.jsdelivr.net/npm/@mediapipe/hands@${MEDIAPIPE_HANDS_VERSION}/${file}`,
  });
  hands.setOptions({
    maxNumHands: 1,
    modelComplexity: 1,
    minDetectionConfidence: 0.6,
    minTrackingConfidence: 0.6,
    selfieMode: true,
  });
  hands.onResults(onResults);
  await hands.initialize();
  handsRef.value = hands;
}

async function switchCamera() {
  if (videoDevices.value.length < 2) {
    await listCameras();
    if (videoDevices.value.length < 2) {
      window.alert("当前仅检测到一枚摄像头。");
      return;
    }
  }
  activeDeviceIndex.value =
    (activeDeviceIndex.value + 1) % videoDevices.value.length;
  const dev = videoDevices.value[activeDeviceIndex.value];
  if (dev?.deviceId) {
    await startStream(dev.deviceId);
  }
}

function goBack() {
  const ret = route.query.return;
  if (typeof ret === "string" && ret.length > 0) {
    void router.push(ret);
    return;
  }
  void router.push({ name: "ai-lab" });
}

function showHelp() {
  window.alert(
    "【实验说明】\n\n将单手置于左侧画面中，食指指尖相对手腕的方向即控制蛇的移动方向。\n\n建议：保持手掌朝向摄像头，动作幅度稍大一些；蛇的移动较慢，便于对准方向后再转向。",
  );
}

function takeScreenshot() {
  const g = gameRef.value;
  if (!g) {
    return;
  }
  const url = g.toDataURL("image/png");
  const a = document.createElement("a");
  a.href = url;
  a.download = `gesture-snake-${Date.now()}.png`;
  a.click();
}

const submitDrawerOpen = ref(false);
const resultText = ref("");
const imageItems = ref<{ id: string; url: string; name: string }[]>([]);
const attachmentFile = ref<File | null>(null);
/** 演示：上次提交时间 */
const lastSubmitTime = ref<string | null>("2026-02-10 14:16");

const imageInputRef = ref<HTMLInputElement | null>(null);
const attachmentInputRef = ref<HTMLInputElement | null>(null);

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

function formatNow(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function openSubmitDrawer() {
  submitDrawerOpen.value = true;
}

function closeSubmitDrawer() {
  submitDrawerOpen.value = false;
}

function onPickImages(ev: Event) {
  const input = ev.target as HTMLInputElement;
  const files = input.files;
  if (!files?.length) {
    return;
  }
  for (const file of Array.from(files)) {
    if (!/^image\/(jpeg|png)$/i.test(file.type)) {
      window.alert(`「${file.name}」格式不支持，请使用 JPG 或 PNG。`);
      continue;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      window.alert(`「${file.name}」超过 5MB，请压缩后重试。`);
      continue;
    }
    const url = URL.createObjectURL(file);
    imageItems.value.push({
      id: crypto.randomUUID(),
      url,
      name: file.name,
    });
  }
  input.value = "";
}

function removeImage(id: string) {
  const item = imageItems.value.find((x) => x.id === id);
  if (item?.url.startsWith("blob:")) {
    URL.revokeObjectURL(item.url);
  }
  imageItems.value = imageItems.value.filter((x) => x.id !== id);
}

function addGameCanvasToImages() {
  const g = gameRef.value;
  if (!g) {
    return;
  }
  const url = g.toDataURL("image/png");
  imageItems.value.push({
    id: crypto.randomUUID(),
    url,
    name: `游戏画面-${Date.now()}.png`,
  });
}

function onPickAttachment(ev: Event) {
  const input = ev.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) {
    return;
  }
  attachmentFile.value = file;
  input.value = "";
}

function clearAttachment() {
  attachmentFile.value = null;
  if (attachmentInputRef.value) {
    attachmentInputRef.value.value = "";
  }
}

const SUBMIT_STUDENT_NAME = "李超涛";

async function blobUrlToDataUrl(blobUrl: string): Promise<string> {
  const res = await fetch(blobUrl);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result as string);
    fr.onerror = () => reject(fr.error);
    fr.readAsDataURL(blob);
  });
}

async function handleSubmitForm() {
  const gradeLabel =
    (route.query.gradeLabel as string | undefined)?.trim() || "二年级（上）";

  const images: { name: string; dataUrl: string }[] = [];
  for (const it of imageItems.value) {
    try {
      if (it.url.startsWith("data:")) {
        images.push({ name: it.name, dataUrl: it.url });
      } else if (it.url.startsWith("blob:")) {
        const dataUrl = await blobUrlToDataUrl(it.url);
        images.push({ name: it.name, dataUrl });
      }
    } catch {
      // 单张失败则跳过，避免整单失败
    }
  }

  const attachmentMeta = attachmentFile.value
    ? {
        name: attachmentFile.value.name,
        size: attachmentFile.value.size,
      }
    : null;

  const id =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `er-${Date.now()}`;

  saveExperimentResultSubmit({
    id,
    experimentId: "gesture-snake",
    gradeLabel,
    studentName: SUBMIT_STUDENT_NAME,
    submittedAt: new Date().toISOString(),
    text: resultText.value.trim(),
    images,
    attachment: attachmentMeta,
  });

  lastSubmitTime.value = formatNow();
  window.alert(
    `提交成功（演示）\n文字：${resultText.value ? "已填写" : "未填写"} · 图片 ${images.length} 张 · 附件 ${attachmentMeta ? attachmentMeta.name : "无"}`,
  );
  closeSubmitDrawer();
  resultText.value = "";
  imageItems.value.forEach((it) => {
    if (it.url.startsWith("blob:")) {
      URL.revokeObjectURL(it.url);
    }
  });
  imageItems.value = [];
  clearAttachment();
}

watch(submitDrawerOpen, (open) => {
  document.body.style.overflow = open ? "hidden" : "";
});

onMounted(async () => {
  await initHands();
  await startStream();
  if (videoRef.value) {
    videoRef.value.addEventListener("loadeddata", resizeOverlay);
  }
  window.addEventListener("resize", resizeOverlay);
  await nextTick();
  resetGame();
  requestAnimationFrame(() => {
    resizeOverlay();
    rafId = requestAnimationFrame(loop);
  });
});

watch(videoDevices, async () => {
  if (videoDevices.value.length && videoRef.value) {
    const id = stream?.getVideoTracks()[0]?.getSettings().deviceId;
    const idx = videoDevices.value.findIndex((d) => d.deviceId === id);
    if (idx >= 0) {
      activeDeviceIndex.value = idx;
    }
  }
});

onUnmounted(async () => {
  document.body.style.overflow = "";
  cancelAnimationFrame(rafId);
  stopGameLoop();
  window.removeEventListener("resize", resizeOverlay);
  videoRef.value?.removeEventListener("loadeddata", resizeOverlay);
  if (stream) {
    stream.getTracks().forEach((t) => t.stop());
  }
  const h = handsRef.value;
  if (h) {
    await h.close();
    handsRef.value = null;
  }
  imageItems.value.forEach((it) => {
    if (it.url.startsWith("blob:")) {
      URL.revokeObjectURL(it.url);
    }
  });
});
</script>

<template>
  <div
    class="flex h-full min-h-0 flex-col gap-3 overflow-y-auto bg-[#1a1f2e] p-3 text-white sm:gap-4 sm:p-4 lg:gap-5"
  >
    <!-- 顶栏 -->
    <header
      class="flex flex-wrap items-center gap-2 border-b border-white/10 pb-3 text-[13px] sm:text-[14px]"
    >
      <button
        type="button"
        class="inline-flex max-w-[min(100%,220px)] items-center gap-1 truncate text-white/70 transition hover:text-sky-300"
        @click="goBack"
      >
        <span class="text-lg leading-none" aria-hidden="true">‹</span>
        <span class="truncate font-medium text-white/95">
          手势贪吃蛇——根据手势控制
        </span>
      </button>
      <p
        class="hidden min-w-0 flex-1 items-center gap-1.5 text-white/70 md:flex md:justify-center"
      >
        <span aria-hidden="true">💡</span>
        <span
          >操作：根据识别手势方向，操作右侧贪吃蛇游戏</span
        >
      </p>
      <button
        type="button"
        class="ml-auto shrink-0 rounded-lg px-2 py-1 text-sky-300/90 underline-offset-2 transition hover:text-sky-200 hover:underline"
        @click="showHelp"
      >
        实验说明
      </button>
    </header>

    <p class="text-[12px] text-white/65 md:hidden">
      💡 操作：根据识别手势方向，操作右侧贪吃蛇游戏
    </p>

    <div
      class="relative flex min-h-0 flex-1 flex-col gap-4 lg:flex-row lg:gap-5 lg:pr-[7.5rem]"
    >
      <!-- 主双栏 -->
      <div
        class="grid min-h-[280px] flex-1 grid-cols-1 gap-4 sm:min-h-[320px] lg:grid-cols-2 lg:gap-5"
      >
        <!-- 左侧摄像头 -->
        <div
          class="relative flex min-h-0 flex-col overflow-hidden rounded-xl border border-white/15 bg-[#141824]"
        >
          <p
            class="border-b border-white/10 px-3 py-2 text-[13px] text-white/80"
          >
            手势操作
          </p>
          <div class="relative min-h-[200px] flex-1 bg-black/40">
            <video
              ref="videoRef"
              class="h-full w-full scale-x-[-1] object-cover"
              playsinline
              muted
            />
            <canvas
              ref="overlayRef"
              class="pointer-events-none absolute inset-0 h-full w-full scale-x-[-1]"
            />
            <p
              v-if="cameraError"
              class="absolute inset-0 flex items-center justify-center bg-black/60 px-4 text-center text-[13px] text-amber-200"
            >
              {{ cameraError }}
            </p>
            <button
              type="button"
              class="absolute bottom-3 right-3 flex items-center gap-1 rounded-full border border-white/20 bg-black/45 px-3 py-1.5 text-[12px] text-white/90 backdrop-blur-sm transition hover:bg-black/60"
              @click="switchCamera"
            >
              <svg
                class="size-3.5"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  stroke="currentColor"
                  stroke-width="1.75"
                  stroke-linecap="round"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              切换摄像头
            </button>
          </div>
        </div>

        <!-- 右侧游戏 -->
        <div
          class="relative flex min-h-0 flex-col overflow-hidden rounded-xl border border-white/15 bg-[#141824]"
        >
          <p
            class="border-b border-white/10 px-3 py-2 text-[13px] text-white/80"
          >
            游戏展示
          </p>
          <div class="relative flex min-h-[200px] flex-1 items-stretch p-2">
            <canvas
              ref="gameRef"
              class="h-full w-full max-h-[min(56vh,420px)] rounded-lg border border-white/10"
              width="360"
              height="360"
            />
            <p
              class="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/55 px-3 py-1 text-[12px] text-white/85"
            >
              {{ gestureLabelZh }}
            </p>
          </div>
        </div>
      </div>

      <!-- 右侧竖条按钮（大屏）：加大触控区域 -->
      <div
        class="flex flex-row justify-center gap-4 lg:absolute lg:right-0 lg:top-1/2 lg:z-10 lg:-translate-y-1/2 lg:flex-col lg:gap-4"
      >
        <button
          type="button"
          class="flex min-h-[5.75rem] min-w-[5.75rem] flex-col items-center justify-center gap-1.5 rounded-2xl border border-white/20 bg-white/10 px-3 py-3 text-[13px] font-medium text-white shadow-lg shadow-black/20 transition hover:bg-white/15 sm:min-h-[6.25rem] sm:min-w-[6.25rem] sm:text-[14px]"
          @click="takeScreenshot"
        >
          <svg
            class="size-8 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              stroke="currentColor"
              stroke-width="1.5"
              d="M4 7h3l2-2h6l2 2h3v12H4V7z"
            />
            <circle cx="12" cy="13" r="3.5" stroke="currentColor" stroke-width="1.5" />
          </svg>
          截图
        </button>
        <button
          type="button"
          class="flex min-h-[5.75rem] min-w-[5.75rem] flex-col items-center justify-center gap-1.5 rounded-2xl border border-sky-400/40 bg-sky-500/25 px-3 py-3 text-[13px] font-medium text-white shadow-lg shadow-sky-900/30 transition hover:bg-sky-500/35 sm:min-h-[6.25rem] sm:min-w-[6.25rem] sm:text-[14px]"
          @click="openSubmitDrawer"
        >
          <svg
            class="size-8 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              d="M8 6h12M8 12h12M8 18h6"
            />
            <path
              stroke="currentColor"
              stroke-width="1.5"
              d="M4 6h.01M4 12h.01M4 18h.01"
            />
          </svg>
          提交结果
        </button>
      </div>
    </div>

    <!-- 底部控制 -->
    <footer
      class="flex flex-wrap items-center gap-3 border-t border-white/10 pt-3"
    >
      <button
        type="button"
        class="rounded-full bg-gradient-to-r from-pink-500 to-violet-600 px-8 py-2.5 text-[14px] font-medium shadow-lg shadow-black/30 transition hover:opacity-95"
        @click="onStartGame"
      >
        开始游戏
      </button>
      <button
        type="button"
        class="rounded-full bg-gradient-to-r from-sky-400/90 to-indigo-500/90 px-8 py-2.5 text-[14px] font-medium text-white shadow-md transition hover:opacity-95"
        @click="onResetGame"
      >
        重置
      </button>
      <span v-if="score > 0 || gameRunning" class="text-[13px] text-white/60">
        得分 {{ score }}
        <template v-if="!gameRunning && score > 0">（已结束）</template>
      </span>
    </footer>

    <!-- 提交结果：右侧抽屉 -->
    <Teleport to="body">
      <Transition name="drawer-backdrop">
        <div
          v-if="submitDrawerOpen"
          class="fixed inset-0 z-[199] bg-black/45 backdrop-blur-[1px]"
          aria-hidden="true"
          @click="closeSubmitDrawer"
        />
      </Transition>
      <Transition name="drawer-panel">
        <aside
          v-if="submitDrawerOpen"
          class="fixed right-0 top-0 z-[200] flex h-full w-full max-w-md flex-col bg-white text-black shadow-2xl"
          role="dialog"
          aria-modal="true"
          aria-labelledby="submit-drawer-title"
          @click.stop
        >
          <header
            class="flex shrink-0 items-center justify-between border-b border-black/10 px-5 py-4"
          >
            <h2
              id="submit-drawer-title"
              class="text-lg font-semibold text-[#2b7cff]"
            >
              提交结果
            </h2>
            <button
              type="button"
              class="flex size-10 items-center justify-center rounded-full text-black/45 transition hover:bg-black/5 hover:text-black"
              aria-label="关闭"
              @click="closeSubmitDrawer"
            >
              <span class="text-2xl leading-none" aria-hidden="true">×</span>
            </button>
          </header>

          <div class="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            <div class="mb-5">
              <p class="text-[14px] font-medium text-black/70">上传要求</p>
              <p class="mt-1 text-[13px] font-medium text-amber-600">
                每个方向需要一张截图
              </p>
            </div>

            <label class="mb-2 block text-[14px] font-medium text-black/80">
              实验结果
            </label>
            <textarea
              v-model="resultText"
              rows="5"
              class="mb-6 w-full resize-y rounded-xl border border-black/15 bg-white px-3 py-2.5 text-[14px] text-black/90 placeholder:text-black/35 focus:border-[#2b7cff] focus:outline-none focus:ring-2 focus:ring-[#2b7cff]/25"
              placeholder="请输入实验结果"
            />

            <p class="mb-2 text-[14px] font-medium text-black/80">图片上传</p>
            <div class="mb-2 flex flex-wrap gap-3">
              <div
                v-for="img in imageItems"
                :key="img.id"
                class="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg border border-black/10 bg-black/5"
              >
                <img
                  :src="img.url"
                  :alt="img.name"
                  class="size-full object-cover"
                />
                <button
                  type="button"
                  class="absolute right-1 top-1 flex size-6 items-center justify-center rounded-full bg-red-500 text-white shadow-md transition hover:bg-red-600"
                  aria-label="删除图片"
                  @click="removeImage(img.id)"
                >
                  <span class="text-sm leading-none">×</span>
                </button>
              </div>
              <button
                type="button"
                class="flex h-24 w-24 shrink-0 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-black/20 bg-black/[0.02] text-center transition hover:border-[#2b7cff]/50 hover:bg-[#2b7cff]/5"
                @click="imageInputRef?.click()"
              >
                <svg
                  class="size-7 text-black/40"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    stroke="currentColor"
                    stroke-width="1.5"
                    d="M4 7h3l2-2h6l2 2h3v12H4V7z"
                  />
                  <circle cx="12" cy="13" r="2.5" stroke="currentColor" stroke-width="1.5" />
                </svg>
                <span class="px-1 text-[10px] leading-tight text-black/45">
                  支持 JPG、PNG 格式，每张图片不超过 5MB
                </span>
              </button>
            </div>
            <input
              ref="imageInputRef"
              type="file"
              class="sr-only"
              accept="image/jpeg,image/png"
              multiple
              @change="onPickImages"
            />
            <button
              type="button"
              class="mb-6 text-[13px] text-[#2b7cff] underline-offset-2 hover:underline"
              @click="addGameCanvasToImages"
            >
              + 添加当前游戏画面为图片
            </button>

            <p class="mb-2 text-[14px] font-medium text-black/80">附件上传</p>
            <button
              type="button"
              class="flex h-24 w-full max-w-xs flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-black/20 bg-black/[0.02] transition hover:border-[#2b7cff]/50"
              @click="attachmentInputRef?.click()"
            >
              <svg
                class="size-8 text-black/35"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linejoin="round"
                  d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"
                />
                <path
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  d="M14 2v6h6M12 18v-6M9 15h6"
                />
              </svg>
              <span class="text-[13px] text-black/50">
                {{
                  attachmentFile ? attachmentFile.name : "点击上传文件"
                }}
              </span>
            </button>
            <input
              ref="attachmentInputRef"
              type="file"
              class="sr-only"
              @change="onPickAttachment"
            />
            <button
              v-if="attachmentFile"
              type="button"
              class="mt-2 text-[13px] text-red-600 hover:underline"
              @click="clearAttachment"
            >
              移除附件
            </button>
          </div>

          <footer
            class="shrink-0 border-t border-black/10 px-5 py-4"
          >
            <p
              v-if="lastSubmitTime"
              class="mb-3 text-right text-[12px] text-black/45"
            >
              上次提交时间：{{ lastSubmitTime }}
            </p>
            <div class="flex justify-end">
              <button
                type="button"
                class="inline-flex min-w-[8rem] items-center justify-center gap-2 rounded-xl bg-[#2b7cff] px-6 py-3 text-[15px] font-medium text-white shadow-md transition hover:bg-[#1f6ae6]"
                @click="handleSubmitForm"
              >
                <svg
                  class="size-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"
                  />
                </svg>
                提交
              </button>
            </div>
          </footer>
        </aside>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.drawer-backdrop-enter-active,
.drawer-backdrop-leave-active {
  transition: opacity 0.2s ease;
}
.drawer-backdrop-enter-from,
.drawer-backdrop-leave-to {
  opacity: 0;
}
.drawer-panel-enter-active,
.drawer-panel-leave-active {
  transition: transform 0.3s cubic-bezier(0.32, 0.72, 0, 1);
}
.drawer-panel-enter-from,
.drawer-panel-leave-to {
  transform: translateX(100%);
}
</style>
