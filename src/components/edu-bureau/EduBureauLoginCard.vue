<script setup lang="ts">
import { onUnmounted, ref } from "vue";
import {
  EDU_BUREAU_DEMO_CODE,
  EDU_BUREAU_DEMO_PASSWORD,
  EDU_BUREAU_DEMO_PHONE,
  setEduBureauSession,
  validateCodeLogin,
  validatePasswordLogin,
} from "@/utils/eduBureauAuth";

const emit = defineEmits<{
  success: [];
  close: [];
}>();

const mode = ref<"password" | "code">("password");
const phone = ref(EDU_BUREAU_DEMO_PHONE);
const password = ref(EDU_BUREAU_DEMO_PASSWORD);
const code = ref(EDU_BUREAU_DEMO_CODE);
const error = ref("");
const codeSending = ref(false);
const codeCooldown = ref(0);

let timer: ReturnType<typeof setInterval> | null = null;

function sendCode() {
  if (codeCooldown.value > 0 || codeSending.value) {
    return;
  }
  if (!/^1[3-9]\d{9}$/.test(phone.value.trim())) {
    error.value = "请先填写正确的 11 位手机号";
    return;
  }
  error.value = "";
  codeSending.value = true;
  window.setTimeout(() => {
    codeSending.value = false;
    codeCooldown.value = 60;
    timer = setInterval(() => {
      codeCooldown.value -= 1;
      if (codeCooldown.value <= 0 && timer) {
        clearInterval(timer);
        timer = null;
      }
    }, 1000);
    window.alert(`验证码已发送：${EDU_BUREAU_DEMO_CODE}`);
  }, 400);
}

function submit() {
  error.value = "";
  const p = phone.value.trim();
  if (!/^1[3-9]\d{9}$/.test(p)) {
    error.value = "请输入正确的 11 位手机号";
    return;
  }
  if (mode.value === "password") {
    if (!validatePasswordLogin(p, password.value)) {
      error.value = `手机号或密码错误（默认密码：${EDU_BUREAU_DEMO_PASSWORD}）`;
      return;
    }
  } else {
    if (!validateCodeLogin(p, code.value)) {
      error.value = `手机号或验证码错误（默认验证码：${EDU_BUREAU_DEMO_CODE}）`;
      return;
    }
  }
  setEduBureauSession({
    phone: p,
    displayName: "区域管理员",
    loggedInAt: new Date().toISOString(),
  });
  emit("success");
}

function onClose() {
  emit("close");
}

onUnmounted(() => {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
});
</script>

<template>
  <div
    class="relative mx-auto w-full max-w-[420px] rounded-2xl border border-border-subtle bg-white shadow-card"
    role="document"
    @click.stop
  >
    <button
      type="button"
      class="absolute right-3 top-3 flex size-9 items-center justify-center rounded-full text-black/40 transition hover:bg-slate-100 hover:text-black"
      aria-label="关闭"
      @click="onClose"
    >
      <span class="text-2xl leading-none" aria-hidden="true">×</span>
    </button>

    <div class="p-6 pt-12 sm:p-8 sm:pt-14">
      <div class="mb-6 pr-6 text-center sm:pr-8">
        <h2
          id="edu-bureau-login-heading"
          class="text-xl font-semibold tracking-tight text-black"
        >
          管理员登录
        </h2>
        <p class="mt-1.5 text-[13px] text-fg-muted">
          使用「账号密码」或「验证码」登录后查看管辖范围数据
        </p>
      </div>

      <div
        class="mb-5 flex rounded-xl border border-border-subtle bg-slate-50/80 p-1"
        role="tablist"
        aria-labelledby="edu-bureau-login-heading"
      >
        <button
          type="button"
          role="tab"
          :aria-selected="mode === 'password'"
          class="flex-1 rounded-lg py-2.5 text-[13px] font-medium transition sm:text-[14px]"
          :class="
            mode === 'password'
              ? 'bg-white text-primary shadow-sm'
              : 'text-fg-muted hover:text-fg-soft'
          "
          @click="mode = 'password'"
        >
          账号密码登录
        </button>
        <button
          type="button"
          role="tab"
          :aria-selected="mode === 'code'"
          class="flex-1 rounded-lg py-2.5 text-[13px] font-medium transition sm:text-[14px]"
          :class="
            mode === 'code'
              ? 'bg-white text-primary shadow-sm'
              : 'text-fg-muted hover:text-fg-soft'
          "
          @click="mode = 'code'"
        >
          验证码登录
        </button>
      </div>

      <label class="mb-1.5 block text-[13px] font-medium text-fg-soft"
        >手机号</label
      >
      <input
        v-model="phone"
        type="tel"
        maxlength="11"
        autocomplete="tel"
        placeholder="11 位手机号"
        class="mb-4 w-full rounded-xl border border-border-subtle bg-card-inner px-3 py-2.5 text-[14px] outline-none ring-primary focus:ring-2"
      />

      <template v-if="mode === 'password'">
        <label class="mb-1.5 block text-[13px] font-medium text-fg-soft"
          >密码</label
        >
        <input
          v-model="password"
          type="password"
          autocomplete="current-password"
          placeholder="请输入密码"
          class="mb-4 w-full rounded-xl border border-border-subtle bg-card-inner px-3 py-2.5 text-[14px] outline-none ring-primary focus:ring-2"
          @keydown.enter="submit"
        />
      </template>

      <template v-else>
        <label class="mb-1.5 block text-[13px] font-medium text-fg-soft"
          >验证码</label
        >
        <div class="mb-4 flex gap-2">
          <input
            v-model="code"
            type="text"
            maxlength="6"
            inputmode="numeric"
            placeholder="6 位验证码"
            class="min-w-0 flex-1 rounded-xl border border-border-subtle bg-card-inner px-3 py-2.5 text-[14px] outline-none ring-primary focus:ring-2"
            @keydown.enter="submit"
          />
          <button
            type="button"
            class="shrink-0 rounded-xl border border-primary/30 bg-primary-muted px-3 text-[13px] font-medium text-primary transition enabled:hover:bg-primary/10 disabled:opacity-45"
            :disabled="codeCooldown > 0 || codeSending"
            @click="sendCode"
          >
            {{
              codeCooldown > 0 ? `${codeCooldown}s 后重发` : "获取验证码"
            }}
          </button>
        </div>
      </template>

      <p
        v-if="error"
        class="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-[13px] text-rose-700"
      >
        {{ error }}
      </p>

      <button
        type="button"
        class="w-full rounded-xl bg-gradient-to-r from-slate-800 to-slate-700 py-3 text-[15px] font-medium text-white shadow-md transition hover:opacity-95"
        @click="submit"
      >
        登录
      </button>

      <p class="mt-4 text-center text-[12px] leading-relaxed text-fg-muted">
        已预填手机号与密码/验证码，可直接点击「登录」
      </p>
    </div>
  </div>
</template>
