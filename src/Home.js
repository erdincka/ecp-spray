import { Card, Box, CardHeader, CardBody, CardFooter, Button, Text } from 'grommet';
import React from 'react';
import { Link } from 'react-router-dom';
import { Platforms } from './Platforms';
import { Github, Launch } from 'grommet-icons';

export const Home = () => {
   return (
    <Box margin='small' full>
      { 
        Platforms.map( (p, key) => 
            <Card margin='medium' key={key}>
              <CardHeader pad='small'><Text weight='bold'>{ p.label }</Text> { p.icon }</CardHeader>
              <CardBody pad='xsmall' align='center'>{ p.description }</CardBody>
              <CardFooter pad='xsmall' background='light-1'>
                <Button icon={<Github />} 
                  label='Source' 
                  hoverIndicator
                  href={p.url} target='_new'>
                </Button>
                <Link to={ '/' + p.name } >
                  <Button icon={<Launch color='plain' />} 
                    label='Launch'
                    hoverIndicator 
                  />
                </Link>
              </CardFooter>
            </Card>
        )
      }
    </Box>
  );
}

export default Home;
