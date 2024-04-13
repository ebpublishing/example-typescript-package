import { Route53Client, ListHostedZonesCommand, ChangeResourceRecordSetsCommand, ChangeAction, RRType } from "@aws-sdk/client-route-53"

export class Route53 {
  private _client: Route53Client;
  constructor() {
    this._client = new Route53Client({});
  }

  async getHostedZoneId(hostedZoneName: string): Promise<string> {
    let hostedZoneId: string = '';
    
    const command = new ListHostedZonesCommand({});

    console.log("**LIST HOSTED ZONES1**");
    const response = await this._client.send(command);
    console.log("**LIST HOSTED ZONES2**");
    console.log(JSON.stringify(response, undefined, 4));
    const obj = response.HostedZones?.filter((obj) => obj.Name === `${hostedZoneName}.`);
    console.log("**LIST HOSTED ZONES3**");
    console.log(';'.repeat(100));
    console.log(JSON.stringify(obj, undefined, 4));
    console.log(';'.repeat(100));
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

    console.log("***ChangeResourceRecordSetsCommandInput***");
    console.log(JSON.stringify(input));
    console.log("***ChangeResourceRecordSetsCommandInput***");
    const command = new ChangeResourceRecordSetsCommand(input);
    const response = await this._client.send(command);
    console.log(JSON.stringify(response));
    return response;
  }
}