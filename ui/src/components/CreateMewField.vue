<template>
  <div class="text-center">
    <div ref="mewContainer" class="text-left" style="position: relative">
      <q-card
        contenteditable="true"
        class="mew-content text-body1 q-pa-md overflow-auto"
        style="word-break: break-all"
        bordered
        flat
        @keydown="onKeyDown"
        @keyup="onKeyUp"
        @mouseup="onMouseUp"
        @paste="onPaste"
        @input="onInput"
      />
      <q-icon name="help" color="grey" size="xs" class="help-text">
        <q-tooltip
          class="text-body2"
          anchor="top middle"
          self="bottom middle"
          :delay="TOOLTIP_DELAY"
        >
          You can mention people with @ and use #hashtags and $cashtags as well
          as ^links in a mew.
        </q-tooltip>
      </q-icon>

      <div class="flex justify-between q-pa-sm">
        <div
          :class="{
            'text-red text-bold': isMewFull || isMewOverfull,
            'text-caption text-grey': !isMewFull && !isMewOverfull,
          }"
        >
          {{ mewContentLength }} / {{ MAX_MEW_LENGTH }} Characters
        </div>
        <div
          class="q-mb-xs text-right text-caption"
          style="color: var(--q-content)"
        >
          Ctrl/Cmd + Enter to publish
        </div>
      </div>

      <q-card class="link-text q-px-md q-py-sm" style="min-width: 13rem">
        <q-input
          v-model="linkText"
          type="text"
          placeholder="Link description (optional)"
          dense
          borderless
          @keyup="onLinkTextKeyDown"
        />
      </q-card>

      <q-card class="autocompleter">
        <template v-if="currentAgentSearch.length < 3">
          <q-card-section>Min. 3 letters</q-card-section>
        </template>

        <template v-else>
          <q-spinner-pie
            v-if="autocompleterLoading"
            color="secondary"
            size="md"
            class="q-mx-lg q-my-xs"
          />

          <q-list
            v-else
            class="autocompleter-list rounded-borders"
            bordered
            dense
            separator
            tabindex="-1"
          >
            <q-item
              v-for="(agent, index) in agentAutocompletions"
              :key="index"
              clickable
              @keydown="onAutocompleteKeyDown"
              @click="onAutocompleteAgentSelect(agent)"
            >
              <q-item-section avatar class="q-pr-sm col-shrink">
                <agent-avatar :agentPubKey="agent.key" size="30" />
              </q-item-section>
              <q-item-section>
                {{ agent.value.fields[PROFILE_FIELDS.DISPLAY_NAME] }}
                {{ TAG_SYMBOLS.MENTION }}{{ agent.value.nickname }}
              </q-item-section>
            </q-item>

            <q-item v-if="agentAutocompletions.length === 0">
              <q-item-section>Nothing found, Kitty</q-item-section>
            </q-item>
          </q-list>
        </template>
      </q-card>

      <q-icon name="help" color="grey" size="xs" class="help-text">
        <q-tooltip
          class="text-body2"
          anchor="top middle"
          self="bottom middle"
          :delay="TOOLTIP_DELAY"
        >
          You can mention people with @ and use #hashtags and $cashtags as well
          as ^links in a mew.
        </q-tooltip>
      </q-icon>
    </div>

    <q-btn
      :disable="isMewEmpty || isMewOverfull"
      :loading="saving"
      :tabindex="agentAutocompletions.length && 0"
      color="accent"
      @click="publishMew"
    >
      Publish Mew
    </q-btn>
  </div>
</template>

<script setup lang="ts">
import { useProfilesStore } from "@/services/profiles-store";
import { useClutterStore } from "@/stores";
import { showError } from "@/utils/notification";
import { isMentionTag, isRawUrl, TAG_SYMBOLS } from "@/utils/tags";
import { Profile } from "@holochain-open-dev/profiles";
import { onMounted, PropType, ref, computed } from "vue";
import {
  CreateMewInput,
  ElementWithInnerText,
  LinkTarget,
  LinkTargetName,
  MewType,
  PROFILE_FIELDS,
  TOOLTIP_DELAY,
} from "../types/types";

const ANCHOR_DATA_ID_AGENT_PUB_KEY = "agentPubKey";
const ANCHOR_DATA_ID_URL = "url";

const emit = defineEmits<{ (e: "publish-mew"): void }>();

const props = defineProps({
  mewType: { type: Object as PropType<MewType>, required: true },
});

interface AgentAutocompletion {
  key: Uint8Array;
  value: Profile;
}

const store = useClutterStore();
const profilesStore = useProfilesStore();
const mewContainer = ref<HTMLDivElement | null>(null);

