/**
 * Cloudflare Worker entry point for the mewsfeed joining service.
 *
 * Based on joining-service/deploy/cloudflare/worker-entry.ts with
 * the KvUrlProvider wired up for linker URL resolution from KV.
 */

import { createApp, type ServiceContext } from '../../../joining-service/src/app.js';
import { resolveConfig, type ServiceConfig } from '../../../joining-service/src/config.js';
import { KvSessionStore } from '../../../joining-service/src/session/kv-store.js';
import { KvUrlProvider } from '../../../joining-service/src/urls/kv.js';
import { OpenAuthMethod } from '../../../joining-service/src/auth-methods/open.js';
import { EmailCodeAuthMethod } from '../../../joining-service/src/auth-methods/email-code.js';
import { InviteCodeAuthMethod } from '../../../joining-service/src/auth-methods/invite-code.js';
import { PostmarkTransport } from '../../../joining-service/src/email/postmark.js';
import { LairProofGenerator } from '../../../joining-service/src/membrane-proof/lair-signer.js';
import type { MembraneProofGenerator } from '../../../joining-service/src/membrane-proof/generator.js';
import type { AuthMethodPlugin } from '../../../joining-service/src/auth-methods/plugin.js';
import type { EmailTransport } from '../../../joining-service/src/email/transport.js';

interface Env {
  SESSIONS: KVNamespace;
  CONFIG_JSON: string;
  SIGNING_KEY_HEX?: string;
}

function buildEmailTransport(config: ServiceConfig): EmailTransport | null {
  if (!config.email) return null;

  if (config.email.provider === 'postmark') {
    if (!config.email.api_key || !config.email.from) {
      throw new Error('Postmark requires api_key and from');
    }
    return new PostmarkTransport(config.email.api_key, config.email.from);
  }

  return null;
}

function buildAuthPlugins(
  config: ServiceConfig,
  emailTransport: EmailTransport | null,
): Map<string, AuthMethodPlugin> {
  const plugins = new Map<string, AuthMethodPlugin>();

  for (const method of config.auth_methods) {
    switch (method) {
      case 'open':
        plugins.set('open', new OpenAuthMethod());
        break;

      case 'email_code':
        if (!emailTransport) {
          throw new Error(
            'email_code auth requires email config with postmark provider',
          );
        }
        plugins.set(
          'email_code',
          new EmailCodeAuthMethod({
            transport: emailTransport,
            subject: config.email?.template
              ? undefined
              : 'Your verification code',
            template: config.email?.template,
          }),
        );
        break;

      case 'invite_code':
        plugins.set(
          'invite_code',
          new InviteCodeAuthMethod(config.invite_codes ?? []),
        );
        break;

      default:
        console.warn(`Unknown auth method: ${method}, skipping`);
    }
  }

  return plugins;
}

async function buildProofGenerator(
  signingKeyHex?: string,
): Promise<MembraneProofGenerator | undefined> {
  if (!signingKeyHex) return undefined;
  return LairProofGenerator.fromHex(signingKeyHex);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const configInput = JSON.parse(env.CONFIG_JSON) as Partial<ServiceConfig>;
    const config = resolveConfig(configInput);

    const sessionStore = new KvSessionStore(
      env.SESSIONS,
      config.session?.pending_ttl_seconds ?? 3600,
      config.session?.ready_ttl_seconds ?? 86400,
    );

    const urlProvider = new KvUrlProvider(env.SESSIONS);

    const emailTransport = buildEmailTransport(config);
    const authPlugins = buildAuthPlugins(config, emailTransport);

    let proofGenerator: MembraneProofGenerator | undefined;
    if (config.membrane_proof?.enabled) {
      proofGenerator = await buildProofGenerator(env.SIGNING_KEY_HEX);
    }

    const context: ServiceContext = {
      config,
      sessionStore,
      authPlugins,
      proofGenerator,
      urlProvider,
    };

    const app = createApp(context);
    return app.fetch(request);
  },
};
