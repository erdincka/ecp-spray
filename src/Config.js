import { Box, Button, Form, FormField, TextInput } from 'grommet';
import React from 'react';

function Config(props) {
  const [config, setConfig] = React.useState({})
  const { ipcRenderer } = window.require("electron");

  React.useEffect(() => {
    const fetchData = async () => {
      const conf = await ipcRenderer.invoke('get-store-value', props.conf);
      setConfig( { ...JSON.parse(conf) } );
    };
    fetchData();
  }, [ipcRenderer, props.conf]);
  
  const saveState = async (c) => {
    // let file = "#!/bin/bash\n"
    // Object.keys(c).forEach(key => 
    //   file += key + "=\"" + c[key] + "\"\n"
    //   );
    await ipcRenderer.invoke('set-store-value', props.conf, JSON.stringify(c))
  }

  return (
    <Box pad="small"> 
      <Form
        value={config}
        onChange={next => setConfig(next)}
        // onReset={() => setConfig(props.conf)}
        onSubmit={ event => saveState(event.value) }
      >
        { 
          Object.keys(config).map(key =>
          <FormField name={key} htmlfor={key} label={key} key={key}>
            <TextInput id={key} name={key} value={config[key]} />
          </FormField>
        )}
        <Box direction="row" gap="medium">
          <Button type="submit" primary label="Submit" />
          {/* <Button type="reset" label="Reset" /> */}
        </Box>
      </Form>
    </Box>
  )
}

export default Config;
