import { type FunctionDeclaration, SchemaType } from '@google/generative-ai';
import { coreMemoryAppend, coreMemoryReplace } from './coreMemory.js';
import { conversationSearch } from './conversation.js';
import { type Identity } from '../../utils/index.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const functions: Record<string, (identity: Identity, args: any) => Promise<object>> = {
  core_memory_append: coreMemoryAppend,
  core_memory_replace: coreMemoryReplace,
  conversation_search: conversationSearch,
};

export const functionDeclarations: FunctionDeclaration[] = [
  {
    name: 'core_memory_append',
    description: 'Add new information to core memory',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        newContent: { type: SchemaType.STRING, description: 'New content to append to the memory.' },
        isPresent: { type: SchemaType.BOOLEAN, description: `Is newContent already present in <human> block?` },
      },
      required: ['newContent', 'isPresent'],
    },
  },
  {
    name: 'core_memory_replace',
    description: 'Replace the contents of core memory. To delete memories, use an empty string for `newContent`.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        oldContent: { type: SchemaType.STRING, description: 'String to replace. Must be an exact match.' },
        newContent: { type: SchemaType.STRING, description: 'Content to write to the memory.' },
      },
      required: ['oldContent'],
    },
  },
  {
    name: 'conversation_search',
    description: 'Search prior conversation history for a query using cosine similarity',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        query: { type: SchemaType.STRING },
      },
      required: ['query'],
    },
  },
  {
    name: 'record_thoughts',
    description: 'Record the thinking process used to provide helpful response to the user',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        thoughts: { type: SchemaType.STRING },
      },
      required: ['thoughts'],
    },
  },
];
