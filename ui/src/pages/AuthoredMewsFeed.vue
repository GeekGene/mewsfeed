<template>
  <QPage :style-fn="pageHeightCorrection">
    <h6 class="q-mb-md row items-center">
      Mews authored by
      <BaseAgentProfileLinkPopup
        class="q-ml-md"
        :agentPubKey="decodeHashFromBase64(route.params.agentPubKey as string)"
        :profile="profile"
        :avatar-size="30"
      />
    </h6>

    <QInfiniteScroll
      v-if="
        data && data.pages && data.pages.length > 0 && data.pages[0].length > 0
      "
      :offset="250"
      @load="fetchNextPageInfiniteScroll"
    >
      <QList bordered separator class="q-mb-lg">
        <template v-for="(page, i) in data.pages" :key="i">
          <BaseMewListItem
            v-for="(mew, j) of page"
            :key="j"
            :feed-mew="mew"
            @mew-deleted="
              refetch({ refetchPage: (page, index) => index === i })
            "
            @mew-licked="refetch({ refetchPage: (page, index) => index === i })"
            @mew-pinned="refetch({ refetchPage: (page, index) => index === i })"
            @mew-unlicked="
              refetch({ refetchPage: (page, index) => index === i })
            "
            @mew-unpinned="
              refetch({ refetchPage: (page, index) => index === i })
            "
            @mewmew-created="
              refetch({ refetchPage: (page, index) => index === i })
            "
            @quote-created="
              refetch({ refetchPage: (page, index) => index === i })
            "
            @reply-created="
              refetch({ refetchPage: (page, index) => index === i })
            "
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
    <BaseMewListSkeleton v-else-if="isLoading" />
    <BaseEmptyMewsFeed v-else />
  </QPage>
</template>

<script setup lang="ts">
import { QPage, QList, QIcon, QSpinnerDots, QInfiniteScroll } from "quasar";
import { pageHeightCorrection } from "@/utils/page-layout";
import { AppAgentClient } from "@holochain/client";
import { ComputedRef, inject } from "vue";
import { useRoute } from "vue-router";
import { useInfiniteQuery, useQuery } from "@tanstack/vue-query";
import BaseMewListSkeleton from "@/components/BaseMewListSkeleton.vue";
import BaseEmptyMewsFeed from "@/components/BaseEmptyMewsFeed.vue";
import BaseMewListItem from "@/components/BaseMewListItem.vue";
import BaseAgentProfileLinkPopup from "@/components/BaseAgentProfileLinkPopup.vue";
import { watch } from "vue";
import { showError } from "@/utils/toasts";
import { ProfilesStore } from "@holochain-open-dev/profiles";
import { decodeHashFromBase64 } from "@holochain/client";

const route = useRoute();
const client = (inject("client") as ComputedRef<AppAgentClient>).value;
const profilesStore = (inject("profilesStore") as ComputedRef<ProfilesStore>)
  .value;

const pageLimit = 10;

const fetchAuthoredMews = async (params: any) => {
  const res = await client.callZome({
    role_name: "mewsfeed",
    zome_name: "mews",
    fn_name: "get_agent_mews_with_context",
    payload: {
      agent: decodeHashFromBase64(route.params.agentPubKey as string),
      page: {
        limit: pageLimit,
        ...params.pageParam,
      },
    },
  });
  return res;
};

const { data, error, fetchNextPage, hasNextPage, isLoading, refetch } =
  useInfiniteQuery({
    queryKey: ["mews", "get_agent_mews_with_context", route.params.agentPubKey],
    queryFn: fetchAuthoredMews,
    getNextPageParam: (lastPage) => {
      if (lastPage.length === 0) return;
      if (lastPage.length < pageLimit) return;

      return { after_hash: lastPage[lastPage.length - 1].action_hash };
    },
    refetchInterval: 1000 * 60 * 2, // 2 minutes
  });

const fetchProfile = async () => {
  const profile = await profilesStore.client.getAgentProfile(
    decodeHashFromBase64(route.params.agentPubKey as string)
  );

  if (profile) {
    return profile;
  } else {
    throw new Error("No profile found");
  }
};

const { data: profile, error: errorProfile } = useQuery({
  queryKey: ["profiles", "getAgentProfile", route.params.agentPubKey],
  queryFn: fetchProfile,
});

const fetchNextPageInfiniteScroll = async (
  index: number,
  done: (stop?: boolean) => void
) => {
  await fetchNextPage();
  done(!hasNextPage?.value);
};

watch(error, showError);
watch(errorProfile, showError);
</script>
