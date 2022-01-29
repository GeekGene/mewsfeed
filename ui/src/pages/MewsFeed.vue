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
    import { mewsBy, createMew, myAgentPubKey } from '../services/clutter-dna'
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
                console.log("got event:", newMew)
                await createMew(newMew)
                this.mewsFeed = await mewsBy(myAgentPubKey())
            }
        },

        async mounted() {
            this.mewsFeed = await mewsBy(myAgentPubKey())
        },

        components: {
            Mew,
            MewConstructor
        }
    }
</script>