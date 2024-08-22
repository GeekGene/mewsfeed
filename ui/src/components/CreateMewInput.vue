<template>
  <div class="w-full flex justify-start items-start p-3">
    <RouterLink
      v-if="myProfile"
      class="px-0 py-0 z-10"
      alt="My Profile"
      :to="{
        name: ROUTES.profile,
        params: { agentPubKey: encodeHashToBase64(client.myPubKey) },
      }"
    >
      <agent-avatar
        :agentPubKey="client.myPubKey"
        :store="profilesStore"
        size="54"
        disable-tooltip
        disable-copy
      />
    </RouterLink>

    <div class="flex-1 px-4 sm:px-8 h-full">
      <div
        v-if="isMewTypeWithText"
        ref="mewContainer"
        class="h-full w-full flex flex-col justify-between items-start relative"
      >
        <div
          ref="mewContainerInput"
          contenteditable
          class="overflow-auto w-full break-all outline-none border-0 outline-0 mew-container-input text-left"
          data-placeholder="What's mewing on?"
          @keydown="onKeyDown"
          @keyup="onKeyUp"
          @mouseup="onMouseUp"
          @paste="onPaste"
        ></div>

        <div class="w-full flex justify-between items-end mt-1">
          <div class="flex justify-start items-center space-x-4">
            <IconHelpCircleOutline
              v-tooltip.bottom="{
                html: true,
                content:
                  'You can mention people with @ and use #hashtags and $cashtags as well as ^links in a mew. <br /></br />You can press Ctrl/Cmd + Enter to publish.',
                popperClass: 'w-96',
                triggers: ['hover'],
              }"
              class="w-5 h-5 text-base-content/50"
            />
          </div>

          <div
            v-if="!isMewEmpty"
            class="flex justify-start items-center text-xs space-x-1"
          >
            <div
              :class="{
                'text-error': !mewLengthOk,
                'text-base-300': mewLengthOk,
              }"
            >
              {{ mewContentLength }} /
              {{
                min([TRUNCATED_MEW_LENGTH, dnaProperties.mew_characters_max])
              }}
              Chars
            </div>
            <div v-if="isMewUnderfull" class="text-error">
              ({{ dnaProperties.mew_characters_min }} Min)
            </div>
            <div v-if="isMewRequireTruncation" class="text-error">
              (Overflow will be hidden)
            </div>
          </div>
        </div>

        <div
          id="link-target-input-container"
          class="hidden absolute bg-base-200 text-base-content rounded-md text-xs sm:text-sm"
        >
          <div class="relative">
            <input
              ref="linkTargetInput"
              v-model="linkTarget"
              type="text"
              placeholder="Paste a URL to create a link"
              class="block w-full rounded-md border-0 outline-none px-2 py-1 sm:leading-6 bg-base-200 text-base-content"
              :aria-invalid="!linkTargetValid"
              aria-label="Enter a URL to create a link"
              @keydown.enter="createLinkTag"
              @keydown.space="createLinkTag"
              @keydown.tab="createLinkTag"
              @blur="resetLinkTargetInput"
            />
            <div
              v-if="!linkTargetValid"
              class="pointer-events-none text-error inset-y-0 right-0 flex justify-start items-center space-x-2 px-2 py-1 border-t-2 border-base-300 border-solid"
            >
              <IconAlertCircleOutline class="h-5 w-5" aria-hidden="true" />
              <div>Link target must be valid URL</div>
            </div>
          </div>
        </div>

        <div
          id="autocompleter"
          class="hidden absolute bg-base-200 rounded-md text-xs sm:text-sm p-2"
        >
          <div v-if="currentAgentSearch.length < 3">Min 3 chars</div>

          <div
            v-else-if="autocompleterLoading"
            class="flex justify-center w-32"
          >
            <div
              class="loading loading-spinner loading-sm m-2 text-base-content"
            ></div>
          </div>

          <div
            v-else-if="agentAutocompletions.length === 0"
            class="text-base-content"
          >
            Nothing found, Kitty
          </div>

          <div v-else>
            <a
              v-for="([agentPubKey, profile], i) in agentAutocompletions"
              :key="i"
              tabindex="0"
              class="cursor-pointer flex justify-start items-center space-x-2 p-2 rounded-md hover:bg-neutral-focus hover:text-neutral-content focus:bg-neutral-focus focus:text-neutral-content"
              @click="onAutocompleteAgentSelect(agentPubKey, profile)"
              @keydown.enter.prevent="
                onAutocompleteAgentSelect(agentPubKey, profile)
              "
              @keydown="onAutocompleteKeyDown"
            >
              <BaseAgentProfileName
                :profile="profile.entry"
                :agentPubKey="agentPubKey"
              />
            </a>
          </div>
        </div>
      </div>
    </div>

    <button
      ref="createButtonInput"
      class="btn btn-neutral btn-sm sm:btn-md rounded-full"
      :class="{
        'btn-disabled':
          (isMewEmpty || isMewOverfull || isMewUnderfull) && isMewTypeWithText,
      }"
      :loading="saving"
      tabindex="0"
      @click="publishMew()"
      @keydown.enter.prevent="publishMew()"
    >
      <div class="flex justify-start items-center space-x-1 sm:space-x-2">
        <IconArrowForwardOutline class="text-xl" />
        <div>
          <template v-if="MewTypeName.Mewmew in props.mewType">Mewmew</template>
          <template v-else>
            Send <br class="inline-block sm:hidden" />Mew
          </template>
        </div>
      </div>
    </button>
  </div>

  <CreateProfileIfNotFoundDialog
    v-model="showCreateProfileDialog"
    @profile-created="(profile: Profile) => publishMew(profile)"
  />
