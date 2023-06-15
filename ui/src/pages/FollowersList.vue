<template>
  <QPage :style-fn="pageHeightCorrection">
    <BaseButtonBack />
    <h6 class="q-mt-md q-mb-md row items-center">
      Followers of
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
        <BaseAgentProfilesList
          v-for="(page, i) in data.pages"
          :key="i"
          class="q-px-md"
          :agent-profiles="page"
          :loading="isLoading"
        />
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
    <BaseProfileSkeleton
      v-for="x in [0, 1, 2, 3]"
      v-else-if="isLoading"
      :key="x"
    />
    <BaseEmptyMewsFeed v-else />
  </QPage>
</template>

<script setup lang="ts">
import { QPage, QList, QIcon, QSpinnerDots, QInfiniteScroll } from "quasar";
import { pageHeightCorrection } from "@/utils/page-layout";
import { AppAgentClient } from "@holochain/client";
import { ComputedRef, inject } from "vue";
import { useRoute, onBeforeRouteLeave } from "vue-router";
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from "@tanstack/vue-query";
import BaseProfileSkeleton from "@/components/BaseProfileSkeleton.vue";
import BaseEmptyMewsFeed from "@/components/BaseEmptyMewsFeed.vue";
import BaseAgentProfilesList from "@/components/BaseAgentProfilesList.vue";
import BaseAgentProfileLinkPopup from "@/components/BaseAgentProfileLinkPopup.vue";
import { watch } from "vue";
import { showError } from "@/utils/toasts";
import { ProfilesStore } from "@holochain-open-dev/profiles";
import { decodeHashFromBase64 } from "@holochain/client";
import { AgentProfile } from "@/types/types";
import { AgentPubKey } from "@holochain/client";
import BaseButtonBack from "@/components/BaseButtonBack.vue";

const route = useRoute();
const client = (inject("client") as ComputedRef<AppAgentClient>).value;
const profilesStore = (inject("profilesStore") as ComputedRef<ProfilesStore>)
  .value;
const queryClient = useQueryClient();

const pageLimit = 10;

const fetchCreators = async (params: any) => {
  const agents: AgentPubKey[] = await await client.callZome({
    role_name: "mewsfeed",
    zome_name: "follows",
    fn_name: "get_followers_for_creator",
    payload: {
      creator: decodeHashFromBase64(route.params.agentPubKey as string),
      page: {
        limit: pageLimit,
        ...params.pageParam,
      },
    },
  });

  const agentProfiles = await Promise.all(
    agents.map(async (agentPubKey) => {
      const profile = await profilesStore.client.getAgentProfile(agentPubKey);
      if (!profile) return null;

      return {
        agentPubKey,
        profile: profile,
      };
    })
  );

  return agentProfiles.filter(Boolean) as AgentProfile[];
};

const { data, error, fetchNextPage, hasNextPage, isLoading } = useInfiniteQuery(
  {
    queryKey: ["mews", "get_followers_for_creator", route.params.agentPubKey],
    queryFn: fetchCreators,
    getNextPageParam: (lastPage) => {
      if (lastPage.length === 0) return;
      if (lastPage.length < pageLimit) return;

      return { after_agentpubkey: lastPage[lastPage.length - 1] };
    },
    refetchInterval: 1000 * 60 * 2, // 2 minutes
  }
);

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

onBeforeRouteLeave(() => {
  if (data.value && data.value.pages.length > 1) {
    queryClient.setQueryData(
      ["mews", "get_followers_for_creator", route.params.agentPubKey],
      (d: any) => ({
        pages: [d.pages[0]],
        pageParams: [d.pageParams[0]],
      })
    );
  }
});
</script>
