import React, { InputHTMLAttributes, DetailedHTMLProps, RefObject, useRef, JSX } from 'react';
import { twMerge } from 'tailwind-merge';

type HTMLInputProps = DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>;

type InputBaseProps = React.JSX.IntrinsicElements['input'] & {
  error?: boolean;
  innerRef?: RefObject<HTMLInputElement>;
};

type InputProps = Omit<HTMLInputProps, 'value' | 'ref'> & {
  value: string | number;
  error?: boolean;
  innerRef?: RefObject<HTMLInputElement>;
};

const BaseInput = ({ className, error, innerRef, ...rest }: InputBaseProps): JSX.Element => {
  return (
    <input
      className={twMerge('input input-bordered rounded-md block w-full', error ? 'input-error' : undefined, className)}
      ref={innerRef}
      {...rest}
    />
  );
};

export const TextInput = (props: InputProps): JSX.Element => {
  return <BaseInput {...props} type="text" />;
};

type TextAreaInputProps = React.JSX.IntrinsicElements['textarea'];

export const TextAreaInput = ({ className, onChange, ...rest }: TextAreaInputProps): JSX.Element => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const onInputChange = (evt: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange?.(evt);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  return (
    <textarea
      ref={textareaRef}
      onChange={onInputChange}
      className={twMerge('textarea leading-normal min-h-24', className)}
      {...rest}
    />
  );
};
