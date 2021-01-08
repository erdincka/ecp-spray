import React from 'react';
import { Box, Button, CheckBox, Form, FormField, TextInput } from 'grommet';
import { Next } from 'grommet-icons';
import { boolToString, sendStatus } from './helpers';

function Config(props) {
  const [config, setConfig] = React.useState({});
  const setParent = props.setParent;

  React.useEffect(() => {
    const fetchData = async () => {
      const conf = await readFromStore(props.conf);
      setConfig( { ...JSON.parse(conf) } );
    };
    fetchData();
  }, [props.conf]);
  
  const saveState = async (c) => {
    await saveToStore(props.conf, JSON.stringify(c));
    sendStatus(props.conf + ' saved');
    setParent(true);
  }

  const isBool = (key) => {
    return config[key] === 'True' || config[key] === 'False';
  }

  return (
    <Box pad="small"> 
      <Form
        value={config}
        onChange={ next => setConfig(boolToString(next)) }
        onSubmit={ event => saveState(event.value) }
        // onReset={() => setConfig(props.conf)}
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
