<template>
  <template
    v-if="agentState && !agentState.isAnonymous && agentState.isAvailable"
  >
    <slot></slot>
  </template>
</template>

<script lang="ts" setup>
import WebSdkApi, { AgentState } from "@holo-host/web-sdk";
import { ComputedRef, inject, onMounted, ref, toRaw } from "vue";

const client = (inject("client") as ComputedRef<WebSdkApi>).value;
const agentState = ref<AgentState>();

onMounted(() => {
  agentState.value = client.agentState;
  if (client.agentState.isAnonymous) {
    client.signUp({});
  }

  toRaw(client).on("agent-state", (newAgentState: AgentState) => {
    console.log("agent-state signal", newAgentState);
    agentState.value = newAgentState;

    if (agentState.value.isAnonymous) {
      client.signUp({});
    }
  });
});
</script>
