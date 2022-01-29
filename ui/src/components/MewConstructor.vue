<template>
    <div>
        <input v-model="newMew">
        <button v-on:click="publishMew">Publish Mew</button>
    </div>
</template>

<script>
import { defineComponent } from 'vue'

export default defineComponent({
    methods: {
        async publishMew() {
            this.$emit("publish-mew", this.newMew)
            this.newMew = ""
        }
    }
})
</script>
