<template>
  <BaseDialog :model-value="visible" @update:model-value="onClose">
    <div class="p-4 md:p-6 space-y-6">
      <div class="font-title text-xl">Verification Required</div>

      <div v-if="challenge" class="space-y-4">
        <p class="text-sm opacity-70">{{ challenge.description }}</p>

        <div class="form-control w-full">
          <label class="label">
            <span class="label-text">{{ inputLabel }}</span>
          </label>
          <input
            ref="inputRef"
            v-model="response"
            type="text"
            :placeholder="inputPlaceholder"
            class="input input-bordered w-full"
            @keydown.enter="submit"
          />
        </div>

        <div v-if="error" class="text-error text-sm">{{ error }}</div>
      </div>

      <div class="flex justify-end space-x-3">
        <button class="btn btn-ghost" @click="cancel">Cancel</button>
        <button
          class="btn btn-primary"
          :disabled="!response.trim()"
          @click="submit"
        >
          Verify
        </button>
      </div>
    </div>
  </BaseDialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from "vue";
import BaseDialog from "./BaseDialog.vue";
import type { Challenge } from "@/hwc";

const visible = ref(false);
const challenge = ref<Challenge | null>(null);
const response = ref("");
const error = ref("");
const inputRef = ref<HTMLInputElement>();

let resolvePromise: ((value: string) => void) | null = null;
let rejectPromise: ((reason: Error) => void) | null = null;

const inputLabel = computed(() => {
  if (!challenge.value) return "Code";
  switch (challenge.value.type) {
    case "email_code":
      return "Email verification code";
    case "sms_code":
      return "SMS verification code";
    case "invite_code":
      return "Invite code";
    default:
      return "Verification code";
  }
});

const inputPlaceholder = computed(() => {
  if (!challenge.value) return "Enter code";
  switch (challenge.value.type) {
    case "email_code":
      return "Enter the code sent to your email";
    case "sms_code":
      return "Enter the code sent to your phone";
    case "invite_code":
      return "Enter your invite code";
    default:
      return "Enter your response";
  }
});

function submit() {
  const val = response.value.trim();
  if (!val) return;
  visible.value = false;
  resolvePromise?.(val);
  resolvePromise = null;
  rejectPromise = null;
}

function cancel() {
  visible.value = false;
  rejectPromise?.(new Error("User cancelled verification"));
  resolvePromise = null;
  rejectPromise = null;
}

function onClose(val: boolean) {
  if (!val) cancel();
}

/**
 * Show the dialog for a challenge and return the user's response.
 * Called from the onChallenge callback in client.ts.
 */
function prompt(ch: Challenge): Promise<string> {
  challenge.value = ch;
  response.value = "";
  error.value = "";
  visible.value = true;

  nextTick(() => inputRef.value?.focus());

  return new Promise<string>((resolve, reject) => {
    resolvePromise = resolve;
    rejectPromise = reject;
  });
}

defineExpose({ prompt });
</script>
