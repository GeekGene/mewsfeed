import { Profile, ProfilesStore } from "@holochain-open-dev/profiles";
import { EntryRecord } from "@holochain-open-dev/utils";
import { AgentPubKey } from "@holochain/client";
import {
  ComputedRef,
  Ref,
  computed,
  inject,
  onActivated,
  onDeactivated,
  onUnmounted,
  ref,
  watch,
} from "vue";
import type { Unsubscriber } from "svelte/store";
import type { AsyncStatus } from "@holochain-open-dev/stores";

export const useProfile = (
  agentPubKey: Ref<AgentPubKey | undefined> | ComputedRef<AgentPubKey | undefined>
) => {
  const profilesStore = (inject("profilesStore") as ComputedRef<ProfilesStore>)
    .value;

  const profile = ref<Profile | undefined>();
  const isLoading = ref(false);
  const error = ref<any>(null);
  const profileVersion = ref(0);

  let unsubscribe: Unsubscriber | null = null;

  const subscribe = () => {
    // Clean up previous subscription
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }

    const key = agentPubKey.value;
    if (!key) {
      profile.value = undefined;
      isLoading.value = false;
      error.value = null;
      return;
    }

    isLoading.value = true;
    error.value = null;

    const asyncReadable = profilesStore.profiles.get(key);
    if (!asyncReadable) {
      isLoading.value = false;
      return;
    }
    // Increment version so :key bindings on agent-avatar force re-mount
    profileVersion.value++;
    unsubscribe = asyncReadable.subscribe(
      (status: AsyncStatus<EntryRecord<Profile> | undefined>) => {
        if (status.status === "pending") {
          isLoading.value = true;
          error.value = null;
        } else if (status.status === "complete") {
          profile.value = status.value?.entry;
          isLoading.value = false;
          error.value = null;
        } else if (status.status === "error") {
          profile.value = undefined;
          isLoading.value = false;
          error.value = status.error;
        }
      }
    );
  };

  const refresh = () => {
    const key = agentPubKey.value;
    if (!key) return;

    // Delete from the LazyHoloHashMap so next .get() creates a fresh AsyncReadable
    profilesStore.profiles.delete(key);
    // Re-subscribe to the new AsyncReadable (subscribe() increments profileVersion)
    subscribe();
  };

  // Subscribe reactively when agentPubKey changes
  watch(agentPubKey, () => subscribe(), { immediate: true });

  // KeepAlive support: re-subscribe to current map entry (may have been refreshed elsewhere)
  onActivated(() => subscribe());
  onDeactivated(() => {
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }
  });

  onUnmounted(() => {
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }
  });

  return {
    profile: computed(() => profile.value),
    isLoading: computed(() => isLoading.value),
    error: computed(() => error.value),
    profileVersion: computed(() => profileVersion.value),
    refresh,
  };
};
