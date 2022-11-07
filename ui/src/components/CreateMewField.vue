<template>
  <div class="text-center">
    <div id="mew-container" class="text-left" style="position: relative">
      <q-card
        id="mew-content"
        contenteditable="true"
        class="q-mb-md q-pa-md"
        bordered
        flat
        @keydown="onKeyDown"
        @keyup="onKeyUp"
        @mouseup="onMouseUp"
        @paste="onPaste"
        @input="onInput"
      />

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
            class="bg-white rounded-borders"
            bordered
            dense
            separator
          >
            <q-item
              v-for="(agent, index) in agentAutocompletions"
              :key="index"
              clickable
              @click="onAutocompleteAgentSelect(agent)"
            >
              <q-item-section avatar class="q-pr-sm col-shrink">
                <agent-avatar :agentPubKey="agent.key" size="30" />
              </q-item-section>
              <q-item-section>
                {{ agent.value.fields[PROFILE_FIELDS.DISPLAY_NAME] }} @{{
                  agent.value.nickname
                }}
              </q-item-section>
            </q-item>

            <q-item v-if="agentAutocompletions.length === 0">
              <q-item-section>Nothing found, Kitty</q-item-section>
            </q-item>
          </q-list>
        </template>
      </q-card>
    </div>

    <q-btn
      :disable="isNewMewEmpty || saving"
      :loading="saving"
      color="accent"
      @click="publishMew"
    >
      Publish Mew
    </q-btn>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import {
  CreateMewInput,
  LinkTarget,
  LinkTargetName,
  MewType,
  PROFILE_FIELDS,
} from "../types/types";
import { PropType } from "vue";
import { showError } from "@/utils/notification";
import { useProfilesStore } from "@/services/profiles-store";
import { Profile } from "@holochain-open-dev/profiles";

const ANCHOR_DATA_ID_AGENT_PUB_KEY = "agentPubKey";

const emit = defineEmits<{ (e: "publish-mew", mew: CreateMewInput): void }>();

const props = defineProps({
  mewType: { type: Object as PropType<MewType>, required: true },
  saving: { type: Boolean, default: false },
});

interface AgentAutocompletion {
  key: Uint8Array;
  value: Profile;
}

const profilesStore = useProfilesStore();

const isNewMewEmpty = ref(true);
const saving = computed(() => props.saving);

const currentAgentSearch = ref("");
let currentAnchorOffset: number;
let currentFocusOffset: number;
let currentNode: Node;

const AUTOCOMPLETER_MARGIN_TOP = 20;
const agentAutocompletions = ref<AgentAutocompletion[]>([]);
const autocompleterLoading = ref(false);

