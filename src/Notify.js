import React from 'react';
import { Text, Box, Button, Layer } from 'grommet';
import { FormClose, StatusGood, StatusCritical } from 'grommet-icons';

export const NotificationLayer = (props) => {
  return (
    <Layer
      position="top-right"
      modal={ false }
      margin={{ vertical: 'medium', horizontal: 'small' }}
      responsive={ false }
      full="horizontal"
      onEsc={ props.closer }
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
        background={ props.status === 'info' ? 'status-ok' : 'status-critical' }
      >
        { props.status === 'info' ? <StatusGood /> : <StatusCritical /> }
        <Text align="center">{ props.message }</Text>
        <Button icon={<FormClose />} onClick={ props.closer } plain />
      </Box>
    </Layer>
  );
}

export const Status = props => 
  <NotificationLayer
    status='info'
    { ...props }
  />;
export const Error = props => 
  <NotificationLayer
    status='error'
    { ...props }
  />;
