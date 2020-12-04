import React from 'react';
import { Box, Button, CheckBox, Form, FormField, Select, TextInput } from 'grommet';
import { PasswordInput } from 'grommet-controls';
import { StatusGood, StatusCritical } from 'grommet-icons';

function Target() {
  const { ipcRenderer } = window.require('electron');
  const platform = ipcRenderer.invoke('get-system', 'platform');
  const targets = platform === 'linux' ? ['localhost', 'ssh'] : ['ssh']
  const defaultHost= {hostname: '', username: '', password: ''}
  const [target, setTarget] = React.useState(targets[0])
  const [host, setHost] = React.useState(defaultHost);
  const [ready, setReady] = React.useState(false);
  const [useHostKey, setUseHostKey] = React.useState(false);
  const [useSshProxy, setUseSshProxy] = React.useState(false);
  const [useProxyKey, setUseProxyKey] = React.useState(false);

  React.useEffect(() => {
    const fetchData = async () => {
      // get target configuration
      const payload = JSON.parse(await ipcRenderer.invoke('get-store-value', 'target'))
      if (payload['target']) setTarget(payload['target'])
      if (payload['host']) setHost(payload['host'])
    };
    fetchData();
  }, [ipcRenderer]);

  const saveHost = (h) => {
    ipcRenderer.invoke('set-store-value', 'target', JSON.stringify({ protocol: target, host }))
      .then(() => { 
        ipcRenderer.invoke('app-message', 'status', target + ' target saved.');
        if ( target === 'ssh' ) {
          // check if ssh command is available
          if (ipcRenderer.invoke('get-system', 'canRunSsh')) {
            
            setReady(true);
          }

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
                name='isHostKey'
                label="Use Key?"
                toggle
                checked={useHostKey}
                onChange={() => setUseHostKey(!useHostKey) } 
              />
              { useHostKey ? 
                <FormField name='hostkey' htmlfor='hostkey-id' label='SSH Public ID' required>
                  <TextInput id='hostkey-id' name='hostkey' placeholder='<ssh-rsa ...>' />
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
                name='viaSshProxy'
                label="SSH proxy?"
                toggle
                checked={useSshProxy}
                onChange={() => setUseSshProxy(!useSshProxy) } 
              />
            </Box>
            { useSshProxy &&
                <Box direction='row' pad='small'>
                  <FormField name='proxy-hostname' htmlfor='proxy-host-id' label='Proxy Hostname' required>
                    <TextInput id='proxy-host-id' name='proxy-hostname' placeholder='hostname / ip address' />
                  </FormField>
                  <CheckBox 
                    name='useProxyKey'
                    label="Use Key?"
                    toggle
                    checked={useProxyKey}
                    onChange={() => setUseProxyKey(!useProxyKey) } 
                  />
                {
                useProxyKey ? 
                  <FormField name='proxy-hostkey' htmlfor='proxy-hostkey-id' label='SSH Public ID' required>
                    <TextInput id='proxy-hostkey-id' name='proxy-hostkey' placeholder='<ssh-rsa ...>' />
                  </FormField>
                :
                  <Box direction='row' pad='none'>
                    <FormField name='proxy-username' htmlfor='proxy-name-id' label='Username' required>
                      <TextInput id='proxy-name-id' name='proxy-username' placeholder='username' />
                    </FormField>
                    <FormField name='proxy-password' htmlfor='proxy-pass-id' label='Password' required>
                      <PasswordInput id='proxy-pass-id' name='proxy-password' placeholder='password' />
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