# Changelog

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/). This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Unreleased

### Added

### Changed

### Fixed

### Removed

## 2022-08-11 v0.4.0-alpha

### Changed

- **BREAKING**: upgrade Holochain to 145 & split into integrity & coordinator zomes
- **BREAKING**: convert b64 hashes to byte hashes in zome and test
- handle agent pub keys on the UI
- all links use header hashes now instead of entry hashes (licking, replying, mewmewing etc. as well as tagging) [\#31](https://github.com/artbrock/clutter/pull/31)
- upgrade to Tryorama 0.5.0 [\#31](https://github.com/artbrock/clutter/pull/31)
- break up the one huge test into isolated test cases [\#31](https://github.com/artbrock/clutter/pull/31)
- update profiles ui
- upgrade profiles & open-dev packages
- differentiate link types
