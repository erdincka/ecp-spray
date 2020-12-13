import React from 'react';
import { Heading, Button, Box, Text } from 'grommet';
import { StatusGood, StatusWarning } from 'grommet-icons';
import { required } from './Kvm_Requires';

function Requirements(props) {
  const { ipcRenderer } = window.require('electron');
  const [ commands, setCommands ] = React.useState({});
  const callback = props.setter;

  React.useEffect(() => {
    const checkCommand = async (command) => {
      return await ipcRenderer.invoke('get-system', 'check-command', command)
        .then( res => res.stdout === '' ? false : true )
        .catch( error => console.error(error) );
    }
  
    const fetchData = () => {
      required.forEach(req =>
        req.needs.forEach( async need => {
          const avail = await checkCommand(need.check || need.command);
          setCommands( c => { return { ...c, [need.command]: avail } } );
        }
      ));
    };

    fetchData();
  }, [ipcRenderer]);

  const installNeeded = async (needStr) => {
    const need = JSON.parse(needStr);
    const os = await ipcRenderer.invoke('get-system', 'execute-command', 'lsb_release -i')
      .then( res => res.stdout.split(':')[1].trim().toLowerCase() )
      .catch(error => ipcRenderer.invoke('app-message', 'error', 
        error.message.replace('Error invoking remote method \'get-system\':', ''))
      )

    ipcRenderer.invoke('get-system', 'execute-command', need.installCommand[os])
        .then( async (res) => { 
          // console.dir(res);
          ipcRenderer.invoke('app-message', 'output', res.stdout);
          // skip warning on Ubuntu
          if (res.stderr !== 'WARNING: apt does not have a stable CLI interface. Use with caution in scripts.') ipcRenderer.invoke('app-message', 'error', res.stderr);
          let installed = await ipcRenderer.invoke('get-system', 'check-command', need.check || need.command)
            .then( res => res.stdout === '' ? false : true )
            .catch( error => console.error(error) );
          if (installed) {
            setCommands( c => { return { ...c, [need.command]: true } } )
          }  
        })
        .catch( error => console.error(error) );
  }

  const saveState = () => {
    ipcRenderer.invoke('app-message', 'status', 'Requirements saved');
    callback(true);
  }
  return(
    <Box gap='small' pad='xsmall'>
      { JSON.stringify(commands)  }
      {
        required.map(req => 
          <Box key={req.group}>
            <Heading level='5' color='neutral-2'>{req.group}</Heading>
            { 
              req.needs && req.needs.map( need => 
                <Box direction='row' key={ need.command } justify='between' >
                  <Text >{ need.command }</Text>
                  <Box direction='row' align='center'>
                    <Button 
                      disabled={ commands[need.command] } 
                      label={ commands[need.command] ? 'Ready' : 'Install' }
                      color={ commands[need.command] ? '' : 'plain' }
                      id={ JSON.stringify(need) }
                      onClick={ (event) => installNeeded(event.target.id) }
                    />
                    { commands[need.command] ? <StatusGood color='status-ok' /> : <StatusWarning color='status-warning' />}
                  </Box>
                </Box>
              )
            }
          </Box>
        )
      }
      <Button 
        disabled={ Object.values(commands).some(c => c === false) }
        primary
        label='Save' 
        onClick={ () => saveState() }
      />
    </Box>
  );
}

export default Requirements;