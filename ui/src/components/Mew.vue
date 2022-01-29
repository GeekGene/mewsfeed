<template>
    <div>
        {{ mewContent.entry }}
    </div>
</template>

<script>
import { defineComponent } from 'vue'

export default defineComponent({
    props: {
        mewContent: String
    },

    setup(props) {
        return props
    }
})
</script>
