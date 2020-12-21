import React from 'react';
import { Heading, Button, Box, Text } from 'grommet';
import { StatusGood, StatusWarning } from 'grommet-icons';
import { required } from './Kvm_Requires';

function Requirements(props) {
  const { ipcRenderer } = window.require('electron');
  const [ commands, setCommands ] = React.useState([]);
  const [ network, setNetwork ] = React.useState('');
  const [ neednet, setNeednet ] = React.useState(true);
  const [ availableNetworks, setAvailableNetworks ] = React.useState([]);
  const setParent = props.setter;

  const checkCmd = (needed) => {
    const cmd = needed.check || needed.command;
    return (cmd.split(' ').length > 1 ? cmd : 'which ' + cmd);
  }
  
  React.useEffect(() => {
    let requestedNet;
    const runCommands = async (commands) => {
      requestedNet = JSON.parse(await ipcRenderer.invoke('get-store-value', 'kvm.KVM_NETWORK'));
      return await ipcRenderer.invoke('get-system', 'execute-command', commands.join('; '));
    }
    
    const fetchData = () => {
      let cmds = [];
      required.forEach( req => req.needs.forEach( need => cmds.push(checkCmd(need)) ) );
      cmds.push('sudo virsh net-list --all');
      // check commands and parse output
      runCommands(cmds)
      .then(result => {
        ipcRenderer.invoke('app-message', 'output', '\nSTDOUT\n' + result.stdout + '\nSTDERR\n' + result.stderr);
        let found = [];
        result.stdout.split('\n').forEach(line => {
          if (line.match(/^\/\w+/)) // command name from path (returned from which command)
            found.push(line.trim().split('/').pop());
          if (line.match(/^Name: /)) // extract module name (returned from pip command)
            found.push(line.trim().split('Name: ').pop());
          if (line.trim().match(/^\w+\s+(active|inactive)\s+(yes|no)\s+(yes|no)$/)) { // match net-list output for active and inactive nets
            const netName = line.trim().split(/\s+/)[0]; // get network name
            if (netName === requestedNet) { // if network is configured
              setNetwork(netName);
              setNeednet(false);
            }
            else {
              // setNeednet(true);
              setAvailableNetworks(n => [...n, netName]);
            }
          }
        });
        setCommands(found);
      });
    };
    fetchData();
  }, [ipcRenderer]);

  const installNeeded = async (needStr) => {
    const need = JSON.parse(needStr);
    const os = await ipcRenderer.invoke('get-system', 'execute-command', 'lsb_release -i')
      .then( res => res.stdout.split(':')[1].trim().toLowerCase() ) // extract os release name
      .catch(error => ipcRenderer.invoke('app-message', 'error', 
        error.message.replace('Error invoking remote method \'get-system\':', ''))
      )

    ipcRenderer.invoke('get-system', 'execute-command', need.installCommand[os])
        .then( async (res) => { 
          ipcRenderer.invoke('app-message', 'output', res.stdout);
          // skip warning on Ubuntu
          if (res.stderr !== 'WARNING: apt does not have a stable CLI interface. Use with caution in scripts.') ipcRenderer.invoke('app-message', 'error', res.stderr);
          
          let installed = await ipcRenderer.invoke('get-system', 'execute-command', checkCmd(need) )
            .then( res => res.stdout === '' ? false : true )
            .catch( error => console.error(error) );
          if (installed) 
            setCommands( c => c.push(need.command));
        })
        .catch( error => console.error(error) );
  }

  const saveState = () => {
    ipcRenderer.invoke('app-message', 'status', 'Requirements satisfied');
    setParent(true);
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
                      disabled={ commands.includes(need.command) } 
                      label={ commands.includes(need.command) ? 'Ready' : 'Install' }
                      color={ commands.includes(need.command) ? '' : 'plain' }
                      id={ JSON.stringify(need) }
                      onClick={ (event) => installNeeded(event.target.id) }
                    />
                    { commands.includes(need.command) ? <StatusGood color='status-ok' /> : <StatusWarning color='status-warning' />}
                  </Box>
                </Box>
              )
            }
          </Box>
        )
      }
      <Box>
        <Heading level='5' color='neutral-2'>Network</Heading>
        <Box direction='row' align='center' justify='end'>
          { JSON.stringify(availableNetworks) }
          <Button 
            disabled={ neednet ? false : true } 
            label={ neednet ? 'Select' : 'Ready' }
            color={ neednet ? 'plain' : '' }
            id={ network }
            onClick={ (event) => setNetwork(event.target.id) }
          />
          { network.length > 0 ? <StatusGood color='status-ok' /> : <StatusWarning color='status-warning' /> }
        </Box>
      </Box>
      <Button 
        disabled={ Object.values(commands).some(c => c === false) && network === '' }
        primary
        label='Save' 
        onClick={ () => saveState() }
      />
    </Box>
  );
}

export default Requirements;