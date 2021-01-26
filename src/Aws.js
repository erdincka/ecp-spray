import { Box, Button, Form, FormField, Heading, Layer, Text, TextInput } from 'grommet';
import React from 'react';
import { sendError, sendOutput, commandToCheck, runMultiCommand, installNeeded, getCommandOutput, sendStatus, runCommand, saveToStore, readFromStore } from './helpers';
import { required } from './aws_requires';
import { Amazon, Next, StatusGood, StatusWarning } from 'grommet-icons';
import { Spinning } from 'grommet-controls';

export const Aws = () => {
  const [ ready, setReady ] = React.useState(false);
  const [ config, setConfig ] = React.useState({
    'access_key': '',
    'secret_key': '',
    'region': '',
    'user': '',
    'epicurl': ''
  });
  const [ loading, setLoading ] = React.useState(false);
  const [ commands, setCommands ] = React.useState([]);
  const repourl = 'https://github.com/hpe-container-platform-community/hcp-demo-env-aws-terraform';
  const repodir = './hcp-demo-env-aws-terraform';
  const tfcommand = (cmd) => 'TF_IN_AUTOMATION=true arch -x86_64 terraform ' + cmd + ' -no-color -input=false '

  React.useEffect(() => {
    const fetchData = async () => {
      // Initialize for local execution
      await saveToStore('host.isremote', JSON.stringify(false));

      // Set config values from store, or from cli if missing
      let aws = JSON.parse(await readFromStore('aws'));
      // get cli settings, if not exist in stored values
      setLoading(true);
      [ 'access_key', 'secret_key', 'region' ].forEach(async key => {
        if (! aws[key]) aws[key] = (await runCommand('aws --output json configure get ' + key)).trim();
      });
      setLoading(false);
      setConfig(aws);

      // Check if requirements are available
      let cmds = [];
      required.forEach( req => req.needs.forEach( need => cmds.push(commandToCheck(need)) ) );
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
      'sed -i \'\' \'s/^region.*=.*$/region = "' + config.region + '"/\' ./etc/bluedata_infra.tfvars',
      'sed -i \'\' -- \'s|^epic_dl_url.*=.*$|epic_dl_url = "' + config.epicurl.replace(/\&/g, '\\&') + '"|\' ./etc/bluedata_infra.tfvars', // escape url string with |
      'sed \'s/<<your-name>>/' + config.user + '/g\' ./etc/bluedata_infra.tfvars_example > ./etc/bluedata_infra.tfvars'
    ];
    // TODO: Stick to regions within tfvars (might want to add others)
    // TODO: Make region selection as <Select /> with available options
    // if ( config.region !== 'eu-west-3' ) commands.push('sed -i \'\' \'s/eu-west-3/' + config.region + '/g\' ./etc/bluedata_infra.tfvars'); 
    // if ( config.region !== 'eu-west-1' ) commands.push('sed -i \'\' \'s/eu-west-1/' + config.region + '/g\' ./etc/bluedata_infra.tfvars'); 
    commands.push('echo tfvars updated');
    commands.push(tfcommand('init'));
    // commands.push(tfcommand(plan) + ' -var-file=etc/bluedata_infra.tfvars -var="client_cidr_block=$(curl -s http://ifconfig.me/ip)/32"');
    commands.push('popd > /dev/null'); // exit the repodir
    runMultiCommand(commands)
      .then(result => sendOutput(result) && setReady(true))
      .catch(err => sendError(err.message));
  }

  const saveConfigState = async (c) => {
    await saveToStore('aws', JSON.stringify(c));
    // Update aws cli configuration/credentials
    runMultiCommand([
      'aws configure set region ' + c['region'],
      'aws configure set aws_access_key_id ' + c['access_key'],
      'aws configure set aws_secret_access_key ' + c['secret_key']
    ])
      .then(result => sendOutput(result))
      .catch(error => sendError(error.message));
      sendStatus('aws settings are saved');
    };
    
  const prepare = async (c) => {
    setLoading(true); // TODO: This is not working as expected
    await saveConfigState(c);
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
      (required.map(req => req.needs.map(n => n.command)).flat().length === commands.length) &&
        <Form
          validate='submit'
          value={ config }
          onChange={ next => setConfig(next) }
          onSubmit={ event => prepare(event.value) }
        >
          { Object.keys(config).map(key => 
            <FormField name={key} htmlfor={key} label={key} key={key} required >
              <TextInput id={key} name={key} value={ config[key] || '' } />
            </FormField>
          )}
          <Button type='submit' label='Prepare' secondary reverse hoverIndicator icon={ <Next /> } />
        </Form>
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