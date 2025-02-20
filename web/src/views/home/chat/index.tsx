import { JSX, useState, useRef } from 'react';
import { twMerge } from 'tailwind-merge';
import update from 'immutability-helper';
import { useQuery, MessageItem, useMutation } from '../../../api/index.js';
import { epochTime } from '../../../utils/time.js';
import { ChatHistory } from './history.js';
import { ChatInput } from './input.js';

export const Chat = (): JSX.Element => {
  const [history, setHistory] = useState<MessageItem[]>();
  const endRef = useRef<HTMLDivElement>(null);
  const putRequest = useMutation({ resource: '/message', method: 'post' });
  const { loading, error } = useQuery({
    resource: '/history',
    onCompleted: (data) => {
      setHistory(data.history);
      requestAnimationFrame(scrollToBottom);
    },
  });

  const scrollToBottom = () => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

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

  const onSendMessage = async (message: string) => {
    const userMessage: MessageItem = { role: 'user', created_at: epochTime().toString(), message: { text: message } };
    const newHistory = update(history, { $push: [userMessage] });
    setHistory(newHistory);
    requestAnimationFrame(scrollToBottom);

    const data = await putRequest.send({ payload: { message } });
    if (data?.messages) {
      setHistory(update(newHistory, { $push: data.messages }));
    } else {
      setHistory(update(newHistory, { $splice: [[-1, 1]] }));
    }
    requestAnimationFrame(scrollToBottom);
  };

  return (
    <div className="h-screen flex flex-col pt-2">
      <div className="flex-1 overflow-y-auto">
        <ChatHistory history={history} loading={putRequest.loading} />
        <div ref={endRef} />
      </div>
      <div className={twMerge(history.length === 0 ? 'flex-1 flex flex-col justify-center' : undefined)}>
        <ChatInput onSendMessage={onSendMessage} loading={putRequest.loading} error={putRequest.error} />
      </div>
    </div>
  );
};
