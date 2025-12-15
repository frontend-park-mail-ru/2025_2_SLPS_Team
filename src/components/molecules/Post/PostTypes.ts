export interface Author {
  id: number | null;
  fullName: string;
  avatarPath: string | null;
  [k: string]: any;
}

export interface Post {
  id: number;
  text?: string;
  photos?: string[];
  imagePath?: string;
  authorID?: number | null;
  authorName?: string;
  author_name?: string;
  authorAvatar?: string | null;
  author_avatar?: string | null;
  author?: Partial<Author> | null;
  communityID?: number | null;
  communityId?: number | null;
  communityName?: string | null;
  community_name?: string | null;
  communityAvatar?: string | null;
  community_avatar?: string | null;
  likes?: number;
  likeCount?: number;
  like_count?: number;
  comments?: number;
  commentsCount?: number;
  comment_count?: number;
  reposts?: number;
  repostCount?: number;
  repost_count?: number;
  isLiked?: boolean;
  post?: Post;
  [k: string]: any;
}

interface LikePayload {
  postId: number;
  isLiked: boolean;
  likeCount: number;
}