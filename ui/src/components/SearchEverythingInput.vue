<template>
  <QSelect
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
      <QIcon name="search" color="white" />
    </template>
    <template #option="item">
      <QItem
        v-if="item.opt.resultType === SearchResult.Agent"
        clickable
        v-bind="item.itemProps"
        dense
        class="q-py-sm"
      >
        <QItemSection avatar>
          <agent-avatar
            :agentPubKey="item.opt.agentPubKey"
            :store="profilesStore"
            disable-tooltip
            disable-copy
            size="40"
          ></agent-avatar>
        </QItemSection>
        <QItemSection class="text-body2">
          {{ item.opt.label }}
        </QItemSection>
      </QItem>
      <QItem
        v-else-if="item.opt.resultType === SearchResult.Hashtag"
        clickable
        v-bind="item.itemProps"
        dense
        class="q-py-sm"
      >
        <QItemSection class="text-body2">
          {{ item.opt.label }}
        </QItemSection>
      </QItem>
      <QItem
        v-else-if="item.opt.resultType === SearchResult.Cashtag"
        clickable
        v-bind="item.itemProps"
        dense
        class="q-py-sm"
      >
        <QItemSection class="text-body2">
          {{ item.opt.label }}
        </QItemSection>
      </QItem>
    </template>
    <template #no-option>
      <QItem>
        <QItemSection>
          {{
            searchTerm.length < 3
              ? "Minimum 3 characters required"
              : "Nothing found, Kitty"
          }}
        </QItemSection>
      </QItem>
    </template>
  </QSelect>
</template>
<script setup lang="ts">
import { isHashtag, TAG_SYMBOLS } from "@/utils/tags";
import { SearchResult, SearchResultOption } from "@/types/types";
import { ROUTES, PATH, router } from "@/router";
import { useSearchProfiles } from "@/utils/profiles";
import { showError } from "@/utils/notification";
import { AppAgentClient, encodeHashToBase64 } from "@holochain/client";
import { QSelect, QSelectOption, QIcon, QItem, QItemSection } from "quasar";
import { ComputedRef, ref, toRaw, inject } from "vue";
import { ProfilesStore } from "@holochain-open-dev/profiles";

const searchProfiles = useSearchProfiles();
const client = (inject("client") as ComputedRef<AppAgentClient>).value;
const profilesStore = (inject("profilesStore") as ComputedRef<ProfilesStore>)
  .value;

const searching = ref(false);
const options = ref<SearchResultOption[]>([]);
const selection = ref<QSelectOption | null>(null);
const searchTerm = ref("");

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
              params: { agent: encodeHashToBase64(agentPubKey) },
            },
            label: profile.fields["Display Name"]
              ? `${profile.fields["Display Name"]} (@${profile.nickname})`
              : `@${profile.nickname}`,
          })
        );

        options.value = [
          ...profileOptions,
          ...tags.map((tag: string) => {
            if (isHashtag(tag)) {
              return {
                resultType: SearchResult.Hashtag,
                value: {
                  name: ROUTES[PATH[TAG_SYMBOLS.HASHTAG]],
                  params: { tag: tag.replace("#", "") },
                },
                label: tag,
              };
            } else {
              return {
                resultType: SearchResult.Cashtag,
                value: {
                  name: ROUTES[PATH[TAG_SYMBOLS.CASHTAG]],
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
  });
};

const onSearchResultSelect = (option: QSelectOption) => {
  router.push(toRaw(option.value));
  selection.value = null;
};
</script>
