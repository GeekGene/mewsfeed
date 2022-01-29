<template>
    <div>
        <input v-model="newMew">
        <button v-on:click="publishMew">Publish Mew</button>
        <h2>Your Mews Feed:</h2>
        <ul>
            <li v-for="mew in mewsFeed">
                {{ mew.entry }}
            </li>
        </ul>
    </div>
</template>

<script>
    import { mewsFeed, createMew } from '../services/clutter-dna'

    export default {
        data() {
            return {
                mewsFeed: [],
                newMew: ""
            }            
        },

        methods: {
            async publishMew() {
                await createMew(this.newMew)
                this.mewsFeed = await mewsFeed({option: ""})
                this.newMew = ""
            }
        },

        async mounted() {
            this.mewsFeed = await mewsFeed({option: ""})
        }
    }
</script>