<template>
  <template v-if="loadingFollowees">
    <QList v-for="i of [0, 1, 2]" :key="i">
      <ProfileSkeleton />
    </QList>
  </template>

  <EmptyMewsFeed
    v-else-if="agentFollowees.length == 0"
    text="No followees yet"
  />

  <template v-else>
    <QList>
      <QItem
        v-for="(followee, index) of agentFollowees"
        :key="index"
        class="q-px-none"
      >
        <ProfileAvatarWithPopup
          :agentPubKey="followee.agentPubKey"
          class="q-mr-md"
        />
        <QItemSection>
          <QItemLabel>
            {{ followee.displayName }}
          </QItemLabel>
          <QItemLabel caption> @{{ followee.nickname }}</QItemLabel>
        </QItemSection>
      </QItem>
    </QList>
  </template>
</template>

<script setup lang="ts">
import { QList, QItem, QItemSection, QItemLabel } from "quasar";
import { following } from "@/services/mewsfeed-dna";
import { useProfilesStore } from "@/stores/profiles";
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
