import { KubeConfig, CoreV1Api, V1LoadBalancerIngress } from '@kubernetes/client-node';
import { Route53Client, ListHostedZonesCommand, ChangeResourceRecordSetsCommand } from "@aws-sdk/client-route-53"; // ES Modules import
//import { ElasticLoadBalancingV2Client, DescribeLoadBalancersCommand, LoadBalancer } from "@aws-sdk/client-elastic-load-balancing-v2"; // ES Modules import
import { ElasticLoadBalancingClient, DescribeLoadBalancersCommand } from "@aws-sdk/client-elastic-load-balancing"; // ES Modules import
const os = require("os");
export async function add(serviceName: string, broydenHostedZoneName: string, subdomain: string): Promise<string> {
    const userInfo = os.userInfo();
    console.log("**GET SERVICE NAME**");
    console.log(serviceName);
    console.log("**GET SERVICE NAME**");
    console.log("**GET LOADBALANCER NAME**");
    const loadBalancerHostName = await getLoadBalancerName(serviceName);
    console.log("**LOAD BALANCER HOST NAME**");
    console.log(loadBalancerHostName);
    console.log("**LOAD BALANCER HOST NAME**");
    console.log("**GET LOADBALANCER HOSTED ZONE ID**");
    const loadBalancerHostedZoneId = await getLoadBalancerHostZone2(loadBalancerHostName);

    const client = new Route53Client({});
    const command = new ListHostedZonesCommand({});

    console.log("**LIST HOSTED ZONES**");
    const response = await client.send(command);
    const obj = response.HostedZones?.filter((obj) => obj.Name === `${broydenHostedZoneName}.`);
    let updatedHostedZoneResponse: any = {};
    if (obj?.length == 1) {
        const broydenHostedZoneId = obj[0].Id?.split("/")[2];
        //console.log(id);
        console.log("**UPDATING HOSTED ZONE RECORDS*");
        updatedHostedZoneResponse = await updateHostedZoneRecord(client, broydenHostedZoneId as string, `${subdomain}.${broydenHostedZoneName}`, loadBalancerHostName as string, loadBalancerHostedZoneId);
    } else {
        console.log("GOT HERE...ERROR");
    }

    return updatedHostedZoneResponse;
}

async function updateHostedZoneRecord(client: Route53Client, hostedZoneId: string, recordName: string, loadBalancerDnsName: string, aliasHostedZoneId: string): Promise<any> {
    const input = { // ChangeResourceRecordSetsRequest
        HostedZoneId: hostedZoneId, // required
        ChangeBatch: { // ChangeBatch
          Changes: [ // Changes // required
            { // Change
              Action: "UPSERT", // required
              ResourceRecordSet: { // ResourceRecordSet
                Name: recordName, // required
                Type: "A", // required
                AliasTarget: { // AliasTarget
                    HostedZoneId: aliasHostedZoneId, // required
                    DNSName: loadBalancerDnsName, // required
                    EvaluateTargetHealth: true, // required
                },
              },
            },
          ],
        },
      };

    console.log("***ChangeResourceRecordSetsCommandInput***");
    console.log(JSON.stringify(input));
    console.log("***ChangeResourceRecordSetsCommandInput***");
    const command = new ChangeResourceRecordSetsCommand(input);
    const response = await client.send(command);
    
    return response;
}

// async function getLoadBalancerHostZone(loadBalancerDnsName: string) {
//     let hostZoneId: string = '';

//     const client = new ElasticLoadBalancingV2Client({});
//     const input = {};
//     const command = new DescribeLoadBalancersCommand(input);
//     const response = await client.send(command);
//     const lbs = response.LoadBalancers;
//     console.log(response);
//     if (lbs) {
//         const matches = (lbs as LoadBalancer[]).filter((lb) => lb.DNSName === loadBalancerDnsName);
//         console.log(matches.length);
//         if (matches.length == 1) {
//             hostZoneId = matches[0].CanonicalHostedZoneId as string;
//         }
//     }

//     return hostZoneId;
// }

async function getLoadBalancerHostZone2(loadBalancerDnsName: string) {
  let hostZoneId: string = '';

  const client = new ElasticLoadBalancingClient({});
  const input = {};
  const command = new DescribeLoadBalancersCommand(input);
  const response = await client.send(command);
  const lbs = response.LoadBalancerDescriptions;
  console.log(response);
  if (lbs) {
      const matches = lbs.filter((lb) => lb.DNSName === loadBalancerDnsName);
      console.log(matches.length);
      if (matches.length == 1) {
          hostZoneId = matches[0].CanonicalHostedZoneNameID as string;
      }
  }

  return hostZoneId;
}

async function getLoadBalancerName(serviceName: string): Promise<string> {
    let loadBalancerHostName : string | undefined;
    const kc = new KubeConfig();
    kc.loadFromDefault();

    const k8sApi = kc.makeApiClient(CoreV1Api);
    console.log("GOT HERE INSIDE GETLOADBALANCERNAME");
    await k8sApi.listNamespacedService('default', 'true' ).then((res) => {
        const objs = res.body.items.filter((obj) => obj?.metadata?.name === serviceName);
        console.log(`NUMBER OF OBS RETURNED FROM K8S API ${objs.length}`);
        if (objs.length == 1) {
            
            const obj = objs[0];
            const ingress : V1LoadBalancerIngress[] | undefined = obj?.status?.loadBalancer?.ingress;
            if (ingress && ingress.length == 1) {
                loadBalancerHostName  = ingress[0].hostname;
            }
            // console.log(JSON.stringify(name));
        }
    });

    return loadBalancerHostName as string;
}