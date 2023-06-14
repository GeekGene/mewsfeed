<template>
  <Combobox v-model="selection" class="q-mx-md">
    <div class="col col-grow">
      <div class="q-pa-md row" style="background: rgba(255, 255, 255, 0.075)">
        <QIcon name="search" color="white" size="sm" class="q-mr-sm" />
        <ComboboxInput
          style="
            background-color: transparent;
            border: none;
            outline: none;
            color: white;
          "
          class="col-grow"
          aria-placeholder="Sniff Around"
          placeholder="Sniff Around"
          @change="search($event.target.value)"
        />
      </div>
      <TransitionRoot
        leave="transition ease-in duration-100"
        leave-from="opacity-100"
        leave-to="opacity-0"
        style="width: 100%; position: relative;"
        @after-leave="query = ''"
      >
        <ComboboxOptions
          style="
            padding: 0;
            margin: 0;
            z-index: 50;
            top: 100;
            position: absolute;
            width: 100%;
          "
        >
          <div
            style="
              margin-left: 0;
              background-color: white;
              color: black;
              width: 100%;
            "
            class="shadow-1"
          >
            <QItem v-if="results.length === 0 && query !== ''">
              <QItemSection>
                {{
                  query.length < 3
                    ? "Minimum 3 characters required"
                    : "Nothing found, Kitty"
                }}
              </QItemSection>
            </QItem>

            <ComboboxOption
              v-for="(item, i) in results"
              :key="i"
              v-slot="{ selected, active }"
              as="template"
              :value="item"
            >
              <QItem
                v-if="item.resultType === SearchResult.Agent"
                clickable
                :active="active"
                :focused="selected"
                dense
                class="q-py-sm"
              >
                <QItemSection avatar>
                  <agent-avatar
                    :agentPubKey="item.agentPubKey"
                    :store="profilesStore"
                    disable-tooltip
                    disable-copy
                    size="40"
                  ></agent-avatar>
                </QItemSection>
                <QItemSection class="text-body2">
                  {{ item.label }}
                </QItemSection>
              </QItem>
              <QItem
                v-else-if="item.resultType === SearchResult.Hashtag"
                clickable
                :active="active"
                :focused="selected"
                dense
                class="q-py-sm"
              >
                <QItemSection class="text-body2">
                  {{ item.label }}
                </QItemSection>
              </QItem>
              <QItem
                v-else-if="item.resultType === SearchResult.Cashtag"
                clickable
                :active="active"
                :focused="selected"
                dense
                class="q-py-sm"
              >
                <QItemSection class="text-body2">
                  {{ item.label }}
                </QItemSection>
              </QItem>
            </ComboboxOption>
          </div>
        </ComboboxOptions>
      </TransitionRoot>
    </div>
  </Combobox>
</template>
<script setup lang="ts">
import {
  Combobox,
  ComboboxInput,
  ComboboxOptions,
  ComboboxOption,
  TransitionRoot,
} from "@headlessui/vue";

import { isHashtag } from "@/utils/tags";
import { SearchResult, SearchResultOption } from "@/types/types";
import { ROUTES, router } from "@/router";
import { useSearchProfiles } from "@/utils/profiles";
import { showError } from "@/utils/toasts";
import { AppAgentClient, encodeHashToBase64 } from "@holochain/client";
import { QSelectOption, QIcon, QItem, QItemSection } from "quasar";
import { ComputedRef, ref, toRaw, inject } from "vue";
import { ProfilesStore } from "@holochain-open-dev/profiles";
import { watch } from "vue";

const searchProfiles = useSearchProfiles();
const client = (inject("client") as ComputedRef<AppAgentClient>).value;
const profilesStore = (inject("profilesStore") as ComputedRef<ProfilesStore>)
  .value;

const searching = ref(false);
const results = ref<SearchResultOption[]>([]);
const selection = ref<QSelectOption>();
const query = ref("");

const search = async (inputValue: string) => {
  query.value = inputValue;

  // Remove leading '@', '#', or '$' character from search query
  inputValue = inputValue.replace(/^[@#$]/, "");

  if (inputValue === "" || inputValue.length < 3) {
    results.value = [];
  } else {
    try {
      searching.value = true;

      const [profiles, tags] = await Promise.all([
        searchProfiles(inputValue),
        client.callZome({
          role_name: "mewsfeed",
          zome_name: "mews",
          fn_name: "search_tags",
          payload: {
            query: inputValue,
            limit: 5,
          },
        }),
      ]);

      const profileOptions: SearchResultOption[] = profiles.map(
        ([agentPubKey, profile]) => ({
          resultType: SearchResult.Agent,
          agentPubKey,
          value: {
            name: ROUTES.profile,
            params: { agentPubKey: encodeHashToBase64(agentPubKey) },
          },
          label: profile.fields["Display Name"]
            ? `${profile.fields["Display Name"]} (@${profile.nickname})`
            : `@${profile.nickname}`,
        })
      );

      results.value = [
        ...profileOptions,
        ...tags.map((tag: string) => {
          if (isHashtag(tag)) {
            return {
              resultType: SearchResult.Hashtag,
              value: {
                name: ROUTES.hashtag,
                params: { tag: tag.replace("#", "") },
              },
              label: tag,
            };
          } else {
            return {
              resultType: SearchResult.Cashtag,
              value: {
                name: ROUTES.cashtag,
                params: { tag: tag.replace("$", "") },
              },
              label: tag,
            };
          }
        }),
      ];
    } catch (error) {
      showError(error);
    } finally {
      searching.value = false;
    }
  }
};
watch(selection, (result: any) => {
  if (result) {
    router.push(toRaw(result.value));
    query.value = "";
    selection.value = undefined;
  }
});
</script>
