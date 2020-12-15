import React from 'react';
import { Box, Button, CheckBox, Form, FormField, TextInput } from 'grommet';
import { PasswordInput } from 'grommet-controls';
import { defaultHost } from './defaultHost';

function Target(props) {
  const { ipcRenderer } = window.require('electron');
  const callback = props.setter;

  const [platform, setPlatform] = React.useState();
  const [host, setHost] = React.useState(defaultHost);
  
  React.useEffect(() => {
    const fetchData = async () => {
      // get host from stored settings
      const stored = JSON.parse(await ipcRenderer.invoke('get-store-value', 'host'));
      if (stored) setHost(stored)
      // set the platform we operate on
      setPlatform(await ipcRenderer.invoke('get-system', 'platform'));
    };
    fetchData();
  }, [ipcRenderer]);

  const updateTarget = (message, code='status') => {
    ipcRenderer.invoke('app-message', code, message);
    callback(code === 'error' ? false : true);
  }

  const saveHost = () => {
    host.isremote ?
      ipcRenderer.invoke('get-system', 'canRunSsh')
      .then(res => {
        // save settings
        ipcRenderer.invoke('set-store-value', 'host', JSON.stringify(host))
        .then( () => {
          // check if connection to remote host successful
          ipcRenderer.invoke('get-system', 'testSshConnect')
            .then( (res) => {
              if (res && res.stderr === '') updateTarget('Target set to ' + host.username + '@' + host.hostname) 
              else updateTarget(res.stderr, 'error');
            })
            // catch error with ssh connection
            .catch(error => ipcRenderer.invoke('app-message', 'error', 
                error.message.replace('Error invoking remote method \'get-system\':', '')));
            }
          )
          // catch error with setting store key
          .catch(error => ipcRenderer.invoke('app-message', 'error', 
            error.message.replace('Error invoking remote method \'set-store-value\':', ''))
          );
      })
      // catch error with ssh command (if exists)
      .catch(error => ipcRenderer.invoke('app-message', 'error', 
        error.message.replace('Error invoking remote method \'get-system\':', ''))
      )
    : // if local deployment
      ipcRenderer.invoke('set-store-value', 'host', JSON.stringify(host))
      .then( () => updateTarget('Target set to localhost') )
      .catch(error => ipcRenderer.invoke('app-message', 'error', 
        error.message.replace('Error invoking remote method \'get-system\':', '')));
  }

  return(
    <Box pad='small' flex>
      {/* { JSON.stringify(host) } <br />  */}
      <Form direction='row'
        value={ host }
        validate='submit'
        onChange={ nextValue => setHost(nextValue) }
        onSubmit={ () => saveHost() }
      >
        <Box direction='row'>
          <CheckBox 
            disabled={ platform === 'linux' ? false : true }
            name='isremote'
            label={ host.isremote ? 'Remote' : 'Local' }
            toggle
            checked={ host.isremote || true }
          />
          { host.isremote && <CheckBox 
            name='useproxy'
            label="Via proxy?"
            toggle
            checked={host.useproxy}
          />}
        </Box>
        { host.isremote &&
          <Box>
            { host.useproxy &&
                <Box direction='row' pad='small'>
                  <FormField name='proxyhostname' htmlfor='proxyhost-id' label='Proxy Hostname' required>
                    <TextInput id='proxyhost-id' name='proxyhostname' placeholder='hostname / ip address' />
                  </FormField>
                  <FormField name='proxyusername' htmlfor='proxyname-id' label='Username' required>
                    <TextInput id='proxyname-id' name='proxyusername' placeholder='username' />
                  </FormField>
                  <CheckBox 
                    name='useproxykeyfile'
                    label="Use prv key?"
                    toggle
                    checked={host.useproxykeyfile}
                  />
                {
                host.useproxykeyfile ? 
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
            <Box direction='row' pad='small'>
              <FormField name='hostname' htmlfor='host-id' label='Hostname' required>
                <TextInput id='host-id' name='hostname' placeholder='hostname / ip address' />
              </FormField>
              <FormField name='username' htmlfor='name-id' label='Username' required>
                <TextInput id='name-id' name='username' placeholder='username' />
              </FormField>
              <CheckBox 
                name='usekeyfile'
                label="Use prv key?"
                toggle
                checked={host.usekeyfile}
              />
              { host.usekeyfile ? 
                <FormField name='keyfile' htmlfor='keyfile-id' label='Private SSH Key File' required>
                  <TextInput id='keyfile-id' name='keyfile' placeholder='path to private key file' />
                </FormField>
                :
                <FormField name='password' htmlfor='pass-id' label='Password' required>
                  <PasswordInput id='pass-id' name='password' placeholder='password' />
                </FormField>
              }
            </Box>
          </Box>
        }
        <Box direction='row' gap='medium'>
          <Button type='submit' primary fill label='Save' />
        </Box>
      </Form>
    </Box>
  )
}

export default Target;