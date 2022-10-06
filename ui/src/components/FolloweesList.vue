<template>
  <q-list>
    <q-item
      v-for="(followee, index) of agentFollowees"
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
        <q-item-label caption> @{{ followee.nickname }} </q-item-label>
      </q-item-section>
    </q-item>
  </q-list>
</template>

<script setup lang="ts">
import { following } from "@/services/clutter-dna";
import { useProfilesStore } from "@/services/profiles-store";
import { PROFILE_FIELDS } from "@/types/types";
import { showError } from "@/utils/notification";
import { AgentPubKey } from "@holochain/client";
import { onMounted, ref, watch } from "vue";
import AvatarWithPopup from "./AvatarWithPopup.vue";

interface AgentFollowee {
  agentPubKey: AgentPubKey;
  nickname: string;
  displayName: string;
}

const props = defineProps<{ agentPubKey: AgentPubKey }>();

const profilesStore = useProfilesStore();

const loadingFollowees = ref(false);
const agentFollowees = ref<AgentFollowee[]>([]);

const loadFollowees = async () => {
  try {
    loadingFollowees.value = true;
    const followeeAgentPubKeys = await following(props.agentPubKey);
    const profilesReadable = await profilesStore.value.fetchAgentsProfiles(
      followeeAgentPubKeys
    );
    profilesReadable.subscribe((profiles) => {
      agentFollowees.value = followeeAgentPubKeys.map((agentPubKey) => {
        const profile = profiles.get(agentPubKey);
        const agentFollowee: AgentFollowee = {
          agentPubKey,
          nickname: profile.nickname,
          displayName: profile.fields[PROFILE_FIELDS.DISPLAY_NAME],
        };
        return agentFollowee;
      });
    });
  } catch (error) {
    showError(error);
  } finally {
    loadingFollowees.value = false;
  }
};

onMounted(loadFollowees);
watch(
  () => props.agentPubKey,
  () => loadFollowees()
);
</script>
