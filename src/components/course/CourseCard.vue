<script setup lang="ts">
import { ref, watch } from "vue";

const props = defineProps<{
  title: string;
  imageSrc: string;
  imageAlt?: string;
}>();

const emit = defineEmits<{
  click: [];
}>();

const displaySrc = ref(props.imageSrc);
const fallbackCover = `${(import.meta.env.BASE_URL || "/").replace(/\/?$/, "/")}covers/ai-01.svg`;

watch(
  () => props.imageSrc,
  (v) => {
    displaySrc.value = v;
  },
);

function onImgError() {
  if (displaySrc.value !== fallbackCover) {
    displaySrc.value = fallbackCover;
  }
}
</script>

<template>
  <article
    class="group cursor-pointer rounded-2xl border border-border-subtle bg-card-inner p-3.5 shadow-card transition hover:shadow-md"
    role="button"
    tabindex="0"
    @click="emit('click')"
    @keydown.enter="emit('click')"
  >
    <div class="overflow-hidden rounded-xl bg-white">
      <img
        :src="displaySrc"
        :alt="imageAlt ?? title"
        class="aspect-[300/169] w-full object-cover bg-slate-100"
        loading="lazy"
        decoding="async"
        referrerpolicy="no-referrer"
        @error="onImgError"
      />
    </div>
    <h3
      class="mt-3 text-[17px] font-medium leading-snug text-black group-hover:text-primary"
    >
      {{ title }}
    </h3>
  </article>
</template>
