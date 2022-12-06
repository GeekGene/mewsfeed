<template>
  <q-layout view="hHh lpr fFf">
    <q-header elevated class="row justify-center">
      <q-toolbar class="col-12 col-md-6 col-xl-4">
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
            <q-tooltip :delay="TOOLTIP_DELAY">Add a mew</q-tooltip>
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
            @update:model-value="onAgentSelect"
          >
            <template #prepend>
              <q-icon name="search" color="white" />
            </template>
            <template #option="item">
              <profiles-context :store="profilesStore">
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

          <q-route-tab :to="{ name: ROUTES.myProfile }">
            <agent-avatar
              :agentPubKey="profilesStore.myAgentPubKey"
              size="40"
            />
            <q-tooltip :delay="TOOLTIP_DELAY">Your profile</q-tooltip>
          </q-route-tab>
        </q-tabs>
      </q-toolbar>
    </q-header>

    <q-page-container class="row q-mt-xl bg-white">
      <q-space />
      <router-view class="col-12 col-md-6 col-xl-4" />
      <q-space />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import CreateMewDialog from "@/components/CreateMewDialog.vue";
import { ROUTES } from "@/router";
import { useProfilesStore } from "@/services/profiles-store";
import { useClutterStore } from "@/stores";
import { MewTypeName, PROFILE_FIELDS, TOOLTIP_DELAY } from "@/types/types";
import { showError } from "@/utils/notification";
import { serializeHash } from "@holochain-open-dev/utils";
import { AgentPubKey } from "@holochain/client";
import { QSelectOption, useQuasar } from "quasar";
import { ref } from "vue";
import { useRouter } from "vue-router";

const $q = useQuasar();

const store = useClutterStore();
const profilesStore = useProfilesStore();
const router = useRouter();
const tab = ref("");

const searching = ref(false);
const options = ref<Array<QSelectOption & { agentPubKey: AgentPubKey }>>([]);
const selection = ref<QSelectOption | null>(null);
const searchTerm = ref("");

const onPublishMew = () => {
  if (router.currentRoute.value.name === ROUTES.feed) {
    store.fetchMewsFeed();
  } else {
    router.push({ name: ROUTES.feed });
  }
};

const onAddMewClick = () =>
  $q.dialog({
    component: CreateMewDialog,
    componentProps: { mewType: { [MewTypeName.Original]: null }, onPublishMew },
  });

const search = (
  inputValue: string,
  updateFn: (callbackFn: () => void, afterFn?: () => void) => void
) => {
  searchTerm.value = inputValue;
  updateFn(async () => {
    if (inputValue === "" || inputValue.length < 3) {
      options.value = [];
    } else {
      try {
        searching.value = true;
        const profilesMap = await profilesStore.value.searchProfiles(
          inputValue
        );
        options.value = profilesMap.entries().map(([key, value]) => ({
          value: serializeHash(key),
          agentPubKey: key,
          label: `${value.fields[PROFILE_FIELDS.DISPLAY_NAME]} (@${
            value.nickname
          })`,
        }));
      } catch (error) {
        showError(error);
      } finally {
        searching.value = false;
      }
    }
  });
};

const onAgentSelect = (option: QSelectOption) => {
  router.push({ name: ROUTES.profiles, params: { agent: option.value } });
  selection.value = null;
};
</script>
