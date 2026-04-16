<script setup lang="ts">
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import GroupPanel from "@/components/lab/GroupPanel.vue";
import ExperimentFab from "@/components/lab/ExperimentFab.vue";
import ExperimentGroupFormModal from "@/components/lab/ExperimentGroupFormModal.vue";
import CourseCard from "@/components/course/CourseCard.vue";
import AddExperimentPackageModal from "@/components/lab/AddExperimentPackageModal.vue";
import GroupMembersModal from "@/components/lab/GroupMembersModal.vue";
import AiExperimentManageModal from "@/components/lab/AiExperimentManageModal.vue";
import {
  LAB_PACKAGE_OPTIONS,
  type LabPackageOption,
  type PackageApplicationTimeId,
  type PackageApplicationTimeSelectId,
} from "@/data/labPackages";
import {
  type GroupMember,
} from "@/data/groupMembers";
import {
  loadGroupMembersByGroup,
  removeGroupMember,
} from "@/utils/groupMembersStorage";

const router = useRouter();

/** 班级 id → 展示名 */
const GROUP_TITLES: Record<string, string> = {
  "ai-group": "AI实验小组",
  "grade3-2": "三年级二班",
  "ai-class-1": "人工智能1班",
};

const modalOpen = ref(false);
const modalClassId = ref<string | null>(null);

const modalClassTitle = computed(() =>
  modalClassId.value ? (GROUP_TITLES[modalClassId.value] ?? "") : "",
);

/** 各班级已添加的实验包 id（演示状态，可对接接口） */
const addedByClass = ref<Record<string, string[]>>({
  "ai-group": ["pkg-demo-g2"],
  "grade3-2": [],
  "ai-class-1": ["pkg-demo-g2"],
});

/** 各班级下每个实验包的应用时间（与 addedByClass 对应） */
const packageApplicationTimeByClass = ref<
  Record<string, Record<string, PackageApplicationTimeId>>
>({
  "ai-group": { "pkg-demo-g2": "unlimited" },
  "grade3-2": {},
  "ai-class-1": { "pkg-demo-g2": "unlimited" },
});

function resolvedPackages(classId: string): LabPackageOption[] {
  const ids = addedByClass.value[classId] ?? [];
  return ids
    .map((id) => LAB_PACKAGE_OPTIONS.find((p) => p.id === id))
    .filter((x): x is LabPackageOption => x != null);
}

function openAddModal(classId: string) {
  modalClassId.value = classId;
  modalOpen.value = true;
}

function onAddPackage(payload: {
  classId: string;
  packageId: string;
  applicationTimeId: PackageApplicationTimeId;
}) {
  const { classId, packageId, applicationTimeId } = payload;
  const next = { ...addedByClass.value };
  const arr = [...(next[classId] ?? [])];
  if (!arr.includes(packageId)) {
    arr.push(packageId);
  }
  next[classId] = arr;
  addedByClass.value = next;

  const metaNext = { ...packageApplicationTimeByClass.value };
  const row = { ...(metaNext[classId] ?? {}) };
  row[packageId] = applicationTimeId;
  metaNext[classId] = row;
  packageApplicationTimeByClass.value = metaNext;
}

const membersModalOpen = ref(false);
const membersGroupId = ref<string | null>(null);

const membersByGroup = ref<Record<string, GroupMember[]>>(
  loadGroupMembersByGroup(),
);

const membersModalTitle = computed(() =>
  membersGroupId.value ? (GROUP_TITLES[membersGroupId.value] ?? "") : "",
);

const membersModalList = computed((): GroupMember[] => {
  const id = membersGroupId.value;
  if (!id) {
    return [];
  }
  return membersByGroup.value[id] ?? [];
});

/** 群组成员「查看统计」时带入年级/包，与班级已添加的首个实验包一致 */
const membersStatsQuery = computed((): Record<string, string> => {
  const id = membersGroupId.value;
  if (!id) {
    return {};
  }
  const pkgs = resolvedPackages(id);
  const first = pkgs[0];
  if (!first) {
    return { grade: "0" };
  }
  return {
    pkg: first.id,
    grade: String(first.gradeRouteIndex),
  };
});

