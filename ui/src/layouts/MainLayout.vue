<template>
  <q-layout view="hHh lpR fFf">
    <q-header elevated class="row justify-center">
      <q-toolbar class="col-12 col-md-6">
        <q-tabs v-model="tab" dense inline-label class="col-grow">
          <q-route-tab to="/">
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
                <q-item-section class="text-grey">
                  {{
                    searchTerm.length < 3
                      ? "Minimum 3 characters required"
                      : "Nothing found, Kitty"
                  }}
                </q-item-section>
              </q-item>
            </template>
          </q-select>

          <q-route-tab to="/feed" icon="feed" label="Mews Feed" />

          <q-route-tab to="/my-profile">
            <agent-avatar :agent-pub-key="store.myAgentPubKey" size="40" />
          </q-route-tab>
        </q-tabs>
      </q-toolbar>
    </q-header>

    <q-page-container class="row">
      <q-space />
      <router-view class="col-12 col-md-6" />
      <q-space />
    </q-page-container>

    <create-mew-dialog
      v-if="isCreatingMew"
      :mew-type="{ original: null }"
      @close="isCreatingMew = false"
    >
      <template #title>Create a new mew:</template>
    </create-mew-dialog>
  </q-layout>
</template>

<script setup lang="ts">
import { useProfileStore } from "@/services/profile-store";
import { QSelectOption } from "quasar";
import { useRouter } from "vue-router";
import { ref } from "vue";
import { showError } from "@/utils/notification";
import { Routes } from "@/router";
import CreateMewDialog from "@/components/CreateMewDialog.vue";

const store = useProfileStore();
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
        const results = await store.searchProfiles(inputValue);
        options.value = results.map((r) => ({
          value: r.agentPubKey,
          label: r.profile.fields["Display name"],
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
  router.push({ name: Routes.Profiles, params: { agent: option.value } });
  selection.value = null;
};
</script>
