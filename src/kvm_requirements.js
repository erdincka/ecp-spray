import React from 'react';
import { Heading, Button, Box, Text, Select, Layer } from 'grommet';
import { Spinning } from 'grommet-controls';
import { Next, StatusGood, StatusWarning } from 'grommet-icons';
import { required } from './kvm_requires';
import { sendStatus, sendError, sendOutput, commandToCheck, runMultiCommand, installNeeded, getCommandOutput } from './helpers';

function Requirements(props) {
  const { ipcRenderer } = window.require('electron');
  const [ commands, setCommands ] = React.useState([]);
  const [ network, setNetwork ] = React.useState('');
  const [ loading, setLoading ] = React.useState(true);
  const [ availableNetworks, setAvailableNetworks ] = React.useState([]);

  const setParent = props.setParent;
  
  React.useEffect(() => {
    const fetchData = async () => {
      const platform = await ipcRenderer.invoke('get-system', 'platform');
      if ( platform !== 'linux' ) await ipcRenderer.invoke('set-store-value', 'host.isremote', JSON.stringify(true));
      let cmds = [];
      required.forEach( req => req.needs.forEach( need => cmds.push(commandToCheck(need)) ) );
      cmds.push('sudo virsh net-list --all');
      // check commands and parse output
      runMultiCommand(cmds)
      .then(result => {
        const [ out, err ] = getCommandOutput(result);
        setLoading(false);
        if (out) sendOutput(out);
        if (err) sendError(err);
        let found = [];
        out.split('\n').forEach(line => {
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
      });
    };
    if (loading) fetchData();
  }, [ipcRenderer, loading]);

  const saveState = () => {
    sendStatus('Requirements satisfied');
    setParent(true);
  }

  const netCheck = (net) => {
    ipcRenderer.invoke('set-store-value', 'kvm.KVM_NETWORK', JSON.stringify(net));
    setNetwork(net);
  }

  const verifyNeed = async (n) => {
    const need = JSON.parse(n);
    let result = await installNeeded(need);
    if (result) {
      setCommands(old => [...old, need.command]);
    }
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
                      onClick={ event => verifyNeed(event.target.id) }
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