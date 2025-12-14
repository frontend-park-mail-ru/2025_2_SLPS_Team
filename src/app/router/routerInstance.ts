export type RouterLike = {
  handleRoute: () => Promise<void> | void;
};

export const routerInstance: {
  current: RouterLike | null;
} = {
  current: null,
};
