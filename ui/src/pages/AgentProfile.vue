<template>
  <q-page>
    <q-spinner-pie v-if="loadingProfile" size="10%" color="primary" />

    <q-card v-else v-bind="$attrs" flat class="q-mb-md text-body1">
      <q-card-section class="flex justify-between">
        <div class="flex items-center">
          <agent-avatar :agentPubKey="agentPubKey" size="50" class="q-mr-lg" />
          <div class="q-mr-lg text-primary text-weight-medium">
            {{ displayName }}
          </div>
          <div class="text-primary">@{{ nickname }}</div>
        </div>
        <ButtonFollow v-if="!isMyProfile" :agent-pub-key="agentPubKey" />
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

    <MewList :loading="loadingMews" :mews="mews" @refresh="loadMews" />
  </q-page>
</template>

<script setup lang="ts">
import { useProfileStore } from "@/services/profile-store";
import { useRoute } from "vue-router";
import { showError } from "@/utils/notification";
import { computed, onMounted, ref, watch } from "vue";
import { mewsBy, myFollowing } from "@/services/clutter-dna";
import { FeedMew } from "@/types/types";
import { isSameAgentPubKey } from "@/utils/hash";
import ButtonFollow from "@/components/ButtonFollow.vue";
import MewList from "../components/MewList.vue";
import { deserializeHash } from "@holochain-open-dev/utils";
import { Profile } from "@holochain-open-dev/profiles";

const profileStore = useProfileStore();
const route = useRoute();
const agentPubKey = computed(() =>
  deserializeHash(
    Array.isArray(route.params.agent)
      ? route.params.agent[0]
      : route.params.agent
  )
);
const loadingMews = ref(false);
const loadingProfile = ref(false);
const nickname = ref("");
const displayName = ref("");
const bio = ref("");
const location = ref("");
const following = ref(false);
const mews = ref<FeedMew[]>([]);

const isMyProfile = computed(() =>
  isSameAgentPubKey(agentPubKey.value, profileStore.myAgentPubKey)
);

const loadMews = async () => {
  try {
    loadingMews.value = true;
    mews.value = await mewsBy(agentPubKey.value);
  } catch (error) {
    showError(error);
  } finally {
    loadingMews.value = false;
  }
};

const loadProfile = async () => {
  try {
    loadingProfile.value = true;
    const [profileReadable, currentMyFollowing] = await Promise.all([
      profileStore.fetchAgentProfile(agentPubKey.value),
      myFollowing(),
    ]);
    let profile: Profile | undefined;
    profileReadable.subscribe((p) => (profile = p));
    if (profile) {
      nickname.value = profile.nickname;
      displayName.value = profile.fields["Display name"];
      bio.value = profile.fields.Bio;
      location.value = profile.fields.Location;
    }
    following.value = currentMyFollowing.includes(agentPubKey.value);
  } catch (error) {
    showError(error);
  } finally {
    loadingProfile.value = false;
  }
};

const load = () => {
  loadProfile();
  loadMews();
};

onMounted(load);

watch(
  () => route.params.agent,
  () => {
    if (route.params.agent) {
      load();
    }
  }
);
</script>
