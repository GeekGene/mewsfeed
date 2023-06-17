<template>
  <div class="w-full max-w-screen-lg h-full px-8 py-8 flex flex-col">
    <h1 class="block sm:hidden text-2xl font-title font-bold tracking-tighter">
      mewsfeed
    </h1>

    <div
      class="flex sm:flex-none justify-center items-start space-x-12 sm:space-x-0 h-full"
    >
      <BaseSiteMenu
        class="sticky left-0 top-0 mt-16 hidden sm:block w-14 flex flex-col justify-start items-start space-y-4"
        @click-search="showSearchDialog = true"
      />
      <div class="flex-1 relative w-full h-full">
        <h1
          class="hidden sm:block text-2xl font-title font-bold tracking-tighter"
        >
          mewsfeed
        </h1>
        <RouterView :key="`${route.fullPath}-${forceReloadRouterViewKey}`" />
        <div class="hidden sm:block absolute bottom-3 w-full">
          <CreateMewInput
            :mew-type="{ [MewTypeName.Original]: null }"
            @mew-created="onCreateMew"
          />
        </div>
        <a
          class="absolute bottom-4 right-0 block sm:hidden btn btn-md btn-neutral rounded-full py-3 flex items-center"
          @click="showCreateMewDialog = true"
        >
          <Icon icon="ion:chatbubble-outline" class="text-xl" />
          <div>New Mew</div>
        </a>
      </div>
    </div>

    <BaseSiteMenu
      class="block flex-0 sm:hidden w-full flex justify-between items-center"
      @click-search="showSearchDialog = true"
    />
    <SearchEverythingDialog v-model="showSearchDialog" />
    <CreateMewDialog v-model="showCreateMewDialog" />
  </div>
</template>

<script setup lang="ts">
import CreateMewInput from "@/components/CreateMewInput.vue";
import BaseSiteMenu from "@/components/BaseSiteMenu.vue";
import SearchEverythingDialog from "@/components/SearchEverythingDialog.vue";
import { ROUTES } from "@/router";
import {
  FeedMew,
  MewTypeName,
  PaginationDirectionName,
  Notification,
} from "@/types/types";
import { AppAgentClient, encodeHashToBase64 } from "@holochain/client";

import { ComputedRef, inject, ref, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { makeUseNotificationsReadStore } from "@/stores/notificationsRead";
import { setHomeRedirect } from "@/utils/homeRedirect";
import { useInfiniteQuery, useQuery } from "@tanstack/vue-query";
import { Icon } from "@iconify/vue";
import CreateMewDialog from "@/components/CreateMewDialog.vue";

const client = (inject("client") as ComputedRef<AppAgentClient>).value;

const router = useRouter();
const route = useRoute();
const useNotificationsReadStore = makeUseNotificationsReadStore(client);
const { addNotificationStatus } = useNotificationsReadStore();

const showSearchDialog = ref(false);
const showCreateMewDialog = ref(false);
const forceReloadRouterViewKey = ref(0);

const onCreateMew = () => {
  showCreateMewDialog.value = false;
  setHomeRedirect(false);

  if (
    router.currentRoute.value.name === ROUTES.feed ||
    router.currentRoute.value.name === ROUTES.discover
  ) {
    forceReloadRouterViewKey.value += 1;
  } else {
    router.push({ name: ROUTES.feed });
    forceReloadRouterViewKey.value += 1;
  }
};

const fetchMostRecentMew = (): Promise<FeedMew[]> =>
  client.callZome({
    role_name: "mewsfeed",
    zome_name: "mews",
    fn_name: "get_followed_creators_mews_with_context",
    payload: {
      agent: client.myPubKey,
      page: {
        limit: 1,
      },
    },
  });

const { data: mostRecentMew } = useQuery({
  queryKey: [
    "mews",
    "get_followed_creators_mews_with_context",
    encodeHashToBase64(client.myPubKey),
    { page: { limit: 1 } },
  ],
  queryFn: fetchMostRecentMew,
});

watch(mostRecentMew, (val) => {
  if (val && val.length > 0) {
    setHomeRedirect(false);
  }
});

const fetchNotifications = async () => {
  const res: Notification[] = await client.callZome({
    role_name: "mewsfeed",
    zome_name: "mews",
    fn_name: "get_notifications_for_agent",
    payload: {
      agent: client.myPubKey,
      page: {
        limit: 5,
        direction: { [PaginationDirectionName.Descending]: null },
      },
    },
  });
  res.forEach((n) => addNotificationStatus(n));
  return res;
};

useInfiniteQuery({
  queryKey: ["mews", "get_notifications_for_agent", client.myPubKey],
  queryFn: fetchNotifications,
  refetchInterval: 1000 * 30, // 30 seconds
  refetchIntervalInBackground: true,
});
</script>
