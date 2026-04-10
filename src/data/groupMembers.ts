export type MemberRole = "admin" | "member";

export interface GroupMember {
  id: string;
  name: string;
  avatar: string;
  role: MemberRole;
}

/** 各实验组成员（演示数据，头像为 Dicebear） */
export const INITIAL_MEMBERS_BY_GROUP: Record<string, GroupMember[]> = {
  "ai-group": [
    {
      id: "m1",
      name: "李超涛",
      role: "admin",
      avatar:
        "https://api.dicebear.com/9.x/avataaars/svg?seed=lichaotao&backgroundColor=b6e3f4",
    },
    {
      id: "m2",
      name: "邓老师",
      role: "member",
      avatar:
        "https://api.dicebear.com/9.x/avataaars/svg?seed=dengls&backgroundColor=ffd5dc",
    },
  ],
  "grade3-2": [
    {
      id: "m1",
      name: "李超涛",
      role: "admin",
      avatar:
        "https://api.dicebear.com/9.x/avataaars/svg?seed=lichaotao&backgroundColor=b6e3f4",
    },
    {
      id: "m3",
      name: "王老师",
      role: "member",
      avatar:
        "https://api.dicebear.com/9.x/avataaars/svg?seed=wang&backgroundColor=c0aede",
    },
  ],
  "ai-class-1": [
    {
      id: "m1",
      name: "李超涛",
      role: "admin",
      avatar:
        "https://api.dicebear.com/9.x/avataaars/svg?seed=lichaotao&backgroundColor=b6e3f4",
    },
    {
      id: "m4",
      name: "张老师",
      role: "member",
      avatar:
        "https://api.dicebear.com/9.x/avataaars/svg?seed=zhang&backgroundColor=ffdfbf",
    },
    {
      id: "m5",
      name: "刘同学",
      role: "member",
      avatar:
        "https://api.dicebear.com/9.x/avataaars/svg?seed=liu&backgroundColor=d1d4f9",
    },
  ],
};
