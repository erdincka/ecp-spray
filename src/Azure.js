import React from 'react';
import { Box, Button, FormField, Heading, Layer, Select, Text, TextInput } from 'grommet';
import { sendError, sendOutput, commandToCheck, runMultiCommand, installNeeded, getCommandOutput, runCommand, saveToStore, readFromStore } from './helpers';
import { required } from './azure_requires';
import { Next, StatusGood, StatusWarning, Windows } from 'grommet-icons';
import { Spinning } from 'grommet-controls';

export function Azure() {
  const [ ready, setReady ] = React.useState(false);
  const [ config, setConfig ] = React.useState({});
  const [ subscription, setSubscription ] = React.useState({});
  const [ loading, setLoading ] = React.useState(false);
  const [ commands, setCommands ] = React.useState([]);
  const [ regions, setRegions ] = React.useState([]);
  const [ region, setRegion ] = React.useState({});
  const [ epicurl, setEpicurl ] = React.useState('');
  const repodir = './ezmeral-demo-azure-terraform';
  const repourl = 'https://github.com/erdincka/ezmeral-demo-azure-terraform.git';
  // Workaround for my M1 MacOS
  const tfcommand = (cmd) => 'TF_IN_AUTOMATION=true arch -x86_64 terraform ' + cmd + ' -no-color -input=false '

  React.useEffect(() => {
    const fetchData = async () => {
      // Initialize for local execution
      await saveToStore('host.isremote', JSON.stringify(false));

      // Set config values from store, or from cli if missing
      let azure = JSON.parse(await readFromStore('azure'));
      // get cli settings, if not exist in stored values
      if (! azure.subscriptions) {
        setLoading(true);
        runCommand('az login')
          .then(res => {
            saveToStore('azure.subscriptions', JSON.stringify(JSON.parse(res)));
            setLoading(false);
          })
          .catch( error => sendError(error.message) && setLoading(false) );
      }
      setConfig(azure);

      if (! azure.regions) { // TODO: requires az to be available, returns error if az not found
        setLoading(true);
        runCommand('az account list-locations --query \'[].{DisplayName:displayName, Name:name}\' -o json')
          .then(res => {
            saveToStore('azure.regions', JSON.stringify(JSON.parse(res)));
            setLoading(false);
          })
          .catch( error => sendError(error.message) && setLoading(false) );
      }
      setRegions(azure.regions);
      if ( azure.region ) setRegion(azure.region);
      if ( azure.epicurl ) setEpicurl(azure.epicurl);
      
      // Check if requirements are available
      let cmds = [];
      required.forEach( group => group.needs.forEach( need => cmds.push(commandToCheck(need)) ) );
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
    };
    fetchData();
  }, []);

  const verifyNeed = async (n) => {
    const need = JSON.parse(n);
    setLoading(true);
    let result = await installNeeded(need);
    setLoading(false);
    if (result) {
      setCommands(old => [...old, need.command]);
    }
  }

  const subscriptionSelected = (s) => {
    if (! s['servicePrinciple']) {
      setLoading(true);
      runMultiCommand([
        'az account set --subscription="' + s.id + '"',
        'az ad sp create-for-rbac --role="Contributor" --scopes="/subscriptions/' + s.id + '" -o json'
      ])
      .then(res => {
        sendOutput(res);
        s['servicePrinciple'] = JSON.parse(res);
        let c = config;
        c.subscriptions[c.subscriptions.findIndex(item => item.id === s.id)] = s;
        saveToStore('azure', JSON.stringify(c));
        setLoading(false);
      })
      .catch(error => sendError(error.message));
    }
    setSubscription(s);
  }
  
  const prepare = () => {
    saveToStore('azure.region', JSON.stringify(region.Name));
    saveToStore('azure.epicurl', JSON.stringify(epicurl));
    let commands = [
      '[ -d ' + repodir + ' ] || git clone ' + repourl + ' ' + repodir,
      'pushd ' + repodir + ' > /dev/null', // enter the repodir
      // 'cp ./etc/postcreate.sh_template ./etc/postcreate.sh',
      'sed -i \'\' \'s/^subscription_id.*=.*$/subscription_id = "' + subscription.id + '"/\' ./etc/bluedata_infra.tfvars',
      'sed -i \'\' \'s/^client_id.*=.*$/client_id = "' + subscription.servicePrinciple.appId + '"/\' ./etc/bluedata_infra.tfvars',
      'sed -i \'\' \'s/^client_secret.*=.*$/client_secret = "' + subscription.servicePrinciple.password + '"/\' ./etc/bluedata_infra.tfvars',
      'sed -i \'\' \'s/^tenant_id.*=.*$/tenant_id = "' + subscription.tenantId + '"/\' ./etc/bluedata_infra.tfvars',
      'sed -i \'\' \'s/^region.*=.*$/region = "' + region.Name + '"/\' ./etc/bluedata_infra.tfvars',
      'sed -i \'\' -- \'s|^epic_dl_url.*=.*$|epic_dl_url = "' + epicurl.replace(/\&/g, '\\&') + '"|\' ./etc/bluedata_infra.tfvars', // escape url string with |
    ];
    // if ( config.region !== 'eu-west-1' ) commands.push('sed -i \'\' \'s/eu-west-1/' + config.region + '/g\' ./etc/bluedata_infra.tfvars'); 
    commands.push('echo tfvars updated');
    commands.push(tfcommand('init'));
    commands.push('popd > /dev/null'); // exit the repodir
    runMultiCommand(commands)
      .then(result => sendOutput(result) && setReady(true))
      .catch(err => sendError(err.message));
  }

  const deploy = () => {
    let commands = [
      'pushd ' + repodir + ' > /dev/null',
      // workaround for my M1 Mac
      'PATH="$PATH":"$(python3 -m site --user-base)/bin" arch -x86_64 ./bin/azure_create_new.sh',
      'popd > /dev/null'
    ]
    runMultiCommand(commands)
      .then(result => {
        sendOutput(result);
      })
      .catch(error => sendError(error.message));
  }

  return (
    <Box gap='small' pad='xsmall' fill flex={false}>
    { loading && <Layer animation='fadeIn' onEsc={ setLoading(false) } ><Spinning size='large' /></Layer> }
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
    
    { // display if all requirements are met
    (required.map(group => group.needs.map(n => n.command)).flat().length === commands.length) && 
    <Box>
      <FormField name='subscription' htmlfor='subscription' label='Azure Subscription' required >
        <Select
          id='subscription'
          options={ config.subscriptions }
          children={ (option, index, status) => option.name }
          labelKey='name'
          placeholder='Select subscription'
          required
          disabledKey={ (option) => option.state !== 'Enabled' }
          onChange={({ option }) => subscriptionSelected(option)}
          />
      </FormField>
      <FormField name='regions' htmlfor='regions' label='Azure Region' required >
        <Select
          id='regions'
          options={ regions }
          children={ (option, index, status) => option.DisplayName }
          labelKey='name'
          placeholder='Select region'
          required
          onChange={({ option }) => setRegion(option)}
          />
      </FormField>
      <FormField name='epic_dl_url' htmlfor='epic_dl_url' label='EPIC Download URL' required >
        <TextInput id='epic_dl_url' name='epic_dl_url' value={ epicurl } onChange={ event => setEpicurl(event.target.value ) } />
      </FormField>

      <Button label='Prepare' 
        secondary 
        hoverIndicator 
        icon={ <Next /> } reverse 
        disabled={ ! subscription.servicePrinciple }
        onClick={ () => prepare() }
      />
    </Box>
    }

    {
      ready && 
      <Button 
        onClick={ () => deploy() }
        type='button' 
        color='plain' 
        label='Deploy on Azure' 
        icon={ <Windows /> } />
    }
  </Box>
  )
}