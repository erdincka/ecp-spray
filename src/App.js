import { Grommet, Card, CardHeader, CardBody, CardFooter, Button } from 'grommet';
import { hpe } from 'grommet-theme-hpe';
import * as Icons from 'grommet-icons';

function App() {
  let toggleKvmConfig = () => {
    console.dir('toggling')
    
  }
  return (
    <Grommet theme={hpe}>
      <Card>
        <CardHeader pad="medium">KVM</CardHeader>
        <CardBody pad="medium">Use libvirt/kvm</CardBody>
        <CardFooter pad={{horizontal: "small"}} background="light-2">   
          <Button icon={<Icons.Help color="plain" />} hoverIndicator />
          <Button
            icon={<Icons.Centos />}
            hoverIndicator
            onClick={toggleKvmConfig}
          />
        </CardFooter>
      </Card>
    </Grommet>
  );
}

export default App;
