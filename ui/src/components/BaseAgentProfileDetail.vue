<template>
  <div
    v-if="profile"
    class="h-full w-full text-base-content font-content font-normal"
    v-bind="$attrs"
  >
    <div class="flex space-x-6 h-full p-4">
      <div class="flex flex-col justify-between">
        <agent-avatar
          class="hidden sm:block"
          :agentPubKey="agentPubKey"
          size="80"
          disable-tooltip
          disable-copy
        />
        <agent-avatar
          class="block sm:hidden"
          :agentPubKey="agentPubKey"
          size="50"
          disable-tooltip
          disable-copy
        />

        <holo-identicon
          v-if="profile.avatar"
          :hash="agentPubKey"
          size="30"
        ></holo-identicon>
      </div>

      <div class="flex-1">
        <div
          class="w-full flex justify-between items-center whitespace-nowrap mb-5"
        >
          <BaseAgentProfileNameLarge
            :profile="profile"
            :agentPubKey="agentPubKey"
          />
          <ButtonFollow v-if="!isMyProfile" :agentPubKey="agentPubKey" />
          <button
            v-else-if="!hideEditButton"
            class="btn btn-xs sm:btn-sm btn-secondary rounded-3xl sm:px-4 flex items-center sm:space-x-1 w-26 sm:w-auto"
            @click="emit('click-edit-profile')"
          >
            <IconPencilSharp />
            <div>Edit Profile</div>
          </button>
        </div>

        <div
          v-if="profile.fields[PROFILE_FIELDS.BIO]"
          class="flex justify-start space-x-2 text-md my-5"
        >
          {{ profile.fields[PROFILE_FIELDS.BIO] }}
        </div>

        <div class="border-t-4 border-base-100"></div>

        <template
          v-if="followersCount !== undefined || creatorsCount !== undefined"
        >
          <div
            class="flex justify-start items-center space-x-2 sm:space-x-16 my-1 flex-wrap"
          >
            <button
              v-if="creatorsCount !== undefined"
              class="btn btn-ghost btn-sm"
              @click="emit('click-creators')"
            >
              <span class="font-bold">{{ creatorsCount }}</span>
              <span class="font-normal font-content lowercase">following</span>
            </button>
            <button
              v-if="followersCount !== undefined"
              class="btn btn-ghost btn-sm"
              @click="emit('click-followers')"
            >
              <span class="font-bold">
                {{ followersCount }}
              </span>
              <span class="font-normal font-content lowercase">followers</span>
            </button>
          </div>
          <div class="border-t-4 border-base-100"></div>
        </template>

        <div
          class="flex justify-start items-center space-x-2 sm:space-x-16 text-xs mt-5"
        >
          <div
            v-if="profile.fields[PROFILE_FIELDS.LOCATION]"
            class="flex justify-start space-x-2"
          >
            <IconNavigateCircleOutline />
            <div>{{ profile.fields[PROFILE_FIELDS.LOCATION] }}</div>
          </div>

          <div class="flex justify-start items-center space-x-2 text-xs">
            <IconCalendarOutline />
            <div>Joined ABC</div>
          </div>
        </div>
        <div
          class="flex justify-start items-center space-x-2 mt-2 text-xs break-all"
        >
          <IconShieldHalfOutline />
          <div>{{ encodeHashToBase64(agentPubKey) }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import isEqual from "lodash/isEqual";
import { showError } from "@/utils/toasts";
import {
  AgentPubKey,
  AppAgentClient,
  encodeHashToBase64,
} from "@holochain/client";
import { computed, ComputedRef, inject, onMounted, ref } from "vue";
import ButtonFollow from "@/components/ButtonFollow.vue";
import { ProfilesStore } from "@holochain-open-dev/profiles";
import BaseAgentProfileNameLarge from "@/components/BaseAgentProfileNameLarge.vue";
import { PROFILE_FIELDS } from "@/types/types";
import IconNavigateCircleOutline from "~icons/ion/navigate-circle-outline";
import IconCalendarOutline from "~icons/ion/calendar-outline";
import IconShieldHalfOutline from "~icons/ion/shield-half-outline";
import IconPencilSharp from "~icons/ion/pencil-sharp";

const props = withDefaults(
  defineProps<{
    agentPubKey: AgentPubKey;
    creatorsCount?: number;
    followersCount?: number;
    hideEditButton?: boolean;
  }>(),
  {
    hideEditButton: false,
    creatorsCount: undefined,
    followersCount: undefined,
  }
);
const emit = defineEmits([
  "click-edit-profile",
  "click-creators",
  "click-followers",
]);

const profilesStore = (inject("profilesStore") as ComputedRef<ProfilesStore>)
  .value;
const client = (inject("client") as ComputedRef<AppAgentClient>).value;

const isMyProfile = computed(() => isEqual(props.agentPubKey, client.myPubKey));

const profile = ref();
const loading = ref(false);

onMounted(async () => {
  try {
    loading.value = true;
    const res = await profilesStore.client.getAgentProfile(props.agentPubKey);
    if (res) {
      profile.value = res;
    }
  } catch (error) {
    showError(error);
  } finally {
    loading.value = false;
  }
});
</script>
