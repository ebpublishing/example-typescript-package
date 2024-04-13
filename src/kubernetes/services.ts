import { ApiType } from '@kubernetes/client-node';
import { LoadBalancer } from './services/load_balancer';

export class Services {
  readonly LoadBalancer: LoadBalancer;
  constructor(apiType: ApiType) {
    this.LoadBalancer = new LoadBalancer(apiType);
  }
}