function openMembersModal(groupId: string) {
  membersGroupId.value = groupId;
  membersModalOpen.value = true;
}

function onDeleteGroupMember(memberId: string) {
  const gid = membersGroupId.value;
  if (!gid) {
    return;
  }
  removeGroupMember(gid, memberId);
  membersByGroup.value = loadGroupMembersByGroup();
}

function onRenameGroup() {
  window.alert("修改群组名称（演示）");
}

const manageModalOpen = ref(false);
const manageGroupId = ref<string | null>(null);

const manageModalPackages = computed((): LabPackageOption[] => {
  const id = manageGroupId.value;
  if (!id) {
    return [];
  }
  return resolvedPackages(id);
});

function onAiExperimentManage(groupId: string) {
  manageGroupId.value = groupId;
  manageModalOpen.value = true;
}

function onRemovePackageFromManage(payload: {
  groupId: string;
  packageId: string;
}) {
  const { groupId, packageId } = payload;
  const next = { ...addedByClass.value };
  next[groupId] = (next[groupId] ?? []).filter((id) => id !== packageId);
  addedByClass.value = next;

  const metaNext = { ...packageApplicationTimeByClass.value };
  const row = { ...(metaNext[groupId] ?? {}) };
  delete row[packageId];
  metaNext[groupId] = row;
  packageApplicationTimeByClass.value = metaNext;
}

const manageModalApplicationTimeIds = computed((): Record<
  string,
  PackageApplicationTimeId
> => {
  const gid = manageGroupId.value;
  if (!gid) {
    return {};
  }
  return { ...(packageApplicationTimeByClass.value[gid] ?? {}) };
});

function onUpdateApplicationTimeFromManage(payload: {
  groupId: string;
  packageId: string;
  applicationTimeId: PackageApplicationTimeSelectId;
}) {
  const { groupId, packageId, applicationTimeId } = payload;
  const metaNext = { ...packageApplicationTimeByClass.value };
  const row = { ...(metaNext[groupId] ?? {}) };
  row[packageId] = applicationTimeId;
  metaNext[groupId] = row;
  packageApplicationTimeByClass.value = metaNext;
}

function onDissolveGroup(groupId: string) {
  const name = GROUP_TITLES[groupId] ?? groupId;
  if (!window.confirm(`确定要解散「${name}」实验组吗？（演示，不会真实删除数据）`)) {
    return;
  }
  window.alert("已执行解散（演示）");
}

const joinGroupModalOpen = ref(false);
const createGroupModalOpen = ref(false);

function onJoinGroupConfirm(code: string) {
  if (!code) {
    window.alert("请输入实验组邀请码");
    return;
  }
  window.alert(`已提交邀请码（演示）：${code}`);
}

function onCreateGroupConfirm(name: string) {
  if (!name) {
    window.alert("请输入实验组名");
    return;
  }
  window.alert(`已创建实验组（演示）：${name}`);
}

/** 与 AI 实验室大厅进入的实验列表为同一路由与同一套列表数据 */
function openExperimentPackageDetail(pkg: LabPackageOption, groupId: string) {
  manageModalOpen.value = false;
  void router.push({
    name: "grade-experiments",
    params: { gradeId: String(pkg.gradeRouteIndex) },
    query: { from: "my-lab", pkg: pkg.id, group: groupId },
  });
}
</script>

