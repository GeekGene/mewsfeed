<template>
  <template v-if="loadingFollowees">
    <q-list v-for="i of [0, 1, 2]" :key="i">
      <ProfileSkeleton />
    </q-list>
  </template>

  <EmptyMewsFeed
    v-else-if="agentFollowees.length == 0"
    text="No followees yet"
  />

  <template v-else>
    <q-list>
      <q-item
        v-for="(followee, index) of agentFollowees"
        :key="index"
        class="q-px-none"
      >
        <ProfileAvatarWithPopup
          :agentPubKey="followee.agentPubKey"
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
</template>

<script setup lang="ts">
import { following } from "@/services/mewsfeed-dna";
import { useProfilesStore } from "@/services/profiles-store";
import { PROFILE_FIELDS } from "@/types/types";
import { showError } from "@/utils/notification";
import { AgentPubKey } from "@holochain/client";
import { onMounted, ref, watch } from "vue";
import ProfileAvatarWithPopup from "./ProfileAvatarWithPopup.vue";
import EmptyMewsFeed from "./EmptyMewsFeed.vue";
import ProfileSkeleton from "./ProfileSkeleton.vue";

interface Followee {
  agentPubKey: AgentPubKey;
  nickname: string;
  displayName: string;
}

const props = defineProps<{ agentPubKey: AgentPubKey }>();

const profilesStore = useProfilesStore();

const loadingFollowees = ref(false);
const agentFollowees = ref<Followee[]>([]);

const loadFollowees = async () => {
  try {
    loadingFollowees.value = true;
    const followeeAgentPubKeys = await following(props.agentPubKey);
    const followees = await Promise.all(
      followeeAgentPubKeys.map((agentPubKey) => {
        return profilesStore.value.client
          .getAgentProfile(agentPubKey)
          .then((profile) => {
            if (!profile) {
              return null;
            }
            const agentFollowee: Followee = {
              agentPubKey,
              nickname: profile.nickname,
              displayName: profile.fields[PROFILE_FIELDS.DISPLAY_NAME],
            };
            return agentFollowee;
          });
      })
    );
    agentFollowees.value = followees.filter(Boolean) as Followee[];
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
