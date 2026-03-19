<template>
  <div class="w-full">
    <BaseInfiniteScroll
      v-if="allHashes.length > 0"
      @load-next="fetchNextPageInfiniteScroll"
    >
      <div class="w-full">
        <template v-for="(slot, i) in mewSlots" :key="i">
          <BaseMewListItem
            v-if="slot.status === 'loaded'"
            :feed-mew="slot.feedMew"
            class="my-4"
            @mew-deleted="refetchBatchForIndex(i)"
            @mew-licked="refetchBatchForIndex(i)"
            @mew-pinned="refetchBatchForIndex(i)"
            @mew-unlicked="refetchBatchForIndex(i)"
            @mew-unpinned="refetchBatchForIndex(i)"
            @mewmew-created="refetchBatchForIndex(i)"
            @quote-created="refetchBatchForIndex(i)"
            @reply-created="refetchBatchForIndex(i)"
          />
          <div v-else-if="slot.status === 'failed'" class="my-4 px-4">
            <div
              class="bg-base-200 rounded-md p-3 text-base-content/50 italic text-sm"
            >
              Mew unavailable
            </div>
          </div>
          <BaseMewListItemSkeleton v-else class="my-4" />
          <hr
            v-if="i !== mewSlots.length - 1"
            class="border-base-300"
          />
        </template>
      </div>
    </BaseInfiniteScroll>
    <BaseListSkeleton v-else-if="isHashesLoading" :count="4">
      <BaseMewListItemSkeleton />
    </BaseListSkeleton>
    <BaseEmptyList v-else />
  </div>
</template>

<script setup lang="ts">
import { AppClient, ActionHash, encodeHashToBase64 } from "@holochain/client";
import { ComputedRef, computed, inject, watch, ref } from "vue";
import { useCellsReady } from "@/composables/useCellsReady";
import { FeedMew, PaginationDirectionName } from "@/types/types";
import {
  useInfiniteQuery,
  useQueries,
  useQueryClient,
} from "@tanstack/vue-query";
import { wrapInput } from "@/utils/zomeCall";
import BaseMewListItem from "@/components/BaseMewListItem.vue";
import BaseEmptyList from "@/components/BaseEmptyList.vue";
import BaseListSkeleton from "@/components/BaseListSkeleton.vue";
import BaseMewListItemSkeleton from "@/components/BaseMewListItemSkeleton.vue";
import BaseInfiniteScroll from "@/components/BaseInfiniteScroll.vue";
import { onBeforeRouteLeave } from "vue-router";

const client = (inject("client") as ComputedRef<AppClient>).value;
const cellsReady = useCellsReady();
const queryClient = useQueryClient();
const myPubKeyB64 = computed(() => encodeHashToBase64(client.myPubKey));
const pageLimit = 10;
const BATCH_SIZE = 5;

const hashFetchStart = ref<number>(0);

// Phase 1: Fetch just the hashes (fast, link queries only)
const fetchHashes = (params: any): Promise<ActionHash[]> => {
  hashFetchStart.value = performance.now();
  return client
    .callZome({
      role_name: "mewsfeed",
      zome_name: "mews",
      fn_name: "get_followed_creators_mew_hashes_extern",
      payload: wrapInput({
        agent: client.myPubKey,
        page: {
          limit: pageLimit,
          direction: PaginationDirectionName.Descending,
          ...params.pageParam,
        },
      }),
    })
    .then((result: ActionHash[]) => {
      console.log(
        `[progressive] get_followed_creators_mew_hashes: ${(performance.now() - hashFetchStart.value).toFixed(0)}ms, ${result.length} hashes`
      );
      return result;
    });
};

const {
  data: hashData,
  error: hashError,
  fetchNextPage,
  hasNextPage,
  isInitialLoading: isHashesLoading,
} = useInfiniteQuery<ActionHash[]>({
  queryKey: [
    "mews",
    "get_followed_creators_mew_hashes",
    myPubKeyB64,
  ],
  queryFn: fetchHashes,
  getNextPageParam: (lastPage) => {
    if (lastPage.length === 0) return;
    if (lastPage.length < pageLimit) return;
    return { after_hash: lastPage[lastPage.length - 1] };
  },
  refetchInterval: 1000 * 60 * 2,
  refetchOnMount: true,
  enabled: cellsReady,
});
watch(hashError, console.error);

