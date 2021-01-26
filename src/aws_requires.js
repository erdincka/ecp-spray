export const required = [
  {
    command: 'aws',
    install: {
      linux: 'curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip" && unzip awscliv2.zip && sudo ./aws/install',
      darwin: 'curl "https://awscli.amazonaws.com/AWSCLIV2-2.0.30.pkg" -o "AWSCLIV2.pkg" && sudo installer -pkg AWSCLIV2.pkg -target /'
    }
  },
  {
    command: 'terraform',
    install: {
      linux: 'curl "https://releases.hashicorp.com/terraform/0.14.3/terraform_0.14.3_linux_amd64.zip" -o "terraform.zip" && unzip terraform.zip && sudo mv terraform /usr/local/bin/',
      darwin: 'curl "https://releases.hashicorp.com/terraform/0.14.3/terraform_0.14.3_darwin_amd64.zip" -o "terraform.zip" && unzip terraform.zip && sudo mv terraform /usr/local/bin/'
    }
  },
  {
    command: 'python3',
    install: {
      linux: 'sudo yum install -y python3 epel-release || sudo apt install -y python3',
      darwin: 'brew install python3'
    }
  },
  {
    command: 'pip3',
    install: {
      linux: 'sudo yum install -y python37-pip || sudo apt install -y python3-pip',
      darwin: 'curl https://bootstrap.pypa.io/get-pip.py -o get-pip.py; python3 get-pip.py --force-reinstall' // https://askubuntu.com/a/1026848
    }
  },
  {
    command: 'git',
    install: {
      linux: 'sudo apt -y install git-all || sudo yum -y install git-all',
      darwin: 'brew install git'
    }
  },
  {
    command: 'ipcalc',
    check: 'python3 -m pip show ipcalc | grep Location: | awk \'{print $2"/ipcalc"}\'',
    install: {
      linux: 'pip3 install --user ipcalc six',
      darwin: 'pip3 install --user ipcalc six'
    }
  },
  {
    command: 'hpecp',
    check: 'python3 -m pip show hpecp | grep Location: | awk \'{print $2"/hpecp"}\'',
    install: {
      linux: 'pip3 install --user hpecp',
      darwin: 'pip3 install --user hpecp'
    }
    }
]
