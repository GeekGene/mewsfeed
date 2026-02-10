/**
 * Fishy integration module for mewsfeed
 *
 * Re-exports from @zippy/fishy-client package for compatibility.
 * Also provides ZeroArcProfilesClient for zero-arc nodes that need to always
 * fetch from network instead of using local-first strategy.
 */

// Re-export from the fishy-client package
export {
  FishyAppClient,
  waitForFishy,
  isFishyAvailable,
  ConnectionStatus,
  type ConnectionState,
  type ConnectionConfig,
  type FishyAppClientOptions,
} from '@zippy/fishy-client';

// Keep local ZeroArcProfilesClient (app-specific)
export { ZeroArcProfilesClient } from './ZeroArcProfilesClient';
