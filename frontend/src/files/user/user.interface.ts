export interface IUser {
  id: string;
  clerkId: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  preferredLang: string;
  createdAt: string;
  updatedAt: string;
}

export interface IProfileData {
  user: IUser;
  isNew: boolean;
}

export interface IUpdateMeRequest {
  displayName?: string;
  preferredLang?: string;
}

export interface IUserSearchData {
  items: IUser[];
  nextCursor: string | null;
}
