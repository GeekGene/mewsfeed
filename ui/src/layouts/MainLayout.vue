<template>
  <QLayout view="hHh lpr fFf">
    <QHeader elevated class="row justify-center">
      <QToolbar class="col-12 col-md-6 col-xl-5">
        <QTabs v-model="tab" dense inline-label class="col-grow">
          <QRouteTab v-if="isNewUser" :to="{ name: ROUTES.discover }">
            <QIcon name="svguse:/icons.svg#cat" size="lg" />
          </QRouteTab>
          <QRouteTab v-else :to="{ name: ROUTES.feed }">
            <QIcon name="svguse:/icons.svg#cat" size="lg" />
          </QRouteTab>

          <QRouteTab
            v-if="!isNewUser"
            :to="{ name: ROUTES.discover }"
            icon="explore"
          />

          <SearchEverythingInput />

          <QBtn
            icon="add"
            color="secondary"
            class="q-mx-md"
            @click="showCreateMewDialog = true"
          >
            Mew
            <QTooltip>Create a mew</QTooltip>
          </QBtn>

          <QRouteTab
            v-if="myProfile && client"
            :to="{
              name: ROUTES.notifications,
            }"
            icon="notifications"
          >
            <QBadge v-if="unreadCount > 0" color="green" floating>
              {{ unreadCount < 5 ? unreadCount : "5+" }}
            </QBadge>
            <QTooltip>Notifications</QTooltip>
          </QRouteTab>
          <QRouteTab
            v-if="myProfile && client"
            :to="{
              name: ROUTES.profile,
              params: { agent: encodeHashToBase64(client.myPubKey) },
            }"
          >
            <agent-avatar
              :agentPubKey="client.myPubKey"
              size="40"
              disable-tooltip
              disable-copy
            />
            <QTooltip>Your profile</QTooltip>
          </QRouteTab>
        </QTabs>
      </QToolbar>
    </QHeader>

    <QPageContainer class="row q-mt-xl bg-white">
      <QSpace />
      <RouterView
        :key="`${route.fullPath}-${forceReloadRouterViewKey}`"
        class="col-12 col-md-6 col-xl-5 q-mb-xl"
      />
      <QSpace />
    </QPageContainer>

    <CreateProfileIfNotFoundDialog v-model="showCreateMewDialog">
      <CreateMewForm
        :mew-type="{ [MewTypeName.Original]: null }"
        :profiles-store="profilesStore"
        :mew-length-min="dnaProperties.mew_characters_min"
        :mew-length-max="dnaProperties.mew_characters_max"
        @mew-created="onCreateMew"
      />
    </CreateProfileIfNotFoundDialog>
  </QLayout>
</template>

<script setup lang="ts">
import CreateMewForm from "@/components/CreateMewForm.vue";
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
import { useRouter, useRoute } from "vue-router";
import { Profile, ProfilesStore } from "@holochain-open-dev/profiles";
import CreateProfileIfNotFoundDialog from "@/components/CreateProfileIfNotFoundDialog.vue";
import SearchEverythingInput from "@/components/SearchEverythingInput.vue";
import { showMessage } from "@/utils/toasts";
import { makeUseNotificationsReadStore } from "@/stores/notificationsRead";
import { storeToRefs } from "pinia";
import { useRequest } from "vue-request";
import { useNewUserStore } from "@/stores/newuser";
import { localStorageCacheSettings } from "@/utils/requests";
import { useQuery } from "@tanstack/vue-query";

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
const { isNewUser } = storeToRefs(useNewUserStore());
const { setNewUser } = useNewUserStore();

const tab = ref("");
const showCreateMewDialog = ref(false);
const forceReloadRouterViewKey = ref(0);

const onCreateMew = () => {
  showCreateMewDialog.value = false;
  setNewUser(false);
  showMessage("Published Mew");
  if (
    router.currentRoute.value.name === ROUTES.feed ||
    router.currentRoute.value.name === ROUTES.discover
  ) {
    forceReloadRouterViewKey.value += 1;
  } else {
    router.push({ name: ROUTES.feed });
  }
};

const fetchMewsFeed = (): Promise<FeedMew[]> =>
  client.callZome({
    role_name: "mewsfeed",
    zome_name: "mews",
    fn_name: "get_followed_creators_mews_with_context",
    payload: client.myPubKey,
  });

const { data: followedCreators } = useRequest(fetchMewsFeed, {
  cacheKey: `mews/get_followed_creators_mews_with_context/${encodeHashToBase64(
    client.myPubKey
  )}`,
  loadingDelay: 1000,
  ...localStorageCacheSettings,
});

watch(followedCreators, (val) => {
  if (val && val.length > 0) {
    setNewUser(false);
  } else {
    setNewUser(true);
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

useQuery({
  queryKey: ["mews", "get_notifications_for_agent", client.myPubKey],
  queryFn: fetchNotifications,
  refetchInterval: 1000 * 30, // 30 seconds
  refetchIntervalInBackground: true,
});
</script>
