export const required = [
  {
    group: 'LibVirt',
    needs: [
      {
        command: 'virsh',
        installCommand: {
          centos: 'sudo apt install -y qemu-kvm libvirt libvirt-client',
          ubuntu: 'sudo apt install -y qemu-kvm libvirt-daemon-system libvirt-clients'
        }
      },
      {
        command: 'virt-install',
        installCommand: {
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
        installCommand: {
          centos: 'sudo yum install -y python3 epel-release',
          ubuntu: 'sudo apt install -y python3'
        }
      },
      {
        command: 'pip3',
        installCommand: {
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
        installCommand: {
          centos: 'sudo yum install -y openssh',
          ubuntu: 'sudo apt install -y openssh-server'
        }
      },
      {
        command: 'nc',
        installCommand: {
          centos: 'sudo dnf install -y nmap-ncat',
          ubuntu: '' // already included in release
        }
      },
      {
        command: 'brctl',
        installCommand: {
          centos: 'sudo yum install -y bridge-utils',
          ubuntu: 'sudo apt install -y bridge-utils'
        }
      },
      {
        command: 'curl',
        installCommand: {
          centos: 'sudo dnf install -y curl',
          ubuntu: '' // already included in release
        }
      },
      {
        command: 'ipcalc',
        check: 'python3 -m pip show ipcalc',
        installCommand: {
          centos: 'pip3 install --user ipcalc six',
          ubuntu: 'pip3 install --user ipcalc six'
        }
      },
      {
        command: 'hpecp',
        check: 'python3 -m pip show hpecp',
        installCommand: {
          centos: 'pip3 install --user hpecp',
          ubuntu: 'pip3 install --user hpecp'
        }
      },
      {
        command: 'git',
        installCommand: {
          centos: 'sudo yum install -y git-all',
          ubuntu: 'sudo apt install -y git-all'
        }
      }
    ]
  }
];
