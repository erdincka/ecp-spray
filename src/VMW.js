import React from 'react';
import { Spinning } from 'grommet-controls';
import { Box, Button, Form, FormField, Heading, Layer, Text, TextInput } from 'grommet';
import { sendError, sendOutput, runMultiCommand, installNeeded } from './helpers';
import { required } from './vmw_requires';
import { Next, StatusGood, StatusWarning, Vmware } from 'grommet-icons';

export const VMW = () => {
  // const [ ready, setReady ] = React.useState(false);
  const [ config, setConfig ] = React.useState({
    'access_key': '',
    'secret_key': '',
    'region': '',
    'user': ''
  });
  const [ loading, setLoading ] = React.useState(false);
  const [ commands, setCommands ] = React.useState([]);
  const repodir = './hcp-demo-env-aws-terraform';
  // const tfcommand = (cmd) => 'TF_IN_AUTOMATION=true arch -x86_64 terraform ' + cmd + ' -no-color -input=false '

  const prepare = async (c) => {
    setLoading(true); // TODO: This is not working as expected
    // await saveConfigState(c);
    // updateRepoFiles();
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
      // 'PATH="${PATH}":"$(python3 -m site --user-base)/bin" arch -x86_64 ./bin/create_new_environment_from_scratch.sh',
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
    { JSON.stringify(required) }
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
        // ready && 
        <Button 
          onClick={ deploy }
          type='button' 
          color='plain' 
          label='Deploy on AWS' 
          icon={ <Vmware /> } />

      }
    </Box>
  )
}