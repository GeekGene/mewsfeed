.
<template>
  <div>
    <RouterLink
      class="btn btn-circle btn-md"
      active-class="btn-neutral"
      alt="Home Page"
      :to="{ name: ROUTES.feed }"
    >
      <IconHome class="w-6 h-6" />
    </RouterLink>
    <RouterLink
      class="btn btn-circle btn-md"
      active-class="btn-neutral"
      alt="Discover Creators Page"
      :to="{ name: ROUTES.discover }"
    >
      <IconGlobeOutline class="w-6 h-6" />
    </RouterLink>
    <div class="indicator">
      <RouterLink
        class="btn btn-circle btn-md"
        active-class="btn-neutral"
        alt="Notifications Page"
        :to="{ name: ROUTES.notifications }"
      >
        <span
          v-if="unreadCount > 0"
          class="indicator-item indicator-bottom indicator-end badge badge-success"
          >{{ unreadCount <= 20 ? unreadCount : "20+" }}</span
        >
        <IconNotificationsOutline class="w-6 h-6" />
      </RouterLink>
    </div>

    <a
      class="btn btn-circle btn-md"
      active-class="btn-neutral"
      alt="Search Button"
      @click="emit('click-search')"
    >
      <IconSearch class="w-6 h-6" />
    </a>
    <RouterLink
      v-if="myProfile"
      class="btn btn-circle btn-md"
      active-class="btn-neutral"
      alt="My Profile Page"
      :to="{
        name: ROUTES.profile,
        params: { agentPubKey: encodeHashToBase64(client.myPubKey) },
      }"
    >
      <agent-avatar
        :agentPubKey="client.myPubKey"
        size="50"
        disable-tooltip
        disable-copy
      />
    </RouterLink>
  </div>
</template>

<script setup lang="ts">
import { ROUTES } from "@/router";
import { AppAgentClient, encodeHashToBase64 } from "@holochain/client";
import { inject, ComputedRef } from "vue";
import { Profile } from "@holochain-open-dev/profiles";
import { makeUseNotificationsReadStore } from "@/stores/notificationsRead";
import { storeToRefs } from "pinia";
import IconHome from "~icons/ion/home";
import IconGlobeOutline from "~icons/ion/globe-outline";
import IconSearch from "~icons/ion/search-outline";
import IconNotificationsOutline from "~icons/ion/notifications-outline";

const client = (inject("client") as ComputedRef<AppAgentClient>).value;
const myProfile = inject("myProfile") as ComputedRef<Profile>;

const useNotificationsReadStore = makeUseNotificationsReadStore(client);
const { unreadCount } = storeToRefs(useNotificationsReadStore());

const emit = defineEmits(["click-search"]);
</script>

<style scoped></style>
