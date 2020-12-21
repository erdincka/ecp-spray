import React from 'react';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import { Grommet, Box, TextArea, Grid } from 'grommet';
import { hpe } from 'grommet-theme-hpe';
import { Error } from './Notify';
import Navbar from './NavBar';
import Home from './Home';
import { Kvm } from './Kvm';
import { Aws } from './Aws';
import { Azure } from './Azure';
import { StatusGood } from 'grommet-icons';

function App() {
  const [output, setOutput] = React.useState([])
  const [error, setError] = React.useState(undefined)
  const [status, setStatus] = React.useState([])
  const [theme, setTheme] = React.useState("dark")

  // update output & error sections when message received
  const { ipcRenderer } = window.require("electron");
  ipcRenderer.on('mainprocess-output', (event, message) => { setOutput( [ ...output, message ] ) })
  ipcRenderer.on('mainprocess-error', (event, message) => { setError(message) })
  // ipcRenderer.on('mainprocess-status', (event, message) => { setStatus(message); setTimeout(() => {
    //   setStatus(undefined);
    // }, 1000); })
  ipcRenderer.on('mainprocess-status', (event, message) => { console.dir(message); setStatus( [ ...status, message ] ) });

  return (
    <Grommet full theme={hpe} themeMode={theme}>
      <Router>
        <Grid
          rows={['xxsmall', 'flex']}
          columns={['flex', 'flex']}
          gap="small"
          fill
          areas={[
            { name: 'header', start: [0, 0], end: [1, 0] },
            { name: 'main', start: [0, 1], end: [0, 1] },
            { name: 'stat', start: [1, 1], end: [1, 1] },
          ]}
        >
          <Box gridArea='header'>
            <Navbar theme={ theme } setTheme={setTheme} />
          </Box>
          <Box gridArea='main'>
            <Switch gridArea='main' direction='row'>
                <Route exact path="/" component={ Home } />
                <Route exact path="/kvm" component={ Kvm } />
                <Route exact path="/aws" component={ Aws } />
                <Route exact path="/azure" component={ Azure } />
            </Switch>
          </Box>
        <Box gridArea='stat'>
          { status.length > 0 && 
            <Box margin='small' overflow='scroll'>
              {/* <Text color='status-ok' weight='bold'>Status</Text> */}
              <TextArea disabled fill icon={<StatusGood />} value={ status.join('\n') } />
            </Box> 
          }
          { (output.length > 0) && 
            <Box margin='small' fill='vertical' overflow='scroll'>
              <TextArea disabled fill value={ output.join('\n') } />
            </Box> 
          }
          </Box>
        </Grid>
      </Router>

      { error && <Error message={ error } closer={ () => setError(undefined) } /> }

      {/* { status && <Status message={ status } closer={ () => setStatus(undefined) } /> } */}

    </Grommet>
  );
}

export default App;
