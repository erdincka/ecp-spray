import { Box, Button, CheckBox, Form, FormField, TextInput } from 'grommet';
import React from 'react';

function Config(props) {
  const [config, setConfig] = React.useState({});
  const { ipcRenderer } = window.require("electron");
  const setParent = props.setter;

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
    await ipcRenderer.invoke('set-store-value', props.conf, JSON.stringify(c));
    ipcRenderer.invoke('app-message', 'status', props.conf + ' saved');
    setParent(true);
  }

  const isBool = (key) => {
    return config[key] === 'True' || config[key] === 'False';
  }

  return (
    <Box pad="small"> 
      <Form
        value={config}
        onChange={ next => { 
          // Convert boolean to string
          Object.keys(next).forEach( key => { 
            if (next[key] === true) next[key]='True';
            if (next[key] === false) next[key]='False';
          } )
          setConfig(next) } 
        }
        // onReset={() => setConfig(props.conf)}
        onSubmit={ event => saveState(event.value) }
      >
        { JSON.stringify(config) }
        { 
          Object.keys(config).map(key =>
            isBool(key) ? 
              <CheckBox 
                name= { key }
                key={ key } 
                label={ key } 
                checked={ config[key] === 'True' ? true : false } 
                reverse={true}
                toggle={true}
              /> 
              :
              <FormField name={key} htmlfor={key} label={key} key={key}>
                  <TextInput id={key} name={key} value={config[key]} />
              </FormField>
        )}
        <Box direction="row" gap="medium">
          <Button type="submit" primary fill label="Save" />
          {/* <Button type="reset" label="Reset" /> */}
        </Box>
      </Form>
    </Box>
  )
}

export default Config;
