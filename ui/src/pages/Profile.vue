<template>
    <q-page>
        <q-form class="q-mx-xl" style="max-width: 400px;">
            <q-input v-model="profile.avatar" label="Avatar" />
            <q-input v-model="profile.bio" label="Bio" />
            <q-input v-model="profile.lang_pref" label="Language preference" />
            <q-input v-model="profile.location" label="Location" />
            <q-btn @click="saveProfile" icon="save">Save</q-btn>
        </q-form>
        <p>{{ errorMsg }}</p>
        <p>{{ successMsg }}</p>
    </q-page>
</template>

<script setup lang="ts">
import { InstalledAppInfo } from '@holochain/client';
import { Profile } from 'ui/src/types/types';
import { onMounted, reactive, ref } from 'vue'
import { useAppWebSocket, createProfile } from '../services/hc-app-service';
import { useQuasar } from 'quasar'
const $q = useQuasar()

const profile = reactive<Profile>({
    avatar: '',
    bio: '',
    lang_pref: 'en',
    location: ''
})

const errorMsg = ref('')
const successMsg = ref('')

const appWs = useAppWebSocket();
let appInfo: InstalledAppInfo

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
        $q.notify({ message: 'Profile saved', color: 'green', position: 'bottom-right' })
    } catch (error) {
        errorMsg.value = error instanceof Error ? error.message : String(error);
    }
}
</script>