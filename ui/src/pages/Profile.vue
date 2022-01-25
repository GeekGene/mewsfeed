<template>
    <q-page>
        <q-form class="q-mx-xl" style="max-width: 400px;">
            <q-input v-model="profile.avatar" label="Avatar" />
            <q-input v-model="profile.bio" label="Bio" />
            <q-input v-model="profile.lang_pref" label="Language preference" />
            <q-input v-model="profile.location" label="Location" />
            <q-btn @click="saveProfile" icon="save">Save</q-btn>
        </q-form>
        {{ errorMsg }}
    </q-page>
</template>

<script setup lang="ts">
import { Profile } from 'ui/src/types/types';
import { AppWebsocket, InstalledCell } from '@holochain/client'
import { onMounted, reactive, ref } from 'vue'

const profile = reactive<Profile>({
    avatar: '',
    bio: '',
    lang_pref: 'en',
    location: ''
})

const errorMsg = ref('')

let ws: AppWebsocket;
let cell: InstalledCell
let agentPubKey: Uint8Array;

onMounted(async () => {
    ws = await AppWebsocket.connect(`ws://localhost:${import.meta.env.VITE_HC_PORT}`)
    const appInfo = await ws.appInfo({ installed_app_id: 'test-app' })
    cell = appInfo.cell_data[0]
    agentPubKey = cell.cell_id[1]
    // const cell = appInfo.cell_data.find((cell) => cell.role_id === 'clutter');
    // if (!cell) {
    //     return
    // }
    // const provenance = cell.cell_id[1]
    // const result = await ws.callZome({
    //     cell_id: cell.cell_id,
    //     zome_name: 'profiles_stub',
    //     fn_name: 'get_profile',
    //     payload: {},
    //     cap_secret: null,
    //     provenance
    // })
})

async function saveProfile() {
    try {
        await ws.callZome({
            cell_id: cell.cell_id,
            zome_name: 'profiles_stub',
            fn_name: 'get_profile',
            payload: {},
            cap_secret: null,
            provenance: agentPubKey
        })
    } catch (error) {
        errorMsg.value = error instanceof Error ? error.message : String(error);
    }
}
</script>