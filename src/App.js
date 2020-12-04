import React from 'react';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import { Grommet, Layer, Box, TextArea } from 'grommet';
import { hpe } from 'grommet-theme-hpe';
import { Status, Error } from './Announce';
import Navbar from './NavBar';
import Home from './Home';
import { Kvm } from './Kvm';
import { Aws } from './Aws';
import { Azure } from './Azure';

function App() {
  const [output, setOutput] = React.useState([])
  const [error, setError] = React.useState(undefined)
  const [status, setStatus] = React.useState(undefined)
  const [theme, setTheme] = React.useState("dark")

  // update output & error sections when message received
  const { ipcRenderer } = window.require("electron");
  ipcRenderer.on('mainprocess-output', (event, message) => { setOutput([...output, message ]) })
  ipcRenderer.on('mainprocess-error', (event, message) => { setError(message) })
  ipcRenderer.on('mainprocess-status', (event, message) => { setStatus(message) })

  return (
    <Grommet full theme={hpe} themeMode={theme}>
      <Router>
        <Navbar theme={ theme } setTheme={setTheme} />

        <Switch>
            <Route exact path="/" component={ Home } />
            <Route exact path="/kvm" component={ Kvm } />
            <Route exact path="/aws" component={ Aws } />
            <Route exact path="/azure" component={ Azure } />
        </Switch>

        { (output.length > 0) && 
          <Box>
            <TextArea disabled fill value={ output.join('\n') }>
            </TextArea>
          </Box> 
        }
      </Router>
      <Layer
        modal={ false }
        position="bottom"
      >
        <Error message={ error } />
      </Layer>
      <Layer
        modal={ false }
        position="bottom"
      >
        <Status message={ status } />
      </Layer>
    </Grommet>
  );
}

export default App;
