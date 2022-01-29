<template>
    <div>
        <h1>Mews Feed</h1>
        <div>{{ mewsFeed }}</div>
    </div>
</template>

<script>
    import { mewsFeed } from '../services/clutter-dna'

    export default {
        async data() {
            return {
                mewsFeed: await mewsFeed()
            }            
        }
    }
</script>