<svelte:options tag={null}/>

<script lang="ts">
    import type Expression from "@perspect3vism/ad4m/Expression";
    export let expression: Expression
    export let createExpression
    let feedMewWithContext
    $: if(expression && expression.data) {
        console.log('expression from icon:', expression)
        feedMewWithContext = JSON.parse(expression.data)
    } 
    
    let text = ""
    let isReplying = false
    let isMewMewing = false
    function togglelickMew() {
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
    function createMewInput(text) {
        let mewType = isReplying ? { reply: feedMewWithContext.mewEntryHash } : { mewMew: feedMewWithContext.mewEntryHash }
        let createMewInput = {
            mewType: mewType,
            mew: text
        }
        return createMewInput
    }
</script>

<div class="container">
    {#if expression}
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
            <input bind:value={text}>
            <button on:click={()=>createExpression(createMewInput(text))}>Publish Mew</button>
        {:else if isMewMewing}
            <input bind:value={text}>
            <button on:click={()=>createExpression(createMewInput(text))}>Publish Mew</button>
        {/if}
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