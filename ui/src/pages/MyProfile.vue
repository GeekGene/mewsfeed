<template>
  <div style="width: 300px; margin-left: 16px; margin-top: -32px;">
    <my-profile />
    <q-input
      v-model="agentDID"
      type="textarea"
      class="q-mb-sm"
      dense
      outlined
      @keyup.enter="followAgent"
    />
    <q-btn
      :disable="agentDID === ''"
      color="secondary"
      @click="followAgent"
    >
      Follow Agent
    </q-btn>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { followAgent as followAd4mAgent } from "../services/ad4m";


const agentDID = ref("");
const followAgent = async () => {
  await followAd4mAgent(agentDID.value)
};
</script>