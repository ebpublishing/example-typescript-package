import { V1LoadBalancerIngress, ApiType, CoreV1Api } from '@kubernetes/client-node';

export class LoadBalancer {
  private _api: CoreV1Api;
  constructor(api: CoreV1Api) {
    this._api = api;
  }
  
  public async getLoadBalancerName(serviceName: string): Promise<string> {
    let loadBalancerHostName : string | undefined;

    console.log("GOT HERE INSIDE GETLOADBALANCERNAME");
    await this._api.listNamespacedService('default', 'true' ).then((res) => {
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