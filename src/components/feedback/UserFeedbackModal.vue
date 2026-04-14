<script setup lang="ts">
import { onUnmounted, ref, watch } from "vue";
import { RouterLink } from "vue-router";

const props = defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  "update:open": [boolean];
}>();

const text = ref("");
type FilePreview = { file: File; url: string };
const images = ref<FilePreview[]>([]);

function revokeAll() {
  for (const x of images.value) {
    URL.revokeObjectURL(x.url);
  }
  images.value = [];
}

function reset() {
  text.value = "";
  revokeAll();
}

watch(
  () => props.open,
  (v) => {
    if (!v) {
      reset();
    }
  },
);

onUnmounted(() => {
  revokeAll();
});

function close() {
  emit("update:open", false);
}

function onBackdropClick() {
  close();
}

function onFileInput(e: Event) {
  const input = e.target as HTMLInputElement;
  const list = input.files;
  if (!list?.length) {
    return;
  }
  for (let i = 0; i < list.length; i++) {
    const file = list.item(i)!;
    if (!file.type.startsWith("image/")) {
      continue;
    }
    images.value.push({ file, url: URL.createObjectURL(file) });
  }
  input.value = "";
}

function removeImage(i: number) {
  const x = images.value[i];
  if (!x) {
    return;
  }
  URL.revokeObjectURL(x.url);
  images.value.splice(i, 1);
}

function submit() {
  const t = text.value.trim();
  if (!t && images.value.length === 0) {
    window.alert("请填写反馈内容或上传截图");
    return;
  }
  const preview =
    t.length > 200 ? `${t.slice(0, 200)}…` : t || "（无文字）";
  window.alert(
    `反馈已记录（演示）\n\n${preview}\n\n图片：${images.value.length} 张\n\n对接接口后可提交到服务端。`,
  );
  close();
}
</script>

<template>
  <Teleport to="body">
    <Transition name="feedback-fade">
      <div
        v-if="open"
        class="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="feedback-dialog-title"
      >
        <div
          class="absolute inset-0 bg-black/45 backdrop-blur-[1px]"
          aria-hidden="true"
          @click="onBackdropClick"
        />
        <div
          class="relative z-10 flex max-h-[min(90dvh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border-subtle bg-surface shadow-popover"
          @click.stop
        >
          <div
            class="flex shrink-0 items-center justify-between border-b border-border-subtle px-5 py-4"
          >
            <h2
              id="feedback-dialog-title"
              class="text-[18px] font-semibold text-black sm:text-[20px]"
            >
              用户反馈
            </h2>
            <button
              type="button"
              class="rounded-lg p-2 text-fg-muted transition hover:bg-card-inner hover:text-black"
              aria-label="关闭"
              @click="close"
            >
              <svg
                class="size-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                aria-hidden="true"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div class="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            <label class="block text-[13px] font-medium text-fg-soft">
              问题描述
            </label>
            <textarea
              v-model="text"
              rows="5"
              class="mt-2 w-full resize-y rounded-xl border border-border-subtle bg-white px-3 py-2.5 text-[15px] leading-relaxed text-black outline-none ring-primary/0 transition placeholder:text-fg-muted focus:border-primary/40 focus:ring-2 focus:ring-primary/25"
              placeholder="请描述遇到的问题、建议或期望…"
            />

            <div class="mt-5">
              <p class="text-[13px] font-medium text-fg-soft">图片附件</p>
              <p class="mt-1 text-[12px] text-fg-muted">
                支持上传截图，可多选（演示为本地预览，提交后对接服务端）
              </p>
              <div class="mt-3 flex flex-wrap items-center gap-3">
                <label
                  class="inline-flex cursor-pointer items-center gap-2 rounded-xl border-2 border-dashed border-border-subtle bg-card-inner px-4 py-3 text-[14px] font-medium text-primary transition hover:border-primary/35 hover:bg-primary/[0.04]"
                >
                  <svg
                    class="size-5 shrink-0"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    aria-hidden="true"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14"
                    />
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M4 20h16a1 1 0 001-1V7a1 1 0 00-1-1h-5l-2-2H5a1 1 0 00-1 1v15a1 1 0 001 1z"
                    />
                  </svg>
                  选择图片
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    class="sr-only"
                    @change="onFileInput"
                  />
                </label>
              </div>

              <ul
                v-if="images.length > 0"
                class="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3"
              >
                <li
                  v-for="(img, i) in images"
                  :key="img.url"
                  class="relative aspect-video overflow-hidden rounded-lg border border-border-subtle bg-slate-100"
                >
                  <img
                    :src="img.url"
                    :alt="img.file.name"
                    class="size-full object-cover"
                  />
                  <button
                    type="button"
                    class="absolute right-1.5 top-1.5 flex size-7 items-center justify-center rounded-full bg-black/55 text-white shadow-md transition hover:bg-black/70"
                    :aria-label="`移除 ${img.file.name}`"
                    @click="removeImage(i)"
                  >
                    <svg
                      class="size-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </li>
              </ul>
            </div>
          </div>

          <div
            class="shrink-0 border-t border-border-subtle bg-card-inner/40 px-5 py-4"
          >
            <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <RouterLink
                to="/settings"
                class="order-2 text-center text-[13px] text-fg-muted underline-offset-2 transition hover:text-primary sm:order-1 sm:text-left"
                @click="close"
              >
                账号与偏好设置
              </RouterLink>
              <div class="order-1 flex gap-2 sm:order-2">
                <button
                  type="button"
                  class="flex-1 rounded-xl border border-border-subtle bg-white px-4 py-2.5 text-[14px] font-medium text-fg-soft transition hover:bg-card-inner sm:flex-none"
                  @click="close"
                >
                  取消
                </button>
                <button
                  type="button"
                  class="flex-1 rounded-xl bg-primary px-4 py-2.5 text-[14px] font-medium text-white shadow-md shadow-primary/20 transition hover:opacity-95 sm:flex-none sm:min-w-[100px]"
                  @click="submit"
                >
                  提交
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.feedback-fade-enter-active,
.feedback-fade-leave-active {
  transition: opacity 0.2s ease;
}
.feedback-fade-enter-active .relative.z-10,
.feedback-fade-leave-active .relative.z-10 {
  transition:
    transform 0.22s cubic-bezier(0.34, 1.1, 0.64, 1),
    opacity 0.2s ease;
}
.feedback-fade-enter-from,
.feedback-fade-leave-to {
  opacity: 0;
}
.feedback-fade-enter-from .relative.z-10,
.feedback-fade-leave-to .relative.z-10 {
  transform: scale(0.96) translateY(8px);
  opacity: 0.9;
}
</style>
