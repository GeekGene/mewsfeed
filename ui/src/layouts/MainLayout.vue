<template>
  <q-layout view="hHh lpr fFf">
    <q-header elevated class="row justify-center">
      <q-toolbar class="col-12 col-md-6">
        <q-tabs v-model="tab" dense inline-label class="col-grow">
          <q-route-tab :to="{ name: ROUTES.home }">
            <q-icon name="svguse:/icons.svg#cat" size="lg" />
          </q-route-tab>

          <q-btn
            icon="add"
            color="secondary"
            class="q-mx-md"
            @click="onAddMewClick"
          >
            Mew
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
            dense
            @filter="search"
            @update:model-value="onAgentSelect"
          >
            <template #prepend>
              <q-icon name="search" color="white" />
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
          </q-route-tab>
        </q-tabs>
      </q-toolbar>
    </q-header>

    <q-page-container class="row q-mt-xl bg-white">
      <q-space />
      <router-view class="col-12 col-md-6" />
      <q-space />
    </q-page-container>

    <create-mew-dialog
      v-if="isCreatingMew"
      :mew-type="{ original: null }"
      @close="isCreatingMew = false"
    >
      <template #title>Create a mew:</template>
    </create-mew-dialog>
  </q-layout>
</template>

<script setup lang="ts">
import { useProfilesStore } from "@/services/profiles-store";
import { QSelectOption } from "quasar";
import { useRouter } from "vue-router";
import { ref } from "vue";
import { showError } from "@/utils/notification";
import { ROUTES } from "@/router";
import CreateMewDialog from "@/components/CreateMewDialog.vue";
import { serializeHash } from "@holochain-open-dev/utils";
import { PROFILE_FIELDS } from "@/types/types";

const profilesStore = useProfilesStore();
const router = useRouter();
const tab = ref("");

const searching = ref(false);
const options = ref<QSelectOption[]>([]);
const selection = ref<QSelectOption | null>(null);
const searchTerm = ref("");

const isCreatingMew = ref(false);
const onAddMewClick = () => (isCreatingMew.value = true);

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
