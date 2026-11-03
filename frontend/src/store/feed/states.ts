export type FeedTab = 'amigos' | 'todos' | string;

export type FeedPost = {
  id: number | string;
  [key: string]: unknown;
};

export type FeedState = {
  posts: FeedPost[];
  postsCarregados: boolean;
  loading: boolean;
  error: string | null;
  lastLoadTime: number | null;
  hasMore: boolean;
  offset: number;
  activeTab: FeedTab;
};

export const feedInitialStates: FeedState = {
  posts: [],
  postsCarregados: false,
  loading: false,
  error: null,
  lastLoadTime: null,
  hasMore: false,
  offset: 0,
  activeTab: 'amigos',
};
