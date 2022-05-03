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
            >Mew</q-btn
          >

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

    <q-dialog v-model="isShowingAddMewDialog">
      <q-card>
        <q-card-section class="q-pb-none">
          <div class="q-mb-sm row items-center text-subtitle2">
            <span class="q-mr-sm">Post a mew</span>
            <q-space />
            <q-btn v-close-popup icon="close" flat round dense />
          </div>
        </q-card-section>

        <q-card-section>
          <AddMew
            class="text-center"
            :mew-type="{ original: null }"
            @publish-mew="onPublishReply"
          />
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-layout>
</template>

<script setup lang="ts">
import { useProfileStore } from "@/services/profile-store";
import { QSelectOption } from "quasar";
import { useRouter } from "vue-router";
import { ref } from "vue";
import { showError } from "@/utils/notification";
import { CreateMewInput } from "@/types/types";
import AddMew from "@/components/AddMew.vue";

const store = useProfileStore();
const router = useRouter();
const tab = ref("");
const isShowingAddMewDialog = ref(false);

const searching = ref(false);
const options = ref<QSelectOption[]>([]);
const selection = ref<QSelectOption | null>(null);
const searchTerm = ref("");

const onAddMewClick = () => (isShowingAddMewDialog.value = true);
const onPublishReply = (mew: CreateMewInput) => console.log("mew", mew);

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
