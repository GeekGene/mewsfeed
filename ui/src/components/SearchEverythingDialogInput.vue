<template>
  <Combobox v-model="selection" class="q-mx-md">
    <div class="my-8">
      <div
        class="relative transform overflow-hidden rounded-3xl bg-base-100 px-4 pb-4 pt-5 text-left transition-all w-full sm:p-6"
      >
        <div class="flex justify-start">
          <IconSearch class="text-3xl mr-4" />
          <ComboboxInput
            id="searcheverythinginput"
            ref="inputFieldRef"
            class="font-title uppercase bg-transparent border-0 outline-none w-full"
            aria-placeholder="Sniff Around"
            placeholder="sniff around"
            @change="search($event.target.value)"
          />
        </div>
      </div>
      <TransitionRoot
        leave="transition ease-in duration-100"
        leave-from="opacity-100"
        leave-to="opacity-0"
        style="width: 100%; position: relative"
        @after-leave="query = ''"
      >
        <div
          v-if="query !== ''"
          class="relative transform overflow-hidden rounded-3xl bg-base-100 text-left transition-all w-full mt-2 sm:mt-4"
        >
          <ComboboxOptions>
            <div>
              <div v-if="results.length === 0" class="p-4">
                {{
                  query.length < 3
                    ? "Minimum 3 characters required"
                    : "Nothing found, Kitty"
                }}
              </div>

              <ComboboxOption
                v-for="(item, i) in results"
                :key="i"
                v-slot="{ active }"
                as="template"
                :value="item"
              >
                <div
                  v-if="item.resultType === SearchResult.Agent"
                  class="cursor-pointer p-4 flex justify-start items-center space-x-4"
                  :class="{ 'bg-neutral-focus text-neutral-content': active }"
                >
                  <agent-avatar
                    :agentPubKey="item.agentPubKey"
                    :store="profilesStore"
                    disable-tooltip
                    disable-copy
                    size="40"
                  ></agent-avatar>
                  <div>
                    {{ item.label }}
                  </div>
                </div>
                <div
                  v-else-if="item.resultType === SearchResult.Hashtag"
                  class="cursor-pointer p-4"
                  :class="{ 'bg-neutral-focus text-neutral-content': active }"
                >
                  <div>
                    {{ item.label }}
                  </div>
                </div>
                <div
                  v-else-if="item.resultType === SearchResult.Cashtag"
                  class="cursor-pointer p-4"
                  :class="{ 'bg-neutral-focus text-neutral-content': active }"
                >
                  <div>
                    {{ item.label }}
                  </div>
                </div>
              </ComboboxOption>
            </div>
          </ComboboxOptions>
        </div>
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
import { ROUTES } from "@/router";
import { useSearchProfiles } from "@/utils/profiles";
import { useToasts } from "@/stores/toasts";
import { AppClient, encodeHashToBase64 } from "@holochain/client";
import { ComputedRef, ref, toRaw, inject } from "vue";
import { ProfilesStore } from "@holochain-open-dev/profiles";
import { watch } from "vue";
import IconSearch from "~icons/ion/search";

const emit = defineEmits(["selected"]);

const searchProfiles = useSearchProfiles();
const client = (inject("client") as ComputedRef<AppClient>).value;
const profilesStore = (inject("profilesStore") as ComputedRef<ProfilesStore>)
  .value;
const { showError } = useToasts();

const inputFieldRef = ref();
const searching = ref(false);
const results = ref<SearchResultOption[]>([]);
const selection = ref<SearchResultOption>();
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
    emit("selected", toRaw(result.value));
    query.value = "";
    selection.value = undefined;
  }
});
</script>
