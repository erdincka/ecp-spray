import React from 'react';
import { Grommet, Card, Box, Button, Text } from 'grommet';
import { hpe } from 'grommet-theme-hpe';
import * as Icons from 'grommet-icons';
import Config from './Config';

function App() {
  const [mode, setMode] = React.useState(null)
  const [output, setOutput] = React.useState([])
  const [error, setError] = React.useState([])
  const [status, setStatus] = React.useState([])

  const os = require("os");
  const shell_cmds = {
    win32: "C:\\Windows\\System32\\cmd.exe",
    darwin: "/bin/bash",
    linux: "/bin/bash",
    sunos: "/bin/bash",
    openbsd: "/bin/bash",
    android: "/bin/bash",
    aix: "/bin/bash"
  }
  // update output & error sections when message received
  const { ipcRenderer } = window.require("electron");
  ipcRenderer.on('mainprocess-output', (event, message) => { setOutput([ ...output, message ]) })
  ipcRenderer.on('mainprocess-error', (event, message) => { setError([ ...error, message ]) })
  ipcRenderer.on('mainprocess-status', (event, message) => { setStatus([ ...status, message ]) })

  // setStatus(ipcRenderer.invoke('run-command', shell_cmds[os.platform()], "hostname"))
  return (
    <Grommet theme={hpe}>
      <Box align="stretch" justify="between">
        <Box direction="row">
          <Card margin="medium">
            ECP on AWS
            <Button
              icon={<Icons.Ubuntu />}
              hoverIndicator
              tip="https://github.com/hpe-container-platform-community/hcp-demo-env-aws-terraform"
              onClick={ () => setMode('aws') }
            />
          </Card>
          <Card margin="medium">
            ECP on Azure
            <Button
              icon={<Icons.Windows />}
              hoverIndicator
              tip="https://github.com/hpe-container-platform-community/demo-env-azure-notebook"
              onClick={ () => setMode('azure') }
            />
          </Card>
          <Card margin="medium">
            ECP on KVM
            <Button
              icon={<Icons.Redhat />}
              hoverIndicator
              tip="https://github.com/erdincka/hcp-demo-kvm-shell/"
              onClick={ () => setMode('kvm') }
            />
          </Card>
        </Box>
        { mode && <Config mode={mode} /> }
        { output && <Box justify="stretch"><pre>{ output }</pre></Box> }
        { error && <Text color="status-critical">{ error }</Text> }
        { status && <Box justify="end" margin="xsmall"><Text color="status-ok">{ status }</Text></Box> }
      </Box>
    </Grommet>
  );
}

export default App;
