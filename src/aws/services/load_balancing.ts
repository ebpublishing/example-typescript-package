import { ElasticLoadBalancingClient, DescribeLoadBalancersCommand } from "@aws-sdk/client-elastic-load-balancing";

export class LoadBalancing {
  private _client: ElasticLoadBalancingClient

  constructor() {
    this._client = new ElasticLoadBalancingClient({});
  }

  async getCanonicalHostedZoneNameId(loadBalancerDnsName: string): Promise<string> {
    let hostZoneNameId: string = '';
  
    const input = {};
    const command = new DescribeLoadBalancersCommand(input);
    const response = await this._client.send(command);
    const lbs = response.LoadBalancerDescriptions;
    console.log(response);
    if (lbs) {
        const matches = lbs.filter((lb) => lb.DNSName === loadBalancerDnsName);
        console.log(matches.length);
        if (matches.length == 1) {
            hostZoneNameId = matches[0].CanonicalHostedZoneNameID as string;
        }
    }
  
    return hostZoneNameId;
  }
}