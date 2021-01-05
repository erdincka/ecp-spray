import { Nav, Button, CheckBox, Box } from 'grommet';
import React from 'react';
import { Link } from 'react-router-dom'
import { Home, Moon, Sun, Console, Desktop } from 'grommet-icons';

export const Navbar = ({ title, theme, setTheme, expert, setExpert }) =>{
  return (
    <Nav direction='row' pad='small' justify='between'>
      <Link to='/' >
        <Button 
          icon={<Home />}
          label={ title }
        />
      </Link>
      <Box direction='row'>
        <CheckBox 
          toggle reverse
          label={ theme === 'dark' ? <Moon /> : <Sun /> }
          checked={ theme === 'dark' ? false : true }
          onChange={ () => setTheme(theme === 'dark' ? 'light' : 'dark')}
        />
        <CheckBox 
          toggle reverse
          label={ expert ? <Console /> : <Desktop /> }
          checked={ expert ? true : false }
          onChange={ () => setExpert(!expert)}
        />
      </Box>
    </Nav>
  )
}

 Navbar.defaultProps={
  title:'ECP Spray'
};

export default Navbar
