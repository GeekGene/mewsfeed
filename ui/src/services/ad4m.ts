import { Ad4mClient, Agent, Link, LinkQuery, Literal, Perspective, PerspectiveProxy } from '@perspect3vism/ad4m'
import { ApolloClient, ApolloLink, InMemoryCache } from "@apollo/client";
import { WebSocketLink } from '@apollo/client/link/ws';
import { Profile, CreateMewInput, FeedMewWithContext, FeedOptions } from '../types/types'
import { EntryHashB64 } from '@holochain-open-dev/core-types';

const AGENT_PERSPECTIVE_NAME = '__agent_public_perspective'
// const CLUTTER_LANGUAGE = "QmWaBfeuvHaLrBH3ybo5qFNgypGFpaoDiSCcny1rAB9NB6"
// const CLUTTER_LANGUAGE = "QmZS7UX1gETVe7EEWXsYNW8DWdCtKpnJry2AdPbdAoKEj1"
// const CLUTTER_LANGUAGE = "Qmezr5VQXZ1jf75STic67dH3KZf5MaiTRZq8wFGKmxNF3r"
// const CLUTTER_LANGUAGE = "QmenhKJnak3GWV8gvTghPw3rvmoFLzoD4nrDKm6guN9i2Z"
// const CLUTTER_LANGUAGE = "QmUhaKmuxYPgzCNRrcjCFqD6zKwGDYy2BH3kLMUsguUkiN"
// const CLUTTER_LANGUAGE = "Qmbrtheoi5nCGGcPHCa7fwTdbRymJf3H991vnHhjK2ZQrf"
// const CLUTTER_LANGUAGE = "QmdaTaKtjULVpTjnf99B1vVTq6vCHU7RiYqgZ6uwZeWxMr"
// const CLUTTER_LANGUAGE = "QmbKWRzYTKxaqbKpXy9UL3BzynyLR86aB4ZvLSdX8QSMTY"
// const CLUTTER_LANGUAGE = "QmNkypz8SjoDajzJreeX2BEogfhTttJMbyYiMXujqxS8UD"
const CLUTTER_LANGUAGE = "QmRtWtNCxZ7HVVc3C8CFD8MnsNL58316APDKVAbH8TRrWa"

//--------------------------------------------
// Create AD4M client
//--------------------------------------------
const uri = 'ws://localhost:4000/graphql'
const apolloClient = new ApolloClient({
    link: new WebSocketLink({
        uri,
        options: { reconnect: true },
        //webSocketImpl: ws,
    }),
    cache: new InMemoryCache({resultCaching: false, addTypename: false}),
    defaultOptions: {
        watchQuery: { fetchPolicy: "no-cache" },
        query: { fetchPolicy: "no-cache" }
    },
});
const ad4m = new Ad4mClient(apolloClient)
//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Create AD4M client
//////////////////////////////////////////////


let agentPerspective: PerspectiveProxy|undefined
let followingAgentPerspective: PerspectiveProxy|undefined
let me: Agent


//------------------------------------------------
// Init temp agent perspective for modifications
//------------------------------------------------
async function initAgentPerspective() {
    me = await ad4m.agent.me()
    const allPerspectives = await ad4m.perspective.all()
    agentPerspective = allPerspectives.find(p => p.name === AGENT_PERSPECTIVE_NAME)
    if(!agentPerspective) {
        agentPerspective = await ad4m.perspective.add(AGENT_PERSPECTIVE_NAME)
        if(me.perspective)
            agentPerspective.loadSnapshot(me.perspective)
    }
}
initAgentPerspective()
//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Init temp agent perspective for modifications
//////////////////////////////////////////////////

