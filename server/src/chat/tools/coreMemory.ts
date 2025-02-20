import { DB } from '../../database/index.js';
import { epochTime, type Identity } from '../../utils/index.js';

type AppendArgs = {
  isPresent: boolean;
  newContent: string;
};

type ReplaceArgs = {
  oldContent: string;
  newContent?: string;
};

type PutMemoryArgs = {
  userId: string;
  memory: string;
};

export async function getMemory(userId: string): Promise<string> {
  const { rows } = await new DB().query('SELECT * FROM core_memory WHERE user_id=$1', [userId]);
  return (rows[0]?.content || '') as string;
}

async function putMemory({ userId, memory }: PutMemoryArgs): Promise<void> {
  await new DB().query(
    `INSERT INTO core_memory (user_id, content, updated_at) VALUES ($1, $2, $3)
    ON CONFLICT (user_id) DO UPDATE SET content = EXCLUDED.content;`,
    [userId, memory, epochTime()],
  );
}

export async function coreMemoryAppend({ userId }: Identity, { isPresent, newContent }: AppendArgs): Promise<object> {
  if (!isPresent) {
    const content = await getMemory(userId);
    await putMemory({ userId, memory: `${content}\n${newContent}` });
  }
  return { status: 'Success' };
}

export async function coreMemoryReplace(
  { userId }: Identity,
  { oldContent, newContent }: ReplaceArgs,
): Promise<object> {
  const content = await getMemory(userId);
  const memory = content.replace(oldContent, newContent || '');
  await putMemory({ userId, memory });
  return { status: 'Success' };
}
