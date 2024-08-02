import { argv } from 'node:process';
import { AwsEnvironmentManager } from './src/aws_environment_manager/aws_environment_manager';

let argvIndex = 2;
const clusterName = argv[argvIndex++];
const loadBalancerServiceName = argv[argvIndex++];
const loadBalancerNamespace = argv[argvIndex++];
const region = argv[argvIndex++];
const hostedZoneName = argv[argvIndex++];
const subdomain = argv[argvIndex++];

console.log(clusterName);
console.log(loadBalancerServiceName);
console.log(loadBalancerNamespace);
console.log(region);
console.log(hostedZoneName);
console.log(subdomain);

(async() => {
    console.log("GOT HERE1");
    console.log(loadBalancerServiceName);
    const awsEnvironmentManager = new AwsEnvironmentManager();
    await awsEnvironmentManager.associateEksNetworkLoadBalancerServiceToHostedZoneSubdomain(clusterName, loadBalancerServiceName, loadBalancerNamespace, hostedZoneName, subdomain, region);
    //console.log(results);
})();