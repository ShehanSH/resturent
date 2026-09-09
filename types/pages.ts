/** Next.js 16 passes params and searchParams as Promises. */
export type PageSearchParams = Promise<Record<string, string | string[] | undefined>>;

export type AsyncPageProps<TParams extends Record<string, string> = Record<string, never>> = {
  params: Promise<TParams>;
  searchParams: PageSearchParams;
};
