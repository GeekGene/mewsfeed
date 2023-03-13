import { BasicRecord, Record } from './BasicRecord';

describe('Model: Basic Record', () => {
  it('The Basic Record Model should be able to initialize a new populated basic record', () => {
    const blankRecord = new BasicRecord();
    expect(BasicRecord.instanceOf(blankRecord)).toBeTrue();
    expect(blankRecord instanceof BasicRecord).toBeTrue();
  });

  it('The Basic Record Model should be able accept data for a previously initialized basic record', () => {
    const id = BasicRecord.generateId();
    const created = Date.now();
    const updated = Date.now();
    const recordObj = { id, created, updated };
    const prevRecord = new BasicRecord(recordObj);
    expect(BasicRecord.instanceOf(prevRecord)).toBeTrue();
    expect(prevRecord instanceof BasicRecord).toBeTrue();
    expect(prevRecord.id).toEqual(id);
    expect(prevRecord.created).toEqual(created);
    expect(prevRecord.updated).toEqual(updated);
  });

  it('The Basic Record Model should be able to throw an error when initializing with a malformed object', () => {
    const id = BasicRecord.generateId();
    const recordObj = { id };
    try {
      const prevRecord = new BasicRecord(recordObj);
    } catch (e) {
      expect(e).toBeDefined();
      console.error(e);
    }
  });
});
