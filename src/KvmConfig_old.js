import { Box, CheckBox, FormField, Text, TextInput } from 'grommet';
import React from 'react';


function KvmConfig() {
  const config_url="https://raw.githubusercontent.com/erdincka/hcp-demo-kvm-shell/main/etc/kvm_config.sh"
  const [error, setError] = React.useState(null)
  const [configLines, setConfigLines] = React.useState([])
  const [detailed, setDetailed] = React.useState(false)

  // handle input change
  const handleInputChange = (e, index) => {
    const list = [...configLines]
    list[index] = list[index].replace(/"(.*)"$/, '"' + e.target.value + '"')
    setConfigLines(list)
  };

  function getInputField(i) {
    // let match
    // match = configLines[i].match(/^(\w+)=([^$]|"(?!\$).*)$/)
    // match[1], match[2].replace(/^"|"$/g, '') // remove enclosing quotes from values
    return (
      <FormField label={ configLines[i].match(/^(\w+)=([^$]|"(?!\$).*)$/)[1] } key={ i }>
        <TextInput 
          value={ configLines[i].match(/^(\w+)=([^$]|"(?!\$).*)$/)[2].replace(/^"|"$/g, '') } 
          onChange={ e => handleInputChange( e, i ) }
        />
      </FormField>
    )
  }

  function buildForm(i){
    // skip empty lines
    if (configLines[i].match(/^\s*\r?\n$/)) { console.dir("skipped "+ configLines[i]) ; return }
    // comments as is
    if (detailed && configLines[i].match(/^\s*(#.*)?$/)) return <pre key={ i }>{configLines[i]}<br /></pre>
    // lines that can be edited
    if (configLines[i].match(/^(\w+)=([^$]|"(?!\$).*)$/)) return getInputField(i)
    // return the regular lines
    if (detailed) return <pre key={ i }>{configLines[i]}<br /></pre>
    return null
  }

  fetch(config_url)
  .then( response => response.text() )
  .then( config => setConfigLines([...config.split(/\r?\n/)]) )
  .catch( error => console.error(error) && setError("Error reading from url") )

  return (
    configLines
    ? <Box>
        <CheckBox
          checked={detailed}
          label="Detailed view?"
          onChange={(event) => setDetailed(event.target.checked)}
        />
        {
          configLines.map((line, i) => 
            buildForm(i)
          )
        }
          {/* <div pad="medium">{JSON.stringify(configLines)}</div> */}
          { error && (<Text color="status-error" >{error}</Text>) }
        </Box>
    : <div>Loading configuration...</div>
  )
}

export default KvmConfig;
