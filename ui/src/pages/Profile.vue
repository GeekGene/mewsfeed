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
import { useAppWebSocket } from '../services/hc-app';
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
    appInfo = await appWs.appInfo({ installed_app_id: 'clutter' })
    // const cell = appInfo.cell_data.find((cell) => cell.role_id === 'clutter');
    // if (!cell) {
    //     errorMsg.value = 'Could not find clutter cell'
    //     return
    // }
    // const provenance = cell.cell_id[1]
    // const result = await appWs.callZome({
    //     cell_id: cell.cell_id,
    //     zome_name: 'profiles_stub',
    //     fn_name: 'get_profile',
    //     payload: {},
    //     cap_secret: null,
    //     provenance
    // })
})

const saveProfile = async () => {
    if (!appInfo) {
        errorMsg.value = 'Could not get app info'
        return
    }
    const cell = appInfo.cell_data.find((cell) => cell.role_id === 'clutter');
    if (!cell) {
        errorMsg.value = 'Could not find clutter cell'
        return;
    }
    const provenance = cell.cell_id[1]
    try {
        const profilehash = await appWs.callZome({
            cell_id: cell.cell_id,
            zome_name: 'profiles_stub',
            fn_name: 'create_profile',
            payload: profile,
            cap_secret: null,
            provenance
        })
        $q.notify({message: 'Profile saved', color: 'green', position: 'bottom-right'})
    } catch (error) {
        errorMsg.value = error instanceof Error ? error.message : String(error);
    }
}
</script>