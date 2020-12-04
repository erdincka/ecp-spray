import React from 'react';
import PropTypes from 'prop-types';
import { AnnounceContext, Text } from 'grommet';

const Announcer = ({ announce, message, mode, role }) => {
  React.useEffect(() => {
    const timeout = 3000;
    announce(message, mode, timeout);
  }, [announce, message, mode]);

  return (
    <Text align="center" role={role} aria-live={mode}>
      {message}
    </Text>
  );
};
Announcer.propTypes = {
  announce: PropTypes.func.isRequired,
  message: PropTypes.string,
  mode: PropTypes.string,
  role: PropTypes.string,
};
Announcer.defaultProps = {
  mode: 'polite',
  role: 'log',
};

const AnnounceContextComponent = props => (
  <AnnounceContext.Consumer>
    {announce => <Announcer announce={announce} {...props} />}
  </AnnounceContext.Consumer>
);

export const Status = props => <AnnounceContextComponent {...props} />;
export const Error = props => (
  <AnnounceContextComponent
    {...props}
    mode="assertive"
    role="alert"
  />
);
