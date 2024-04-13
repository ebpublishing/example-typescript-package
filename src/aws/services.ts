import { Route53 } from './services/route53';
import { LoadBalancing } from './services/load_balancing';

export class Services {
  readonly Route53: Route53 = new Route53();
  readonly LoadBalancing: LoadBalancing = new LoadBalancing();
}