import { TestBed, inject, waitForAsync } from '@angular/core/testing';

import { declarations } from '../app/declarations';
import { imports } from '../app/imports';
import { MessageService } from './message.service';

describe('Service: MessageService', () => {
  let service;
  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations,
      imports,
      providers: [MessageService]
    }).compileComponents();
    service = TestBed.inject(MessageService);
  });

  it('The Message Service should be dependancy injected', waitForAsync(() => {
    expect(service).toBeDefined();
  }));

  it('The Message Service should add a message', waitForAsync(() => {
    expect(service).toBeDefined();
    service.add(`Hello world, it's me and I am ok!`);
    const messages = service.getMessages();
    expect(messages).toHaveSize(1);
    expect(messages[0]).toBe(`Hello world, it's me and I am ok!`);
    service.clear();
  }));

  it('The Message Service should be able to clear all messages', waitForAsync(() => {
    expect(service).toBeDefined();
    service.add(`Hello world, it's me and I am ok!`);
    let messages = service.getMessages();
    expect(messages).toHaveSize(1);
    service.clear();
    messages = service.getMessages();
    expect(messages).toHaveSize(0);
  }));
});
