import React from 'react';
import config from './config.json';
import KvmConfig from './KvmConfig';

function Config(props) {
  // setUrl('https://raw.githubusercontent.com/hpe-container-platform-community/hcp-demo-env-aws-terraform/master/bluedata_infra_main.tf') 
  // setUrl('https://raw.githubusercontent.com/hpe-container-platform-community/demo-env-azure-notebook/master/bluedata_infra_main.tf') 
  // setUrl('https://raw.githubusercontent.com/erdincka/hcp-demo-kvm-shell/main/etc/kvm_config.sh')

  let component
  switch (props.mode) {
    case "kvm":
      component=<KvmConfig />
      break
    case "azure":
      component=<h3>Azure coming soon</h3>
      break
    case "aws":
      component=<h3>AWS coming soon</h3>
      break
    default:
      component=<div>Don't know what to do with this</div>      
  }

  console.dir(config)

  return (
    component && component
  )
}

export default Config;
