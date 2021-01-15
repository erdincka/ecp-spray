import React from 'react';
import { Box, Button, Form, FormField, Heading, Layer, Text, TextInput } from 'grommet';
import { sendError, sendOutput, commandToCheck, runMultiCommand, installNeeded, getCommandOutput, runCommand, saveToStore, readFromStore } from './helpers';
import { required } from './azure_requires';
import { Next, StatusGood, StatusWarning, Windows } from 'grommet-icons';
import { Spinning } from 'grommet-controls';

export function Azure() {
  const [ ready, setReady ] = React.useState(false);
  const [ config, setConfig ] = React.useState({
    'access_key': '',
    'secret_key': '',
    'region': '',
    'user': ''
  });
  const [ loading, setLoading ] = React.useState(false);
  const [ commands, setCommands ] = React.useState([]);
  // const repodir = './hcp-demo-env-azure-terraform';
  // const tfcommand = (cmd) => 'TF_IN_AUTOMATION=true arch -x86_64 terraform ' + cmd + ' -no-color -input=false '

  React.useEffect(() => {
    const fetchData = async () => {
      // Initialize for local execution
      await saveToStore('host.isremote', JSON.stringify(false));

      // Set config values from store, or from cli if missing
      let azure = JSON.parse(await readFromStore('azure'));
      // get cli settings, if not exist in stored values
      // setLoading(true);
      // [ 'name', 'subscriptionId', 'tenantId' ].forEach(async key => {
        // if ( !azure[key] )
        //   azure[key] = await runCommand('az --output json configure get ' + key)
        //     .then(res => {
        //       if (res.stderr) sendError(res.stderr.replace('Error invoking remote method \'get-system\': ', ''));
        //       setLoading(false);
        //       return res.stdout;
        //     })
        //     .catch(error => sendError(error.message.replace('Error invoking remote method \'get-system\': ', '')));
      // });
      setConfig(c => Object.assign(c, azure));

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
      setReady(true);
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
        value={config}
        onChange={ next => setConfig(next) }
        onSubmit={ event => console.dir(event.value) }
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
        onClick={ () => console.dir('go') }
        type='button' 
        color='plain' 
        label='Deploy on Azure' 
        icon={ <Windows /> } />
    }
  </Box>
  )
}