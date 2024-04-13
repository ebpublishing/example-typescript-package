import { Route53Client, ListHostedZonesCommand, ChangeResourceRecordSetsCommand, ChangeAction } from "@aws-sdk/client-route-53"

export class Route53 {
  private _client: Route53Client;
  constructor() {
    this._client = new Route53Client({});
  }

  async getHostedZoneId(hostedZoneName: string): Promise<string> {
    let hostedZoneId: string = '';
    
    const command = new ListHostedZonesCommand({});

    console.log("**LIST HOSTED ZONES**");
    const response = await this._client.send(command);
    const obj = response.HostedZones?.filter((obj) => obj.Name === `${hostedZoneName}.`);
    if (obj?.length == 1 && obj[0].Id) {
      hostedZoneId = obj[0].Id.split("/")[2];
      //console.log(id);
      console.log("**UPDATING HOSTED ZONE RECORDS*");
      //updatedHostedZoneResponse = await updateHostedZoneRecord(client, broydenHostedZoneId as string, `${subdomain}.${hostedZoneName}`, loadBalancerHostName as string, loadBalancerHostedZoneId);
    } else {
      throw new Error(`Error in method: getHostedZoneId, ${hostedZoneName}`);
    }

    return hostedZoneId;
  }

  async updateHostedZoneRecord(hostedZoneId: string, recordName: string, loadBalancerDnsName: string, aliasHostedZoneId: string): Promise<any> {
    console.log("WM".repeat(20));
    console.log(`hostedZoneId: ${hostedZoneId}, recordName: ${recordName}, loadBalancerDnsName: ${loadBalancerDnsName}, aliasHostedZoneId: ${aliasHostedZoneId}`);
    console.log("WM".repeat(20));
    const input = { // ChangeResourceRecordSetsRequest
        HostedZoneId: hostedZoneId, // required
        ChangeBatch: { // ChangeBatch
          Changes: [ // Changes // required
            { // Change
              Action: "UPSERT" as ChangeAction, // required
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
    const response = await this._client.send(command);
    console.log(JSON.stringify(response));
    return response;
  }
}