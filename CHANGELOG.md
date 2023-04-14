# Changelog

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/). This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Unreleased

### Added
### Changed
### Fixed
### Removed

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
