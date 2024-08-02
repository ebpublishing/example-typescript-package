import { Route53Client, ListHostedZonesCommand, ChangeResourceRecordSetsCommand, ChangeAction, RRType } from "@aws-sdk/client-route-53"

export class Route53 {
  private _client: Route53Client;
  constructor() {
    this._client = new Route53Client({});
  }

  async getHostedZoneId(hostedZoneName: string): Promise<string> {
    let hostedZoneId: string = '';
    
    const command = new ListHostedZonesCommand({});

    const response = await this._client.send(command);
    const obj = response.HostedZones?.filter((obj) => obj.Name === `${hostedZoneName}.`);
    
    if (obj?.length == 1 && obj[0].Id) {
      hostedZoneId = obj[0].Id.split("/")[2];
    } else {
      throw new Error(`Error in method: getHostedZoneId, ${hostedZoneName}`);
    }

    return hostedZoneId;
  }

  async updateHostedZoneRecord(hostedZoneId: string, recordName: string, loadBalancerDnsName: string, aliasHostedZoneId: string): Promise<any> {
    const input = { // ChangeResourceRecordSetsRequest
        HostedZoneId: hostedZoneId, // required
        ChangeBatch: { // ChangeBatch
          Changes: [ // Changes // required
            { // Change
              Action: "UPSERT" as ChangeAction, // required
              ResourceRecordSet: { // ResourceRecordSet
                Name: recordName, // required
                Type: "A" as RRType, // required
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

    const command = new ChangeResourceRecordSetsCommand(input);
    const response = await this._client.send(command);
    
    return response;
  }
}