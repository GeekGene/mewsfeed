import { useQueryClient } from "@tanstack/vue-query";
import { FeedMew } from "@/types/types";
import { encodeHashToBase64 } from "@holochain/client";

/**
 * Returns a function that patches a single FeedMew in a vue-query cache
 * without triggering a zome refetch. Works with both useInfiniteQuery
 * (pages of FeedMew[]) and useQuery (FeedMew[]) data shapes.
 */
export function usePatchFeedMew() {
  const queryClient = useQueryClient();

  const patchFeedMew = (queryKey: unknown[], updatedMew: FeedMew) => {
    const targetHash = encodeHashToBase64(updatedMew.action_hash);

    // Try infinite query shape: { pages: FeedMew[][], pageParams: ... }
    queryClient.setQueryData(queryKey, (old: any) => {
      if (!old) return old;

      if (old.pages) {
        return {
          ...old,
          pages: old.pages.map((page: FeedMew[]) =>
            page.map((mew) =>
              encodeHashToBase64(mew.action_hash) === targetHash
                ? updatedMew
                : mew
            )
          ),
        };
      }

      // Plain array shape: FeedMew[]
      if (Array.isArray(old)) {
        return old.map((mew: FeedMew) =>
          encodeHashToBase64(mew.action_hash) === targetHash
            ? updatedMew
            : mew
        );
      }

      return old;
    });
  };

  return { patchFeedMew };
}
