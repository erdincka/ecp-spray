import { Box, Button, Layer, Select, Text, TextInput } from 'grommet';
import React from 'react';
import { sendError, sendOutput, commandToCheck, runMultiCommand, installNeeded, getCommandOutput, sendStatus, runCommand, saveToStore, readFromStore } from './helpers';
import { required } from './aws_requires';
import { Amazon, Next, StatusGood, StatusWarning } from 'grommet-icons';
import { Spinning } from 'grommet-controls';
import { Platforms } from './Platforms';

export const Aws = () => {
  const [ ready, setReady ] = React.useState(false);
  const [ loading, setLoading ] = React.useState(false);
  const [ commands, setCommands ] = React.useState([]);
  const [ regions, setRegions ] = React.useState();
  const [ accesskey, setAccesskey ] = React.useState();
  const [ secretkey, setSecretkey ] = React.useState();
  const [ region, setRegion ] = React.useState();
  const [ epicurl, setEpicurl ] = React.useState();
  const [ user, setUser ] = React.useState([]);
  const repourl = Platforms.find(p => p.name === 'aws').url;
  const repodir = repourl.split('/').slice(-1); //'./hcp-demo-env-aws-terraform';
  const tfcommand = (cmd) => 'TF_IN_AUTOMATION=true arch -x86_64 terraform ' + cmd + ' -no-color -input=false '

  React.useEffect(() => {
    const fetchData = async () => {
      // Initialize for local execution
      await saveToStore('host.isremote', JSON.stringify(false));
      // Get regions for configured AMIs
      let response = await fetch('https://raw.githubusercontent.com/hpe-container-platform-community/hcp-demo-env-aws-terraform/master/bluedata_infra_variables.tf');
      if (response.ok) {
        let result = (await response.text()).split('\n');
        let amis_start = result.findIndex(item => item.includes('variable "EC2_CENTOS7_AMIS')) + 3;
        let amis_end = result.slice(amis_start).findIndex( item => item.includes('}'));
        const regions = result.slice(amis_start, amis_start + amis_end).map( item => item.split('=')[0].trim());
        setRegions(regions);
      }
      else {
        sendError(response.status);
      }
      // Set config values from store, or from cli if missing
      let aws = JSON.parse(await readFromStore('aws'));
      // get cli settings, if not exist in stored values
      setLoading(true);
      [ 'access_key', 'secret_key', 'region' ].forEach(async key => {
        if (! aws[key]) aws[key] = (await runCommand('aws --output json configure get ' + key)).trim();
      });
      setLoading(false);
      setRegion(aws.region);
      setAccesskey(aws.access_key);
      setSecretkey(aws.secret_key);

      // Check if requirements are available
      let cmds = [];
      required.forEach( req => cmds.push(commandToCheck(req)) );
      setLoading(true);
      runMultiCommand(cmds)
        .then(result => {
          let [ out, err ] = getCommandOutput(result);
          if (err) sendError(err);
          if (out) {
            sendOutput(out);
            let found = [];
            out.split('\n').forEach(line => {
              if (line.match(/^\/\w+/)) // if path starts with / (returned from which command)
              found.push(line.trim().split('/').pop()); // extract command name from path
            })
            setCommands(found);
          }
        });
      setLoading(false);
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

  const updateRepoFiles = () => {
    let commands = [
      '[ -d ' + repodir + ' ] || git clone ' + repourl + ' ' + repodir,
      'pushd ' + repodir + ' > /dev/null', // enter the repodir
      // 'cp ./etc/postcreate.sh_template ./etc/postcreate.sh',
      'sed \'s/^region.*=.*$/region = "' + region + '"/\' ./etc/bluedata_infra.tfvars',
      'sed \'s|^epic_dl_url.*=.*$|epic_dl_url = "' + epicurl.replace(/\&/g, '\\&') + '"|\' ./etc/bluedata_infra.tfvars', // escape url string with |
      'sed \'s/<<your-name>>/' + user + '/g\' ./etc/bluedata_infra.tfvars_example > ./etc/bluedata_infra.tfvars'
    ];
    commands.push('echo tfvars updated');
    commands.push(tfcommand('init'));
    commands.push('popd > /dev/null'); // exit the repodir
    runMultiCommand(commands)
      .then(result => sendOutput(result) && setReady(true))
      .catch(err => sendError(err.message));
  }

  const saveConfigState = async () => {
    let aws;
    aws.access_key = accesskey;
    aws.secret_key = secretkey;
    aws.region = region;
    aws.user = user;
    aws.epicurl = epicurl;
    await saveToStore('aws', JSON.stringify(aws));
    // Update aws cli configuration/credentials
    runMultiCommand([
      'aws configure set region ' + aws['region'],
      'aws configure set aws_access_key_id ' + aws['access_key'],
      'aws configure set aws_secret_access_key ' + aws['secret_key']
    ])
      .then(result => sendOutput(result))
      .catch(error => sendError(error.message));
      sendStatus('aws settings are saved');
    };
    
  const prepare = async () => {
    setLoading(true); // TODO: This is not working as expected
    await saveConfigState();
    updateRepoFiles();
    setLoading(false);
  }

  const deploy = () => {
    let commands = [
      'pushd ' + repodir + ' > /dev/null',
      // workaround for my M1 Mac
      'PATH="$PATH":"$(python3 -m site --user-base)/bin" arch -x86_64 ./bin/create_new_environment_from_scratch.sh',
      'popd > /dev/null'
    ]
    runMultiCommand(commands)
      .then(result => {
        sendOutput(result);
      })
      .catch(error => sendError(error.message));
  }

  return (
    <Box pad='xsmall' fill flex={false}>
      { loading && <Layer animation='fadeIn' onEsc={ setLoading(false) } ><Spinning size='large' /></Layer> }
      {
        required.map(req => 
          <Box margin='xsmall' direction='row' key={ req.command } justify='between' align='center' >
            <Text >{ req.command }</Text>
            <Box direction='row' align='center'>
              <Button 
                disabled={ loading || commands.includes(req.command) } 
                label={ commands.includes(req.command) ? 'Ready' : 'Install' }
                color={ commands.includes(req.command) ? '' : 'plain' }
                id={ JSON.stringify(req) }
                onClick={ event => verifyNeed(event.target.id) }
              />
              { commands.includes(req.command) ? <StatusGood color='status-ok' /> : <StatusWarning color='status-warning' />}
            </Box>
          </Box>
        )
      }
      
      { // display if all requirements are met
      (required.length === commands.length) &&
      <Box>
        <TextInput id='access_key' placeholder='Access Key' value={ accesskey } onChange={ event => setAccesskey(event.target.value)} />
        <TextInput id='secret_key' placeholder='Secret Key' value={ secretkey } onChange={ event => setSecretkey(event.target.value)} />
        <TextInput id='user' placeholder='User' value={ user } onChange={ event => setUser(event.target.value)} />
        <TextInput id='epicurl' placeholder='EPIC Download URL' value={ epicurl } onChange={ event => setEpicurl(event.target.value)} />
        { regions &&
          <Select id='region' placeholder='Select Region' options={ regions } value={ region } onChange={ event => setRegion(event.target.value)} />
        }
        <Button 
          onSubmit={ () => prepare() }
          label='Prepare'
          secondary reverse hoverIndicator
          icon={ <Next /> }
        />
      </Box>
      }
      {
        ready && 
        <Button 
          onClick={ deploy }
          type='button' 
          color='plain' 
          label='Deploy on AWS' 
          icon={ <Amazon /> } />
      }
    </Box>
  )
}