onMounted(() => setTimeout(focusInputField, 0));

const saving = ref(false);

const MAX_MEW_LENGTH = 200;
const mewContentLength = ref(0);
const isMewEmpty = computed(() => mewContentLength.value === 0);
const isMewFull = computed(() => mewContentLength.value === MAX_MEW_LENGTH);
const isMewOverfull = computed(() => mewContentLength.value > MAX_MEW_LENGTH);

const linkText = ref("");

const currentAgentSearch = ref("");
let currentAnchorOffset: number;
let currentFocusOffset: number;
let currentNode: Node;

const POPUP_MARGIN_TOP = 20;
const agentAutocompletions = ref<AgentAutocompletion[]>([]);
const autocompleterLoading = ref(false);

const focusInputField = () =>
  document
    .getSelection()
    ?.setPosition(mewContainer.value?.querySelector(".mew-content") || null, 0);

const hideElement = (selector: string) => {
  const element = mewContainer.value?.querySelector(selector);
  if (element && element instanceof HTMLElement) {
    element.style.display = "none";
  }
};

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

const getRawText = (): string => {
  const text = (
    mewContainer.value?.querySelector(
      ".mew-content"
    ) as null | ElementWithInnerText
  )?.innerText;

  return text ? text : "";
};

const getTrimmedText = (): string => {
  const text = getRawText();
  return text ? text.trim() : "";
};

const setMewContentLength = () => {
  const text = getTrimmedText();
  mewContentLength.value = text.length;
};

const onInput = (event: KeyboardEvent) => {
  setMewContentLength();

  // Prevent input of characters if mew is already full
  if (
    (isMewFull.value || isMewOverfull.value) &&
    event.key !== "Backspace" &&
    event.key !== "Delete" &&
    !(event.key === "a" && event.ctrlKey) &&
    event.key !== "ArrowLeft" &&
    event.key !== "ArrowRight" &&
    event.key !== "ArrowUp" &&
    event.key !== "ArrowDown"
  ) {
    event.preventDefault();
  }
};

const onKeyDown = (event: KeyboardEvent) => {
  setMewContentLength();

  // Support Meta + Enter keys to publish
  if (
    event.key === "Enter" &&
    event.metaKey &&
    !(isMewEmpty.value || isMewOverfull.value)
  ) {
    publishMew();
  }

  // Support KeyDown or Tab keys to focus on first item displayed in agents list (after typing an agent tag)
  else if (event.key === "ArrowDown" || event.key === "Tab") {
    const firstListItem = mewContainer.value?.querySelector(".q-item");
    if (firstListItem instanceof HTMLElement) {
      event.preventDefault();
      firstListItem.focus();
    }
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
  } else {
    onInput(event);
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
    hideLinkTextInput();
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
  hideLinkTextInput();
};

const onPaste = (event: ClipboardEvent) => {
  event.preventDefault();
  const data = event.clipboardData?.getData("text/plain");

  if (data && data.length + mewContentLength.value > MAX_MEW_LENGTH) {
    return;
  } else if (data) {
    const pastedNode = document.createTextNode(data);
    document.getSelection()?.getRangeAt(0).insertNode(pastedNode);
    document.getSelection()?.setPosition(pastedNode, pastedNode.length);
    onCaretPositionChange();

    setMewContentLength();
  }
};

const loadAutocompleterUsers = async (nickname: string) => {
  try {
    autocompleterLoading.value = true;
    const profilesLoaded = new Promise<ReadonlyMap<Uint8Array, Profile>>(
      (resolve) => {
        profilesStore.value.searchProfiles(nickname).subscribe((profiles) => {
          if (profiles.status === "complete") {
            resolve(profiles.value);
          }
        });
      }
    );
    const profiles = await profilesLoaded;
    agentAutocompletions.value = Array.from(profiles).map(([key, value]) => ({
      key,
      value,
    }));
  } catch (error) {
    showError(error);
  } finally {
    autocompleterLoading.value = false;
  }
};

const onLinkTextKeyDown = (keyDownEvent: KeyboardEvent) => {
  if (keyDownEvent.key === "Enter") {
    const range = new Range();
    range.setStart(currentNode, currentAnchorOffset);
    range.setEnd(currentNode, currentFocusOffset);
    const url = range.extractContents().textContent;

    const anchor = document.createElement("a");
    anchor.href = "#";

    // Wrap link text in brackets if it has multiple words
    const linkTextValue = linkText.value?.trim();
    if (linkTextValue?.includes(" ")) {
      anchor.textContent = `${TAG_SYMBOLS.URL}[${linkTextValue}]`;
    } else if (linkText.value) {
      anchor.textContent = TAG_SYMBOLS.URL + linkTextValue;
    } else {
      anchor.textContent = url;
    }

    anchor.dataset[ANCHOR_DATA_ID_URL] = url ?? undefined;
    range.insertNode(anchor);
    // insert space after link
    const spaceNode = document.createTextNode(String.fromCharCode(160));
    anchor.after(spaceNode);

    hideLinkTextInput();
    document.getSelection()?.setPosition(spaceNode, 1);
    linkText.value = "";
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
        const mewContent = mewContainer.value?.querySelector(".mew-content");
        if (mewContent instanceof HTMLElement) {
          mewContent.focus();
        }
      }
    }
  }
};