<template>
  <div class="relative pb-24">
    <header class="mb-6 lg:mb-8">
      <h1 class="text-[22px] font-semibold tracking-tight text-black/90 lg:text-[24px]">
        我的 AI 实验
      </h1>
    </header>
    <div class="flex flex-col gap-8">
      <GroupPanel
        title="AI实验小组"
        group-id="ai-group"
        show-admin
        show-add-experiment
        @add-experiment="openAddModal"
        @open-members="openMembersModal"
        @ai-experiment-manage="onAiExperimentManage"
        @dissolve-group="onDissolveGroup"
      >
        <div
          class="grid max-w-full gap-3 sm:grid-cols-2 lg:max-w-3xl"
        >
          <div
            v-for="pkg in resolvedPackages('ai-group')"
            :key="pkg.id"
            class="max-w-sm"
          >
            <CourseCard
              :title="pkg.title"
              :image-src="pkg.cover"
              image-alt="实验封面"
              @click="openExperimentPackageDetail(pkg, 'ai-group')"
            />
          </div>
        </div>
      </GroupPanel>

      <GroupPanel
        title="三年级二班"
        group-id="grade3-2"
        show-admin
        show-add-experiment
        @add-experiment="openAddModal"
        @open-members="openMembersModal"
        @ai-experiment-manage="onAiExperimentManage"
        @dissolve-group="onDissolveGroup"
      >
        <div
          v-if="resolvedPackages('grade3-2').length === 0"
          class="flex min-h-[220px] flex-col items-center justify-center gap-5 py-6"
        >
          <p class="text-center text-[15px] text-fg-muted">
            将AI实验添加到该班级群
          </p>
          <button
            type="button"
            class="rounded-xl bg-primary px-8 py-3 text-[15px] font-medium text-white shadow-md shadow-primary/20 transition hover:opacity-95"
            @click="openAddModal('grade3-2')"
          >
            + 添加实验
          </button>
        </div>
        <div
          v-else
          class="grid max-w-full gap-3 sm:grid-cols-2 lg:max-w-3xl"
        >
          <div
            v-for="pkg in resolvedPackages('grade3-2')"
            :key="pkg.id"
            class="max-w-sm"
          >
            <CourseCard
              :title="pkg.title"
              :image-src="pkg.cover"
              image-alt="实验封面"
              @click="openExperimentPackageDetail(pkg, 'grade3-2')"
            />
          </div>
        </div>
      </GroupPanel>

      <GroupPanel
        title="人工智能1班"
        group-id="ai-class-1"
        :show-add-experiment="false"
        @open-members="openMembersModal"
        @ai-experiment-manage="onAiExperimentManage"
        @dissolve-group="onDissolveGroup"
      >
        <div class="grid max-w-full gap-3 sm:grid-cols-2 lg:max-w-3xl">
          <div
            v-for="pkg in resolvedPackages('ai-class-1')"
            :key="pkg.id"
            class="max-w-sm"
          >
            <CourseCard
              :title="pkg.title"
              :image-src="pkg.cover"
              image-alt="实验封面"
              @click="openExperimentPackageDetail(pkg, 'ai-class-1')"
            />
          </div>
        </div>
      </GroupPanel>
    </div>

    <ExperimentFab
      @join="joinGroupModalOpen = true"
      @create="createGroupModalOpen = true"
    />

    <ExperimentGroupFormModal
      v-model:open="joinGroupModalOpen"
      title="加入实验组"
      placeholder="请输入实验组邀请码"
      @confirm="onJoinGroupConfirm"
    />
    <ExperimentGroupFormModal
      v-model:open="createGroupModalOpen"
      title="创建实验组"
      placeholder="请输入实验组名"
      @confirm="onCreateGroupConfirm"
    />

    <AddExperimentPackageModal
      :open="modalOpen"
      :class-id="modalClassId"
      :class-title="modalClassTitle"
      :added-by-class="addedByClass"
      @update:open="modalOpen = $event"
      @add="onAddPackage"
    />

    <GroupMembersModal
      :open="membersModalOpen"
      :group-id="membersGroupId"
      :group-title="membersModalTitle"
      :members="membersModalList"
      :stats-query="membersStatsQuery"
      @update:open="membersModalOpen = $event"
      @delete-member="onDeleteGroupMember"
      @rename-group="onRenameGroup"
    />

    <AiExperimentManageModal
      :open="manageModalOpen"
      :group-id="manageGroupId"
      :packages="manageModalPackages"
      :application-time-id-by-package-id="manageModalApplicationTimeIds"
      @update:open="manageModalOpen = $event"
      @remove-package="onRemovePackageFromManage"
      @update-application-time="onUpdateApplicationTimeFromManage"
      @view-package-detail="
        (pkg) => openExperimentPackageDetail(pkg, manageGroupId || 'ai-group')
      "
    />
  </div>
</template>
