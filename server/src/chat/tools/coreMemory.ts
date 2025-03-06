import { DynamoMapper } from '@madhava-yallanki/dynamo-mapper';
import { epochTime, type Identity } from '../../utils/index.js';
import { CoreMemory } from '../../database/entities.js';

type AppendArgs = {
  isPresent: boolean;
  newContent: string;
  reason: string;
};

type ReplaceArgs = {
  oldContent: string;
  newContent?: string;
  reason: string;
};

export async function getMemory(userId: string): Promise<CoreMemory> {
  const item = await new DynamoMapper().getItem(CoreMemory, CoreMemory.keyGenerator({ userId }));
  return (
    item ||
    new CoreMemory({
      userId,
      content: '',
      createdBy: userId,
      createdOn: epochTime(),
      updatedBy: userId,
      updatedOn: epochTime(),
    })
  );
}

export async function coreMemoryAppend({ userId }: Identity, args: AppendArgs): Promise<object> {
  if (!args.isPresent) {
    const item = await getMemory(userId);
    item.content = `${item.content}\n${args.newContent}`;
    item.updatedBy = userId;
    item.updatedOn = epochTime();
    await new DynamoMapper().putItem(item);
  }
  return {};
}

export async function coreMemoryReplace({ userId }: Identity, args: ReplaceArgs): Promise<object> {
  const item = await getMemory(userId);
  item.content = item.content.replace(args.oldContent, args.newContent || '');
  item.updatedBy = userId;
  item.updatedOn = epochTime();
  await new DynamoMapper().putItem(item);
  return {};
}