const onAutocompleteAgentSelect = (agent: AgentAutocompletion) => {
  const range = new Range();
  range.setStart(currentNode, currentAnchorOffset);
  range.setEnd(currentNode, currentFocusOffset);

  // Insert mention link: '@' + agent username
  const anchor = document.createElement("a");
  anchor.href = "#";
  anchor.textContent = TAG_SYMBOLS.MENTION + agent.value.nickname;
  anchor.dataset[ANCHOR_DATA_ID_AGENT_PUB_KEY] = agent.key.toString();
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

const publishMew = async () => {
  const mewInput = mewContainer.value?.querySelector(
    ".mew-content"
  ) as ElementWithInnerText;
  if (!mewInput) {
    return;
  }

  // build link array
  const links: LinkTarget[] = [];
  for (let i = 0; i < mewInput.children.length; i++) {
    const element = mewInput.children.item(i);
    if (
      element &&
      element.tagName === "A" &&
      element instanceof HTMLAnchorElement
    ) {
      if (element.dataset[ANCHOR_DATA_ID_AGENT_PUB_KEY]) {
        const agentPubKeyString = element.dataset[ANCHOR_DATA_ID_AGENT_PUB_KEY];
        const agentPubKey = Uint8Array.from(
          agentPubKeyString.split(",") as Iterable<number>
        );
        links.push({ [LinkTargetName.Mention]: agentPubKey });
      } else if (element.dataset[ANCHOR_DATA_ID_URL]) {
        const url = element.dataset[ANCHOR_DATA_ID_URL];
        links.push({ [LinkTargetName.URL]: url });
      }
    }
  }

  const createMewInput: CreateMewInput = {
    mewType: props.mewType,
    text: getTrimmedText(),
    links: links.length ? links : undefined,
  };
  try {
    saving.value = true;
    await store.createMew(createMewInput);
  } catch (error) {
    showError(error);
  } finally {
    saving.value = false;
  }
  emit("publish-mew");
  mewInput.textContent = "";
  linkText.value = "";
  mewContentLength.value = 0;
  hideAutocompleter();
  hideLinkTextInput();
  focusInputField();
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
      showElement(selection.anchorNode, startOfWordIndex, ".autocompleter");

      const nicknameChars = currentWord.substring(1);
      currentAgentSearch.value = nicknameChars;
      if (nicknameChars.length >= 3) {
        loadAutocompleterUsers(nicknameChars);
        currentAnchorOffset = startOfWordIndex;
        currentFocusOffset = endOfWordIndex;
      }
      // current word is a URL
    } else if (isRawUrl(currentWord)) {
      showElement(selection.anchorNode, startOfWordIndex, ".link-text");
      currentAnchorOffset = startOfWordIndex;
      currentFocusOffset = endOfWordIndex;
    } else {
      hideAutocompleter();
      hideLinkTextInput();
    }
  }
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
  if (element instanceof HTMLElement && mewContainer.value) {
    element.style.top =
      Math.max(
        0,
        selectionRect.top - mewContainer.value.getBoundingClientRect().top
      ) +
      POPUP_MARGIN_TOP +
      "px";
    element.style.left =
      Math.max(
        0,
        selectionRect.left - mewContainer.value.getBoundingClientRect().left
      ) + "px";
    element.style.display = "block";
  }
};
const hideAutocompleter = hideElement.bind(null, ".autocompleter");
const hideLinkTextInput = hideElement.bind(null, ".link-text");
</script>

<style lang="sass">
.mew-content
  min-height: $body-font-size * $body-line-height * 2

  &:focus
    outline-color: $primary
  a
    color: $secondary
    font-weight: 600

.help-text
  position: absolute
  cursor: default
  top: 5px
  right: 5px

.autocompleter, .link-text
  position: absolute
  display: none
  z-index: 1
</style>
