import { Ubuntu, Windows, Redhat } from 'grommet-icons';
import { Aws } from "./Aws";
import { Azure } from "./Azure";
import { Kvm } from "./Kvm";

export const Platforms = [
  {
    "name": "aws",
    "label":"ECP on AWS",
    "description": "",
    "icon": <Ubuntu color="plain" />,
    "component": <Aws />,
    "url":"https://github.com/hpe-container-platform-community/hcp-demo-env-aws-terraform"
  },
  {
    "name": "azure",
    "label": "ECP on Azure",
    "description": "",
    "icon": <Windows color="plain" />,
    "component": <Azure />,
    "url": "https://github.com/hpe-container-platform-community/demo-env-azure-notebook"
  },
  {
    "name": "kvm",
    "label":"ECP on KVM",
    "description": "",
    "icon": <Redhat color="plain" />,
    "component": <Kvm />,
    "url":"https://github.com/erdincka/hcp-demo-kvm-shell/"
  }
]