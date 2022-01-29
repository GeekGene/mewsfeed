<template>
    <div>
        <MewConstructor v-on:publish-mew="publishMew"></MewConstructor>
        <h2>Your Mews Feed:</h2>
        <ul>
            <li v-for="mew in mewsFeed">
                <Mew :mewContent="mew"></Mew>
            </li>
        </ul>
    </div>
</template>

<script>
    import { mewsFeed, createMew } from '../services/clutter-dna'
    import Mew from '../components/Mew.vue'
    import MewConstructor from '../components/MewConstructor.vue'

    export default {
        data() {
            return {
                mewsFeed: [],
            }            
        },

        methods: {
            async publishMew(newMew) {
                await createMew(newMew)
                this.mewsFeed = await mewsFeed({option: ""})
            }
        },

        async mounted() {
            this.mewsFeed = await mewsFeed({option: ""})
        },

        components: {
            Mew,
            MewConstructor
        }
    }
</script>