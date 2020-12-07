import React, { useState } from 'react';
import { Box, Accordion, AccordionPanel } from 'grommet';
import Config from './Config';
import Target from './Target';
import Requirements from './Requirements';

export const Kvm = () => {
  const [ target, setTarget ] = useState(undefined);
  const [ prerequisites, setPrerequisites ] = useState(undefined);

  return (
    <Box flex pad='medium'>
      <Accordion animate >
        <AccordionPanel label='Target'>
          <Target targetSetter={ (t) => setTarget(t) } />
        </AccordionPanel>
        { target && 
          <AccordionPanel label='Requirements'>
            <Requirements target={ target } />
          </AccordionPanel>
        }
        { prerequisites && 
          <Box>
            <AccordionPanel label='Ezmeral'>
              <Box background='light-2' flex>
                <Config conf='ezmeral' />
              </Box>
            </AccordionPanel>
            <AccordionPanel label='KVM'>
              <Box background='light-2' flex>
                <Config conf='kvm' />
              </Box>
            </AccordionPanel>
          </Box>
        }
      </Accordion>
    </Box>
  );

}