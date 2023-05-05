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
        <h6 class="q-mb-md">
          <q-btn
            v-if="myProfile"
            size="lg"
            color="secondary"
            @click="
              router.push({
                name: ROUTES[PATH[TAG_SYMBOLS.MENTION]],
                params: {
                  tag: myProfile.nickname,
                  agentPubKey: encodeHashToBase64(myAgentPubKey),
                },
              })
            "
          >
            Mew Mentions
          </q-btn>
        </h6>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import FolloweesList from "@/components/FolloweesList.vue";
import FollowersList from "@/components/FollowersList.vue";
import { useProfilesStore } from "@/services/profiles-store";
import { pageHeightCorrection } from "@/utils/page-layout";
import { useMyProfile } from "@/utils/profile";
import { encodeHashToBase64 } from "@holochain/client";
import { PATH, ROUTES } from "@/router";
import { TAG_SYMBOLS } from "@/utils/tags";
import { useRouter } from "vue-router";

const router = useRouter();
const profilesStore = useProfilesStore();
const { myProfile } = useMyProfile();
const myAgentPubKey = profilesStore.value.client.client.myPubKey;
</script>

<style lang="sass">
.follow-col
  position: sticky
  top: $toolbar-min-height + map-get(map-get($spaces, "xl"), "y")
</style>
