export const required = [
  {
    group: 'Utils',
    needs: [
      // {
      //   command: 'brctl',
      //   installCommand: 'sudo yum install -y bridge-utils || sudo apt install -y bridge-utils'
      // },
      {
        command: 'git',
        installCommand: {
          linux: 'sudo yum install -y git-all || sudo apt install -y git-all'
        }
      }
    ]
  }
];
