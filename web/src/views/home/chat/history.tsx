import { JSX } from 'react';
import Markdown from 'react-markdown';
import { twMerge } from 'tailwind-merge';
import { Time } from '../../../components/index.js';
import { MessageItem } from '../../../api/index.js';

type ChatHistoryProps = {
  history: MessageItem[];
  loading?: boolean;
};

export const ChatHistory = ({ history, loading }: ChatHistoryProps): JSX.Element => {
  if (history.length === 0) {
    return <div />;
  }

  return (
    <div>
      {history.map((item, idx) => (
        <ChatMessage key={idx} item={item} />
      ))}
      {loading && (
        <div className="chat chat-end">
          <div className="chat-bubble">
            <span className="loading loading-dots loading-xs mr-2" />
            <span className="loading loading-dots loading-md mr-2" />
            <span className="loading loading-dots loading-xl" />
          </div>
        </div>
      )}
    </div>
  );
};

type ChatMessageProps = {
  item: MessageItem;
};

const ChatMessage = ({ item }: ChatMessageProps): JSX.Element | null => {
  if (!item.message.text) {
    return null;
  }

  return (
    <div className={twMerge('chat', item.role === 'user' ? 'chat-start' : 'chat-end')}>
      <div className={twMerge('chat-bubble shadow-md', item.role === 'user' ? 'chat-bubble-success' : undefined)}>
        <div className="prose">
          <Markdown>{item.message.text}</Markdown>
        </div>
      </div>
      <Time className="chat-footer mt-1 opacity-75" epochString={item.created_at} />
    </div>
  );
};
