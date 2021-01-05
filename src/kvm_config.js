import React from 'react';
import { Box, Button, CheckBox, Form, FormField, TextInput } from 'grommet';
import { Next } from 'grommet-icons';

function Config(props) {
  const [config, setConfig] = React.useState({});
  const { ipcRenderer } = window.require("electron");
  const setParent = props.setParent;

  React.useEffect(() => {
    const fetchData = async () => {
      const conf = await ipcRenderer.invoke('get-store-value', props.conf);
      setConfig( { ...JSON.parse(conf) } );
    };
    fetchData();
  }, [ipcRenderer, props.conf]);
  
  const saveState = async (c) => {
    await ipcRenderer.invoke('set-store-value', props.conf, JSON.stringify(c));
    ipcRenderer.invoke('app-message', 'status', props.conf + ' saved');
    setParent(true);
  }

  const isBool = (key) => {
    return config[key] === 'True' || config[key] === 'False';
  }

  const processConfig = next => {
    Object.keys(next).forEach( key => { 
      // Convert boolean to string
      if (next[key] === true) next[key]='True';
      if (next[key] === false) next[key]='False';
    } ) // end of forEach
    setConfig(next);
  }

  return (
    <Box pad="small"> 
      <Form
        value={config}
        onChange={ next => processConfig(next) }
        // onReset={() => setConfig(props.conf)}
        onSubmit={ event => saveState(event.value) }
      >
        {/* { JSON.stringify(config) } */}
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
              <FormField name={key} htmlfor={key} label={key} key={key} >
                  <TextInput id={key} name={key} value={config[key]} disabled={ ( key === 'KVM_NETWORK' ) } />
              </FormField>
        )}
        <Box direction='row' gap='medium' justify='end'>
          <Button type='submit' label='Next' icon={ <Next /> } />
        </Box>
      </Form>
    </Box>
  )
}

export default Config;
