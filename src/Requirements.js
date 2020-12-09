import React from 'react';
import { Heading, Button, Box, Text } from 'grommet';
import { StatusGoodSmall, StatusWarningSmall } from 'grommet-icons';
import { required } from './kvm_prereqs';

function Requirements(props) {
  const { ipcRenderer } = window.require('electron');
  // const [ targetReady, setTargetReady ] = React.useState(false);
  const [ host, setHost ] = React.useState(undefined);
  const [ commands, setCommands ] = React.useState(undefined);
  const callback = props.setter;

  React.useEffect(() => {
    const checkCommand = (command) => {
      return ipcRenderer.invoke('get-system', 'check-command', command)
        .then( res => res.stdout === '' ? false : true)
        .catch( error => console.error(error) );
    }
  
    const fetchData = async () => {
      // setHost(JSON.parse(await ipcRenderer.invoke('get-store-value', 'host')) || {});
      const cmds = required.map(req => 
        req.needs.map( async need => {
          const command = need.command;
          const isAvailable = await checkCommand(need.command);
          console.dir(isAvailable);
          return ( { command, isAvailable } );
        }
      ))
      setCommands(cmds);
    };

    fetchData();
  }, [ipcRenderer]);

  return(
    <Box gap='small' pad='xsmall'>
      {
        required.map(req => 
          <Box key={req.group}>
            <Heading level='5'>{req.group}</Heading>
            { 
              commands && req.needs && req.needs.map( need => 
                <Box direction='row' key={ need.command } justify='between' >
                  <Text >{ commands[need.command] }</Text>
                  { commands[need.command] && commands[need.command]['isAvailable'] ? <StatusGoodSmall /> : <StatusWarningSmall />}
                </Box>
              )
            }
            { JSON.stringify(commands)  }
            { JSON.stringify(req.needs) }
          </Box>
        )
      }
      { JSON.stringify(host) }
    </Box>
  );
}

export default Requirements;