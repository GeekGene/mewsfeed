import { Ad4mClient, Literal, Perspective, PerspectiveProxy } from '@perspect3vism/ad4m'
import { ApolloClient, ApolloLink, InMemoryCache } from "@apollo/client";
import { WebSocketLink } from '@apollo/client/link/ws';
import { Profile } from '../types/types'

const AGENT_PERSPECTIVE_NAME = '__agent_public_perspective'

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
let me


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