import React from 'react';
import { Box, Accordion, AccordionPanel } from 'grommet';
import Config from './Config';
import Target from './Target';

export const Kvm = () => {
  return (
    <Box flex pad='medium'>
      <Accordion animate multiple={false}>
        <AccordionPanel label='Target'>
          <Target />
        </AccordionPanel>
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
      </Accordion>
    </Box>
  );

}