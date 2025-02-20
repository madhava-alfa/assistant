import { type Part } from '@google/generative-ai';

export type CoreMemoryRow = {
  user_id: string;
  content: string;
  updated_at: string;
};

export type ConversationRow = {
  user_id: string;
  message_sequence: string;
  message: Part;
  role: string;
  is_summary: boolean;
  is_archived: boolean;
  embedding: number[];
  created_at: string;
  updated_at: string;
};
