/**
 * HWC integration module for mewsfeed
 *
 * Re-exports from @holo-host/web-conductor-client package for compatibility.
 * Also provides ZeroArcProfilesClient for zero-arc nodes that need to always
 * fetch from network instead of using local-first strategy.
 */

// Re-export from the web-conductor-client package
export {
  WebConductorAppClient,
  waitForHolochain,
  isWebConductorAvailable,
  ConnectionStatus,
  JoiningClient,
  JoiningError,
  GatewayProxy,
  type ConnectionState,
  type ConnectionConfig,
  type WebConductorAppClientOptions,
  type Challenge,
} from '@holo-host/web-conductor-client';

// Keep local ZeroArcProfilesClient (app-specific)
export { ZeroArcProfilesClient } from './ZeroArcProfilesClient';
