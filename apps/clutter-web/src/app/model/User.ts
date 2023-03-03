import { BasicRecordInterface, BasicRecordSchema, Record } from './BasicRecord';

interface UserPartialSchema {
  name: string | null;
  handle: string | null;
  userName: string | null;
  email: string | null;
  plainPass: string | null;
  token: string | null;
  password: string | null;
  lastLogin: number;
}

type UserSchema = UserPartialSchema & BasicRecordSchema;

class UserRecord extends Record implements BasicRecordInterface {
  public name = '';
  public handle = '';
  public userName = '';
  public email = '';
  public plainPass = '';
  public token = '';
  public password = '';
  public lastLogin = 0;

  protected static MemberVariblesNames: Array<string> = [
    'name',
    'handle',
    'userName',
    'email',
    'plainPass',
    'token',
    'password',
    'lastLogin'
  ];

  constructor(data?: Partial<UserSchema>) {
    super();
    if (data) {
      if (UserRecord.instanceOf(data)) {
        Object.assign(this, data);
      } else if (UserRecord.partialInstanceOf(data)) {
        const record = { ...this.initEmptyRecord(), ...data };
        Object.assign(this, record);
      } else if (Object.keys(data).length < 8) {
        const dString = JSON.stringify(data);
        throw new Error(
          `Attempted to initialize a User Record with a malformed object: ${dString}`
        );
      }
    } else {
      Object.assign(this, this.initEmptyRecord());
    }
  }

  public initEmptyRecord(): any {
    const blank = {};
    for (const e of UserRecord.getKeys()) blank[e] = null;
    const basicRecord = super.initEmptyRecord();
    const record = {
      ...basicRecord,
      ...blank
    };
    return record;
  }
}

export { UserRecord, UserPartialSchema, UserSchema };
