<template>
  <q-layout view="hHh lpr fFf">
    <q-header elevated class="row justify-center">
      <q-toolbar class="col-12 col-md-6 col-xl-5">
        <q-tabs v-model="tab" dense inline-label class="col-grow">
          <q-route-tab :to="{ name: ROUTES.home }">
            <q-icon name="svguse:/icons.svg#cat" size="lg" />
            <q-tooltip :delay="TOOLTIP_DELAY">Den</q-tooltip>
          </q-route-tab>

          <q-btn
            icon="add"
            color="secondary"
            class="q-mx-md"
            @click="onAddMewClick"
          >
            Mew
            <q-tooltip :delay="TOOLTIP_DELAY">Create a mew</q-tooltip>
          </q-btn>
          <q-select
            v-model="selection"
            :options="options"
            :loading="searching"
            input-debounce="0"
            label="Sniff around"
            label-color="white"
            filled
            behavior="menu"
            standout
            use-input
            hide-dropdown-icon
            hide-selected
            dark
            class="col q-mx-md"
            :options-dark="false"
            @filter="search"
            @update:model-value="onSearchResultSelect"
          >
            <template #prepend>
              <q-icon name="search" color="white" />
            </template>
            <template #option="item">
              <profiles-context
                v-if="item.opt.resultType === SearchResult.Agent"
                :store="profilesStore"
              >
                <q-item clickable v-bind="item.itemProps" dense class="q-py-sm">
                  <q-item-section avatar>
                    <agent-avatar
                      :agentPubKey="item.opt.agentPubKey"
                      size="40"
                    />
                  </q-item-section>
                  <q-item-section class="text-body2">
                    {{ item.opt.label }}
                  </q-item-section>
                </q-item>
              </profiles-context>
              <q-item
                v-else-if="item.opt.resultType === SearchResult.Hashtag"
                clickable
                v-bind="item.itemProps"
                dense
                class="q-py-sm"
              >
                <q-item-section class="text-body2">
                  {{ item.opt.label }}
                </q-item-section>
              </q-item>
              <q-item
                v-else-if="item.opt.resultType === SearchResult.Cashtag"
                clickable
                v-bind="item.itemProps"
                dense
                class="q-py-sm"
              >
                <q-item-section class="text-body2">
                  {{ item.opt.label }}
                </q-item-section>
              </q-item>
            </template>
            <template #no-option>
              <q-item>
                <q-item-section>
                  {{
                    searchTerm.length < 3
                      ? "Minimum 3 characters required"
                      : "Nothing found, Kitty"
                  }}
                </q-item-section>
              </q-item>
            </template>
          </q-select>

          <q-route-tab
            :to="{ name: ROUTES.feed }"
            icon="feed"
            label="Mews Feed"
          />

          <q-route-tab v-if="myProfile" :to="{ name: ROUTES.myProfile }">
            <agent-avatar :agentPubKey="myAgentPubKey" size="40" />
            <q-tooltip :delay="TOOLTIP_DELAY">Your profile</q-tooltip>
          </q-route-tab>
        </q-tabs>
      </q-toolbar>
    </q-header>

    <q-page-container class="row q-mt-xl bg-white">
      <q-space />
      <router-view class="col-12 col-md-6 col-xl-5" />
      <q-space />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import CreateMewDialog from "@/components/CreateMewDialog.vue";
import { PATH, ROUTES } from "@/router";
import { useProfilesStore } from "@/services/profiles-store";
import { searchCashtags, searchHashtags } from "@/services/clutter-dna";
import { useClutterStore } from "@/stores";
import {
  MewTypeName,
  PROFILE_FIELDS,
  TOOLTIP_DELAY,
  SearchResult,
} from "@/types/types";
import { showError } from "@/utils/notification";
import { AgentPubKey, encodeHashToBase64 } from "@holochain/client";
import { QSelectOption, useQuasar } from "quasar";
import { ref } from "vue";
import { RouteLocationRaw, useRouter } from "vue-router";
import { TAG_SYMBOLS } from "@/utils/tags";
import { Profile } from "@holochain-open-dev/profiles-dev/ui";
import { computed, onUnmounted } from "vue";

type SearchResultOption = QSelectOption<RouteLocationRaw> & {
  agentPubKey?: AgentPubKey;
  resultType: SearchResult;
};

const $q = useQuasar();

const store = useClutterStore();
const profilesStore = useProfilesStore();
const router = useRouter();
const tab = ref("");
const myProfile = ref<undefined | Profile>(undefined);

const myAgentPubKey = computed(
  () => profilesStore.value.client.client.myPubKey
);

const unsubscribe = profilesStore.value.myProfile.subscribe((res: any) => {
  myProfile.value = res.value;
});
onUnmounted(unsubscribe);

const searching = ref(false);
const options = ref<SearchResultOption[]>([]);
const selection = ref<QSelectOption | null>(null);
const searchTerm = ref("");

const onPublishMew = () => {
  if (router.currentRoute.value.name === ROUTES.feed) {
    store.fetchMewsFeed();
  } else {
    router.push({ name: ROUTES.feed });
  }
};

const onAddMewClick = () => {
  $q.dialog({
    component: CreateMewDialog,
    componentProps: {
      mewType: { [MewTypeName.Original]: null },
      onPublishMew,
    },
  });
};

const search = (
  inputValue: string,
  updateFn: (callbackFn: () => void, afterFn?: () => void) => void
) => {
  searchTerm.value = inputValue;
  updateFn(async () => {
    // Remove leading '@', '#', or '$' character from search query
    inputValue = inputValue.replace(/^[@#$]/, "");

    if (inputValue === "" || inputValue.length < 3) {
      options.value = [];
    } else {
      try {
        searching.value = true;

        const profilesPromise = new Promise<
          ReadonlyMap<Uint8Array, Profile | undefined>
        >((resolve) => {
          profilesStore.value.client.searchAgents(inputValue).then((agents) => {
            profilesStore.value.agentsProfiles(agents).subscribe((value) => {
              if (value.status === "complete") {
                resolve(value.value);
              }
            });
          });
        });

        const [profiles, hashtags, cashtags] = await Promise.all([
          profilesPromise,
          searchHashtags(inputValue),
          searchCashtags(inputValue),
        ]);

        const profileOptions: SearchResultOption[] = [];
        profiles.forEach((value, key) => {
          profileOptions.push({
            resultType: SearchResult.Agent,
            agentPubKey: key,
            value: {
              name: ROUTES.profiles,
              params: { agent: encodeHashToBase64(key) },
            },
            label: `${value.fields[PROFILE_FIELDS.DISPLAY_NAME]} (@${
              value.nickname
            })`,
          });
        });

        options.value = [
          ...profileOptions,
          ...hashtags.map((hashtag) => ({
            resultType: SearchResult.Hashtag,
            value: {
              name: ROUTES[PATH[TAG_SYMBOLS.HASHTAG]],
              params: { tag: hashtag },
            },
            label: `#${hashtag}`,
          })),
          ...cashtags.map((cashtag) => ({
            resultType: SearchResult.Cashtag,
            value: {
              name: ROUTES[PATH[TAG_SYMBOLS.CASHTAG]],
              params: { tag: cashtag },
            },
            label: `$${cashtag}`,
          })),
        ];
      } catch (error) {
        showError(error);
      } finally {
        searching.value = false;
      }
    }
  });
};

const onSearchResultSelect = (option: QSelectOption) => {
  router.push(option.value);
  selection.value = null;
};
</script>
