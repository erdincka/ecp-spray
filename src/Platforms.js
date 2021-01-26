import { Ubuntu, Windows, Redhat, Vmware } from 'grommet-icons';
import { Aws } from './Aws';
import { Azure } from './Azure';
import { Kvm } from './Kvm';
import { VMWare } from './VMWare';

export const Platforms = [
  {
    'name': 'aws',
    'label':'ECP on AWS',
    'description': 'Deploy Ezmeral on AWS ECS',
    'icon': <Ubuntu color='plain' />,
    'component': <Aws />,
    'url':'https://github.com/hpe-container-platform-community/hcp-demo-env-aws-terraform'
  },
  {
    'name': 'azure',
    'label': 'ECP on Azure',
    'description': 'Deploy Ezmeral on Azure VMs',
    'icon': <Windows color='plain' />,
    'component': <Azure />,
    'url': 'https://github.com/erdincka/ezmeral-demo-azure-terraform'
  },
  {
    'name': 'kvm',
    'label':'ECP on KVM',
    'description': 'Deploy Ezmeral on libvirtd VMs',
    'icon': <Redhat color='plain' />,
    'component': <Kvm />,
    'url':'https://github.com/erdincka/hcp-demo-kvm-shell'
  },
  {
    'name': 'vmware',
    'label':'ECP on vSphere',
    'description': 'Deploy Ezmeral on vSphere VMs',
    'icon': <Vmware  />,
    'component': <VMWare />,
    'url':'https://github.com/erdincka/ezmeral-demo-vmware-terraform'
  }
]