<template>
  <q-list>
    <q-item
      v-for="(followee, index) of followersOfAgent"
      :key="index"
      class="q-px-none"
    >
      <avatar-with-popup
        :agent-pub-key="followee.agentPubKey"
        class="q-mr-md"
      />
      <q-item-section>
        <q-item-label>
          {{ followee.displayName }}
        </q-item-label>
        <q-item-label caption> @{{ followee.nickname }}</q-item-label>
      </q-item-section>
    </q-item>
  </q-list>
</template>

<script setup lang="ts">
import { followers } from "@/services/clutter-dna";
import { useProfilesStore } from "@/services/profiles-store";
import { PROFILE_FIELDS } from "@/types/types";
import { showError } from "@/utils/notification";
import { AgentPubKey } from "@holochain/client";
import { onMounted, ref, watch } from "vue";
import AvatarWithPopup from "./AvatarWithPopup.vue";

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
    const profilesReadable = await profilesStore.value.fetchAgentsProfiles(
      followerAgentPubKeys
    );
    profilesReadable.subscribe((profiles) => {
      followersOfAgent.value = followerAgentPubKeys.map((agentPubKey) => {
        const profile = profiles.get(agentPubKey);
        const follower: Follower = {
          agentPubKey,
          nickname: profile.nickname,
          displayName: profile.fields[PROFILE_FIELDS.DISPLAY_NAME],
        };
        return follower;
      });
    });
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
