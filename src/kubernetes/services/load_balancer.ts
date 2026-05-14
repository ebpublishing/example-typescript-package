import { V1LoadBalancerIngress, ApiType, CoreV1Api } from '@kubernetes/client-node';

export class LoadBalancer {
  private _api: CoreV1Api;
  constructor(api: CoreV1Api) {
    this._api = api;
  }
  
  public async getLoadBalancerName(serviceName: string): Promise<string> {
    let loadBalancerHostName : string | undefined;

    
    // console.log("*********LOADBALANCERTEST*********");
    // const test = await this._api.listNamespacedService('default', 'true' );
    // console.log(JSON.stringify(test));
    // console.log("*********LOADBALANCERTEST*********");
    console.log("GOT HERE INSIDE GETLOADBALANCERNAME");
    await this._api.listNamespacedService({namespace: 'default', pretty: 'true'}).then((res: any) => {
        console.log('RESRESRESRESRESRESRESRESRESRESRESRESRESRESRESRESRESRESRESRESRESRESRES');
        console.log(JSON.stringify(res));
        console.log('RESRESRESRESRESRESRESRESRESRESRESRESRESRESRESRESRESRESRESRESRESRESRES');
        const objs:any = res.body.items.filter((obj: any) => obj?.metadata?.name === serviceName);
        console.log(`NUMBER OF OBS RETURNED FROM K8S API ${objs.length}`);
        if (objs.length == 1) {
            const obj = objs[0];
            console.log("*********LOADBALANCEROBJ*********");
            console.log(JSON.stringify(obj));
            console.log("*********LOADBALANCEROBJ*********");
            const ingress : V1LoadBalancerIngress[] | undefined = obj?.status?.loadBalancer?.ingress;
            console.log("*********INGRESS*********");
            console.log(JSON.stringify(ingress));
            console.log("*********INGRESS*********");
            if (ingress && ingress.length == 1) {
                loadBalancerHostName  = ingress[0].hostname;
            }
            // console.log(JSON.stringify(name));
        }
    });

    return loadBalancerHostName as string;
  }
}