import { UserRecord } from './User';

describe('Model: User Record', () => {
  it('The User Record Model should be able to initialize a new populated User record', () => {
    const blankUser = new UserRecord();
    expect(UserRecord.instanceOf(blankUser)).toBeTrue();
    expect(blankUser instanceof UserRecord).toBeTrue();
  });

  it('The User Record Model should be able accept data for a previously initialized User record', () => {
    const id = UserRecord.generateId();
    const created = Date.now();
    const updated = Date.now();
    const name = 'Tray Parker';
    const handle = 'TDiddyParkingLotBoy';
    const userName = 'tillTomorrowTrey';
    const email = 'tillTomorrowTrey@gmail.com';
    const plainPass = 'plainPass';
    const token = 'token';
    const password = 'password';
    const lastLogin = Date.now();

    const recordObj = {
      id,
      created,
      updated,
      name,
      handle,
      userName,
      email,
      plainPass,
      token,
      password,
      lastLogin
    };

    const prevRecord = new UserRecord(recordObj);
    expect(UserRecord.instanceOf(prevRecord)).toBeTrue();
    expect(prevRecord instanceof UserRecord).toBeTrue();

    expect(prevRecord.id).toEqual(id);
    expect(prevRecord.created).toEqual(created);
    expect(prevRecord.updated).toEqual(updated);
    expect(prevRecord.name).toEqual(name);
    expect(prevRecord.handle).toEqual(handle);
    expect(prevRecord.userName).toEqual(userName);
    expect(prevRecord.email).toEqual(email);
    expect(prevRecord.plainPass).toEqual(plainPass);
    expect(prevRecord.token).toEqual(token);
    expect(prevRecord.password).toEqual(password);
    expect(prevRecord.lastLogin).toEqual(lastLogin);
  });

  it('The User Record Model should be to initialize a new User Record with only a some of the user variables', () => {
    const name = 'Tray Parker';
    const handle = 'TDiddyParkingLotBoy';
    const userName = 'tillTomorrowTrey';
    const email = 'tillTomorrowTrey@gmail.com';
    const plainPass = 'plainPass';
    const token = 'token';
    const password = 'password';
    const lastLogin = Date.now();

    const partialUser = {
      name,
      handle,
      userName,
      email,
      plainPass,
      token,
      password,
      lastLogin
    };
    expect(UserRecord.partialInstanceOf(partialUser)).toBeTrue();

    const newUser = new UserRecord(partialUser);
    expect(UserRecord.instanceOf(newUser)).toBeTrue();
    expect(newUser instanceof UserRecord).toBeTrue();

    expect(newUser.name).toEqual(name);
    expect(newUser.handle).toEqual(handle);
    expect(newUser.userName).toEqual(userName);
    expect(newUser.email).toEqual(email);
    expect(newUser.plainPass).toEqual(plainPass);
    expect(newUser.token).toEqual(token);
    expect(newUser.password).toEqual(password);
    expect(newUser.lastLogin).toEqual(lastLogin);
  });

  it('The User Record Model should be able to throw an error when initializing with a malformed object', () => {
    const id = UserRecord.generateId();
    const recordObj = { id };
    try {
      const prevRecord = new UserRecord(recordObj);
    } catch (e) {
      expect(e).toBeDefined();
      console.error(e);
    }
  });
});
