<template>
  <q-page padding>
    <q-spinner-pie v-if="loading" size="10%" color="primary" />

    <template v-else>
      <q-card v-bind="$attrs" flat class="q-mb-md text-body1">
        <q-card-section class="flex justify-between">
          <div class="flex items-center">
            <agent-avatar
              :agent-pub-key="agentPubKey"
              size="50"
              class="q-mr-lg"
            />
            <div class="q-mr-lg text-primary text-weight-medium">
              {{ displayName }}
            </div>
            <div class="text-primary">@{{ nickname }}</div>
          </div>
          <ButtonFollow :agent-pub-key="agentPubKey" />
        </q-card-section>

        <q-card-section class="flex">
          <div class="q-mr-md">
            <div>
              <label class="text-weight-medium">Bio:</label>
            </div>
            <div>
              <label class="text-weight-medium">Location:</label>
            </div>
          </div>
          <div class="col-grow">
            <div>{{ bio }}</div>
            <div>{{ location }}</div>
          </div>
        </q-card-section>
      </q-card>

      <q-list v-if="mewsFeed.length > 0" bordered separator>
        <q-item v-for="(mew, index) in mewsFeed" :key="index">
          <q-item-section avatar>
            <agent-avatar :agent-pub-key="agentPubKey" size="50" />
          </q-item-section>
          <q-item-section>
            <MewContent :mew="mew" />
          </q-item-section>
        </q-item>
      </q-list>
    </template>
  </q-page>
</template>

<script setup lang="ts">
import { useProfileStore } from "@/services/profile-store";
import { useRoute } from "vue-router";
import { showError } from "@/utils/notification";
import { computed, onMounted, ref, watch } from "vue";
import { mewsBy, myFollowing } from "@/services/clutter-dna";
import { FeedMew } from "@/types/types";
import ButtonFollow from "@/components/ButtonFollow.vue";
import MewContent from "@/components/MewContent.vue";

const profileStore = useProfileStore();
const route = useRoute();
const agentPubKey = computed(() =>
  typeof route.params.agent === "string"
    ? route.params.agent
    : route.params.agent[0]
);
const loading = ref(false);
const nickname = ref("");
const displayName = ref("");
const bio = ref("");
const location = ref("");
const following = ref(false);
const mewsFeed = ref<FeedMew[]>([]);

const loadProfile = async () => {
  try {
    loading.value = true;
    const [profile, currentMyFollowing, mews] = await Promise.all([
      profileStore.fetchAgentProfile(agentPubKey.value),
      myFollowing(),
      mewsBy(agentPubKey.value),
    ]);
    if (profile) {
      nickname.value = profile.nickname;
      displayName.value = profile.fields["Display name"];
      bio.value = profile.fields.Bio;
      location.value = profile.fields.Location;
    }
    following.value = currentMyFollowing.includes(agentPubKey.value);
    mewsFeed.value = mews;
  } catch (error) {
    showError(error);
  } finally {
    loading.value = false;
  }
};

onMounted(loadProfile);
watch(
  () => route.params.agent,
  () => loadProfile()
);
</script>
