import { BasicRecordInterface, BasicRecordSchema, Record } from './BasicRecord';

interface TweetPartialSchema {
  tweetText: string | null;
  userId: string | null;
}

type TweetSchema = TweetPartialSchema & BasicRecordSchema;

class TweetRecord extends Record implements BasicRecordInterface {
  public tweetText: string;
  public userId: string;
  protected static MemberVariblesNames: Array<string> = ['tweetText', 'userId'];

  constructor(data?: Partial<TweetSchema>) {
    super();
    if (data) {
      if (TweetRecord.instanceOf(data)) {
        Object.assign(this, data);
      } else if (TweetRecord.partialInstanceOf(data)) {
        const record = { ...this.initEmptyRecord(), ...data };
        Object.assign(this, record);
      } else if (Object.keys(data).length < 2) {
        const dString = JSON.stringify(data);
        throw new Error(
          `Attempted to initialize a Tweet Record with a malformed object: ${dString}`
        );
      }
    } else {
      Object.assign(this, this.initEmptyRecord());
    }
  }

  public initEmptyRecord(userId = null, tweetText = null): TweetSchema {
    const basicRecord = super.initEmptyRecord();
    const record = {
      ...basicRecord,
      tweetText,
      userId
    };
    return record;
  }
}

export { TweetRecord, TweetPartialSchema, TweetSchema };
