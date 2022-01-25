<template>
    <q-page>
        <q-form class="q-mx-xl" style="max-width: 400px;">
            <q-input v-model="profile.avatar" label="Avatar"/>
            <q-input v-model="profile.bio" label="Bio"/>
            <q-input v-model="profile.lang_pref" label="Language preference"/>
            <q-input v-model="profile.location" label="Location"/>
        </q-form>
    </q-page>
</template>

<script setup lang="ts">
import { Profile } from 'ui/src/types/types';
import {AppWebsocket} from '@holochain/client'
import {onMounted, reactive, UnwrapRef} from 'vue'

const profile = reactive<Profile>({
    avatar: '',
    bio: '',
    lang_pref: 'en',
    location: ''
})

onMounted(async () => {
    // const ws = await AppWebsocket.connect('ws://localhost:8888')
    // const appInfo = await ws.appInfo({installed_app_id: 'test-app'})
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


</script>