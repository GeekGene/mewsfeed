<template>
  <div style="width: 300px; margin-left: 16px; margin-top: -32px;">
    <my-profile></my-profile>
  </div>
</template>

<script setup lang="ts">
import { Profile } from "../types/types";
import { onMounted, reactive, ref } from "vue";
import { createProfile } from "../services/clutter-dna";
import { showError, showMessage } from "../utils/notification";
</script>