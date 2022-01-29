import type { Address, Agent, Expression, PublicSharing, LanguageContext, HolochainLanguageDelegate, ExpressionAdapter, AgentService } from "@perspect3vism/ad4m";
import { DNA_NICK } from "./dna";

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
    const mew = await this.#DNA.call(
      DNA_NICK,
      "mew",
      "get_mew",
      mewAddress
    );

    return {
      author: 'unknown',
      timestamp: 'unknown',
      data: mew,
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

    const address = await this.#DNA.call(
      DNA_NICK,
      "mew",
      "create_mew",
      //@ts-ignore
      mewObject.content
    );

    return address
  }
}