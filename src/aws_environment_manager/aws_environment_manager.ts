import { AwsAccountsManager } from "../aws/aws_account_manager";
import { KubernetesClusterManager } from "../kubernetes/kubernetes_cluster_manager";
import { ResourceGroupsTaggingAPIClient, GetResourcesCommand } from "@aws-sdk/client-resource-groups-tagging-api";

export class AwsEnvironmentManager {
    private _awsAccountsManager: AwsAccountsManager;
    private _kubernetesClusterManager: KubernetesClusterManager;

    constructor() {
      this._awsAccountsManager = new AwsAccountsManager();
      this._kubernetesClusterManager = new KubernetesClusterManager();
    }

    async associateKubernetesLoadBalancerServiceToHostedZoneSubdomain(serviceName: string, hostedZoneName: string, subdomain: string) {
        const loadBalancerHostName = await this._kubernetesClusterManager.Services.LoadBalancer.getLoadBalancerName(serviceName);
        const canonicalHostedZoneNameId = await this._awsAccountsManager.Services.LoadBalancing.getCanonicalHostedZoneNameId(loadBalancerHostName);
        const hostedZoneId = await this._awsAccountsManager.Services.Route53.getHostedZoneId(hostedZoneName);
        await this._awsAccountsManager.Services.Route53.updateHostedZoneRecord(hostedZoneId, `${subdomain}.${hostedZoneName}`, loadBalancerHostName, canonicalHostedZoneNameId);
    }

    async associateEksNetworkLoadBalancerServiceToHostedZoneSubdomain(clusterName: string, serviceName: string, loadBalancerNamespace: string, hostedZoneName: string, subdomain: string, region: string) {
      const resourceName = await this.searchForEksClusterLoadBalancerResourceNameByTags(clusterName, serviceName, loadBalancerNamespace, region);
      console.log(resourceName);
      // const loadBalancerHostName = await this._kubernetesClusterManager.Services.LoadBalancer.getLoadBalancerName(serviceName);
      const {
        canonicalHostedZoneId,
        dnsName,
        name,
      } = await this._awsAccountsManager.Services.LoadBalancing.getLoadBalancerInfoByResourceName(resourceName);
      console.log(name);
      // console.log(canonicalHostedZoneNameId);
      const hostedZoneId = await this._awsAccountsManager.Services.Route53.getHostedZoneId(hostedZoneName);
      await this._awsAccountsManager.Services.Route53.updateHostedZoneRecord(hostedZoneId, `${subdomain}.${hostedZoneName}`, dnsName, canonicalHostedZoneId);
    }

    async searchForEksClusterLoadBalancerResourceNameByTags(clusterNameTag: string, loadBalancerNameTag: string, loadBalancerNamespace: string, region: string): Promise<string> {
      let resourceName = "";
      const client = new ResourceGroupsTaggingAPIClient({ region: region });
      
      const input = {
        TagFilters: [
          { 
            Key: "elbv2.k8s.aws/cluster",
            Values: [ clusterNameTag ],
          },
          { 
            Key: "service.k8s.aws/resource",
            Values: [ "LoadBalancer" ],
          },
          { 
            Key: "service.k8s.aws/stack",
            Values: [ `${loadBalancerNamespace}/${loadBalancerNameTag}` ],
          },
        ],
      };
      
      const command = new GetResourcesCommand(input);
      const response = await client.send(command);
      if(response.ResourceTagMappingList && response.ResourceTagMappingList.length == 1) {
        resourceName = response.ResourceTagMappingList[0].ResourceARN as string;
      }

      return resourceName;
    }
  }