export async function loadProfile(): Promise<Profile> {
    let profile = {
        did: "",
        avatar: "",
        bio: "",
        lang_pref: "en",
        location: ""
    }

    let { did, perspective } = await ad4m.agent.me()
    profile.did = did

    perspective = new Perspective(perspective?.links)

    try{
        //@ts-ignore
        profile.avatar = Literal.fromUrl(perspective.getSingleTarget({source: 'self', predicate: 'clutter://profile.avatar'})).get()
    }catch(e){}
    try{
        //@ts-ignore
        profile.bio = Literal.fromUrl(perspective.getSingleTarget({source: 'self', predicate: 'clutter://profile.bio'})).get()
    }catch(e){
        console.error(e)
    }
    try{
        //@ts-ignore
        profile.lang_pref = Literal.fromUrl(perspective.getSingleTarget({source: 'self', predicate: 'clutter://profile.lang_pref'})).get()
    }catch(e){}
    try{
        //@ts-ignore
        profile.location = Literal.fromUrl(perspective.getSingleTarget({source: 'self', predicate: 'clutter://profile.location'})).get()
    }catch(e){}

    return profile
}

export async function createProfile(profile: Profile) {
    await initAgentPerspective()
    if(profile.avatar)
        await agentPerspective!.setSingleTarget({source: 'self', predicate: 'clutter://profile.avatar', target: Literal.from(profile.avatar).toUrl()})
    if(profile.bio)
        await agentPerspective!.setSingleTarget({source: 'self', predicate: 'clutter://profile.bio', target: Literal.from(profile.bio).toUrl()})
    if(profile.lang_pref)
        await agentPerspective!.setSingleTarget({source: 'self', predicate: 'clutter://profile.lang_pref', target: Literal.from(profile.lang_pref).toUrl()})
    if(profile.location)
        await agentPerspective!.setSingleTarget({source: 'self', predicate: 'clutter://profile.location', target: Literal.from(profile.location).toUrl()})
    await ad4m.agent.updatePublicPerspective(await agentPerspective!.snapshot())
}


export const createMew = async (mew: CreateMewInput) => {
    const mewUrl = await ad4m.expression.create(mew, CLUTTER_LANGUAGE)

    await agentPerspective!.add(new Link({
        source: me.did,
        predicate: 'clutter://haz_mew',
        target: mewUrl
    }))

    let agent = await ad4m.agent.updatePublicPerspective(await agentPerspective!.snapshot())
    console.log('returned agent', agent)
    return mewUrl
};
  
export const getMew = async (mew: EntryHashB64) : Promise<FeedMewWithContext> => {
    const mewExpression = await ad4m.expression.get(`${CLUTTER_LANGUAGE}://${mew}`)
    return mewExpression.data
};
  
export const mewsFeed = async (options: FeedOptions) : Promise<Array<FeedMewWithContext>> => {
    if (!agentPerspective) {
        await initAgentPerspective();
    }
    const myMewLinks = await agentPerspective!.get(new LinkQuery({
        source: me.did,
        predicate: 'clutter://haz_mew'
    }))
    const myMewUrls = myMewLinks?.map(link => link.data.target)

    const myMews = await Promise.all(
        myMewUrls.map(async url => await ad4m.expression.get(url))
    )

    const followingLinks = await agentPerspective!.get(new LinkQuery({
        source: me.did,
        predicate: 'clutter://follows'
    }))
    
    const followingDIDs = followingLinks.map(link => link.data.target)
    let allMews = []
    for (let agentDID of followingDIDs) {
        const agent = await ad4m.agent.byDID(agentDID)
        if (!agent) continue
        console.log('agent followed:', agent)
        console.log('agent perspective:', agent.perspective)
        const tempAgentPerspective = await ad4m.perspective.add("temp working perspective")
        await tempAgentPerspective.loadSnapshot(agent.perspective)
        const mewLinks = await tempAgentPerspective.get(new LinkQuery({
            source: agentDID,
            predicate: 'clutter://haz_mew'
        }))

        const mewURLs = mewLinks.map(link => link.data.target)
        const mews = await Promise.all(
            mewURLs.map(async url => await ad4m.expression.get(url))
        )
        allMews = allMews.concat(mews)
    }
    return allMews.concat(myMews).map(expression => expression.data)
    //get all mine, get all people I follow
};

export const followAgent = async (agentDID: string) => {
    if (!agentPerspective) {
        await initAgentPerspective();
    }
    await agentPerspective!.add(new Link({
        source: me.did,
        predicate: 'clutter://follows',
        target: agentDID
    }))
    const snapshot = await agentPerspective!.snapshot()
    console.log('snapshot after follow:', snapshot)
    await ad4m.agent.updatePublicPerspective(snapshot)
}