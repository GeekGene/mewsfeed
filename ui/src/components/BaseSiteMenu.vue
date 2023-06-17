.
<template>
  <div>
    <RouterLink
      class="btn btn-circle btn-md btn-neutral-inverse"
      active-class="btn-neutral"
      alt="Home Page"
      :to="{ name: ROUTES.feed }"
    >
      <Icon icon="ion:home" class="text-2xl" />
    </RouterLink>
    <RouterLink
      class="btn btn-circle btn-md"
      active-class="btn-neutral"
      alt="Home Page"
      :to="{ name: ROUTES.discover }"
    >
      <Icon icon="ion:globe-outline" class="text-2xl" />
    </RouterLink>
    <RouterLink
      class="btn btn-circle btn-md btn-neutral-inverse"
      active-class="btn-neutral"
      alt="Home Page"
      :to="{ name: ROUTES.notifications }"
    >
      <Icon icon="ion:notifications-outline" class="text-2xl" />
    </RouterLink>
    <a
      class="btn btn-circle btn-md btn-neutral-inverse"
      active-class="btn-neutral"
      alt="Search Button"
      @click="emit('click-search')"
    >
      <Icon icon="ion:search" class="text-2xl" />
    </a>
    <RouterLink
      v-if="myProfile"
      class="btn btn-circle btn-md btn-neutral-inverse px-0 py-0"
      active-class="btn-neutral"
      alt="Home Page"
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
import { Icon } from "@iconify/vue";
import { Profile } from "@holochain-open-dev/profiles";
import BaseAgentProfile from "@/components/BaseAgentProfile.vue";

const client = (inject("client") as ComputedRef<AppAgentClient>).value;
const myProfile = inject("myProfile") as ComputedRef<Profile>;
const emit = defineEmits(["click-search"]);
</script>

<style scoped></style>
