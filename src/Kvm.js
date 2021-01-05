import React, { useState } from 'react';
import { Box, Button, Layer, Text } from 'grommet';
import Config from './kvm_config';
import Target from './kvm_target';
import Requirements from './kvm_requirements';
import { StatusGood, StatusWarning } from 'grommet-icons';
import { Previous } from 'grommet-icons';
import { sendError, sendOutput } from './helpers';
import { Spinning } from 'grommet-controls';

export const Kvm = () => {
  const [ ready, setReady ] = useState(false);
  const [ page, setPage ] = useState('target');
  const [ loading, setLoading ] = React.useState(false);
  const { ipcRenderer } = window.require('electron');

  const deploy = async () => {    
    const repodir = 'hcp-demo-kvm-shell';

    const replace = (obj) => {
      let patterns = [];
      Object.keys(obj).forEach( val => {
        const replaceVal = '\'s+^' + val + '=.*$+' + val + '="' + obj[val] + '"+\'';
        // console.dir(replaceVal);
        patterns.push(replaceVal);
      })
      return patterns;
    }

    setLoading(true);
    ipcRenderer.invoke('get-system', 'execute-command', '[ -d '+ repodir + ' ] || git clone https://github.com/erdincka/hcp-demo-kvm-shell.git ' + repodir)
    .then( async res => {
      setLoading(false);
      // cancel if we can't find repo files
      if (res.stderr) {
        sendError(res.stderr);
      }
      else { // safe to proceed
        let kvm = JSON.parse(await ipcRenderer.invoke('get-store-value', 'kvm'));
        let ezmeral = JSON.parse(await ipcRenderer.invoke('get-store-value', 'ezmeral'));

        // TODO: implement CIDR in original kvm scripts
        [ kvm.GATW_PUB_IP, kvm.GATW_PUB_PREFIX ] = kvm.GATW_PUB_CIDR.split('/');
        delete kvm.GATW_PUB_CIDR;
        // TODO: implement URL merge in original kvm scripts
        kvm.CENTOS_DL_URL += kvm.CENTOS_FILENAME;
        ezmeral.EPIC_DL_URL += ezmeral.EPIC_FILENAME;

        // combine all replacements in single command
        const cmd = 'sed -i -e ' + replace(kvm).concat(replace(ezmeral)).join(' -e ') +  ' ./' + repodir + '/etc/kvm_config.sh';
        // console.dir(cmd);
        ipcRenderer.invoke('get-system', 'execute-command', cmd)
          .then(res => {
            if (res.stdout) sendOutput(res.stdout);
            if (res.stderr) sendError(res.stderr)
            else {
              ipcRenderer.invoke('get-system', 'execute-command', 'pushd ' + repodir + ' && ./kvm_create_new.sh && popd')
              .then( res => {
                if (res.stdout) sendOutput(res.stdout);
                if (res.stderr) sendError(res.stderr);
              })
              .catch( err => sendError(err.message));
            }
          })
          .catch(err => sendError(err.message));
      }
    })
  }

  return (
    <Box fill pad='small'>
      { loading && <Layer animation='fadeIn' ><Spinning size='large' /></Layer> }
      <Box direction='row' justify='between' align='center'>
        <Button 
          hoverIndicator
          label='Go back' plain
          icon={ <Previous />}
          onClick={ () => setPage('target') }
        />
        <Text weight='bold'
          margin='none'
        >
        { page === 'target' ? 'Target' : page === 'requirements' ? 'Requirements'
          : page === 'kvm' ? 'KVM Settings' : 'Ezmeral Settings' }
        </Text>
        { ready ? <StatusGood color='status-ok' /> : <StatusWarning color='status-warning' /> }
      </Box>

      {
        page === 'target' &&
        <Target setParent={ (t) => { if (t) setPage('requirements') } } />
      }
      
      { page === 'requirements' &&
          <Requirements setParent={ (t) => { if (t) setPage('kvm') } } />
      }
      {
        page === 'kvm' &&
          <Config conf={ page } setParent={ (t) => { if (t) setPage('ezmeral') } } />
      }
      {
        page === 'ezmeral' &&
          <Config conf={ page } setParent={ (t) => { if (t) setReady(true) } } />
      }

      {
        ready &&
        <Button 
          onClick={ () => deploy() }
          primary
          label='Start deployment' 
        />
      }
    </Box>
  );
}
