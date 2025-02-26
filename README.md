# mewsfeed

We are currently working towards the first major release of MewsFeed.

[Collaborate on GitHub](https://github.com/orgs/GeekGene/projects/1) and [join our Discord](https://discord.gg/D3BykUZumM)!

## Chat With Us

Come join us on mewsfeed. We're talking at the hashtags #mewsfeed and #holochain. Share your feedback by tagging #mewsfeedback!

## Follow Us

You can follow the team on mewsfeed at:

@artbrock
@bierlingm
@mattyg
@jost

## Environment Setup

1. Install the holochain dev environment (only nix-shell is required): https://developer.holochain.org/docs/install/
2. Enable Holochain cachix with:

```bash
nix-env -iA cachix -f https://cachix.org/api/v1/install
cachix use holochain-ci
```

3. Clone this repo and `cd` inside of it.
4. Enter the nix shell by running this in the root folder of the repository:

```bash
nix develop
npm install
```

This will install all the needed dependencies in your local environment, including `holochain`, `hc` and `npm`.

## Building the DNA

- Build the DNA (assumes you are still in the nix shell for correct rust/cargo versions from step above):

```bash
npm run build:happ
```

## Running the DNA tests

```bash
npm run test
```

## UI

To test out the UI:

```bash
npm start
```

To run another agent, open another terminal, and execute again:

```bash
npm start
```

Each new agent that you create this way will get assigned its own port and get connected to the other agents.

## Holo Hosting

1. Get a copy of the Holo envoy server directly from a Holo team member, copy it to the root of the directory as `holo-dev-server`

To test out a holo hosted agent:

```bash
npm start:agent:holo
```

## Package

To package the web happ:

```bash
npm run package
```

You'll have the `mewsfeed.webhapp` in `workdir`. This is what you should distribute so that the Holochain Launcher can install it.

You will also have its subcomponent `mewsfeed.happ` in the same folder`.

## Documentation

We are using this tooling:

- [NPM Workspaces](https://docs.npmjs.com/cli/v7/using-npm/workspaces/): npm v7's built-in monorepo capabilities.
- [hc](https://github.com/holochain/holochain/tree/develop/crates/hc): Holochain CLI to easily manage Holochain development instances.
- [@holochain/tryorama](https://www.npmjs.com/package/@holochain/tryorama): test framework.
- [@holochain/conductor-api](https://www.npmjs.com/package/@holochain/conductor-api): client library to connect to Holochain from the UI.
