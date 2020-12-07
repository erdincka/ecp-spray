import React from 'react';
import { Box, Button, CheckBox, Form, FormField, Select, TextInput } from 'grommet';
import { PasswordInput } from 'grommet-controls';
import { StatusGood, StatusCritical } from 'grommet-icons';

function Target(props) {
  const defaultHost= {hostname: '', username: '', password: ''}
  const { ipcRenderer } = window.require('electron');
  const callback = props.targetSetter;

  // set states
  const [targets, setTargets] = React.useState(['ssh']);
  const [target, setTarget] = React.useState(targets[0]);
  const [host, setHost] = React.useState(defaultHost);
  const [targetReady, setTargetReady] = React.useState(false);
  
  React.useEffect(() => {
    const fetchData = async () => {
      // get target configuration
      const payload = JSON.parse(await ipcRenderer.invoke('get-store-value', 'target'));
      if (payload['target']) setTarget(payload['target']);
      if (payload['host']) setHost(payload['host']);
      // set targets
      const platform = await ipcRenderer.invoke('get-system', 'platform');
      if (platform === 'linux') {
        setTargets(t => t.filter(f => f !== 'localhost').concat(['localhost']));
        setTarget('localhost');
      }
    };
    fetchData();
  }, [ipcRenderer]);

  const updateTarget = (message, code='status') => {
    ipcRenderer.invoke('app-message', code, message);
    const result = code === 'error' ? false : true;
    setTargetReady(result);
    callback(result);
  }

  const saveHost = () => {
    if ( target === 'ssh' ) {
      // check if ssh command is available
      ipcRenderer.invoke('get-system', 'canRunSsh')
      .then(res => {
        // check if connection to remote host successful
        ipcRenderer.invoke('get-system', 'testSshConnect')
          .then(res => {
            if (res && res.stderr === '') {
              // success - save values and update interface
              ipcRenderer.invoke('set-store-value', 'target', JSON.stringify({ protocol: target, host }))
                .then( () => updateTarget('Target set to ' + host.username + '@' + host.hostname) )
                .catch(error => ipcRenderer.invoke('app-message', 'error', 
                  error.message.replace('Error invoking remote method \'get-system\':', '')));
            }
            else updateTarget(res.stderr, 'error');
          })
          // catch error with ssh connection
          .catch(error => ipcRenderer.invoke('app-message', 'error', 
            error.message.replace('Error invoking remote method \'get-system\':', ''))
          );
      })
      // catch error with ssh command (if exists)
      .catch(error => ipcRenderer.invoke('app-message', 'error', 
        error.message.replace('Error invoking remote method \'get-system\':', ''))
      );
    }
    else { // target is localhost
      ipcRenderer.invoke('set-store-value', 'target', JSON.stringify({ protocol: target }))
      .then( () => updateTarget('Target set to localhost') )
      .catch(error => ipcRenderer.invoke('app-message', 'error', 
        error.message.replace('Error invoking remote method \'get-system\':', '')));
    }
  }

  return(
    <Box pad='small' background='light-2' flex>
      <Select
        options={targets}
        value={target}
        onChange={({ option }) => setTarget(option)}
        icon={ targetReady ? <StatusGood color='brand' /> : <StatusCritical color='plain' /> }
      />
      <Form direction='row'
        value={host}
        validate='blur'
        onChange={ nextValue => setHost(nextValue) }
        onSubmit={ () => saveHost() }
      >
        { (target === 'ssh') &&
          <Box>
            <Box direction='row' pad='small'>
              <FormField name='hostname' htmlfor='host-id' label='Hostname' required>
                <TextInput id='host-id' name='hostname' placeholder='hostname / ip address' />
              </FormField>
              <FormField name='username' htmlfor='name-id' label='Username' required>
                <TextInput id='name-id' name='username' placeholder='username' />
              </FormField>
              <CheckBox 
                name='useKeyFile'
                label="Private Key?"
                toggle
                checked={host.useKeyFile}
              />
              { (host.useProxy && !host.useKeyFile) }
              { host.useKeyFile ? 
                <FormField name='keyfile' htmlfor='keyfile-id' label='Private SSH Key File' required>
                  <TextInput id='keyfile-id' name='keyfile' placeholder='path to private key file' />
                </FormField>
                :
                <FormField name='password' htmlfor='pass-id' label='Password' required>
                  <PasswordInput id='pass-id' name='password' placeholder='password' />
                </FormField>
              }
              <CheckBox 
                name='useProxy'
                label="SSH proxy?"
                toggle
                checked={host.useProxy}
              />
            </Box>
            { host.useProxy &&
                <Box direction='row' pad='small'>
                  <FormField name='proxyhostname' htmlfor='proxyhost-id' label='Proxy Hostname' required>
                    <TextInput id='proxyhost-id' name='proxyhostname' placeholder='hostname / ip address' />
                  </FormField>
                  <FormField name='proxyusername' htmlfor='proxyname-id' label='Username' required>
                    <TextInput id='proxyname-id' name='proxyusername' placeholder='username' />
                  </FormField>
                  <CheckBox 
                    name='useProxyKeyFile'
                    label="Private Key?"
                    toggle
                    checked={host.useProxyKeyFile}
                  />
                {
                host.useProxyKeyFile ? 
                  <FormField name='proxykeyfile' htmlfor='proxykeyfile-id' label='Private SSH Key File' required>
                    <TextInput id='proxykeyfile-id' name='proxykeyfile' placeholder='path to private key file' />
                  </FormField>
                :
                  <FormField name='proxypassword' htmlfor='proxypass-id' label='Password' required>
                    <PasswordInput id='proxypass-id' name='proxypassword' placeholder='password' />
                  </FormField>
                }
              </Box>
            }
          </Box>
        }
        <Box direction='row' gap='medium'>
          <Button type='submit' primary label='Submit' />
        </Box>
      </Form>
    </Box>
  )
}

export default Target;