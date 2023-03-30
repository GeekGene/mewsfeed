<template>
  <template v-if="loadingFollowers">
    <q-list v-for="i of [0, 1, 2]" :key="i">
      <ProfileSkeleton />
    </q-list>
  </template>

  <EmptyMewsFeed
    v-else-if="followersOfAgent.length == 0"
    text="No followers yet"
  />

  <template v-else>
    <q-list>
      <q-item
        v-for="(followee, index) of followersOfAgent"
        :key="index"
        class="q-px-none"
      >
        <AvatarWithPopup :agentPubKey="followee.agentPubKey" class="q-mr-md" />
        <q-item-section>
          <q-item-label>
            {{ followee.displayName }}
          </q-item-label>
          <q-item-label caption> @{{ followee.nickname }}</q-item-label>
        </q-item-section>
      </q-item>
    </q-list>
  </template>
</template>

<script setup lang="ts">
import { followers } from "@/services/clutter-dna";
import { useProfilesStore } from "@/services/profiles-store";
import { PROFILE_FIELDS } from "@/types/types";
import { showError } from "@/utils/notification";
import { AgentPubKey } from "@holochain/client";
import { onMounted, ref, watch } from "vue";
import AvatarWithPopup from "./AvatarWithPopup.vue";
import EmptyMewsFeed from "./EmptyMewsFeed.vue";
import ProfileSkeleton from "./ProfileSkeleton.vue";

interface Follower {
  agentPubKey: AgentPubKey;
  nickname: string;
  displayName: string;
}

const props = defineProps<{ agentPubKey: AgentPubKey }>();

const profilesStore = useProfilesStore();

const loadingFollowers = ref(false);
const followersOfAgent = ref<Follower[]>([]);

const loadFollowers = async () => {
  try {
    loadingFollowers.value = true;
    const followerAgentPubKeys = await followers(props.agentPubKey);
    const _followers = await Promise.all(
      followerAgentPubKeys.map((agentPubKey) => {
        return profilesStore.value.client
          .getAgentProfile(agentPubKey)
          .then((profile) => {
            if (!profile) {
              return null;
            }
            const follower: Follower = {
              agentPubKey,
              nickname: profile.nickname,
              displayName: profile.fields[PROFILE_FIELDS.DISPLAY_NAME],
            };
            return follower;
          });
      })
    );
    followersOfAgent.value = _followers.filter(Boolean) as Follower[];
  } catch (error) {
    showError(error);
  } finally {
    loadingFollowers.value = false;
  }
};

onMounted(loadFollowers);
watch(
  () => props.agentPubKey,
  () => loadFollowers()
);
</script>
