import { ElasticLoadBalancingV2Client, DescribeLoadBalancersCommand } from "@aws-sdk/client-elastic-load-balancing-v2";

export class LoadBalancing {
  private _client: ElasticLoadBalancingV2Client

  constructor() {
    this._client = new ElasticLoadBalancingV2Client({});
  }

  async getCanonicalHostedZoneNameId(loadBalancerDnsName: string): Promise<string> {
    let hostZoneNameId: string = '';
  
    const input = {};
    const command = new DescribeLoadBalancersCommand(input);
    const LoadBalancers = await this._client.send(command);
    console.log("********************************");
    console.log(JSON.stringify(LoadBalancers));
    console.log("********************************");
    // const lbs = LoadBalancers.LoadBalancerDescriptions;
    
    // if (lbs) {
    //     const matches = lbs.filter((lb) => lb.DNSName === loadBalancerDnsName);
    //     console.log(matches.length);
    //     if (matches.length == 1) {
    //         hostZoneNameId = matches[0].CanonicalHostedZoneNameID as string;
    //     }
    // }
  
    return hostZoneNameId;
  }

  async getLoadBalancerInfoByResourceName(resourceName: string): Promise<any> {
    let hostZoneNameId: string = '';
    let dnsName: string = '';
    let name: string = '';
    const input = {
      LoadBalancerArns: [  resourceName ],
    };
    const command = new DescribeLoadBalancersCommand(input);
    const LoadBalancers = await this._client.send(command);
    const lbs = LoadBalancers.LoadBalancers;
    
    if (lbs) {
        const matches = lbs.filter((lb: any) => lb.LoadBalancerArn === resourceName);
        if (matches.length == 1) {
            hostZoneNameId = matches[0].CanonicalHostedZoneId as string;
            dnsName = matches[0].DNSName as string;
            name = matches[0].LoadBalancerName as string;
        }
    }

    const obj = {
      canonicalHostedZoneId: hostZoneNameId,
      dnsName: dnsName,
      name: name,
    };
  
    return obj;
  }
}