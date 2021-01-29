import React from 'react';
import { Spinning } from 'grommet-controls';
import { Box, Button, CheckBox, Form, FormField, Layer, Text, TextInput } from 'grommet';
import { sendError, sendOutput, runMultiCommand, installNeeded, readFromStore, commandToCheck, getCommandOutput, saveToStore, sendStatus } from './helpers';
import { required } from './vmware_requires';
import { Next, StatusGood, StatusWarning, Vmware } from 'grommet-icons';
import Target from './host_target';
import { Platforms } from './Platforms';

export const VMWare = () => {
  const [ ready, setReady ] = React.useState(false);
  const [ host, setHost ] = React.useState({});
  const [ targetready, setTargetready ] = React.useState(false);
  const [ loading, setLoading ] = React.useState(false);
  const [ commands, setCommands ] = React.useState([]);
  const [ config, setConfig ] = React.useState({
    vsphere_server: "",
    vsphere_user: "",
    vsphere_password: "",
    vsphere_cluster: "",
    vsphere_datacenter: "",
    vsphere_resourcepool: "",
    vsphere_datastore: "",
    vsphere_network: "",
    centos_iso_url: "",
    centos_iso_path: "",
    centos_iso_checksum: "sha256:...",
    domain: "",
    timezone: "UTC",
    epic_dl_url: ""
  });

  const repourl = Platforms.find(p => p.name === 'vmware').url;
  const repodir = repourl.split('/').slice(-1); // './ezmeral-demo-vmware-terraform';

  const tfcommand = (cmd) => 'TF_IN_AUTOMATION=true terraform ' + cmd + ' -no-color -input=false '

  React.useEffect(() => {
    const fetchData = async () => {
      let vmware = JSON.parse(await readFromStore('vmware'));
      let host = JSON.parse(await readFromStore('host'));
      if ( vmware ) setConfig(Object.assign(config, vmware));
      setHost(host);
      sendStatus('defaults are loaded');
      if ( ! host.isremote ) checkTarget();
    };
    fetchData();
  }, [config]);

  const checkTarget = () => {
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
    setTargetready(true);
  }

  const prepare = async (c) => {
    saveToStore('vmware', JSON.stringify(config));
    sendStatus('vmware settings are saved');
  
    const replace = (obj) => {
      let patterns = [];
      Object.keys(obj).forEach( val => {
        const replaceVal = '\'s|^' + val + '\\s*=.*$|' + val + '="' + obj[val].replace(/\&/g, '\\&') + '"|\'';
        patterns.push(replaceVal);
      })
      return patterns;
    }

    let commands = [
      'set -eu',
      '[ -d ' + repodir + ' ] || git clone -q ' + repourl + ' ' + repodir,
      'pushd ' + repodir + ' > /dev/null', // enter the repodir
      // 'cp ./etc/postcreate.sh_template ./etc/postcreate.sh',
      // 'sed -i.bak \'s|^epic_dl_url.*=.*$|epic_dl_url = "' + config.epic_dl_url.replace(/\&/g, '\\&') + '"|\' ./etc/bluedata_infra.tfvars', // escape url string with |
      'sed -e ' + replace(config).join(' -e ') +  ' ./etc/my_env.sh-template > ./etc/my_env.sh'
    ];
    commands.push('echo tfvars updated');
    commands.push(tfcommand('init'));
    commands.push('popd > /dev/null'); // exit the repodir

    setLoading(true);
    runMultiCommand(commands)
      .then(result => {
        sendOutput(result.stdout);
        if (result.stderr) sendError(result.stderr);
        else setReady(true);
        setLoading(false);
      })
      .catch(err => sendError(err.message));
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
    checkTarget();
  }

  return (
    <Box gap='small' pad='xsmall' fill flex>
    { loading && <Layer animation='fadeIn' onEsc={ setLoading(false) } ><Spinning size='large' /></Layer> }
    <CheckBox 
      checked={ host.isremote }
      onChange={ (event) => updateHost(event.target.checked) }
      label={ host.isremote ? 'Remote' : 'Local' }
      toggle
    />
    { host.isremote && <Box><Target setParent={ (res) => updateHost(res) } /></Box> }
    <Box flex>
      {
        targetready && required.map(need =>
          <Box pad='xxsmall' direction='row' key={ need.command } justify='between' align='center' >
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

{ // display if all requirements are met
      (required.length === commands.length) &&
      <Box flex>
        <Form
          value= { config }
          validate='submit' onSubmit={ () => prepare() }
          onChange= { (value) => setConfig(value) }
          >
            { Object.keys(config).map( key => 
                <FormField name={key} htmlfor={key} label={key} key={key} required >
                  <TextInput id={key} name={key} value={ config[key] } type={ key.includes('password') ? 'password' : 'text' } />
                </FormField>
              )}
              <Box direction='row'>
                <Button label='Prepare' 
                  secondary 
                  type='submit'
                  hoverIndicator 
                  icon={ <Next /> } reverse 
                  disabled={ ! config }
                />
                <Button label='Deploy on vSphere'
                  color='plain'
                  type='button'
                  hoverIndicator
                  disabled={ !ready }
                  onClick={ deploy }
                  icon={ <Vmware /> } />
              </Box>
        </Form>
      </Box>
      }
    </Box>
  )
}