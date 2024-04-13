import { AwsAccountsManager } from "../aws/aws_account_manager";
import { KubernetesClusterManager } from "../kubernetes/kubernetes_cluster_manager";

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
        const hostedZoneId = await this._awsAccountsManager.Services.Route53.getHostedZoneId(canonicalHostedZoneNameId);
        await this._awsAccountsManager.Services.Route53.updateHostedZoneRecord(hostedZoneId, `${subdomain}.${hostedZoneName}`, loadBalancerHostName, canonicalHostedZoneNameId);
    }
  }