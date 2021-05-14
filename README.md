# HPE ECP Spray

## Cross-platform GUI to spray some nodes around - in development

Uses 
[Electron](https://www.electronjs.org),
[Grommet](https://v2.grommet.io),
and lots of other OSS (and [Stackoverflow](https://stackoverflow.com/questions/tagged/javascript) contributions)

Cross platform GUI to deploy HPE Ezmeral Container Platform, using KVM, AWS, or Azure repos as backend.

### KVM deployment 
- Working
- Uses [kvm-shell repo](https://github.com/erdincka/ezmeral-demo-kvm-shell)
- If run on Linux, allows local or remote (ssh) deployment
- If run on other OS (Windows or Linux), allows only remote deployment (tested on Windows)
- Throughly tested on Ubuntu 2004 as host, should work fine with 1810 and later (mostly depending on kvm-shell repo)
- You might need to create virsh network and bridge beforehand (script uses default network, assuming it is set up with default configuration - NAT forwarding mode, using virbr0 etc).
- You might need to create separate bridge/network for gateway public IP interface, currently kvm-shell repo uses SR-IOV enabled network interface (physical function dedicated to bridge).

### AWS deployment
- Working
- Uses [aws-terraform repo](https://github.com/hpe-container-platform-community/hcp-demo-env-aws-terraform)
- Very little customization is allowed (TODO)
- Not all regions are available (limited in aws repo) (TODO)
- Tested on MacOS with M1 chip (Apple Silicon), needs checks/verifications to cater Intel models (TODO)
- Needs more testing for different scenarios (not enough permissions on AWS IAM user, not enabled region selected, AMIs not enabled for that region etc) (TODO)

### Azure deployment
- 
- [Repo](https://github.com/hpe-container-platform-community/demo-env-azure-notebook) is available for jupyter/python deployment, and this one is updated for ECP 5.x [repo](https://github.com/erdincka/bluedata-demo-env-azure-terraform-private) that uses terraform

### Vmware deployment
- [Repo](https://github.com/erdincka/ezmeral-demo-vmware-terraform)
- Tested on vSphere v7.0 environment
- No RDP host created
- Needs extensive testing

## TODO
- Improved security model (both for electron and code)
- KVM
  - [ ] Simplified settings for KVM, allow advanced toggle for more settings
  - [ ] SR-IOV or bridged network creation
  - [ ] SR-IOV or bridged network creation for gateway public IP
  - [ ] GPU host creation
- AWS
  - [ ] Advanced settings, customization (ie, toggle RDP host creation, AD creation, external MapR cluster creation etc)
  - [ ] Add more regions
  - [ ] Detailed error detection
  - [ ] Streaming command output (shelljs async execution?)
  - [ ] Non-blocking command execution (shelljs async execution?)
- Azure
  - Improve backend repo
    - [ ] Re-factor azure-notebook repo to azure-terraform
    - [ ] Add missing features to azure backend (repo) (such as enable external MapR creation, GPU host creation etc)
  - [ ] Implement GUI for the improved backend

- Vmware
  - [x] Create backend repo (using Terraform)
  - [ ] Implement GUI for the backend


Contributions welcomed.


