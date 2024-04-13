import { V1LoadBalancerIngress, ApiType } from '@kubernetes/client-node';

export class LoadBalancer {
  private _apiType: ApiType;
  constructor(apiType: ApiType) {
    this._apiType = apiType;
  }
  
  public async getLoadBalancerName(serviceName: string): Promise<string> {
    let loadBalancerHostName : string | undefined;

    console.log("GOT HERE INSIDE GETLOADBALANCERNAME");
    await this._apiType.listNamespacedService('default', 'true' ).then((res) => {
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
}