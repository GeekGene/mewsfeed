# Clutter Specs

[![hackmd-github-sync-badge](https://hackmd.io/DSAyoLf1TbWpDwTZNcTrOg/badge)](https://hackmd.io/DSAyoLf1TbWpDwTZNcTrOg)


## Assumptions & Requirements
 - Reuse some of the original crazy cat stuff for UI, but have an option to turn off the background (tone it down)
 - Our goal is to have a competent, show-worthy app, but it doesn't have to be perfect
 - We'd like to end up with something that people would enjoy playing with and would be good to show off to bluesky folks
 - Use open source widgets / UIs wherever helpful


## Basic Feature List
### 1st Pass / MVP for playing

Zome: Profile
 - [x] Register a username
   - [ ] Disambiguation page for usernames
 - [x] Create / Edit user profile
   - [ ] First Name / Last Name
   - [ ] Default: identicon as avatar
   - [x] Upload avatar image
   - [x] Basic 1-line bio
   - [x] Location
 - [ ] Search for users (by pathname/anchor)
 - [ ] User Page (with that user's mews feed)
 - [ ] Follow / Unfollow users (by agentkey)

Zome: Mews
 - [ ] Compose/Commit mew
 - [ ] Mews Feed (with recent mews from follows)
   - [ ] pagination / "load more" option
 - [ ] Link new mew from a agentkey as a post

### 2nd Pass Features / More full experience
 - [ ] Ensure username uniqueness (via external namespace service?)
 - [ ] Change username?
 - [ ] Process tweet text for grammatical components
     - [ ] @user mentions
     - [ ] #hashtags
     - [ ] $cashtags ?
     - [ ] ^links (in UI triggers a link constructor)
 - [ ] Open social preview (e.g. thumbnail, mewmew box, etc)
 - [ ] Attach / Upload Picture (file sharing DNA)
 - [ ] Reply to mew :left_speech_bubble: 
 - [ ] Mewmew? (Retweet without comment) :recycle: 
 - [ ] Favorite a mew? :heart:
 - [ ] Delete a mew? 🗑
 - [ ] infinite scroll on feeds?


### Later Passes / Future Features
- [ ] Preview Profile
- [ ] Update Post
- [ ] Language preference in user profile
- [ ] Future: Search mews by keywords
- [ ] Lists??
- [ ] Direct Messages

## User Experience / Workflow
 
## UI Specs

### Pages
 - [ ] Home page: TBD
 - [x] View/Edit my profile:
 - [ ] View/Follow other user profile
 - [ ] Mews_by(agent)
 - [ ] MewsFeed(agent): coallated mews_by for the people the agent follows



## DNA Specs

### Component DNAs

#### Clutter App

###### Entry Defs

###### External FnsAttach image / file store

**V.01 / First Pass**

Zome: Profile
 - create_handle(string)
 - create_profile(struct)
 - update_profile(struct)
 - view_user()


#### Contents / Structure of MewsFeed

Date sorted Vector of FeedMews

```rust 
enum MewType {
  Original(MewContent,
  Reply(HeaderHash,MewContent),
  ReMew(HeaderHash,Option<MewContent>),
  MewMew(HeaderHash,MewContent), // QuoteTweet
}

struct FullMew {}
  mew_type: MewType,
  mew: Option<MewContent>,
}

struct MewContent {
  mew: String, // "Visit this web site ^link by @user about #hashtag to earn $cashtag! Also read this humm earth post ^link (as an HRL link)" 
  mew_links: Vec[LinkTypes], // [^links in the mewstring in sequence]
  mew_images: Vec[EntryHash], //Vec of image links hashes to retrieve
}
enum LinkTypes {
  URL,
  HRL, //Holochain Resource Locator DnaHash/DhtHash<@AgentKey>
}

struct AuthorInfo {
 handle: Profile.handle,
 full_name: Profile.Firstname + Profile.Lastname,
 avatar_hash: EntryHash,
}

struct FeedMew {
  author: AuthorInfo,
  time: Element.Header.TimeStamp,
  mew: FullMew,
  stats: Vec[u32], // counts of get_links for replies, retweets, likes
}

MewsFeed: Vec[FeedMews]
```

### Structuring Links in Clutter

Use PATHS for a bunch of stuff to find things in standard places. For example:
```
/agent/[sharded agent_pubkey]/mews/ (links to mews)
                      /followers (links to agentkeys)
                      /following (links to agentkeys)
                      /licks (likes) (links to mews)
                      /mentions (links to mews)
                      /images (links to entryhashes)
/hashtag/[sharded hashtag] (links to mews)
/cashtag/[sharded cashtag] (links to mews)
/handle/[rivalrously managed namespace]/[links to agentkeys]
/time/year/month/day/hour/
```
Other non-path links
```
MewContent/replies
          /retweets
          /licks(likes)
```

``` rust
enum FeedOptions {
    By(AgentPubKey),
    About(Path), // (mentions, hashtags, cashtags, links)
    FollowedBy(AgentPubKey), 
    authored_by: AgentPubKey
    
}

Paths
/hashtags/[tags]
/cashtags/[tags]
/agents/[agentpubkey][3:2]
  .../mentions
  .../favorites
  .../following
  .../follows
```
Zome: Mews
 - create_mew()
 - view_mew // includes replies (and related things, e.g. "quote tweets")
 - mews_feed(FeedOptions) -> Vec<Mew>
 - mews_by(AgentPubKey)
 - reply_to_mew()

**Future versions**
Zome: Profile
 - delete_handle()  // leave the platform
 - update_handle(string)
 - preview_profile()
Zome: Mews
 - delete_post()
 - update_post()

#### Keyword Indexer (someday)
###### Entry Defs
###### External Fns

#### Personas/profiles (someday)

## Mimetic Content / Branding
- Cattiness
- Cat = animal of the internet
- Mew instead of tweet
- Mewmew instead of retweet
- Mewsfeed instead of newsfeed
- Licks instead of likes
- Collar tags instead of username/handle
- ## editors
/.idea
/.vscode

## system files
.DS_Store
## editors
/.idea
/.vscode

## system files
.DS_Store
