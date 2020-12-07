import React from 'react';
import { Box } from 'grommet';

function Requirements(props) {
  const { ipcRenderer } = window.require('electron');
  const [ targetReady, setTargetReady ] = React.useState(false);

  React.useEffect(() => {
    const fetchData = async () => {
      // get target
      const payload = JSON.parse(await ipcRenderer.invoke('get-store-value', 'target'));
      setTargetReady(payload);
      // set targets
      const platform = await ipcRenderer.invoke('get-system', 'platform');
    };
    fetchData();
  }, [ipcRenderer]);

  return(
    <Box>
      { JSON.stringify(targetReady) }
    </Box>
  );
}

export default Requirements;