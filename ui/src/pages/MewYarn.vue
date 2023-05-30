<template>
  <QPage :style-fn="pageHeightCorrection">
    <QCard flat>
      <QCardSection class="q-pb-none">
        <QBtn flat @click="router.back()">
          <QIcon
            name="arrow_right_alt"
            size="lg"
            style="transform: rotate(180deg); font-weight: 100"
          />
          Back
        </QBtn>
      </QCardSection>

      <QCardSection class="yarn-container">
        <QList>
          <BaseMewListItem
            v-if="mew"
            :feed-mew="mew"
            class="q-mb-md bg-orange-1"
            @mew-deleted="refetchMewAndRepliesPage(0)"
            @mew-licked="refetchMewAndRepliesPage(0)"
            @mew-pinned="refetchMewAndRepliesPage(0)"
            @mew-unlicked="refetchMewAndRepliesPage(0)"
            @mew-unpinned="refetchMewAndRepliesPage(0)"
            @mewmew-created="refetchMewAndRepliesPage(0)"
            @quote-created="refetchMewAndRepliesPage(0)"
            @reply-created="refetchMewAndRepliesPage(0)"
          />
          <BaseMewListItemSkeleton v-else-if="isLoadingMew" />

          <QItem class="q-mb-md q-px-none">
            <div class="col-grow">
              <div class="q-mb-md text-h6 text-medium">Reply</div>

              <CreateMewField
                :mew-type="{ [MewTypeName.Reply]: actionHash }"
                class="full-width"
                @mew-created="refetchMewAndRepliesLastPage"
              />
            </div>
          </QItem>
        </QList>

        <QInfiniteScroll
          v-if="
            replies && replies.pages.length > 0 && replies.pages[0].length > 0
          "
          :offset="250"
          @load="fetchNextPageReplies"
        >
          <QList bordered separator class="q-mb-lg">
            <template v-for="(page, i) in replies.pages" :key="i">
              <BaseMewListItem
                v-for="(reply, j) of page"
                :key="j"
                :feed-mew="reply"
                :show-yarn-link="false"
                @mew-deleted="refetchRepliesPage(i)"
                @mew-licked="refetchRepliesPage(i)"
                @mew-pinned="refetchRepliesPage(i)"
                @mew-unlicked="refetchRepliesPage(i)"
                @mew-unpinned="refetchRepliesPage(i)"
                @mewmew-created="refetchRepliesPage(i)"
                @quote-created="refetchRepliesPage(i)"
                @reply-created="refetchRepliesPage(i)"
              />
            </template>
          </QList>

          <template #loading>
            <div class="row justify-center q-mt-lg">
              <QSpinnerDots color="primary" size="40px" />
            </div>
          </template>
          <div v-if="!hasNextPage" class="row justify-center q-mt-lg">
            <QIcon name="svguse:/icons.svg#paw" size="40px" color="grey-4" />
          </div>
        </QInfiniteScroll>
        <BaseMewListSkeleton v-else-if="isLoadingReplies" />
        <BaseEmptyMewsFeed v-else />
      </QCardSection>
    </QCard>
  </QPage>
</template>

<script setup lang="ts">
import {
  QPage,
  QInfiniteScroll,
  QSpinnerDots,
  QCard,
  QCardSection,
  QBtn,
  QIcon,
  QItem,
  QList,
} from "quasar";
import CreateMewField from "@/components/CreateMewField.vue";
import BaseMewListItem from "@/components/BaseMewListItem.vue";
import BaseMewListItemSkeleton from "@/components/BaseMewListItemSkeleton.vue";
import { MewTypeName, PaginationDirectionName } from "@/types/types";
import { pageHeightCorrection } from "@/utils/page-layout";
import { decodeHashFromBase64 } from "@holochain/client";
import { ComputedRef, computed, inject, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { AppAgentClient } from "@holochain/client";
import { showError } from "@/utils/toasts";
import { useInfiniteQuery, useQuery } from "@tanstack/vue-query";
import { encodeHashToBase64 } from "@holochain/client";

const client = (inject("client") as ComputedRef<AppAgentClient>).value;
const route = useRoute();
const router = useRouter();

const pageLimit = 10;

const actionHash = computed(() =>
  decodeHashFromBase64(route.params.actionHash as string)
);
const hasActionHash = computed(() => actionHash.value !== undefined);

const fetchMew = () =>
  client.callZome({
    role_name: "mewsfeed",
    zome_name: "mews",
    fn_name: "get_mew_with_context",
    payload: actionHash.value,
  });

const {
  data: mew,
  error: mewError,
  isLoading: isLoadingMew,
  refetch: refetchMew,
} = useQuery({
  queryKey: ["mews", "get_mew_with_context", route.params.actionHash as string],
  queryFn: fetchMew,
  enabled: hasActionHash,
  refetchInterval: 1000 * 60 * 2, // 2 minutes
});
watch(mewError, showError);

const fetchReplies = (params: any) => {
  console.log("fetchReplies", params);
  return client.callZome({
    role_name: "mewsfeed",
    zome_name: "mews",
    fn_name: "get_responses_for_mew_with_context",
    payload: {
      original_mew_hash: mew?.value.action_hash,
      page: {
        limit: pageLimit,
        direction: { [PaginationDirectionName.Ascending]: null },
        ...params.pageParam,
      },
    },
  });
};

const hasMew = computed(() => mew.value !== undefined);

const {
  data: replies,
  error: errorReplies,
  fetchNextPage,
  hasNextPage,
  isLoading: isLoadingReplies,
  refetch: refetchReplies,
} = useInfiniteQuery({
  queryKey: [
    "mews",
    "get_responses_for_mew_with_context",
    route.params.actionHash as string,
  ],
  queryFn: fetchReplies,
  enabled: hasMew,
  getNextPageParam: (lastPage) => {
    if (lastPage.length === 0) return;
    if (lastPage.length < pageLimit) return;

    return { after_hash: lastPage[lastPage.length - 1].action_hash };
  },
  refetchInterval: 1000 * 60 * 2, // 2 minutes
});
watch(errorReplies, showError);

const fetchNextPageReplies = async (
  index: number,
  done: (stop?: boolean) => void
) => {
  await fetchNextPage();
  done(!hasNextPage?.value);
};

const refetchMewAndRepliesPage = async (pageIndex: number) => {
  await refetchMew();
  await refetchRepliesPage(pageIndex);
};

const refetchRepliesPage = async (pageIndex: number) => {
  await refetchReplies({
    refetchPage: (page: any, index: number) => index === pageIndex,
  });
};

const refetchMewAndRepliesLastPage = async () => {
  await refetchMew();

  if (
    !mew.value.replies ||
    !replies.value ||
    replies.value.pages.length === 0
  ) {
    await refetchRepliesPage(0);
  } else if (
    mew.value.replies.length <
    replies.value.pages.length * pageLimit
  ) {
    await refetchRepliesPage(replies.value.pages.length - 1);
  } else {
    await refetchRepliesPage(replies.value.pages.length - 1);
    await fetchNextPage();
  }
};
</script>
