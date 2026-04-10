<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";
import CourseCard from "@/components/course/CourseCard.vue";
import IconRobot from "@/components/icons/IconRobot.vue";
import { AI_COVER_IMAGES, shuffleCovers } from "@/constants/aiCoverImages";

const router = useRouter();

const grades = [
  "一年级（上）",
  "二年级（上）",
  "三年级（上）",
  "四年级（上）",
  "五年级（上）",
  "六年级（上）",
];

/** 每次进入页面随机打乱封面与年级对应 */
const covers = shuffleCovers(AI_COVER_IMAGES);

const courses = computed(() =>
  grades.map((title, i) => ({
    title,
    img: covers[i % covers.length],
  })),
);

function openGradePack(i: number) {
  void router.push({
    name: "grade-experiments",
    params: { gradeId: String(i) },
  });
}
</script>

<template>
  <section class="flex flex-col gap-6">
    <header class="flex items-center gap-2">
      <span
        class="flex size-9 items-center justify-center rounded-full bg-primary-muted text-primary"
      >
        <IconRobot class="size-[19px]" />
      </span>
      <h1 class="text-[22px] font-normal text-black">AI实验室</h1>
    </header>

    <div
      class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
    >
      <CourseCard
        v-for="(c, i) in courses"
        :key="c.title"
        :title="c.title"
        :image-src="c.img"
        @click="openGradePack(i)"
      />
    </div>
  </section>
</template>
