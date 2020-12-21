import React, { useState } from 'react';
import { Box, Accordion, AccordionPanel, Button, Text } from 'grommet';
import Config from './Config';
import Target from './Target';
import Requirements from './KVM_Prereq';
import { StatusGood, StatusWarning } from 'grommet-icons';

export const Kvm = () => {
  const [ target, setTarget ] = useState(undefined);
  const [ prerequisites, setPrerequisites ] = useState(undefined);
  const [ ezmeral, setEzmeral ] = useState(undefined);
  const [ kvmconfig, setKvmconfig ] = useState(undefined);
  const { ipcRenderer } = window.require("electron");

  const deploy = async () => {
    // const host = JSON.parse(await ipcRenderer.invoke('get-store-value', 'host'));
    const ezmeral = JSON.parse(await ipcRenderer.invoke('get-store-value', 'ezmeral'));
    const kvm = JSON.parse(await ipcRenderer.invoke('get-store-value', 'kvm'));
    
    const repodir = 'hcp-demo-kvm-shell';

    const replace = () => {
      Object.keys(ezmeral).forEach( val => {
        const replaceVal = 'sed -i \'s+' + val + '=+' + val + '=' + ezmeral[val] + '+\' ./' + repodir + '/etc/kvm_config.sh';
        console.dir(replaceVal);
        // ipcRenderer.invoke('get-system', 'execute-command', replaceVal);
      })
    }

    ipcRenderer.invoke('get-system', 'execute-command', '[ -d '+ repodir + ' ] || git clone https://github.com/erdincka/hcp-demo-kvm-shell.git ' + repodir)
    .then( res => {
      // cancel if we can't find repo files
      if (res.stderr) {
        ipcRenderer.invoke('app-message', 'error', res.stderr);
      }
      else { // safe to proceed
        console.dir('safe to proceed');
      }
    })
  }

  return (
    <Box fill pad='small' overflow='scroll'>
      <Accordion>
        <AccordionPanel header={
          <Box direction='row' justify='between' pad='small'>
            <Text>Target</Text>
            { target ? <StatusGood color='status-ok' /> : <StatusWarning color='status-warning' /> }
          </Box>}>
          <Target setter={ (t) => setTarget(t) } />
        </AccordionPanel>
        { target &&
          <AccordionPanel header={
            <Box direction='row' justify='between' pad='small'>
              <Text>KVM Settings</Text>
              { kvmconfig ? <StatusGood color='status-ok' /> : <StatusWarning color='status-warning' /> }
            </Box>}>
            <Config conf='kvm' setter={ (k) => setKvmconfig(k) } />
          </AccordionPanel>
        }
        { kvmconfig &&
          <AccordionPanel header={
            <Box direction='row' justify='between' pad='small'>
              <Text>Pre-requisites</Text>
              { prerequisites ? <StatusGood color='status-ok' /> : <StatusWarning color='status-warning' /> }
            </Box>}>
            <Requirements setter={ (p) => setPrerequisites(p) } />
          </AccordionPanel>
        }
        { prerequisites &&
        <AccordionPanel header={
          <Box direction='row' justify='between' pad='small'>
            <Text>Ezmeral</Text>
            { ezmeral ? <StatusGood color='status-ok' /> : <StatusWarning color='status-warning' /> }
          </Box>}>
          <Config conf='ezmeral' setter={ (e) => setEzmeral(e) } />
        </AccordionPanel>
        }
      {
        ezmeral &&
        <Button 
        onClick={ () => deploy() }
        label='Start deployment' 
        />
      }
      </Accordion>
    </Box>
  );

}