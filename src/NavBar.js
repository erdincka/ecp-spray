import { Nav, Button } from 'grommet';
import React from 'react';
import { Link } from 'react-router-dom'
import { Home, Moon } from 'grommet-icons';

const Navbar = ({ title, theme, setTheme }) =>{
  return (
    <Nav direction="row" background="brand" pad="small" justify="between">
      <Link to="/" >
        <Button 
          icon={<Home color="plain" />}
          label={ title }
        />
      </Link>
      <Button 
        icon={<Moon color="plain" />}
        label="Theme"
        onClick={ () => setTheme(theme === "dark" ? "light" : "dark")}
      />
    </Nav>
  )
}

 Navbar.defaultProps={
  title:'ECP Spray'
};

export default Navbar
