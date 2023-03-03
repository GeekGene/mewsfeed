<template>
  <q-page :style-fn="pageHeightCorrection">
    <div class="row">
      <div>
        <q-card class="self-start q-mb-xl q-px-xl q-py-lg bg-info">
          <my-profile />
        </q-card>
        <ThemeSelect />
      </div>

      <q-space class="col-1" />

      <div class="follow-col col self-start">
        <h6 class="q-mt-none q-mb-md" style="color: var(--q-content)">
          Following
        </h6>
        <FolloweesList :agent-pub-key="myAgentPubKey" />
        <h6 class="q-mb-md" style="color: var(--q-content)">Followed by</h6>
        <FollowersList :agent-pub-key="myAgentPubKey" />
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import FolloweesList from "@/components/FolloweesList.vue";
import FollowersList from "@/components/FollowersList.vue";
import { useProfilesStore } from "@/services/profiles-store";
import { pageHeightCorrection } from "@/utils/page-layout";
import ThemeSelect from "../components/ThemeSelect.vue";

const profilesStore = useProfilesStore();
const myAgentPubKey = profilesStore.value.client.client.myPubKey;
</script>

<style lang="sass">
.follow-col
  position: sticky
  top: $toolbar-min-height + map-get(map-get($spaces, "xl"), "y")
</style>
