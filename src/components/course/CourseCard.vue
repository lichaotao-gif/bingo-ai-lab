<script setup lang="ts">
defineProps<{
  title: string;
  imageSrc: string;
  imageAlt?: string;
}>();

const emit = defineEmits<{
  click: [];
}>();
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
        :src="imageSrc"
        :alt="imageAlt ?? title"
        class="aspect-[300/169] w-full object-cover"
        loading="lazy"
        decoding="async"
        referrerpolicy="no-referrer"
      />
    </div>
    <h3
      class="mt-3 text-[17px] font-medium leading-snug text-black group-hover:text-primary"
    >
      {{ title }}
    </h3>
  </article>
</template>
