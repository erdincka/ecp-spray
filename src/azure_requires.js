export const required = [
  {
    group: 'System',
    needs: [
      {
        command: 'az',
        installCommand: {
          linux: 'curl -L https://aka.ms/InstallAzureCli | bash',
          darwin: 'brew update && brew install azure-cli',
          win32: 'Invoke-WebRequest -Uri https://aka.ms/installazurecliwindows -OutFile .\\AzureCLI.msi; Start-Process msiexec.exe -Wait -ArgumentList \'/I AzureCLI.msi /quiet\'; rm .\\AzureCLI.msi'
        }
      },
      {
        command: 'terraform',
        installCommand: {
          linux: 'curl "https://releases.hashicorp.com/terraform/0.14.3/terraform_0.14.3_linux_amd64.zip" -o "terraform.zip" && unzip terraform.zip && sudo mv terraform /usr/local/bin/',
          darwin: 'curl "https://releases.hashicorp.com/terraform/0.14.3/terraform_0.14.3_darwin_amd64.zip" -o "terraform.zip" && unzip terraform.zip && sudo mv terraform /usr/local/bin/',
          win32: 'Invoke-WebRequest -Uri https://releases.hashicorp.com/terraform/0.14.4/terraform_0.14.4_windows_amd64.zip -OutFile .\\terraform.zip; Expand-Archive .\\terraform.zip ; rm .\\terraform.zip'
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
          linux: 'sudo yum install -y python3 epel-release || sudo apt install -y python3',
          darwin: 'brew install python3',
          win32: ''
        }
      },
      {
        command: 'pip3',
        installCommand: {
          linux: 'sudo yum install -y python37-pip || sudo apt install -y python3-pip',
          darwin: 'curl https://bootstrap.pypa.io/get-pip.py -o get-pip.py; python3 get-pip.py --force-reinstall', // https://askubuntu.com/a/1026848
          win32: ''
        }
      }
    ]
  },
  {
    group: 'Utils',
    needs: [
      {
        command: 'git',
        installCommand: {
          linux: 'sudo apt -y install git-all || sudo yum -y install git-all',
          darwin: 'brew install git',
          win32: ''
        }
      },
      {
        command: 'ipcalc',
        check: 'python3 -m pip show ipcalc | grep Location: | awk \'{print $2"/ipcalc"}\'',
        installCommand: {
          linux: 'pip3 install --user ipcalc six',
          darwin: 'pip3 install --user ipcalc six',
          win32: ''
        }
      },
      {
        command: 'hpecp',
        check: 'python3 -m pip show hpecp | grep Location: | awk \'{print $2"/hpecp"}\'',
        installCommand: {
          linux: 'pip3 install --user hpecp',
          darwin: 'pip3 install --user hpecp',
          win32: ''
        }
      }
    ]
  }
];