</template>

<script setup lang="ts">
import { useSearchProfiles } from "@/utils/profiles";
import { Profile } from "@holochain-open-dev/profiles";
import { isMentionTag, isRawUrl, isLinkTag, TAG_SYMBOLS } from "@/utils/tags";
import { onMounted, ref, computed, ComputedRef, inject } from "vue";
import {
  Mew,
  LinkTarget,
  LinkTargetName,
  MewsfeedDnaProperties,
  MewType,
  UrlLinkTarget,
  MentionLinkTarget,
  FeedMew,
  MewTypeName,
} from "../types/types";
import {
  AgentPubKey,
  decodeHashFromBase64,
  encodeHashToBase64,
} from "@holochain/client";
import min from "lodash/min";
import union from "lodash/union";
import flatten from "lodash/flatten";
import { AppClient } from "@holochain/client";
import CreateProfileIfNotFoundDialog from "@/components/CreateProfileIfNotFoundDialog.vue";
import { ROUTES } from "@/router";
import { ProfilesStore } from "@holochain-open-dev/profiles";
import IconHelpCircleOutline from "~icons/ion/help-circle-outline";
import IconAlertCircleOutline from "~icons/ion/alert-circle-outline";
import IconArrowForwardOutline from "~icons/ion/arrow-forward-outline";
import { useToasts } from "@/stores/toasts";
import { EntryRecord } from "@holochain-open-dev/utils";

const ANCHOR_DATA_ID_AGENT_PUB_KEY = "agentPubKey";
const ANCHOR_DATA_ID_URL = "url";
let currentAnchorOffset: number;
let currentFocusOffset: number;
let currentNode: Node;

const emit = defineEmits(["mew-created"]);
const props = defineProps<{
  mewType: MewType;
}>();
const searchProfiles = useSearchProfiles();
const client = (inject("client") as ComputedRef<AppClient>).value;
const dnaProperties = (
  inject("dnaProperties") as ComputedRef<MewsfeedDnaProperties>
).value;
const myProfile = inject("myProfile") as ComputedRef<Profile>;
const profilesStore = inject("profilesStore") as ComputedRef<ProfilesStore>;
const { showMessage, showError } = useToasts();

const TRUNCATED_MEW_LENGTH = 300;
const POPUP_MARGIN_TOP = 18;

const mewContainer = ref<HTMLDivElement>();
const mewContainerInput = ref<HTMLDivElement>();
const mewContentLength = ref(0);
const saving = ref(false);
const linkTarget = ref();
const linkTargetInput = ref();
const currentAgentSearch = ref("");
const agentAutocompletions = ref<Array<[AgentPubKey, EntryRecord<Profile>]>>(
  []
);
const autocompleterLoading = ref(false);
const showCreateProfileDialog = ref(false);
const createButtonInput = ref();

const isMewEmpty = computed(() => mewContentLength.value === 0);
const isMewFull = computed(
  () =>
    dnaProperties.mew_characters_max !== null &&
    mewContentLength.value === dnaProperties.mew_characters_max
);
const isMewRequireTruncation = computed(
  () => mewContentLength.value > TRUNCATED_MEW_LENGTH
);
const isMewOverfull = computed(
  () =>
    dnaProperties.mew_characters_max !== null &&
    mewContentLength.value > dnaProperties.mew_characters_max
);
const isMewUnderfull = computed(
  () =>
    dnaProperties.mew_characters_min !== null &&
    mewContentLength.value < dnaProperties.mew_characters_min
);
const mewLengthOk = computed(
  () =>
    !isMewUnderfull.value &&
    !isMewFull.value &&
    !isMewRequireTruncation.value &&
    !isMewOverfull.value
);
const linkTargetValid = computed(() => {
  if (!linkTarget.value) return true;

  return isRawUrl(linkTarget.value);
});
const isMewTypeWithText = computed(() => {
  return (
    MewTypeName.Original === props.mewType.type ||
    MewTypeName.Reply === props.mewType.type ||
    MewTypeName.Quote === props.mewType.type
  );
});

