import {
  INITIAL_MEMBERS_BY_GROUP,
  type GroupMember,
} from "@/data/groupMembers";

const KEY = "bingo-lab-group-members";

function cloneInitialMembers(): Record<string, GroupMember[]> {
  return structuredClone(INITIAL_MEMBERS_BY_GROUP);
}

export function loadGroupMembersByGroup(): Record<string, GroupMember[]> {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      return cloneInitialMembers();
    }
    const parsed = JSON.parse(raw) as Record<string, GroupMember[]>;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return cloneInitialMembers();
    }
    return {
      ...cloneInitialMembers(),
      ...parsed,
    };
  } catch {
    return cloneInitialMembers();
  }
}

export function saveGroupMembersByGroup(
  membersByGroup: Record<string, GroupMember[]>,
): void {
  localStorage.setItem(KEY, JSON.stringify(membersByGroup));
}

export function removeGroupMember(groupId: string, memberId: string): void {
  const next = loadGroupMembersByGroup();
  next[groupId] = (next[groupId] ?? []).filter((m) => m.id !== memberId);
  saveGroupMembersByGroup(next);
}
