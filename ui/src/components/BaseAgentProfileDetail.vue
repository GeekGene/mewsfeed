<template>
  <div
    class="h-full w-full text-base-content font-content font-normal"
    v-bind="$attrs"
  >
    <div class="flex space-x-6 h-full p-4">
      <div class="flex flex-col justify-between">
        <div
          v-tooltip.bottom="{
            disabled: profile && !!profile.fields.avatar,
            content: encodeHashToBase64(agentPubKey),
            popperClass: 'text-xs',
            triggers: ['hover'],
          }"
        >
          <agent-avatar
            v-if="!enableCopyAgentPubKey"
            class="hidden sm:block"
            :agentPubKey="agentPubKey"
            size="80"
            disable-tooltip
            disable-copy
          />
          <BaseCopyOnClick
            v-else
            :text="encodeHashToBase64(agentPubKey)"
            notice-text="Copied public key"
            class="hidden sm:block"
          >
            <agent-avatar
              :agentPubKey="agentPubKey"
              size="80"
              disable-tooltip
              disable-copy
            />
          </BaseCopyOnClick>
          <agent-avatar
            v-if="!enableCopyAgentPubKey"
            class="block sm:hidden"
            :agentPubKey="agentPubKey"
            size="50"
            disable-tooltip
            disable-copy
          />
          <BaseCopyOnClick
            v-else
            :text="encodeHashToBase64(agentPubKey)"
            notice-text="Copied public key"
            class="block sm:hidden"
          >
            <agent-avatar
              :agentPubKey="agentPubKey"
              size="50"
              disable-tooltip
              disable-copy
            />
          </BaseCopyOnClick>
        </div>

        <div
          v-if="profile?.fields.avatar"
          v-tooltip.bottom="{
            content: encodeHashToBase64(agentPubKey),
            popperClass: 'text-xs',
            triggers: ['hover'],
          }"
          class="mt-8 relative w-fit flex items-end"
        >
          <holo-identicon
            v-if="!enableCopyAgentPubKey"
            :hash="agentPubKey"
            size="30"
            disable-tooltip
            disable-copy
          ></holo-identicon>
          <holo-identicon
            v-else
            :hash="agentPubKey"
            size="30"
            disable-tooltip
          ></holo-identicon>
        </div>
      </div>

      <div class="flex-1 flex flex-col justify-between">
        <div
          class="w-full flex justify-between items-start whitespace-nowrap mb-5 space-x-14"
        >
          <BaseAgentProfileNameLarge
            :profile="profile"
            :agentPubKey="agentPubKey"
          />
          <ButtonFollow
            v-if="!isMyProfile"
            :agentPubKey="agentPubKey"
            :big="bigFollowButton"
            @toggle-follow="(val) => emit('toggle-follow', val)"
          />
          <div v-else-if="!hideEditButton" class="flex flex-col space-y-2">
            <button
              class="btn btn-xs sm:btn-md px-4 btn-outline rounded-3xl flex justify-center items-center space-x-2"
              @click="emit('click-edit-profile')"
            >
              <IconPencilSharp />
              <div>Edit Profile</div>
            </button>
            <BaseThemeSelect />
          </div>
        </div>

        <template v-if="profile">
          <div
            v-if="profile.fields[PROFILE_FIELDS.BIO]"
            class="flex justify-start space-x-2 text-md mb-5"
          >
            {{ profile.fields[PROFILE_FIELDS.BIO] }}
          </div>
        </template>
        <div v-else>
          <div class="flex flex-col w-full space-y-2 my-4">
            <div class="h-1.5 bg-base-200 rounded-full w-5/6"></div>
            <div class="h-1.5 bg-base-200 rounded-full w-3/4"></div>
            <div class="h-1.5 bg-base-200 rounded-full w-5/6"></div>
            <div class="h-1.5 bg-base-200 rounded-full w-3/4"></div>
          </div>
        </div>

        <div>
          <div class="border-t-[1px] border-base-content/10"></div>

          <template
            v-if="followersCount !== undefined || creatorsCount !== undefined"
          >
            <div
              class="flex justify-start items-center space-x-2 sm:space-x-16 my-1 flex-wrap"
            >
              <button
                v-if="creatorsCount !== undefined"
                class="btn btn-ghost btn-xs"
                :class="{ 'btn-disabled': creatorsCount === 0 }"
                @click="emit('click-creators')"
              >
                <span class="font-bold">{{ creatorsCount }}</span>
                <span class="font-normal font-content lowercase"
                  >following</span
                >
              </button>
              <button
                v-if="followersCount !== undefined"
                class="btn btn-ghost btn-xs"
                :class="{ 'btn-disabled': followersCount === 0 }"
                @click="emit('click-followers')"
              >
                <span class="font-bold">
                  {{ followersCount }}
                </span>
                <span class="font-normal font-content lowercase"
                  >followers</span
                >
              </button>
            </div>
            <div class="border-t-[1px] border-base-content/10"></div>
          </template>

          <div
            class="flex justify-start items-center space-x-2 sm:space-x-16 text-xs mt-3"
          >
            <template v-if="profile">
              <div
                v-if="profile.fields[PROFILE_FIELDS.LOCATION]"
                class="flex justify-start items-center space-x-2 text-xs font-mono px-2"
              >
                <IconNavigateCircleOutline />
                <div>{{ profile.fields[PROFILE_FIELDS.LOCATION] }}</div>
              </div>
            </template>
            <div v-else>
              <IconNavigateCircleOutline />
              <div
                class="h-1.5 bg-base-200 rounded-full w-1/3 animate-pulse"
              ></div>
            </div>

            <div
              v-if="joinedTimestamp !== undefined"
              class="flex justify-start items-center space-x-2 text-xs font-mono px-2"
            >
              <IconCalendarOutline />
              <div>Joined <BaseTimestamp :timestamp="joinedTimestamp" /></div>
            </div>
            <div v-else>
              <IconCalendarOutline />
              <div
                class="h-1.5 bg-base-200 rounded-full w-1/3 animate-pulse"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import isEqual from "lodash/isEqual";
