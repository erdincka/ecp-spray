import React, { useState } from 'react';
import { Box, Button, Layer, Text } from 'grommet';
import Config from './kvm_config';
import Target from './host_target';
import Requirements from './kvm_requirements';
import { StatusGood, StatusWarning } from 'grommet-icons';
import { Previous } from 'grommet-icons';
import { readFromStore, runCommand, sendError, sendOutput } from './helpers';
import { Spinning } from 'grommet-controls';

export const Kvm = () => {
  const [ ready, setReady ] = useState(false);
  const [ page, setPage ] = useState('target');
  const [ loading, setLoading ] = React.useState(false);

  const deploy = async () => {    
    const repodir = 'hcp-demo-kvm-shell';

    const replace = (obj) => {
      let patterns = [];
      Object.keys(obj).forEach( val => {
        const replaceVal = '\'s+^' + val + '=.*$+' + val + '="' + obj[val] + '"+\'';
        patterns.push(replaceVal);
      })
      return patterns;
    }

    setLoading(true);

    runCommand('[ -d '+ repodir + ' ] || git clone -q https://github.com/erdincka/hcp-demo-kvm-shell.git ' + repodir)
    .then( async res => {
      // cancel if we can't find repo files
      if (res.stderr) {
        sendError(res.stderr);
      }
      else { // safe to proceed
        let kvm = JSON.parse(await readFromStore('kvm'));

        // TODO: implement CIDR in original kvm scripts
        [ kvm.GATW_PUB_IP, kvm.GATW_PUB_PREFIX ] = kvm.GATW_PUB_CIDR.split('/');
        delete kvm.GATW_PUB_CIDR;
        // TODO: implement full hostname in original kvm scripts
        const [ host, ...domain ] = kvm.GATW_PUB_FQDN.split('.');
        kvm.GATW_PUB_HOST = host;
        kvm.PUBLIC_DOMAIN = domain.join('.');
        delete kvm.GATW_PUB_FQDN;
        // TODO: implement URL desconstruction in original kvm scripts
        kvm.CENTOS_FILENAME = kvm.CENTOS_DL_URL.split('/').pop();
        kvm.EPIC_FILENAME = kvm.EPIC_DL_URL.split('/').pop();

        // combine all replacements in single command
        const cmd = 'sed -i -e ' + replace(kvm).join(' -e ') +  ' ./' + repodir + '/etc/kvm_config.sh';
        
        runCommand(cmd)
          .then(res => {
            if (res.stdout) sendOutput(res.stdout);
            if (res.stderr) sendError(res.stderr) && setLoading(false);
            else {
              runCommand(`pushd ${repodir}; TERM=xterm PATH=$PATH:$(python3 -m site --user-base)/bin ./kvm_create_new.sh; popd`)
              .then( res => {
                // console.dir(res);
                setLoading(false);
                if (res.stdout) sendOutput(res.stdout);
                if (res.stderr) sendError(res.stderr);
              })
              .catch( err => sendError(err.message));
            }
          })
          .catch(err => sendError(err.message));
      }
    });
  }

  return (
    <Box fill pad='small'>
      { loading && <Layer animation='fadeIn' ><Spinning size='large' /></Layer> }
      <Box direction='row' justify='between' align='center'>
        {/* <Button 
          hoverIndicator
          label='Go back' plain
          icon={ <Previous />}
          onClick={ () => setPage('target') }
        /> */}
        <Text weight='bold'
          margin='none'
        >
        { page === 'target' ? 'Target' : page === 'requirements' ? 'Requirements' : 'KVM Settings' }
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
