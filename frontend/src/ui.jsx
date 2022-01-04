import React, {useMemo} from 'react';
import {useDelay} from '@layr/react-integration';
import {formatError} from '@layr/utilities';

export function ErrorMessage({children}) {
  const message = typeof children === 'string' ? children : formatError(children);

  return (
    <div className="alert alert-danger" style={{marginTop: '1rem'}} role="alert">
      <div>{message}</div>
    </div>
  );
}

export function LoadingSpinner({delay}) {
  const style = useMemo(
    () => ({
      borderRadius: '50%',
      width: '40px',
      height: '40px',
      margin: '90px auto',
      position: 'relative',
      borderTop: '3px solid rgba(0, 0, 0, 0.1)',
      borderRight: '3px solid rgba(0, 0, 0, 0.1)',
      borderBottom: '3px solid rgba(0, 0, 0, 0.1)',
      borderLeft: '3px solid #818a91',
      transform: 'translateZ(0)',
      animation: 'loading-spinner 0.5s infinite linear'
    }),
    []
  );

  return (
    <Delayed duration={delay}>
      <div className="loading-spinner" style={style}>
        <style>
          {`
        @keyframes loading-spinner {
          0% {transform: rotate(0deg);}
          100% {transform: rotate(360deg);}
        }
        `}
        </style>
      </div>
    </Delayed>
  );
}

export function Delayed({duration = 500, children}) {
  const [isElapsed] = useDelay(duration);

  return isElapsed ? children : null;
}
