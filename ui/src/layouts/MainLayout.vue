<template>
  <QLayout view="hHh lpr fFf">
    <QHeader elevated class="row justify-center">
      <QToolbar class="col-12 col-md-6 col-xl-5">
        <QTabs v-model="tab" dense inline-label class="col-grow">
          <QRouteTab :to="{ name: ROUTES.home }">
            <QIcon name="svguse:/icons.svg#cat" size="lg" />
            <QTooltip :delay="TOOLTIP_DELAY">Den</QTooltip>
          </QRouteTab>

          <QBtn
            icon="add"
            color="secondary"
            class="q-mx-md"
            @click="onAddMewClick"
          >
            Mew
            <QTooltip :delay="TOOLTIP_DELAY">Create a mew</QTooltip>
          </QBtn>
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
              <profiles-context
                v-if="item.opt.resultType === SearchResult.Agent"
                :store="profilesStore"
              >
                <QItem clickable v-bind="item.itemProps" dense class="q-py-sm">
                  <QItemSection avatar>
                    <agent-avatar
                      :agentPubKey="item.opt.agentPubKey"
                      disable-tooltip
                      disable-copy
                      size="40"
                    ></agent-avatar>
                  </QItemSection>
                  <QItemSection class="text-body2">
                    {{ item.opt.label }}
                  </QItemSection>
                </QItem>
              </profiles-context>
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

          <QRouteTab
            :to="{ name: ROUTES.feed }"
            icon="feed"
            label="Mews Feed"
          />

          <QRouteTab v-if="myProfile" :to="{ name: ROUTES.myProfile }">
            <agent-avatar
              :agentPubKey="clientStore.agentKey"
              size="40"
              disable-tooltip
              disable-copy
            />
            <QTooltip :delay="TOOLTIP_DELAY">Your profile</QTooltip>
          </QRouteTab>
        </QTabs>
      </QToolbar>
    </QHeader>

    <QPageContainer class="row q-mt-xl bg-white">
      <QSpace />
      <RouterView class="col-12 col-md-6 col-xl-5" />
      <QSpace />
    </QPageContainer>
  </QLayout>
</template>

<script setup lang="ts">
import CreateMewDialog from "@/components/CreateMewDialog.vue";
import { PATH, ROUTES } from "@/router";
import { useProfilesStore } from "@/stores/profiles";
import { searchTags } from "@/services/mewsfeed-dna";
import { useMewsfeedStore } from "@/stores/mewsfeed";
import {
  MewTypeName,
  PROFILE_FIELDS,
  TOOLTIP_DELAY,
  SearchResult,
} from "@/types/types";
import { showError } from "@/utils/notification";
import { AgentPubKey, encodeHashToBase64 } from "@holochain/client";
import { QSelectOption, useQuasar } from "quasar";
import { ref, toRaw } from "vue";
import { RouteLocationRaw, useRouter } from "vue-router";
import { isHashtag, TAG_SYMBOLS } from "@/utils/tags";
import { computed } from "vue";
import { useMyProfile, useSearchProfiles } from "@/utils/profile";

type SearchResultOption = QSelectOption<RouteLocationRaw> & {
  agentPubKey?: AgentPubKey;
  resultType: SearchResult;
};

const $q = useQuasar();
const mewsfeedStore = useMewsfeedStore();
const profilesStore = useProfilesStore();
const router = useRouter();
const { myProfile, runWhenMyProfileExists } = useMyProfile();
const { searchProfiles } = useSearchProfiles();
const tab = ref("");

const myAgentPubKey = computed(
  () => profilesStore.value.client.client.myPubKey
);

const searching = ref(false);
const options = ref<SearchResultOption[]>([]);
const selection = ref<QSelectOption | null>(null);
const searchTerm = ref("");

const onPublishMew = () => {
  if (router.currentRoute.value.name === ROUTES.feed) {
    mewsfeedStore.fetchMewsFeed();
  } else {
    router.push({ name: ROUTES.feed });
  }
};

const onAddMewClick = () => {
  runWhenMyProfileExists(() =>
    $q.dialog({
      component: CreateMewDialog,
      componentProps: {
        mewType: { [MewTypeName.Original]: null },
        onPublishMew,
      },
    })
  );
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

        const [profiles, tags] = await Promise.all([
          searchProfiles(inputValue),
          searchTags(inputValue),
        ]);

        const profileOptions: SearchResultOption[] = profiles.map(
          ([agentPubKey, profile]) => ({
            resultType: SearchResult.Agent,
            agentPubKey,
            value: {
              name: ROUTES.profiles,
              params: { agent: encodeHashToBase64(agentPubKey) },
            },
            label: `${profile.fields[PROFILE_FIELDS.DISPLAY_NAME]} (@${
              profile.nickname
            })`,
          })
        );

        options.value = [
          ...profileOptions,
          ...tags.map((tag) => {
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
