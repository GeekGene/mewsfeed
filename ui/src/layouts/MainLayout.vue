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
        @click-search="showSearchModal = true"
      />
      <div class="flex-1 relative w-full h-full">
        <h1
          class="hidden sm:block text-2xl font-title font-bold tracking-tighter"
        >
          mewsfeed
        </h1>
        <RouterView :key="`${route.fullPath}-${forceReloadRouterViewKey}`" />
        <CreateMewInput
          :mew-type="{ [MewTypeName.Original]: null }"
          class="absolute bottom-3 w-full hidden sm:block"
        />
      </div>
    </div>

    <BaseSiteMenu
      class="block flex-0 sm:hidden w-full flex justify-between items-center"
      @click-search="showSearchModal = true"
    />
    <SearchEverythingModal
      :open="showSearchModal"
      @close="showSearchModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import CreateMewInput from "@/components/CreateMewInput.vue";
import BaseSiteMenu from "@/components/BaseSiteMenu.vue";
import SearchEverythingModal from "@/components/SearchEverythingModal.vue";
import { ROUTES } from "@/router";
import {
  FeedMew,
  MewTypeName,
  MewsfeedDnaProperties,
  PaginationDirectionName,
  Notification,
} from "@/types/types";
import { AppAgentClient, encodeHashToBase64 } from "@holochain/client";
import {
  QPageContainer,
  QSpace,
  QRouteTab,
  QTabs,
  QBtn,
  QBadge,
  QLayout,
  QHeader,
  QToolbar,
  QTooltip,
  QIcon,
} from "quasar";
import { ComputedRef, inject, ref, watch } from "vue";
import { useRouter, useRoute, RouterLink } from "vue-router";
import { Profile, ProfilesStore } from "@holochain-open-dev/profiles";
import CreateProfileIfNotFoundDialog from "@/components/CreateProfileIfNotFoundDialog.vue";
import SearchEverythingInput from "@/components/SearchEverythingInput.vue";
import { makeUseNotificationsReadStore } from "@/stores/notificationsRead";
import { storeToRefs } from "pinia";
import { getHomeRedirect, setHomeRedirect } from "@/utils/homeRedirect";
import { useInfiniteQuery, useQuery } from "@tanstack/vue-query";

const client = (inject("client") as ComputedRef<AppAgentClient>).value;
const dnaProperties = (
  inject("dnaProperties") as ComputedRef<MewsfeedDnaProperties>
).value;
const profilesStore = (inject("profilesStore") as ComputedRef<ProfilesStore>)
  .value;
const myProfile = inject("myProfile") as ComputedRef<Profile>;
const router = useRouter();
const route = useRoute();
const useNotificationsReadStore = makeUseNotificationsReadStore(client);
const { unreadCount } = storeToRefs(useNotificationsReadStore());
const { addNotificationStatus } = useNotificationsReadStore();

const showSearchModal = ref(false);
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
