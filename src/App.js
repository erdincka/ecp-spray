import React from 'react';
import { Grommet, Card, Box, Button, Text, Footer, Anchor } from 'grommet';
import { hpe } from 'grommet-theme-hpe';
import * as Icons from 'grommet-icons';
import Config from './Config';

function App() {
  const [mode, setMode] = React.useState(null)
  const [error, setError] = React.useState([])
  const [output, setOutput] = React.useState([])
  const [status, setStatus] = React.useState(null)

  const { ipcRenderer } = window.require("electron");
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
  // update error when recieved stderr returns from ipcMain
  ipcRenderer.on('mainprocess-error', (event, message) => { setError([ ...error, message ]) })
  ipcRenderer.on('mainprocess-output', (event, message) => { setOutput([ ...error, message ]) })

  setStatus(ipcRenderer.invoke('run-command', shell_cmds[os.platform()], "hostname"))

  return (
    <Grommet theme={hpe}>
      <Box>
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
        { output && <pre>{ output }</pre> }
        { error && <Text color="status-critical">{ error }</Text> }
        <Footer background="brand" pad="xsmall">
          <Text>{ status && status }</Text>
        </Footer>
      </Box>
    </Grommet>
  );
}

export default App;