onMounted(async () => {
  focusInputField();
});

const collectLinksWithinElement = (element: Element): LinkTarget[] => {
  if (element.children.length > 0) {
    const childrenLinks: LinkTarget[] = Array.from(element.children)
      .map((child) => {
        if (
          child &&
          child.tagName === "A" &&
          child instanceof HTMLAnchorElement
        ) {
          if (child.dataset[ANCHOR_DATA_ID_AGENT_PUB_KEY]) {
            return {
              [LinkTargetName.Mention]: decodeHashFromBase64(
                child.dataset[ANCHOR_DATA_ID_AGENT_PUB_KEY]
              ),
            } as MentionLinkTarget;
          } else if (child.dataset[ANCHOR_DATA_ID_URL]) {
            return {
              [LinkTargetName.Url]: child.dataset[ANCHOR_DATA_ID_URL],
            } as UrlLinkTarget;
          }
        }
      })
      .filter((l) => l !== undefined)
      .map((l) => l as LinkTarget);

    return union(
      childrenLinks,
      flatten(
        Array.from(element.children).map((child) =>
          collectLinksWithinElement(child)
        )
      )
    );
  } else {
    return [];
  }
};

const publishMew = async (profile: undefined | Profile = undefined) => {
  if (!myProfile.value && !profile) {
    showCreateProfileDialog.value = true;
    return;
  }
  showCreateProfileDialog.value = false;

  const mew: Mew = {
    text: "",
    links: [],
    mew_type: props.mewType,
  };

  if (isMewTypeWithText.value && mewContainerInput.value) {
    // build link array
    const links = collectLinksWithinElement(mewContainerInput.value);
    mew.text = getTrimmedText();
    mew.links = links;

    if (!mewContainerInput.value) return;
  }

  try {
    saving.value = true;
    const feedMew: FeedMew = await client.callZome({
      role_name: "mewsfeed",
      zome_name: "mews",
      fn_name: "create_mew_with_context",
      payload: mew,
    });
    emit("mew-created", feedMew);
    if (MewTypeName.Original in mew.mew_type) {
      showMessage("Published Mew");
    }
  } catch (error) {
    showError(error);
  } finally {
    saving.value = false;
  }

  if (isMewTypeWithText.value && mewContainerInput.value) {
    mewContainerInput.value.textContent = "";
    mewContentLength.value = 0;
    hideAutocompleter();
    resetLinkTargetInput();
    focusInputField();
  }
};

/**
 * Link Tag Handling
 */
const createLinkTag = (e: Event) => {
  if (!isRawUrl(linkTarget.value)) return;
  e.preventDefault();

  // Extract label text
  const range = new Range();
  range.setStart(currentNode, currentAnchorOffset);
  range.setEnd(currentNode, currentFocusOffset);
  const label = range.extractContents().textContent;

  // Create html link element
  const anchor = document.createElement("a");
  anchor.textContent = label;
  anchor.className = "text-primary";
  anchor.href = "#";
  anchor.dataset[ANCHOR_DATA_ID_URL] = linkTarget.value;
  range.insertNode(anchor);

  // insert space after html link
  const spaceNode = document.createTextNode("");
  anchor.after(spaceNode);

  // reset input
  resetLinkTargetInput();
  document.getSelection()?.setPosition(spaceNode, 0);
};

/**
 * Profile Tag Handling
 */
const loadAutocompleterUsers = async (nickname: string) => {
  try {
    autocompleterLoading.value = true;
    agentAutocompletions.value = await searchProfiles(nickname);
  } catch (error) {
    showError(error);
  } finally {
    autocompleterLoading.value = false;
  }
};

const onAutocompleteKeyDown = (keyDownEvent: KeyboardEvent) => {
  if (keyDownEvent.key === "ArrowDown") {
    keyDownEvent.preventDefault();
    const currentListItem = keyDownEvent.currentTarget;
    if (currentListItem instanceof HTMLElement) {
      const nextSibling = currentListItem.nextSibling;
      if (nextSibling instanceof HTMLElement) {
        nextSibling.focus();
      }
    }
  } else if (keyDownEvent.key === "ArrowUp") {
    keyDownEvent.preventDefault();
    const currentListItem = keyDownEvent.currentTarget;
    if (currentListItem instanceof HTMLElement) {
      const previousSibling = currentListItem.previousSibling;
      if (previousSibling instanceof HTMLElement) {
        previousSibling.focus();
      } else {
        if (!mewContainerInput.value) return;
        mewContainerInput.value.focus();
      }
    }
  }
};

