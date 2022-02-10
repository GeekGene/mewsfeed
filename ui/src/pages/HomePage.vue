<template>
  <q-page
    padding
    class="text-center"
  >
    <h6>Meeow, {{ displayName }}, you're in!</h6>
    <h2>Welcome to the Clutter</h2>
    <q-img
      width="30%"
      src="/src/assets/img/cat-eating-bird-circle.png"
    />
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useProfileStore } from '../services/profile-store';
const displayName = ref("");
const store = useProfileStore();
store.myProfile.subscribe((profile) => displayName.value = profile.fields["Display name"]);
</script>
