export const required = [
  {
    group: 'LibVirt',
    needs: [
      {
        command: 'virsh',
        instalCommand: {
          centos: 'sudo apt install -y qemu-kvm libvirt libvirt-client',
          ubuntu: 'sudo apt install -y qemu-kvm libvirt-daemon-system libvirt-clients'
        }
      },
      {
        command: 'virt-install',
        instalCommand: {
          centos: 'sudo yum install -y virt-install',
          ubuntu: 'sudo apt install -y sudo apt install virtinst'
        }
      }
    ]
  },
  {
    group: 'Python',
    needs: [
      {
        command: 'python3',
        instalCommand: {
          centos: 'sudo yum install -y python3 epel-release',
          ubuntu: 'sudo apt install -y python3'
        }
      },
      {
        command: 'pip3',
        instalCommand: {
          centos: 'yum install -y python37-pip',
          ubuntu: 'sudo apt install -y python3-pip'
        }
      }
    ]
  },
  {
    group: 'Utils',
    needs: [
      {
        command: 'ssh-keygen',
        instalCommand: {
          centos: 'sudo yum install -y openssh',
          ubuntu: 'sudo apt install -y openssh-server'
        }
      },
      {
        command: 'nc',
        instalCommand: {
          centos: 'sudo dnf install -y nmap-ncat',
          ubuntu: '' // already included in release
        }
      },
      {
        command: 'curl',
        instalCommand: {
          centos: 'sudo dnf install -y curl',
          ubuntu: '' // already included in release
        }
      },
      {
        command: 'ipcalc',
        instalCommand: {
          centos: 'pip3 install --user ipcalc six',
          ubuntu: 'pip3 install --user ipcalc six'
        }
      },
      {
        command: 'hpecp',
        instalCommand: {
          centos: 'pip3 install --user hpecp',
          ubuntu: 'pip3 install --user hpecp'
        }
      }
    ]
  }
];
