import type { Address, Agent, Expression, PublicSharing, LanguageContext, HolochainLanguageDelegate, ExpressionAdapter, AgentService } from "@perspect3vism/ad4m";
import { DNA_NICK } from "./dna";
import { serializeHash } from "@holochain-open-dev/core-types";
import { Base64 } from 'js-base64';

export default class ExpressionAdapterImpl implements ExpressionAdapter {
  #DNA: HolochainLanguageDelegate;
  #agent: AgentService;
  putAdapter: PublicSharing

  constructor(context: LanguageContext) {
    this.#DNA = context.Holochain as HolochainLanguageDelegate;
    this.#agent = context.agent;
    this.putAdapter = new Sharing(context)
  }

  async get(mewAddress: Address): Promise<Expression> {
    const fullMewWithContext = await this.#DNA.call(
      DNA_NICK,
      "mews",
      "get_feed_mew_and_context",
      mewAddress
    );
    const author = serializeHash(new Uint8Array(fullMewWithContext.feedMew.header.author.data)) 
    const timestamp = fullMewWithContext.feedMew.header.timestamp
    return {
      author: author,
      timestamp: timestamp,
      data: fullMewWithContext,
      proof: {
        key: 'none',
        signature: 'none'
      }
    }
  };
}

class Sharing implements PublicSharing {
  #DNA: HolochainLanguageDelegate;
  #agent: AgentService;

  constructor(context: LanguageContext) {
    this.#DNA = context.Holochain as HolochainLanguageDelegate;
    this.#agent = context.agent; 
  }

  async createPublic(mewObject: object): Promise<Address> {
    // if(!mewObject["mew"]) throw "Not a Mew object"
    // //@ts-ignore
    // const mewString = mewObject.mew

    const address = await this.#DNA.call(
      DNA_NICK,
      "mews",
      "create_mew",
      mewObject
    );

    return address
  }
}