<template>
  <BaseDialog :model-value="visible" @update:model-value="onClose">
    <div class="p-4 md:p-6 space-y-6">
      <div class="font-title text-xl">Join {{ appName || "Network" }}</div>

      <div v-if="loading" class="flex items-center space-x-3">
        <sl-spinner style="font-size: 1.5rem"></sl-spinner>
        <span class="text-sm opacity-70">Loading service info...</span>
      </div>

      <div v-else-if="fetchError" class="space-y-4">
        <p class="text-error text-sm">{{ fetchError }}</p>
        <button class="btn btn-ghost" @click="cancel">Close</button>
      </div>

      <div v-else class="space-y-4">
        <div v-if="needsInviteCode" class="form-control w-full">
          <label class="label">
            <span class="label-text">Invite code</span>
          </label>
          <input
            ref="inviteInputRef"
            v-model="inviteCode"
            type="text"
            placeholder="Enter your invite code"
            class="input input-bordered w-full"
            @keydown.enter="maybeSubmit"
          />
        </div>

        <div v-if="needsEmail" class="form-control w-full">
          <label class="label">
            <span class="label-text">Email address</span>
          </label>
          <input
            ref="emailInputRef"
            v-model="email"
            type="email"
            placeholder="Enter your email"
            class="input input-bordered w-full"
            @keydown.enter="maybeSubmit"
          />
        </div>

        <div v-if="error" class="text-error text-sm">{{ error }}</div>

        <div class="flex justify-end space-x-3">
          <button class="btn btn-ghost" @click="cancel">Cancel</button>
          <button
            class="btn btn-primary"
            :disabled="!canSubmit"
            @click="submit"
          >
            Join
          </button>
        </div>
      </div>
    </div>
  </BaseDialog>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from "vue";
import BaseDialog from "./BaseDialog.vue";
import { JOINING_SERVICE_URL } from "@/utils/client";

const visible = ref(false);
const loading = ref(false);
const fetchError = ref("");
const error = ref("");
const appName = ref("");
const authMethods = ref<string[]>([]);
const inviteCode = ref("");
const email = ref("");
const inviteInputRef = ref<HTMLInputElement>();
const emailInputRef = ref<HTMLInputElement>();

let resolvePromise: ((value: Record<string, string>) => void) | null = null;
let rejectPromise: ((reason: Error) => void) | null = null;

const needsInviteCode = computed(() => authMethods.value.includes("invite_code"));
const needsEmail = computed(() => authMethods.value.includes("email_code"));

const canSubmit = computed(() => {
  if (needsInviteCode.value && !inviteCode.value.trim()) return false;
  if (needsEmail.value && !email.value.trim()) return false;
  return true;
});

function submit() {
  if (!canSubmit.value) return;
  const claims: Record<string, string> = {};
  if (needsInviteCode.value) claims.invite_code = inviteCode.value.trim();
  if (needsEmail.value) claims.email = email.value.trim();
  visible.value = false;
  resolvePromise?.(claims);
  resolvePromise = null;
  rejectPromise = null;
}

function maybeSubmit() {
  if (canSubmit.value) submit();
}

function cancel() {
  visible.value = false;
  rejectPromise?.(new Error("User cancelled joining"));
  resolvePromise = null;
  rejectPromise = null;
}

function onClose(val: boolean) {
  if (!val) cancel();
}

/**
 * Fetch service info and show the dialog to collect claims.
 * If only "open" auth is configured, resolves immediately with empty claims.
 */
async function collectClaims(): Promise<Record<string, string>> {
  // Fetch /info to discover auth methods
  loading.value = true;
  fetchError.value = "";
  error.value = "";
  inviteCode.value = "";
  email.value = "";
  authMethods.value = [];
  visible.value = true;

  try {
    const res = await fetch(`${JOINING_SERVICE_URL}/info`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const info = await res.json();
    authMethods.value = info.auth_methods || [];
    appName.value = info.happ?.name || "";
  } catch (e) {
    loading.value = false;
    fetchError.value = `Could not reach joining service: ${e instanceof Error ? e.message : e}`;
    return new Promise((resolve, reject) => {
      resolvePromise = resolve;
      rejectPromise = reject;
    });
  }

  loading.value = false;

  // If only "open" auth, no claims needed
  const needsClaims = authMethods.value.some(
    (m) => m === "invite_code" || m === "email_code"
  );
  if (!needsClaims) {
    visible.value = false;
    return {};
  }

  // Focus first input
  nextTick(() => {
    if (needsInviteCode.value) inviteInputRef.value?.focus();
    else if (needsEmail.value) emailInputRef.value?.focus();
  });

  return new Promise((resolve, reject) => {
    resolvePromise = resolve;
    rejectPromise = reject;
  });
}

defineExpose({ collectClaims });
</script>
