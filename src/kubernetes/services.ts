import { CoreV1Api } from '@kubernetes/client-node';
import { LoadBalancer } from './services/load_balancer';

export class Services {
  readonly LoadBalancer: LoadBalancer;
  constructor(api: CoreV1Api) {
    this.LoadBalancer = new LoadBalancer(api);
  }
}