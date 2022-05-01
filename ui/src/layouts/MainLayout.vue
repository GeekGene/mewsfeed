<template>
  <q-layout view="hHh lpr lfr">
    <q-header elevated class="row justify-center">
      <q-toolbar class="col col-sm-6 col-lg-5">
        <q-tabs v-model="tab" dense inline-label>
          <q-route-tab to="/">
            <q-icon name="svguse:/icons.svg#cat" size="lg" />
          </q-route-tab>

          <q-space />

          <q-select
            v-model="selection"
            :options="options"
            :loading="searching"
            input-debounce="0"
            label="Sniff around"
            label-color="secondary"
            behavior="menu"
            standout
            use-input
            hide-dropdown-icon
            hide-selected
            dark
            :options-dark="false"
            dense
            class="col-4 bg-white"
            @filter="search"
            @update:model-value="onAgentSelect"
          >
            <template #prepend>
              <q-icon name="search" color="secondary" />
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

          <q-space />

          <q-route-tab to="/feed" icon="feed" label="Mews" />

          <q-space />

          <q-route-tab to="/my-profile">
            <agent-avatar :agent-pub-key="store.myAgentPubKey" size="40" />
            <div class="lg q-ml-sm text-weight-bold">Profile</div>
          </q-route-tab>
        </q-tabs>
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" side="left">
      <sidebar-left />
    </q-drawer>

    <q-drawer v-model="rightDrawerOpen" side="right" />

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { useProfileStore } from "@/services/profile-store";
import { QSelectOption } from "quasar";
import { useRouter } from "vue-router";
import { ref } from "vue";
import { showError } from "@/utils/notification";
import SidebarLeft from "@/components/SidebarLeft.vue";

const store = useProfileStore();
const router = useRouter();
const tab = ref("");
const leftDrawerOpen = ref(true);
const rightDrawerOpen = ref(true);

const searching = ref(false);
const options = ref<QSelectOption[]>([]);
const selection = ref<QSelectOption | null>(null);
const searchTerm = ref("");

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
  router.push(`/profiles/${option.value}`);
  selection.value = null;
};
</script>
