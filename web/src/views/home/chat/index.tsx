import { JSX, useState } from 'react';
import { twMerge } from 'tailwind-merge';
import { ArrowUp } from 'lucide-react';
import update from 'immutability-helper';
import Markdown from 'react-markdown';
import { IconButton, TextAreaInput, Time } from '../../../components/index.js';
import { useFetch, MessageItem } from '../../../api/index.js';
import { epochTime } from '../../../utils/time.js';

export const Chat = (): JSX.Element => {
  const [history, setHistory] = useState<MessageItem[]>();
  const [message, setMessage] = useState('');
  const { loading, error } = useFetch({ resource: '/history', onCompleted: (data) => setHistory(data.history) });
  const messageRequest = useFetch({ resource: '/message', method: 'post' });

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <span className="loading loading-spinner loading-xl text-primary" />
      </div>
    );
  }

  if (!history || error) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="alert alert-error">{error?.message}</div>
      </div>
    );
  }

  const onSubmit = async () => {
    const userMessage: MessageItem = { role: 'user', created_at: epochTime().toString(), message: { text: message } };
    setHistory(update(history, { $push: [userMessage] }));
    setMessage('');
    const data = await messageRequest.submit(JSON.stringify({ payload: { message } }));
    if (data?.messages) {
      setHistory(update(history, { $push: data.messages }));
    }
  };

  return (
    <div className="h-screen flex flex-col py-4 gap-2">
      <ChatMessages history={history} loading={messageRequest.loading} />
      <div className={twMerge(history.length === 0 ? 'flex-1 flex flex-col justify-center' : undefined)}>
        <div className="relative">
          <TextAreaInput
            className="w-full bg-white"
            placeholder={`What's on your mind?`}
            value={message}
            onChange={({ target: { value } }) => setMessage(value)}
            enterKeyHint="send"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                onSubmit();
              }
            }}
          />

          <IconButton
            className="btn-accent btn-sm absolute top-1 right-1"
            hidden={!message}
            onClick={onSubmit}
            loading={messageRequest.loading}
          >
            <ArrowUp />
          </IconButton>
        </div>
      </div>
    </div>
  );
};

type ChatMessagesProps = {
  history: MessageItem[];
  loading?: boolean;
};

const ChatMessages = ({ history, loading }: ChatMessagesProps): JSX.Element => {
  if (history.length === 0) {
    return <div />;
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {history.map((item, idx) => (
        <div key={idx} className={twMerge('chat', item.role === 'user' ? 'chat-start' : 'chat-end')}>
          <div className={twMerge('chat-bubble shadow-md', item.role === 'user' ? 'chat-bubble-success' : undefined)}>
            <div className="prose">
              <Markdown>{item.message.text}</Markdown>
            </div>
          </div>
          <Time className="chat-footer mt-1 opacity-75" epochString={item.created_at} />
        </div>
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
