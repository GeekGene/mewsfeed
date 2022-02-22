<svelte:options tag={null}/>

<script lang="ts">
    // import type Expression from "@perspect3vism/ad4m/Expression";
    import ConstructorIcon from "./ConstructorIcon.svelte";
    export let expression//: Expression
    let feedMewWithContext
    $: if(expression && expression.data) feedMewWithContext = JSON.parse(expression.data)
    let isReplying = false
    let isMewMewing = false
    function togglelickMew() {
        //TODO: create function in adapter for liking/unliking mews
        console.log(feedMewWithContext.mewEntryHash)
    }
    function replyToMew() {
        if (isMewMewing) {
            isMewMewing = !isMewMewing
        }
        isReplying = !isReplying
    }
    function shareMew() {
        const createMewInput = {
            mewType: {
                reMew: feedMewWithContext.mewEntryHash
            },
            mew: null
        }
        createExpression(createMewInput)
    }
    function mewMew() {
        if (isReplying) {
            isReplying = !isReplying
        }
        isMewMewing = !isMewMewing
    }

    function createExpression(createMewInput) {
        console.log(createMewInput)
        //TODO: call createPublic in adapter
    }
</script>

<div class="container">
    <div class="avatar-box"></div>
    <div class="mew-meta">
        {expression.author} {expression.timestamp}
    </div>
    <div class="mew-content">
        <p>{feedMewWithContext.feedMew.mew.mew.mew}</p>
    </div>
    <div class="mew-interactions">
        <button on:click={() => togglelickMew()}>lick ({feedMewWithContext.licks.length})</button>
        <button on:click={() => replyToMew()}>reply ({feedMewWithContext.comments.length})</button>
        <button on:click={() => shareMew()}>share ({feedMewWithContext.shares.length})</button>
        <button on:click={() => mewMew()}>mewmew ({feedMewWithContext.shares.length})</button>
    </div>
    {#if isReplying}
        <ConstructorIcon commitExpression={createExpression} mewType={{reply:feedMewWithContext.mewEntryHash}}/>
    {:else if isMewMewing}
        <ConstructorIcon commitExpression={createExpression} mewType={{mewMew:feedMewWithContext.mewEntryHash}}/>
    {/if}
</div>


<style>
    .container {
        width: 400px;
        height: 300px;
        background-color: lightblue;
    }
    .avatar-box {
        width: 50px;
        height: 50px;
        border-radius: 50px;
        background: blue;
    }
</style>