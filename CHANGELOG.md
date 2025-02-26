# Changelog

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/). This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Unreleased

## 2025-02-25 v0.12.0
- build: bump to holochain 0.4.1
- build: switch to new holonix
- fix: avoid failing zome calls due to empty input when navigating away from profile page

## 2023-09-12 v0.11.1
- feat: add ellipses to truncated agent pub keys, extend truncation to 15 chars, do not truncate only on creators / followers list

## 2023-09-12 v0.11.0
- feat: show avatar in lightbox upon clicking profile (#233)
- refactor: manage dialogs via stores, reduce duplicate components (#232)
- fix: ensure notifications count only grows over time (#231)
- fix: reactivity of profile popup data (#230)
- fix: show create profile form upon clicking 'pin mew' button without a profile (#228)
- fix: avoid excessive "profile not found" errors (#225)
- build: replace new-port-cli with fork avoiding rust clap validation issue (#224)
- feat: only notify agent of responses to mews they responded to if those responses are created after their own (#221)
- feat: avoid duplicate notifications for both 'responded to your mew' and 'responded to a mew you responded to' when agent both created the mew & responded to it (#221)
- fix: infinite scroll of followers / creators lists (#220)
- feat: display confirmation dialog before creating a mewmew (#219)
- feat: focus on input fields upon opening dialogs (#216)
- fix: reduce noise of toast errors from failed zome calls when fetching data, only display toast errors when active user actions fail (#204)
- fix: remove typo dot (#203)
- feat: add tooltips to site menu (#202)
- chore: delete unused signals code (#201, #200)
- fix: reactively update pinned mews & authored mews upon mew deletion (#199)
- style: add padding around agent profiles in followers / creators lists (#198)
- fix: use count_links for followers /creators counts (#197)
- style: wrap toast message text, shrink font size, increase display time (#196)
- fix: explore shuffle profiles reactivity (#175)
- fix: explore page mis-matched tags (#175)

## 2023-02-26 v0.10.0-rc.1

### Added
### Changed
- **BREAKING CHANGE**: upgrade Holochain to v0.3.0-beta-dev.8
- **BREAKING CHANGE**: upgrade JS client to v0.15.0
- **BREAKING CHANGE**: upgrade Tryorama to v0.15.0-rc.1
- **BREAKING CHANGE**: upgrade to holochain 0.2.1 (#159)
- feat: front-end UI redesign (#128, #154)
- refactor: rewrite DNAs following patterns of scaffolder (#124)
- feat: improve styling of quotes (#134)
- feat: pin mews to your profile page (#133)
- feat: pagination + infinite scroll of all lists (#146)
- feat: explore page to discover creators and tags
- feat: notifications page to see all interactions with an agent's content (#141)
- feat: use local storage cache, polling, and SWRV pattern for fetching data (#144, #133)
- feat: support pagination + infinite scroll of lists (#146)
- feat: soft-delete mews (#129)
- feat: optionally set a strict min + max mew length via DNA properties (#116)
- feat: link to mentions on profile page (#110)
- feat: link to parent mew in response mews (#107)
- feat: allow app use without profile, prompt to create profile upon first action (#61)
- feat: improve rendering of mew content and input field (#57)
- refactor: link input UX (#106)
- infrastructure: improvements to deployment, ci infrastructure (#156, #119, #118, #103)
- chore: rename app from 'clutter' to 'mewsfeed' (#115)
### Fixed
- fix: minor quirks & codebase cleanup (#148, #143, #164)
### Removed
- removed support for multi-word link text

## 2023-02-26 v0.9.0-alpha
### Added
- Support multi-word link text in mews with the syntax `^[my link]`
- Human-readable timestamps
- Search for hashtags, cashtags
- Display URL in tooltip when hovering over mew links
- URL hyperlinks in mews.
### Changed
- **BREAKING CHANGE**: Upgrade to Holochain v0.1.3

## 2022-12-25 v0.8.0-alpha
### Added
- Thread view for a mew with all its replies.
### Changed
- Upgrade to Holochain 0.0.175

## 2022-11-10 v0.7.0-alpha

### Added
- **BREAKING CHANGE**: Add links vector to mew content, which holds agent keys of user mentions in mews.
- Add sections "Followed by" and "Following" to agent profile view.

### Changed
- **BREAKING CHANGE**: Upgrade to Holochain v0.0.170.

## 2022-09-29 v0.6.0-alpha

### Changed
- Upgrade to Holochain 0.0.161 & Lair 0.2.0 (compatible with Holo Alpha Testnet)

## 2022-08-27 v0.5.1-alpha

### Fixed
- Initialize profiles store only after log in to Holo
  - fixes profile prompt after Holo log in with existing profile
  - fixes possibility to follow oneself

## 2022-08-25 v0.5.0-alpha

### Changed

- **BREAKING**: upgrade Holochain to 156
- refactor to hybridity for Holo hosting and running locally (dev server/Launcher)
- running with a Holo Chaperone server can be configured with two env vars:
  - VITE_IS_HOLO_HOSTED=true to enable holo hosted version (= front end only)
  - VITE_CHAPERONE_SERVER_URL=https://chaperone.url to set the Chaperone server's URL

## 2022-08-11 v0.4.0-alpha

### Changed

- **BREAKING**: upgrade Holochain to 145 & split into integrity & coordinator zomes
- **BREAKING**: convert b64 hashes to byte hashes in zome and test
- handle agent pub keys on the UI
- all links use header hashes now instead of entry hashes (licking, replying, mewmewing etc. as well as tagging) [\#31](https://github.com/geekgene/mewsfeed/pull/31)
- upgrade to Tryorama 0.5.0 [\#31](https://github.com/geekgene/mewsfeed/pull/31)
- break up the one huge test into isolated test cases [\#31](https://github.com/geekgene/mewsfeed/pull/31)
- update profiles ui
- upgrade profiles & open-dev packages
- differentiate link types
