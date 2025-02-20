import React, { JSX } from 'react';
import { twMerge } from 'tailwind-merge';

type ButtonProps = React.JSX.IntrinsicElements['button'] & {
  loading?: boolean;
};

const BaseButton = ({ children, className, disabled, loading, ...rest }: ButtonProps): JSX.Element => {
  return (
    <button {...rest} className={twMerge(`btn rounded-md`, className)} disabled={disabled || loading}>
      {loading && <span className="loading loading-spinner" />}
      {children}
    </button>
  );
};

export const PrimaryButton = (props: ButtonProps): JSX.Element => {
  return <BaseButton {...props} className={twMerge('btn-primary', props.className)} />;
};

export const SecondaryButton = (props: ButtonProps): JSX.Element => {
  return <BaseButton {...props} className={twMerge('btn-outline', props.className)} />;
};

type IconButtonProps = Omit<ButtonProps, 'children'> & { children: JSX.Element };

export const IconButton = ({ children, className, loading, disabled, ...rest }: IconButtonProps): JSX.Element => {
  return (
    <button {...rest} disabled={disabled || loading} className={twMerge(`btn btn-square`, className)}>
      {loading ? <span className="loading loading-spinner" /> : children}
    </button>
  );
};
