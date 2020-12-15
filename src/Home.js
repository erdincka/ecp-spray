import { Card, Box, CardHeader, CardBody, CardFooter, Button } from 'grommet';
import React from 'react';
import { Link } from 'react-router-dom';
import { Platforms } from './Platforms';
import { Github, Launch } from 'grommet-icons';

const Home = () => {
   return (
    <Box margin="medium" direction="row-responsive" full>
      { 
        Platforms.map( (p, key) => 
            <Card margin="medium" flex key={key}>
              <CardHeader pad="medium">{p.label} { p.icon }</CardHeader>
              <CardBody pad="medium" align="center">{ p.description }</CardBody>
              <CardFooter pad="small" background="light-2">
                <Button icon={<Github />} 
                  // label="Source" 
                  hoverIndicator
                  href={p.url} target="_new">
                </Button>
                <Link to={ "/" + p.name } >
                  <Button icon={<Launch color="plain" />} 
                    // label="Launch"
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
