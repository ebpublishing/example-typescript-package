import { KubeConfig, CoreV1Api, ApiType } from '@kubernetes/client-node';
import { Services } from './services';

export class AwsAccountsManager {
  readonly Services: Services;
  constructor() {
    const kc = new KubeConfig();
    const k8sApi: ApiType = kc.makeApiClient(CoreV1Api);
    this.Services = new Services(k8sApi);
  }
}