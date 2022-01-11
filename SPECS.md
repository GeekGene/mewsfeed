# Clutter Specs

## Assumptions & Requirements
 - Reuse some of the original crazy cat stuff for UI, but have an option to turn off the background (tone it down)
 - Our goal is to have a competent, show-worthy app, but it doesn't have to be perfect
 - We'd like to end up with something that people would enjoy playing with and would be good to show off to bluesky folks
 - Use open source widgets / UIs wherever helpful


## Basic Feature List
 - [ ] Register a username, in the future ensure uniqueness
 - [ ] Create / Edit user profile
   - [ ] Change username?
   - [ ] First Name / Last Name
   - [ ] Default: identicon as avatar
   - [ ] Upload avatar image
   - [ ] Basic 1-line bio
 - [ ] Search for users (by pathname/anchor)
 - [ ] Follow / Unfollow users
 - [ ] Compose/Commit mew
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
 - [ ] Mews Feed (with recent mews from follows)
 - [ ] User Page (with that user's mews)
   - [ ] infinite scroll on feeds?
   - [ ] pagination / "load more" option
 - [ ] Future: Search mews by keywords

## Possible Future Features
- [ ] Lists
- [ ] Direct Messages
- [ ] Preview Profile
- [ ] Update Post

## User Experience / Workflow



## UI Specs



## DNA Specs

### Component DNAs

#### Clutter App

###### Entry Defs

###### External Fns

V.01
 - create_handle(string)
 - delete_handle()
 - create_profile(struct)
 - update_profile(struct)
 - view_user()
 - view_feed(agentkey)
 - create_post()
 - delete_post()
 - view_post // includes replies (and related things, e.g. "quote tweets")
 - reply_to_post()

Future versions
 - update_handle(string)
 - preview_profile()
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
- 