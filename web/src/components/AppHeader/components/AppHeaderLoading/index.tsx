export const AppHeaderLoading = () => {
  return (
    <>
      <div className="hidden flex-col bg-zinc-900 md:flex">
        <div className="border-b border-b-black">
          <div className="flex h-16 items-center justify-between px-4">
            <div className="h-10 w-10 animate-pulse rounded-full bg-zinc-700"></div>
            <div className="flex w-full max-w-sm items-center space-x-2">
              <div className="h-9 w-full animate-pulse rounded-lg bg-zinc-700"></div>
              <div className="h-9 w-9 animate-pulse rounded-lg bg-zinc-700"></div>
            </div>
            <div className="mx-6 flex items-center space-x-4">
              <div className="h-10 w-24 animate-pulse rounded-lg bg-zinc-700"></div>
              <div className="h-9 w-9 animate-pulse rounded-lg bg-zinc-700"></div>
              <div className="h-9 w-9 animate-pulse rounded-full bg-zinc-700"></div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