const onAutocompleteAgentSelect = (
  agent: AgentPubKey,
  profile: EntryRecord<Profile>
) => {
  const range = new Range();
  range.setStart(currentNode, currentAnchorOffset);
  range.setEnd(currentNode, currentFocusOffset);

  // Insert mention link: '@' + agent username
  const anchor = document.createElement("a");
  anchor.href = "#";
  anchor.textContent = TAG_SYMBOLS.MENTION + profile.entry.nickname;
  anchor.dataset[ANCHOR_DATA_ID_AGENT_PUB_KEY] = encodeHashToBase64(agent);
  range.deleteContents();
  range.insertNode(anchor);

  // insert space after mention
  const spaceNode = document.createTextNode(String.fromCharCode(160));
  anchor.after(spaceNode);

  // reset autocomplete input
  hideAutocompleter();
  document.getSelection()?.setPosition(spaceNode, 1);

  setMewContentLength();
};

const onKeyDown = (event: KeyboardEvent) => {
  setMewContentLength();

  if (agentAutocompletions.value.length > 0 && !autocompleterLoading.value) {
    onAutocompleteKeyDown(event);
    return;
  }

  // Support Meta + Enter keys to publish
  if (
    event.key === "Enter" &&
    event.metaKey &&
    !(isMewEmpty.value || isMewOverfull.value || isMewUnderfull.value)
  ) {
    publishMew();
  }

  // Support KeyDown or Tab keys to focus on first item displayed in agents list (after typing an agent tag)
  else if (event.key === "ArrowDown" || event.key === "Tab") {
    if (!mewContainerInput.value) return;
    event.preventDefault();
    mewContainerInput.value.focus();
  }

  // Prevent input of leading line breaks
  // Prevent input of trailing line breaks if mew is already full
  else if (
    event.key === "Enter" &&
    (isMewEmpty.value || isMewFull.value || isMewOverfull.value)
  ) {
    event.preventDefault();
  }

  // Prevent input of more than 3 consecutive line breaks
  else if (
    event.key === "Enter" &&
    !(isMewEmpty.value || isMewOverfull.value)
  ) {
    const textContent = getRawText();

    if (textContent.slice(-3) === "\n\n\n") {
      event.preventDefault();
    }
  } else if (
    (isMewFull.value || isMewOverfull.value) &&
    event.key !== "Backspace" &&
    event.key !== "Delete" &&
    !(event.key === "a" && event.ctrlKey) &&
    event.key !== "ArrowLeft" &&
    event.key !== "ArrowRight" &&
    event.key !== "ArrowUp" &&
    event.key !== "ArrowDown"
  ) {
    // Prevent input of characters if mew is already full
    event.preventDefault();
  }
};

const onKeyUp = (keyUpEvent: KeyboardEvent) => {
  if (!(keyUpEvent.currentTarget instanceof HTMLElement)) {
    return;
  }
  const content = keyUpEvent.currentTarget.textContent;
  const selection = document.getSelection();
  if (keyUpEvent.key === " ") {
    hideAutocompleter();
    resetLinkTargetInput();
  } else if (
    (keyUpEvent.key === "Backspace" || keyUpEvent.key === "Delete") &&
    selection?.anchorNode?.parentElement?.tagName === "A"
  ) {
    stripAnchorFromLink(selection);
  } else if (keyUpEvent.key.length === 1 && content) {
    // all single characters
    onCaretPositionChange();
  }
};

const onMouseUp = () => {
  hideAutocompleter();
  resetLinkTargetInput();
};

const onPaste = (event: ClipboardEvent) => {
  event.preventDefault();
  const data = event.clipboardData?.getData("text/plain");

  if (data) {
    const pastedNode = document.createTextNode(data);
    document.getSelection()?.getRangeAt(0).insertNode(pastedNode);
    document.getSelection()?.setPosition(pastedNode, pastedNode.length);
    onCaretPositionChange();

    setMewContentLength();
  }
};

