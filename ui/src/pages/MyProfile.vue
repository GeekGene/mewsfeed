<template>
  <q-page :style-fn="pageHeightCorrection">
    <div class="row">
      <div>
        <q-card class="self-start q-mb-xl q-px-xl q-py-lg text-body1">
          <my-profile />
        </q-card>
      </div>

      <q-space class="col-1" />

      <div class="follow-col col self-start">
        <h6 class="q-mt-none q-mb-md">Following</h6>
        <FolloweesList :agentPubKey="myAgentPubKey" />
        <h6 class="q-mb-md">Followed by</h6>
        <FollowersList :agentPubKey="myAgentPubKey" />
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import FolloweesList from "@/components/FolloweesList.vue";
import FollowersList from "@/components/FollowersList.vue";
import { useProfilesStore } from "@/services/profiles-store";
import { pageHeightCorrection } from "@/utils/page-layout";

const profilesStore = useProfilesStore();
const myAgentPubKey = profilesStore.value.client.client.myPubKey;
</script>

<style lang="sass">
.follow-col
  position: sticky
  top: $toolbar-min-height + map-get(map-get($spaces, "xl"), "y")
</style>