import {
  AgentPubKey,
  AppAgentClient,
  encodeHashToBase64,
} from "@holochain/client";
import { computed, ComputedRef, inject } from "vue";
import ButtonFollow from "@/components/ButtonFollow.vue";
import { Profile } from "@holochain-open-dev/profiles";
import BaseAgentProfileNameLarge from "@/components/BaseAgentProfileNameLarge.vue";
import { PROFILE_FIELDS } from "@/types/types";
import IconNavigateCircleOutline from "~icons/ion/navigate-circle-outline";
import IconCalendarOutline from "~icons/ion/calendar-outline";
import IconPencilSharp from "~icons/ion/pencil-sharp";
import { Timestamp } from "@holochain/client";
import BaseCopyOnClick from "@/components/BaseCopyOnClick.vue";

const props = withDefaults(
  defineProps<{
    profile?: Profile;
    joinedTimestamp?: Timestamp;
    agentPubKey: AgentPubKey;
    creatorsCount?: number;
    followersCount?: number;
    hideEditButton?: boolean;
    enableCopyAgentPubKey?: boolean;
    bigFollowButton?: boolean;
  }>(),
  {
    profile: undefined,
    joinedTimestamp: undefined,
    hideEditButton: false,
    creatorsCount: undefined,
    followersCount: undefined,
    enableCopyAgentPubKey: false,
    bigFollowButton: true,
  }
);
const emit = defineEmits([
  "click-edit-profile",
  "click-creators",
  "click-followers",
  "toggle-follow",
]);

const client = (inject("client") as ComputedRef<AppAgentClient>).value;
const isMyProfile = computed(() => isEqual(props.agentPubKey, client.myPubKey));
</script>
