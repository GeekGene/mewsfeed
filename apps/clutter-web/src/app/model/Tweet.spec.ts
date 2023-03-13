import { TweetRecord } from './Tweet';

describe('Model: Tweet Record', () => {
  it('The Tweet Record Model should be able to initialize a new populated Tweet record', () => {
    const blankTweet = new TweetRecord();
    expect(TweetRecord.instanceOf(blankTweet)).toBeTrue();
    expect(blankTweet instanceof TweetRecord).toBeTrue();
  });

  it('The Tweet Record Model should be able accept data for a previously initialized Tweet record', () => {
    const id = TweetRecord.generateId();
    const created = Date.now();
    const updated = Date.now();
    const userId = TweetRecord.generateId();
    const tweetText = 'Testing attention please!';
    const recordObj = { id, created, updated, userId, tweetText };
    const prevRecord = new TweetRecord(recordObj);
    expect(TweetRecord.instanceOf(prevRecord)).toBeTrue();
    expect(prevRecord instanceof TweetRecord).toBeTrue();
    expect(prevRecord.id).toEqual(id);
    expect(prevRecord.created).toEqual(created);
    expect(prevRecord.updated).toEqual(updated);
    expect(prevRecord.userId).toEqual(userId);
    expect(prevRecord.tweetText).toEqual(tweetText);
  });

  it('The Tweeet Record Model should be to initialize a new Tweet Record with only the user id and the text of the tweet', () => {
    const userId = TweetRecord.generateId();
    const tweetText = 'Testing once again!';
    const partialTweet = { userId, tweetText };
    expect(TweetRecord.partialInstanceOf(partialTweet)).toBeTrue();
    const newTweet = new TweetRecord(partialTweet);
    expect(TweetRecord.instanceOf(newTweet)).toBeTrue();
    expect(newTweet instanceof TweetRecord).toBeTrue();
  });

  it('The Tweeet Record Model should be able to throw an error when initializing with a malformed object', () => {
    const id = TweetRecord.generateId();
    const recordObj = { id };
    try {
      const prevRecord = new TweetRecord(recordObj);
    } catch (e) {
      expect(e).toBeDefined();
      console.error(e);
    }
  });
});
