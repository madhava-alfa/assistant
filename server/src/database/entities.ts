import { EntityBase, entity } from '@madhava-yallanki/dynamo-mapper';
import type { ConstructorItem, EntityConfig } from '@madhava-yallanki/dynamo-mapper';
import type { PrimaryKey } from '@madhava-yallanki/dynamo-mapper/dist/lib/entities/base';
import { SetOptional } from 'type-fest';
import { type Part } from '@google/generative-ai';

const table: EntityConfig['table'] = { tableName: 'Assistant', pkName: 'partitionKey', skName: 'sortKey' };

const makeDynamoKey = (elements: Array<string | number>) => elements.join('#');

enum ItemType {
  CoreMemory = 'CoreMemory',
  Message = 'Message',
}

@entity({ table, keyGenerator: CoreMemory.keyGenerator })
export class CoreMemory extends EntityBase {
  userId!: string;
  content!: string;

  constructor(item: ConstructorItem<CoreMemory>) {
    super(item);
    Object.assign(this, item);
  }

  static makePartitionKey({ userId }: Pick<CoreMemory, 'userId'>): string {
    return makeDynamoKey([ItemType.CoreMemory, userId]);
  }

  static keyGenerator(this: void, { userId }: Pick<CoreMemory, 'userId'>): PrimaryKey {
    return { partitionKey: CoreMemory.makePartitionKey({ userId }), sortKey: userId };
  }
}

export enum MessageStatus {
  active = 'active',
  archived = 'archived',
}

@entity({
  table,
  keyGenerator: Message.keyGenerator,
  indexes: {
    [Message.StatusIndex]: { pkName: table.pkName, skName: 'statusSequence' },
  },
})
export class Message extends EntityBase {
  userId!: string;
  sequence!: number;
  role!: 'user' | 'model' | 'function';
  status!: MessageStatus;
  statusSequence!: string;
  data!: Part;
  isSummary?: boolean;

  static StatusIndex = 'MessageStatusIndex';

  constructor(item: ConstructorItem<SetOptional<Message, 'statusSequence'>>) {
    if (!item.statusSequence) {
      item.statusSequence = makeDynamoKey([item.status, item.sequence]);
    }

    super(item);
    Object.assign(this, item);
  }

  static makePartitionKey({ userId }: Pick<Message, 'userId'>): string {
    return makeDynamoKey([ItemType.Message, userId]);
  }

  static keyGenerator(this: void, { userId, sequence }: Pick<Message, 'userId' | 'sequence'>): PrimaryKey {
    return { partitionKey: Message.makePartitionKey({ userId }), sortKey: sequence.toString(10) };
  }
}
