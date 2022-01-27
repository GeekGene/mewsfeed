<template>
    <q-page>
        <q-form class="q-mx-xl" style="max-width: 400px;">
            <q-input v-model="profile.avatar" label="Avatar" />
            <q-input v-model="profile.bio" label="Bio" />
            <q-input v-model="profile.lang_pref" label="Language preference" />
            <q-input v-model="profile.location" label="Location" />
            <q-btn @click="saveProfile" icon="save">Save</q-btn>
        </q-form>
    </q-page>
</template>

<script setup lang="ts">
import { Profile } from 'ui/src/types/types';
import { onMounted, reactive } from 'vue'
import { createProfile } from '../services/hc-app-service';
import { showError, showMessage } from '../utils/notification';

const profile = reactive<Profile>({
    avatar: '',
    bio: '',
    lang_pref: 'en',
    location: ''
})

onMounted(async () => {
    // const profile = await loadProfile({
    //     zome_name: 'profiles_stub',
    //     fn_name: 'get_profile',
    // })
})

const saveProfile = async () => {
    try {
        const profilehash = await createProfile(profile)
        console.log('profileHash', profilehash)
        showMessage({ message: 'Profile saved'})
    } catch (error) {
        showError(error)
    }
}
</script>