const hideAutocompleter = () => {
  const autocompleter = document.querySelector(".autocompleter");
  if (autocompleter && autocompleter instanceof HTMLElement) {
    autocompleter.style.display = "none";
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

const onInput = () =>
  (isNewMewEmpty.value =
    document.getElementById("mew-content")?.textContent?.length === 0);

const onKeyDown = (keyDownEvent: KeyboardEvent) => {
  if (keyDownEvent.key === "Enter") {
    keyDownEvent.preventDefault();
    if (keyDownEvent.metaKey && !isNewMewEmpty.value) {
      publishMew();
    }
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
  } else if (
    (keyUpEvent.key === "Backspace" || keyUpEvent.key === "Delete") &&
    selection?.anchorNode?.parentElement?.tagName === "A"
  ) {
    stripAnchorFromLink(selection);
  } else if (keyUpEvent.key.length && content) {
    onCaretPositionChange();
  }
};

const onMouseUp = () => hideAutocompleter();

const onPaste = (event: ClipboardEvent) => {
  event.preventDefault();
  const data = event.clipboardData?.getData("text/plain");
  if (data) {
    const pastedNode = document.createTextNode(data);
    document.getSelection()?.getRangeAt(0).insertNode(pastedNode);
    document.getSelection()?.setPosition(pastedNode, pastedNode.length);
  }
};

const loadAutocompleterUsers = async (nickname: string) => {
  try {
    autocompleterLoading.value = true;
    const profiles = await profilesStore.value.searchProfiles(nickname);
    agentAutocompletions.value = profiles
      .keys()
      .map((key) => ({ key, value: profiles.get(key) }));
  } catch (error) {
    showError(error);
  } finally {
    autocompleterLoading.value = false;
  }
};

const onAutocompleteAgentSelect = (agent: AgentAutocompletion) => {
  const mewNode = document.getElementById("mew-content");
  if (!mewNode) {
    return;
  }
  const range = new Range();
  range.setStart(currentNode, currentAnchorOffset);
  range.setEnd(currentNode, currentFocusOffset);
  const anchor = document.createElement("a");
  anchor.href = "#";
  anchor.textContent = "@" + agent.value.nickname;
  anchor.dataset[ANCHOR_DATA_ID_AGENT_PUB_KEY] = agent.key.toString();
  range.deleteContents();
  range.insertNode(anchor);
  hideAutocompleter();
  document
    .getSelection()
    ?.setPosition(anchor.childNodes[0], anchor.textContent.length);
};

const publishMew = () => {
  const mewInput = document.getElementById("mew-content");
  if (!mewInput) {
    return;
  }

  // build link array
  const mentions: LinkTarget[] = [];
  for (let i = 0; i < mewInput.children.length; i++) {
    const element = mewInput.children.item(i);
    if (
      element &&
      element.tagName === "A" &&
      element instanceof HTMLAnchorElement &&
      element.dataset[ANCHOR_DATA_ID_AGENT_PUB_KEY]
    ) {
      const agentPubKeyString = element.dataset[ANCHOR_DATA_ID_AGENT_PUB_KEY];
      // dunno why this is an error; an array is array-like
      // eslint-disable-next-line
      // @ts-ignore
      const agentPubKey = Uint8Array.from(agentPubKeyString.split(","));
      mentions.push({ [LinkTargetName.Mention]: agentPubKey });
    }
  }

  const createMewInput: CreateMewInput = {
    mewType: props.mewType,
    text: mewInput.textContent,
    links: mentions.length ? mentions : null,
  };
  emit("publish-mew", createMewInput);
  mewInput.textContent = "";
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
  const behind = content.substring(0, selection.anchorOffset);
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

  if (
    currentWord.length &&
    currentWord.startsWith("@") &&
    /^@\w+/.test(currentWord) &&
    selection.anchorNode
  ) {
    // current word starts with @ and is followed by at least another word character
    const range = new Range();
    range.setStart(selection.anchorNode, startOfWordIndex);
    currentNode = selection.anchorNode;
    const selectionRect = range.getBoundingClientRect();
    const mewContentDiv = document.querySelector("#mew-container");
    const autocompleter = document.querySelector(".autocompleter");
    if (
      autocompleter instanceof HTMLElement &&
      mewContentDiv instanceof HTMLElement
    ) {
      autocompleter.style.top =
        Math.max(
          0,
          selectionRect.top - mewContentDiv.getBoundingClientRect().top
        ) +
        AUTOCOMPLETER_MARGIN_TOP +
        "px";
      autocompleter.style.left =
        Math.max(
          0,
          selectionRect.left - mewContentDiv.getBoundingClientRect().left
        ) + "px";
      autocompleter.style.display = "block";

      const nicknameChars = currentWord.substring(1);
      currentAgentSearch.value = nicknameChars;
      if (nicknameChars.length >= 3) {
        loadAutocompleterUsers(nicknameChars);
        currentAnchorOffset = startOfWordIndex;
        currentFocusOffset = endOfWordIndex;
      }
    }
  } else {
    hideAutocompleter();
  }
};
</script>

<style lang="sass">
#mew-content
  &:focus
    outline-color: $primary
  a
    color: $secondary

.autocompleter
  position: absolute
  display: none
</style>