const onCaretPositionChange = () => {
  const selection = document.getSelection();
  const content = selection?.anchorNode?.textContent;
  if (!selection || !content) {
    return;
  }

  // find end of word that the caret is positioned at
  const ahead = content.substring(selection.anchorOffset);
  const nextWhitespace = /\s/.exec(ahead);
  const endOfAheadIndex = nextWhitespace ? nextWhitespace.index : ahead.length;
  const endOfWordIndex = selection.anchorOffset + endOfAheadIndex;

  // find start of word that the caret is positioned at
  const behind = content.substring(0, selection.anchorOffset - 1);
  let lastSpaceIndex = -1;
  // find last index of space, which can be " " (32) or "&nbsp;" (160)
  for (let i = behind.length - 1; i >= 0; i--) {
    if (behind.charCodeAt(i) === 32 || behind.charCodeAt(i) === 160) {
      lastSpaceIndex = i;
      break;
    }
  }

  const startOfWordIndex = lastSpaceIndex === -1 ? 0 : lastSpaceIndex + 1;
  const currentWord = content.substring(startOfWordIndex, endOfWordIndex);

  if (currentWord.length && selection.anchorNode) {
    // current word starts with @ and is followed by at least another word character
    if (isMentionTag(currentWord)) {
      showElement(selection.anchorNode, startOfWordIndex, "#autocompleter");

      const nicknameChars = currentWord.substring(1);
      currentAgentSearch.value = nicknameChars;
      if (nicknameChars.length >= 3) {
        loadAutocompleterUsers(nicknameChars);
        currentAnchorOffset = startOfWordIndex;
        currentFocusOffset = endOfWordIndex;
      }
      // current word is a URL
    } else if (isLinkTag(currentWord)) {
      // find start of tag that the caret is positioned at
      const behind = content.substring(0, selection.anchorOffset - 1);
      let lastCaretIndex = -1;
      // find last index of space, which can be " " (32) or "&nbsp;" (160)
      for (let i = behind.length - 1; i >= 0; i--) {
        if (behind.charCodeAt(i) === 94) {
          lastCaretIndex = i;
          break;
        }
      }

      showElement(
        selection.anchorNode,
        lastCaretIndex,
        "#link-target-input-container"
      );
      currentAnchorOffset = lastCaretIndex;
      currentFocusOffset = endOfWordIndex;
    } else {
      hideAutocompleter();
      resetLinkTargetInput();
    }
  }
};

/**
 * Helper Utils
 */

const focusInputField = () =>
  document.getSelection()?.setPosition(mewContainerInput.value || null, 0);

const stripAnchorFromLink = (selection: Selection) => {
  if (!selection.anchorNode?.parentElement) {
    return;
  }
  const parentElement = selection.anchorNode.parentElement;
  const linkContent = parentElement.firstChild?.cloneNode();
  if (linkContent) {
    const offset = selection.anchorOffset;
    parentElement.after(linkContent);
    parentElement.remove();
    selection.setPosition(linkContent, offset);
  }
};

const getRawText = (): string =>
  mewContainerInput.value ? mewContainerInput.value.innerText : "";

const getTrimmedText = (): string => {
  const text = getRawText();
  return text ? text.trim() : "";
};

const setMewContentLength = () => {
  const text = getTrimmedText();
  mewContentLength.value = text.length;
};

const showElement = (
  anchorNode: Node,
  startOfWordIndex: number,
  selector: string
) => {
  const range = new Range();
  range.setStart(anchorNode, startOfWordIndex);
  currentNode = anchorNode;
  const selectionRect = range.getBoundingClientRect();
  const element = mewContainer.value?.querySelector(selector);
  if (
    element instanceof HTMLElement &&
    mewContainer.value &&
    mewContainerInput.value
  ) {
    const mewContainerBoundingRect = mewContainer.value.getBoundingClientRect();

    element.style.top =
      Math.max(0, selectionRect.top - mewContainerBoundingRect.top) +
      POPUP_MARGIN_TOP +
      "px";

    element.style.left =
      Math.max(0, selectionRect.left - mewContainerBoundingRect.left) + "px";

    element.style.display = "block";
    element.focus();
  }
};

const hideElement = (selector: string) => {
  const element = mewContainer.value?.querySelector(selector);
  if (element && element instanceof HTMLElement) {
    element.style.display = "none";
  }
};

const resetLinkTargetInput = () => {
  hideElement("#link-target-input-container");
  linkTarget.value = undefined;
};

const hideAutocompleter = () => {
  hideElement("#autocompleter");
  agentAutocompletions.value = [];
};
</script>
<style scoped>
.mew-container-input:empty::before {
  content: attr(data-placeholder);
  display: block;
  position: absolute;
  font-family: "Inter";

  @apply text-base-content/50;
}

.mew-container-input a {
  color: hsl(var(--p)) !important;
}
</style>
