import React from 'react';
import { Spinning } from 'grommet-controls';
import { Box, Button, CheckBox, FormField, Layer, Text, TextInput } from 'grommet';
import { sendError, sendOutput, runMultiCommand, installNeeded, readFromStore, commandToCheck, getCommandOutput, saveToStore, sendStatus } from './helpers';
import { required } from './vmware_requires';
import { Next, StatusGood, StatusWarning, Vmware } from 'grommet-icons';
import Target from './host_target';

export const VMWare = () => {
  const [ ready, setReady ] = React.useState(false);
  const [ host, setHost ] = React.useState({});
  const [ targetready, setTargetready ] = React.useState(false);
  const [ loading, setLoading ] = React.useState(false);
  const [ commands, setCommands ] = React.useState([]);
  const [ epicurl, setEpicurl ] = React.useState('');
  const repourl = 'https://github.com/erdincka/ezmeral-demo-vmware-terraform.git'; // TODO: Read from Platforms.url
  const repodir = './ezmeral-demo-vmware-terraform';
  const tfcommand = (cmd) => 'TF_IN_AUTOMATION=true terraform ' + cmd + ' -no-color -input=false '

  React.useEffect(() => {
    const fetchData = async () => {
      let vmware = JSON.parse(await readFromStore('vmware'));
      let host = JSON.parse(await readFromStore('host'));
      if ( vmware.epicurl ) setEpicurl(vmware.epicurl);
      setHost(host);
    };
    fetchData();
  }, []);

  const checkTarget = (status) => {
    if (status) {
      // Check if requirements are available
      let cmds = [];
      required.forEach( need => cmds.push(commandToCheck(need)) );
      setLoading(true);
      runMultiCommand(cmds)
      .then(result => {
        let [ out, err ] = getCommandOutput(result);
        if (err) sendError(err) && setLoading(false);
        if (out) {
          sendOutput(out);
          let found = [];
          out.split('\n').forEach(line => {
            if (line.match(/^\/\w+/)) // if path starts with / (returned from which command)
            found.push(line.trim().split('/').pop()); // extract command name from path
          });
          setCommands(found);
          setLoading(false);
        }
      });
    }
    setTargetready(status);
  }

  const prepare = async (c) => {
    setLoading(true); // TODO: This is not working as expected
    saveToStore('vmware.epicurl', JSON.stringify(epicurl));
    sendStatus('vmware settings are saved');
    let commands = [
      '[ -d ' + repodir + ' ] || git clone ' + repourl + ' ' + repodir,
      'pushd ' + repodir + ' > /dev/null', // enter the repodir
      // 'cp ./etc/postcreate.sh_template ./etc/postcreate.sh',
      'sed -i \'s|^epic_dl_url.*=.*$|epic_dl_url = "' + epicurl.replace(/\&/g, '\\&') + '"|\' ./etc/bluedata_infra.tfvars', // escape url string with |
    ];
    commands.push('echo tfvars updated');
    commands.push(tfcommand('init'));
    commands.push('popd > /dev/null'); // exit the repodir
    runMultiCommand(commands)
      .then(result => {
        sendOutput(result.stdout);
        if (result.stderr) sendError(result.stderr);
        else setReady(true);
      })
      .catch(err => sendError(err.message));

    setLoading(false);
  }

  const verifyNeed = async (n) => {
    const need = JSON.parse(n);
    setLoading(true);
    let result = await installNeeded(need);
    setLoading(false);
    if (result) {
      setCommands(old => [...old, need.command]);
    }
  }

  const deploy = () => {
    let commands = [
      'pushd ' + repodir + ' > /dev/null',
      // workaround for my M1 MacOS
      'PATH="${PATH}":"$(python3 -m site --user-base)/bin" ./bin/vmware_create_new.sh',
      'popd > /dev/null'
    ]
    runMultiCommand(commands)
      .then(result => {
        sendOutput(result.stdout);
        if (result.stderr) sendError(result.stderr)
      })
      .catch(error => sendError(error.message));
  }

  const updateHost = async (isremote) => {
    await saveToStore('host.isremote', JSON.stringify(isremote));
    setHost(prev => ({ ...prev, 'isremote': isremote }));
    checkTarget(true);
  }

  return (
    <Box gap='small' pad='xsmall' fill flex={false}>
    { loading && <Layer animation='fadeIn' onEsc={ setLoading(false) } ><Spinning size='large' /></Layer> }
    <CheckBox 
      checked={ host.isremote }
      onChange={ (event) => updateHost(event.target.checked) }
      label={ host.isremote ? 'Remote' : 'Local' }
      toggle
    />
    { host.isremote && <Target setParent={ (res) => updateHost(res) } /> }
    {
        targetready && required.map(need =>
          <Box margin='none' direction='row' key={ need.command } justify='between' align='center' >
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

{ // display if all requirements are met
      (required.map(req => req.needs.map(n => n.command)).flat().length === commands.length) &&
      <Box>
        <FormField name='epicurl' htmlfor='epicurl' label='EPIC Download URL' required >
          <TextInput id='epicurl' name='epicurl' value={ epicurl } onChange={ event => setEpicurl(event.target.value ) } />
        </FormField>
        <Button label='Prepare' 
          secondary 
          hoverIndicator 
          icon={ <Next /> } reverse 
          disabled={ ! epicurl }
          onClick={ () => prepare() }
        />

      </Box>
      }

      {
        ready && 
        <Button 
          onClick={ deploy }
          type='button' 
          color='plain' 
          label='Deploy on vSphere' 
          icon={ <Vmware /> } />

      }
    </Box>
  )
}