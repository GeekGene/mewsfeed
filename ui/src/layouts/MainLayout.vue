<template>
  <q-layout view="hHh lpR fFf">
    <q-header
      elevated
      class="row justify-center"
    >
      <q-space />

      <q-toolbar class="col col-sm-6 col-lg-5">
        <q-btn
          to="/"
          flat
        >
          <q-icon
            name="svguse:/icons.svg#cat"
            size="lg"
            class="q-mr-xs"
          />
          <div>Clutter</div>
        </q-btn>

        <q-space />

        <q-select
          v-model="selection"
          :options="options"
          :loading="searching"
          input-debounce="0"
          label="Sniff around"
          behavior="menu"
          standout
          use-input
          hide-dropdown-icon
          hide-selected
          dark
          :options-dark="false"
          dense
          class="col-4"
          @filter="search"
          @update:model-value="onAgentSelect"
        >
          <template #prepend>
            <q-icon name="search" />
          </template>
          <template #no-option>
            <q-item>
              <q-item-section class="text-grey">
                {{ searchTerm.length < 3 ? "Minimum 3 characters required" : "Nothing found, Kitty" }}
              </q-item-section>
            </q-item>
          </template>
        </q-select>

        <q-space />

        <q-btn
          to="/feed"
          icon="feed"
          label="Mews"
          flat
        />
        <q-btn
          to="/my-profile"
          flat
        >
          <agent-avatar
            :agent-pub-key="store.myAgentPubKey"
            size="40"
          />
        </q-btn>
      </q-toolbar>

      <q-space />
    </q-header>

    <q-page-container class="row">
      <q-space />
      <router-view class="col col-sm-6 col-lg-5" />
      <q-space />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { useProfileStore } from "@/services/profile-store";
import { QSelectOption } from "quasar";
import { useRouter } from "vue-router";
import { ref } from "vue";
import { showError } from "@/utils/notification";

const store = useProfileStore();
const router = useRouter();
const searching = ref(false);
const options = ref<QSelectOption[]>([]);
const selection = ref<QSelectOption | null>(null);
const searchTerm = ref("");

const search = (inputValue: string, updateFn: (callbackFn: () => void, afterFn?: () => void) => void) => {
  searchTerm.value = inputValue;
  updateFn(async () => {
    if (inputValue === "" || inputValue.length < 3) {
      options.value = [];
    } else {
      try {
        searching.value = true;
        const results = await store.searchProfiles(inputValue);
        options.value = results.map((r) => ({ value: r.agentPubKey,  label: r.profile.fields["Display name"]}));
      } catch (error) {
        showError(error);
      } finally {
        searching.value = false;
      }
    }
  });
};

const onAgentSelect = (option: QSelectOption) => {
  router.push(`/profiles/${option.value}`);
  selection.value = null;
};
</script>