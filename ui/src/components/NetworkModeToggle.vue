<template>
  <div class="form-control">
    <label class="label cursor-pointer gap-2">
      <span class="label-text text-xs">{{ store.useNetwork ? 'Network' : 'Local' }}</span>
      <input
        type="checkbox"
        class="toggle toggle-sm"
        :checked="store.useNetwork"
        @change="store.toggle()"
      />
    </label>
  </div>
</template>

<script lang="ts" setup>
import { useNetworkModeStore } from "@/stores/networkMode";

const store = useNetworkModeStore();
</script>
