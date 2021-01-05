import React from 'react';
import { Box, Button, CheckBox, Form, FormField, TextInput } from 'grommet';
import { Next } from 'grommet-icons';
import { PasswordInput } from 'grommet-controls';
import { sendStatus, sendError, sendOutput } from './helpers';
import { defaultHost } from './defaultHost';

function Target(props) {
  const { ipcRenderer } = window.require('electron');
  const setParent = props.setParent;

  const [platform, setPlatform] = React.useState();
  const [host, setHost] = React.useState(defaultHost);
  
  React.useEffect(() => {
    const fetchData = async () => {
      // get host from stored settings
      const stored = JSON.parse(await ipcRenderer.invoke('get-store-value', 'host'));
      if (stored.hostname) setHost(stored);
      // else console.dir(defaultHost);
      // set the platform we operate on
      setPlatform(await ipcRenderer.invoke('get-system', 'platform'));
    };
    fetchData();
  }, [ipcRenderer]);

  const saveHost = () => {
    host.isremote ?
      ipcRenderer.invoke('get-system', 'canRunSsh')
      .then(res => {
        // save settings
        ipcRenderer.invoke('set-store-value', 'host', JSON.stringify(host))
        .then( () => {
          // check if connection to remote host successful
          ipcRenderer.invoke('get-system', 'execute-command', 'uname -a')
            .then( (res) => {
              if (res && res.stderr === '') {
                sendStatus('Connected to ' + host.username + '@' + host.hostname);
                sendOutput(res.stdout);
                setParent(true);
              }
              else sendError(res.stderr);
            })
            // catch error with ssh connection
            .catch(error => sendError(error.message.replace('Error invoking remote method \'get-system\':', '')));
            }
          )
          // catch error with setting store key
          .catch(error => sendError(error.message.replace('Error invoking remote method \'set-store-value\':', ''))
          );
      })
      // catch error with ssh command (if exists)
      .catch(error => sendError(error.message.replace('Error invoking remote method \'get-system\':', ''))
      )
    : // if local deployment
      ipcRenderer.invoke('set-store-value', 'host', JSON.stringify(host))
      .then( () => {
        sendStatus('Target set to localhost');
        setParent(true);
      })
      .catch(error => sendError(error.message.replace('Error invoking remote method \'get-system\':', '')));
  }

  const proxyBox = 
  <Box>
    <Box direction='row'>
      <FormField name='proxyhostname' htmlfor='proxyhost-id' label='Proxy Hostname' required>
        <TextInput id='proxyhost-id' name='proxyhostname' placeholder='hostname / ip address' />
      </FormField>
      <FormField name='proxyusername' htmlfor='proxyname-id' label='Username' required>
        <TextInput id='proxyname-id' name='proxyusername' placeholder='username' />
      </FormField>
    </Box>
    <CheckBox 
      name='useproxykeyfile'
      label="Use private key file?"
      toggle
      checked={host.useproxykeyfile}
    />
    <Box> {
        host.useproxykeyfile ? 
          <FormField name='proxykeyfile' htmlfor='proxykeyfile-id' label='Private SSH Key File' required>
            <TextInput id='proxykeyfile-id' name='proxykeyfile' placeholder='path to private key file' />
          </FormField>
        :
          <FormField name='proxypassword' htmlfor='proxypass-id' label='Password' required>
            <PasswordInput id='proxypass-id' name='proxypassword' placeholder='password' />
          </FormField>
      } </Box>
    </Box>;

  const hostBox = 
    <Box>
      <Box direction='row'>
        <FormField name='hostname' htmlfor='host-id' label='Hostname' required>
          <TextInput id='host-id' name='hostname' placeholder='hostname / ip address' />
        </FormField>
        <FormField name='username' htmlfor='name-id' label='Username' required>
          <TextInput id='name-id' name='username' placeholder='username' />
        </FormField>
      </Box>
      <CheckBox 
        name='usekeyfile'
        label="Use private key file?"
        toggle
        checked={host.usekeyfile}
      />
      <Box>
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
    </Box>;

  return(
    <Box pad='small' flex>
      {/* { JSON.stringify(host) } <br /> */}
      <Form direction='row'
        value={ host }
        validate='submit'
        onChange={ nextValue => setHost(nextValue) }
        onSubmit={ () => saveHost() }
      >
        <Box direction='row'>
          { platform === 'linux' && <CheckBox 
            // disabled={ platform === 'linux' ? false : true }
            name='isremote'
            label={ host.isremote ? 'Remote' : 'Local' }
            toggle
            checked={ host.isremote || true }
          />
          }
          { host.isremote && <CheckBox 
            name='useproxy'
            label="Via proxy?"
            toggle
            checked={host.useproxy}
          />}
        </Box>
        { host.isremote &&
          <Box>
            { host.useproxy && proxyBox
            }
            { hostBox }
          </Box>
        }
        <Box direction='row' gap='medium' justify='end'>
          <Button type='submit' label='Next' icon={ <Next /> }
            disabled={ !host }
          />
        </Box>
      </Form>
    </Box>
  )
}

export default Target;