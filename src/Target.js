import React from 'react';
import { Box, Button, CheckBox, Form, FormField, Select, TextInput } from 'grommet';
import { PasswordInput } from 'grommet-controls';
import { StatusGood, StatusCritical } from 'grommet-icons';

function Target() {
  const defaultHost= {hostname: '', username: '', password: ''}
  const [target, setTarget] = React.useState()
  const [host, setHost] = React.useState(defaultHost);
  const [ready, setReady] = React.useState(false);
  const { remote, ipcRenderer } = window.require('electron');

  React.useEffect(() => {
    const fetchData = async () => {
      // get target configuration
      const payload = JSON.parse(await ipcRenderer.invoke('get-store-value', 'target'));
      if (payload['target']) setTarget(payload['target']);
      if (payload['host']) setHost(payload['host']);
      // set targets
      // const platform = ipcRenderer.invoke('get-system', 'platform');
      const platform = remote.process.platform && console.dir('running on: ' + platform);
      const targets = platform === 'linux' ? ['localhost', 'ssh'] : ['ssh']
      setTarget(targets[0]);
    };
    fetchData();
  }, [ipcRenderer]);

  const saveHost = (h) => {
    ipcRenderer.invoke('set-store-value', 'target', JSON.stringify({ protocol: target, host }))
      .then(() => { 
        ipcRenderer.invoke('app-message', 'status', host.hostname + ' target saved.');
        if ( target === 'ssh' ) {
          // check if ssh command is available
          // ipcRenderer.invoke('get-system', 'canRunSsh')
          remote.commandExists.sync('ssh')
          .then(res => {
            // ipcRenderer.invoke('get-system', 'testSshConnect', host)
            remote.testSshConnect(host)
              .then(res => {
                if (res && res.stderr === '') {
                  setReady(true);
                }
                else {
                  setReady(false);
                }
              })
              .catch(error => ipcRenderer.invoke('app-message', 'error', 
                error.message.replace('Error invoking remote method \'get-system\':', ''))
              );
          })
          .catch(error => {
            console.dir(error);
          })
        }
      })
      .catch(error => console.error(error))
  }

  return(
    <Box pad='small' background='light-2' flex>
      <Select
        options={targets}
        value={target}
        onChange={({ option }) => setTarget(option)}
        icon={ ready ? <StatusGood color='brand' /> : <StatusCritical color='plain' /> }
      />
      <Form direction='row'
        value={host}
        validate='blur'
        onValidate={() => setReady(false)}
        onChange={nextValue => setHost(nextValue)}
        onReset={() => setHost(defaultHost)}
        onSubmit={ (event) => saveHost(event.value) }
      >
        { (target === 'ssh') &&
          <Box>
            <Box direction='row' pad='small'>
              <FormField name='hostname' htmlfor='host-id' label='Hostname' required>
                <TextInput id='host-id' name='hostname' placeholder='hostname / ip address' />
              </FormField>
              <CheckBox 
                name='useKeyFile'
                label="Private Key?"
                toggle
                checked={host.useKeyFile}
                onChange={() => setHost({ ...host, useKeyFile: !host.useKeyFile }) } 
              />
              { (host.useProxy && !host.useKeyFile) && setHost({ ...host, useKeyFile: !host.useKeyFile }) }
              { host.useKeyFile ? 
                <FormField name='keyfile' htmlfor='keyfile-id' label='Private SSH Key File' required>
                  <TextInput id='keyfile-id' name='keyfile' placeholder='path to private key file' />
                </FormField>
                :
                <Box direction='row' pad='none'>
                  <FormField name='username' htmlfor='name-id' label='Username' required>
                    <TextInput id='name-id' name='username' placeholder='username' />
                  </FormField>
                  <FormField name='password' htmlfor='pass-id' label='Password' required>
                    <PasswordInput id='pass-id' name='password' placeholder='password' />
                  </FormField>
                </Box>
              }
              <CheckBox 
                name='useProxy'
                label="SSH proxy?"
                toggle
                checked={host.useProxy}
                onChange={() => setHost({ ...host, useProxy: !host.useProxy }) } 
              />
            </Box>
            { host.useProxy &&
                <Box direction='row' pad='small'>
                  <FormField name='proxyhostname' htmlfor='proxyhost-id' label='Proxy Hostname' required>
                    <TextInput id='proxyhost-id' name='proxyhostname' placeholder='hostname / ip address' />
                  </FormField>
                  <CheckBox 
                    name='useProxyKeyFile'
                    label="Private Key?"
                    toggle
                    checked={host.useProxyKeyFile}
                    onChange={() => ({ ...host, useProxyKeyFile: !host.useProxyKeyFile }) } 
                  />
                {
                host.useProxyKeyFile ? 
                  <FormField name='proxykeyfile' htmlfor='proxykeyfile-id' label='Private SSH Key File' required>
                    <TextInput id='proxykeyfile-id' name='proxykeyfile' placeholder='path to private key file' />
                  </FormField>
                :
                  <Box direction='row' pad='none'>
                    <FormField name='proxyusername' htmlfor='proxyname-id' label='Username' required>
                      <TextInput id='proxyname-id' name='proxyusername' placeholder='username' />
                    </FormField>
                    <FormField name='proxypassword' htmlfor='proxypass-id' label='Password' required>
                      <PasswordInput id='proxypass-id' name='proxypassword' placeholder='password' />
                    </FormField>
                  </Box>
                }
              </Box>
            }            
          </Box>
        }
        <Box direction='row' gap='medium'>
          <Button type='submit' primary label='Submit' />
          <Button type='reset' label='Reset' />
        </Box>
      </Form>
    </Box>
  )
}

export default Target;