// Flatten all hashes across pages
const allHashes = computed<ActionHash[]>(() => {
  if (!hashData.value?.pages) return [];
  return hashData.value.pages.flat();
});

// Split hashes into batches of BATCH_SIZE
const hashBatches = computed(() => {
  const batches: ActionHash[][] = [];
  const hashes = allHashes.value;
  for (let i = 0; i < hashes.length; i += BATCH_SIZE) {
    batches.push(hashes.slice(i, i + BATCH_SIZE));
  }
  return batches;
});

// Phase 2: Fetch context for each batch in parallel
const batchStartTimes = ref<Map<string, number>>(new Map());

const batchQueries = useQueries({
  queries: computed(() =>
    hashBatches.value.map((batch, batchIndex) => {
      const batchKey = batch
        .map((h) => encodeHashToBase64(h))
        .join(",");
      return {
        queryKey: [
          "mews",
          "get_batch_mews_with_context",
          batchKey,
        ],
        queryFn: async () => {
          const start = performance.now();
          batchStartTimes.value.set(batchKey, start);
          const result: FeedMew[] = await client.callZome({
            role_name: "mewsfeed",
            zome_name: "mews",
            fn_name: "get_batch_mews_with_context",
            payload: wrapInput(batch),
          });
          const elapsed = performance.now() - start;
          const totalElapsed = performance.now() - hashFetchStart.value;
          console.log(
            `[progressive] batch ${batchIndex} context: ${elapsed.toFixed(0)}ms (${result.length}/${batch.length} resolved), total elapsed: ${totalElapsed.toFixed(0)}ms`
          );
          return result;
        },
        enabled: cellsReady.value && batch.length > 0,
        staleTime: 1000 * 60 * 2,
      };
    })
  ),
});

// Build the slot list: map each hash to its resolved FeedMew or a status
type MewSlot =
  | { status: "loading" }
  | { status: "loaded"; feedMew: FeedMew }
  | { status: "failed" };

const mewSlots = computed<MewSlot[]>(() => {
  const slots: MewSlot[] = [];
  const hashes = allHashes.value;

  // Build a lookup from action_hash to FeedMew across all batch results
  const resolvedMap = new Map<string, FeedMew>();
  for (const queryResult of batchQueries) {
    if (queryResult.data) {
      for (const feedMew of queryResult.data as FeedMew[]) {
        resolvedMap.set(
          encodeHashToBase64(feedMew.action_hash),
          feedMew
        );
      }
    }
  }

  // Determine which batches have completed (success or error)
  for (let i = 0; i < hashes.length; i++) {
    const hashB64 = encodeHashToBase64(hashes[i]);
    const batchIndex = Math.floor(i / BATCH_SIZE);
    const batchResult = batchQueries[batchIndex];
    const feedMew = resolvedMap.get(hashB64);

    if (feedMew) {
      slots.push({ status: "loaded", feedMew });
    } else if (batchResult && (batchResult.isError || batchResult.isSuccess)) {
      // Batch completed but this hash wasn't in the results
      slots.push({ status: "failed" });
    } else {
      slots.push({ status: "loading" });
    }
  }

  return slots;
});

// Refetch the batch containing a given slot index
const refetchBatchForIndex = (slotIndex: number) => {
  const batchIndex = Math.floor(slotIndex / BATCH_SIZE);
  const batch = hashBatches.value[batchIndex];
  if (batch) {
    const batchKey = batch
      .map((h) => encodeHashToBase64(h))
      .join(",");
    queryClient.invalidateQueries({
      queryKey: ["mews", "get_batch_mews_with_context", batchKey],
    });
  }
};

const fetchNextPageInfiniteScroll = async (
  done: (hasMore?: boolean) => void
) => {
  await fetchNextPage();
  done(hasNextPage?.value);
};

onBeforeRouteLeave(() => {
  if (hashData.value && hashData.value.pages.length > 1) {
    queryClient.setQueryData(
      ["mews", "get_followed_creators_mew_hashes", myPubKeyB64],
      (d: any) => ({
        pages: [d.pages[0]],
        pageParams: [d.pageParams[0]],
      })
    );
  }
});
</script>
