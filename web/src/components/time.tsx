import React, { JSX } from 'react';

type TimeProps = React.JSX.IntrinsicElements['div'] & {
  epochString: string;
};

export const Time = ({ epochString, ...rest }: TimeProps): JSX.Element => {
  const date = new Date(parseInt(epochString));
  const value = date.toLocaleTimeString('en-US', { month: 'short', day: 'numeric' });
  return <div {...rest}>{value}</div>;
};
