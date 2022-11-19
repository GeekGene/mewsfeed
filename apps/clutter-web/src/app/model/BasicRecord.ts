interface BasicRecordSchema {
  id: string;
  created: number;
  updated: number;
}

interface BasicRecordInterface {
  initEmptyRecord(): AbstractBasicRecord;
}

abstract class AbstractBasicRecord {
  protected static MemberVariblesNames: Array<string> = [
    'id',
    'created',
    'updated'
  ];
  protected static implements(
    keys: Array<string>,
    data: AbstractBasicRecord
  ): boolean {
    return keys.every((key) => Object.keys(data).includes(key));
  }

  public static instanceOf(
    data: AbstractBasicRecord,
    partial = false
  ): boolean {
    return this.implements(this.getKeys(), data);
  }

  protected static getKeys(): Array<string> {
    //Todo:  Is there a function to return a list of variables from an interface?
    return [...this.MemberVariblesNames];
  }
}

class BasicRecord extends AbstractBasicRecord implements BasicRecordInterface {
  public id: string;
  public created: number;
  public updated: number;

  constructor(data: Partial<BasicRecordSchema> = null) {
    super();
    if (data) {
      if (BasicRecord.instanceOf(data)) {
        Object.assign(this, data);
      } else if (Object.keys(data).length < 3) {
        //throw some catch
        const dString = JSON.stringify(data);
        throw new Error(
          `Attempted to initialize a BasicRecord with a malformed object: ${dString}`
        );
      }
    } else {
      Object.assign(this, this.initEmptyRecord());
    }
  }

  public initEmptyRecord(): BasicRecordSchema {
    const record = {
      id: BasicRecord.generateId(),
      created: Date.now(),
      updated: Date.now()
    };
    return record;
  }

  public static generateId(len = 0): string {
    const dec2hex = (dec: number) => {
      return ('0' + dec.toString(16)).substring(-2);
    };
    const arr = new Uint8Array((len || 40) / 2);
    crypto.getRandomValues(arr);
    return Array.from(arr, dec2hex).join('');
  }
}

class Record extends BasicRecord {
  public static instanceOf(data: AbstractBasicRecord, partial = false) {
    return partial
      ? this.implements(this.getKeys(), data)
      : this.implements(this.getKeys(true), data);
  }

  public static partialInstanceOf(data: AbstractBasicRecord) {
    return this.instanceOf(data, true);
  }

  protected static getKeys(callParent = false): Array<string> {
    //Todo:  Is there a function to return a list of variables from an interface?
    return callParent
      ? [...super.MemberVariblesNames, ...this.MemberVariblesNames]
      : [...this.MemberVariblesNames];
  }
}

export { Record, BasicRecord, BasicRecordSchema, BasicRecordInterface };
