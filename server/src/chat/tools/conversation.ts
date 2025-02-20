import { type Identity } from '../../utils/index.js';

export async function conversationSearch({ userId }: Identity, args: { query: string }): Promise<object> {
  return { result: `No results found for query ${userId} ${args.query}` };
}
