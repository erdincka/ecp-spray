import React from 'react';
import { Heading, Button, Box, Text, Select, Layer } from 'grommet';
import { Spinning } from 'grommet-controls';
import { Next, StatusGood, StatusWarning } from 'grommet-icons';
import { required } from './kvm_requires';
import { sendStatus, sendError, sendOutput } from './helpers';

function Requirements(props) {
  const { ipcRenderer } = window.require('electron');
  const [ commands, setCommands ] = React.useState([]);
  const [ network, setNetwork ] = React.useState('');
  const [ loading, setLoading ] = React.useState(true);
  const [ availableNetworks, setAvailableNetworks ] = React.useState([]);
  // const [ bridge, setBridge ] = React.useState('');

  const setParent = props.setParent;

  const checkCmd = (needed) => {
    const cmd = needed.check || needed.command;
    return (cmd.split(' ').length > 1 ? cmd : 'which ' + cmd);
  }
  
  React.useEffect(() => {
    const runCommands = async (commands) => {
      return await ipcRenderer.invoke('get-system', 'execute-command', commands.join('; '));
    }
    
    const fetchData = () => {
      let cmds = [];
      required.forEach( req => req.needs.forEach( need => cmds.push(checkCmd(need)) ) );
      cmds.push('sudo virsh net-list --all');
      // check commands and parse output
      runCommands(cmds)
      .then(result => {
        setLoading(false);
        if (result.stdout) sendOutput(result.stdout);
        if (result.stderr) sendError(result.stderr);
        let found = [];
        result.stdout.split('\n').forEach(line => {
          if (line.match(/^\/\w+/)) // command name from path (returned from which command)
            found.push(line.trim().split('/').pop());
          if (line.match(/^Name: /)) // extract module name (returned from pip command)
            found.push(line.trim().split('Name: ').pop());
          if (line.trim().match(/^\w+\s+(active|inactive)\s+(yes|no)\s+(yes|no)$/)) { // match net-list output for active and inactive nets
            const netName = line.trim().split(/\s+/)[0]; // get network name
            setAvailableNetworks(n => [...n, netName]);
          }
        });
        setCommands(found);
        // setAvailableNetworks(n => [...n, 'Create New...']);
      });
    };
    if (loading) fetchData();
  }, [ipcRenderer, loading]);

  const installNeeded = async (needStr) => {
    const need = JSON.parse(needStr);
    const os = await ipcRenderer.invoke('get-system', 'execute-command', 'lsb_release -i')
      .then( res => res.stdout.split(':')[1].trim().toLowerCase() ) // extract os release name
      .catch(error => sendError(error.message.replace('Error invoking remote method \'get-system\':', '')));

    ipcRenderer.invoke('get-system', 'execute-command', need.installCommand[os])
        .then( async (res) => { 
          sendOutput(res.stdout);
          // skip warning on Ubuntu
          if (res.stderr !== 'WARNING: apt does not have a stable CLI interface. Use with caution in scripts.') sendError(res.stderr);
          
          let installed = await ipcRenderer.invoke('get-system', 'execute-command', checkCmd(need) )
            .then( res => res.stdout === '' ? false : true )
            .catch( error => console.error(error) );
          if (installed) 
            setCommands( c => c.push(need.command));
        })
        .catch( error => console.error(error) );
  }

  const saveState = () => {
    sendStatus('Requirements satisfied');
    setParent(true);
  }

  const netCheck = (net) => {
    ipcRenderer.invoke('set-store-value', 'kvm.KVM_NETWORK', JSON.stringify(net));
    setNetwork(net);
  }

  return(
    <Box gap='small' pad='xsmall' fill flex={false}>
      { loading && <Layer animation='fadeIn' ><Spinning size='large' /></Layer> }

      {
        required.map(req => 
          <Box key={req.group} pad='small'>
            <Heading level='5' margin='none' color='neutral-2'>{req.group}</Heading>
            { 
              req.needs && req.needs.map( need => 
                <Box margin='small' direction='row' key={ need.command } justify='between' align='center' >
                  <Text >{ need.command }</Text>
                  <Box direction='row' align='center'>
                    <Button 
                      disabled={ loading || commands.includes(need.command) } 
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

      <Box pad='small'>
        <Heading level='5' margin='none' color='neutral-2'>Network</Heading>
        <Box direction='row' margin='small' align='center' justify='between' pad={ {"vertical": "small"} }>
          {
          <Select options={ availableNetworks }
            value={ network }
            onChange={ (option) => netCheck(option.value) }
          />
          }
          { network === '' ? <StatusWarning color='status-warning' /> : <StatusGood color='status-ok' /> }
        </Box>
      </Box>
      <Button 
        disabled={ Object.values(commands).some(c => c === false) || network === '' }
        label='Next' 
        icon={<Next />}
        onClick={ () => saveState() }
        alignSelf='end'
      />
    </Box>
  );
}

export default Requirements;