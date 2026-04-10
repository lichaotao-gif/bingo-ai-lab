<script setup lang="ts">
import { useRouter } from "vue-router";
import LogoMark from "@/components/brand/LogoMark.vue";

const router = useRouter();

function enterDemo() {
  void router.push({ name: "my-lab" });
}
</script>

<template>
  <div
    class="flex h-full min-h-0 flex-col items-center justify-center overflow-y-auto bg-page px-4 py-12"
  >
    <div
      class="w-full max-w-[420px] rounded-panel bg-surface p-8 shadow-card"
    >
      <div class="mb-8 flex flex-col items-center gap-3">
        <div class="h-14 w-14 shrink-0">
          <LogoMark />
        </div>
        <h1 class="text-xl font-semibold text-fg">缤果AI实验室</h1>
        <p class="text-center text-[14px] text-fg-muted">手机号登录（演示）</p>
      </div>
      <label class="mb-2 block text-[14px] text-fg-soft">手机号</label>
      <input
        type="tel"
        placeholder="请输入手机号"
        class="mb-4 w-full rounded-[8px] border border-border-subtle bg-card-inner px-3 py-2.5 text-[14px] outline-none ring-primary focus:ring-2"
      />
      <label class="mb-2 block text-[14px] text-fg-soft">验证码</label>
      <div class="mb-6 flex gap-2">
        <input
          type="text"
          placeholder="验证码"
          class="min-w-0 flex-1 rounded-[8px] border border-border-subtle bg-card-inner px-3 py-2.5 text-[14px] outline-none ring-primary focus:ring-2"
        />
        <button
          type="button"
          class="shrink-0 rounded-[8px] bg-primary-muted px-3 text-[14px] text-primary"
        >
          获取验证码
        </button>
      </div>
      <button
        type="button"
        class="w-full rounded-[8px] bg-primary py-3 text-[15px] text-white shadow-card transition hover:opacity-95"
        @click="enterDemo"
      >
        进入实验平台
      </button>
      <p class="mt-4 text-center text-[12px] text-fg-muted">
        演示环境可直接进入，无需真实验证
      </p>
    </div>
  </div>
</template>
