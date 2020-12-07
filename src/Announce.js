import React from 'react';
import PropTypes from 'prop-types';
import { AnnounceContext, Text, Box, Button, Layer } from 'grommet';
import { FormClose, StatusGood, StatusCritical } from 'grommet-icons';

const Announcer = ({ announce, message, mode, role }) => {
  React.useEffect(() => {
    const timeout = 5000;
    announce(message, mode, timeout);
  }, [announce, message, mode]);

  return (
    <Layer
      position="bottom"
      modal={false}
      margin={{ vertical: 'medium', horizontal: 'small' }}
      responsive={false}
      plain
    >
      <Box
        align="center"
        direction="row"
        gap="small"
        justify="between"
        round="medium"
        elevation="medium"
        pad={{ vertical: 'xsmall', horizontal: 'small' }}
        background="status-ok"
      >
        <Box align="center" direction="row" gap="xsmall">
          <StatusGood />
          <Text align="center" role={role} aria-live={mode}>
            {message}
          </Text>
        </Box>
        <Button icon={<FormClose />} plain />
      </Box>
    </Layer>
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
